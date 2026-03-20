/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  RegimeEngine.js — Probabilistic Market Regime Analysis        ║
 * ║                                                                ║
 * ║  5-State Gaussian HMM:                                        ║
 * ║    Bull → Euphoria → Correction → Crisis → Recovery → Bull    ║
 * ║                                                                ║
 * ║  Components:                                                   ║
 * ║    1. Gaussian HMM (Baum-Welch / Viterbi / Forward-Backward)  ║
 * ║    2. Multi-Signal Composite Scoring (FRED-based)              ║
 * ║    3. Regime-Conditional Portfolio Analytics                   ║
 * ║    4. Regime Transition Forecasting                            ║
 * ║    5. Turbulence Index (Mahalanobis Distance)                  ║
 * ║    6. Absorption Ratio (PCA Systemic Risk)                     ║
 * ║    7. BOCPD (Bayesian Online Change-Point Detection)           ║
 * ║    8. Ensemble Regime Detector (fuses all signals)             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ─── REGIME DEFINITIONS ────────────────────────────────────────────
export const REGIMES = {
  BULL:       { id: 0, name: 'Bull',       color: '#22c55e', description: 'Sustained uptrend, low vol, favorable macro' },
  EUPHORIA:   { id: 1, name: 'Euphoria',   color: '#f59e0b', description: 'Overheated, high valuations, complacency' },
  CORRECTION: { id: 2, name: 'Correction', color: '#f97316', description: 'Repricing, rising vol, tightening conditions' },
  CRISIS:     { id: 3, name: 'Crisis',     color: '#ef4444', description: 'Severe drawdown, stress, flight to safety' },
  RECOVERY:   { id: 4, name: 'Recovery',   color: '#3b82f6', description: 'Bottoming, improving breadth, mean reversion' },
};

export const REGIME_LIST = Object.values(REGIMES);
export const NUM_STATES = 5;

// ─── MATH UTILITIES ────────────────────────────────────────────────
const LOG_2PI = Math.log(2 * Math.PI);

function gaussianLogPdf(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return -0.5 * (LOG_2PI + 2 * Math.log(sigma) + z * z);
}

function logSumExp(logValues) {
  if (logValues.length === 0) return -Infinity;
  const maxVal = Math.max(...logValues);
  if (maxVal === -Infinity) return -Infinity;
  let sum = 0;
  for (let i = 0; i < logValues.length; i++) {
    sum += Math.exp(logValues[i] - maxVal);
  }
  return maxVal + Math.log(sum);
}

function normalizeLogProbs(logProbs) {
  const lse = logSumExp(logProbs);
  return logProbs.map(lp => Math.exp(lp - lse));
}

function zScore(values) {
  const n = values.length;
  if (n === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / n) || 1;
  return values.map(v => (v - mean) / std);
}

function rollingZScore(values, window = 252) {
  const result = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length) || 1;
    result.push((values[i] - mean) / std);
  }
  return result;
}


// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: GAUSSIAN HIDDEN MARKOV MODEL
// ═══════════════════════════════════════════════════════════════════

export class GaussianHMM {
  /**
   * @param {number} nStates - Number of hidden states (default 5)
   * @param {object} [opts] - Options: maxIter, tolerance, minVariance
   */
  constructor(nStates = NUM_STATES, opts = {}) {
    this.N = nStates;
    this.maxIter = opts.maxIter || 100;
    this.tol = opts.tolerance || 1e-6;
    this.minVar = opts.minVariance || 0.01;
    this.trained = false;

    // Initialize parameters with economically-informed priors
    this._initParams();
  }

  _initParams() {
    const N = this.N;

    // Initial state distribution — start in Bull or Recovery
    this.pi = new Float64Array(N);
    this.pi[0] = 0.35; // Bull
    this.pi[1] = 0.10; // Euphoria
    this.pi[2] = 0.10; // Correction
    this.pi[3] = 0.05; // Crisis
    this.pi[4] = 0.40; // Recovery

    // Transition matrix — encodes business cycle dynamics
    // Rows = from-state, Cols = to-state
    // Key insight: regimes are "sticky" (high self-transition)
    this.A = [
      // To:   Bull   Euph   Corr   Cris   Recv
      /* Bull */  [0.90,  0.06,  0.03,  0.005, 0.005],
      /* Euph */  [0.05,  0.80,  0.12,  0.02,  0.01 ],
      /* Corr */  [0.02,  0.01,  0.78,  0.15,  0.04 ],
      /* Cris */  [0.005, 0.005, 0.04,  0.82,  0.13 ],
      /* Recv */  [0.20,  0.02,  0.03,  0.02,  0.73 ],
    ];

    // Emission parameters (mean, std) for composite score per regime
    // Composite score: negative = risk-off, positive = risk-on
    this.means = new Float64Array([-0.5, -1.5, 0.8, 2.0, 0.0]);
    //                              Bull  Euph  Corr  Cris  Recv
    // Note: Euphoria has LOW composite (low OAS, low VIX → negative stress)
    // Crisis has HIGH composite (high OAS, high VIX → high stress)

    this.stds = new Float64Array([0.5, 0.6, 0.7, 0.8, 0.6]);
  }

  /**
   * Forward algorithm (log-space) — P(observations up to t, state at t)
   * @returns {Float64Array[]} alpha[t][i] = log P(o_1..o_t, s_t = i)
   */
  _forward(obs) {
    const T = obs.length;
    const N = this.N;
    const alpha = [];

    // t = 0
    const a0 = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      a0[i] = Math.log(this.pi[i] + 1e-300) + gaussianLogPdf(obs[0], this.means[i], this.stds[i]);
    }
    alpha.push(a0);

    // t = 1..T-1
    for (let t = 1; t < T; t++) {
      const at = new Float64Array(N);
      for (let j = 0; j < N; j++) {
        const logTerms = new Float64Array(N);
        for (let i = 0; i < N; i++) {
          logTerms[i] = alpha[t - 1][i] + Math.log(this.A[i][j] + 1e-300);
        }
        at[j] = logSumExp(Array.from(logTerms)) + gaussianLogPdf(obs[t], this.means[j], this.stds[j]);
      }
      alpha.push(at);
    }
    return alpha;
  }

  /**
   * Backward algorithm (log-space) — P(observations after t | state at t)
   * @returns {Float64Array[]} beta[t][i] = log P(o_{t+1}..o_T | s_t = i)
   */
  _backward(obs) {
    const T = obs.length;
    const N = this.N;
    const beta = new Array(T);

    // t = T-1
    beta[T - 1] = new Float64Array(N).fill(0); // log(1) = 0

    // t = T-2..0
    for (let t = T - 2; t >= 0; t--) {
      beta[t] = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        const logTerms = new Float64Array(N);
        for (let j = 0; j < N; j++) {
          logTerms[j] = Math.log(this.A[i][j] + 1e-300)
            + gaussianLogPdf(obs[t + 1], this.means[j], this.stds[j])
            + beta[t + 1][j];
        }
        beta[t][i] = logSumExp(Array.from(logTerms));
      }
    }
    return beta;
  }

  /**
   * Compute state posteriors: gamma[t][i] = P(s_t = i | all observations)
   */
  _computeGamma(alpha, beta) {
    const T = alpha.length;
    const N = this.N;
    const gamma = [];

    for (let t = 0; t < T; t++) {
      const logGamma = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        logGamma[i] = alpha[t][i] + beta[t][i];
      }
      gamma.push(normalizeLogProbs(Array.from(logGamma)));
    }
    return gamma;
  }

  /**
   * Compute transition posteriors: xi[t][i][j] = P(s_t=i, s_{t+1}=j | all obs)
   */
  _computeXi(obs, alpha, beta) {
    const T = obs.length;
    const N = this.N;
    const xi = [];

    for (let t = 0; t < T - 1; t++) {
      const logXi = [];
      const allTerms = [];

      for (let i = 0; i < N; i++) {
        logXi[i] = new Float64Array(N);
        for (let j = 0; j < N; j++) {
          const val = alpha[t][i]
            + Math.log(this.A[i][j] + 1e-300)
            + gaussianLogPdf(obs[t + 1], this.means[j], this.stds[j])
            + beta[t + 1][j];
          logXi[i][j] = val;
          allTerms.push(val);
        }
      }

      const logNorm = logSumExp(allTerms);
      const xiT = [];
      for (let i = 0; i < N; i++) {
        xiT[i] = new Float64Array(N);
        for (let j = 0; j < N; j++) {
          xiT[i][j] = Math.exp(logXi[i][j] - logNorm);
        }
      }
      xi.push(xiT);
    }
    return xi;
  }

  /**
   * Baum-Welch (EM) training
   * @param {number[]} observations - Array of composite regime scores
   * @returns {object} Training info: { iterations, logLikelihood, converged }
   */
  fit(observations) {
    const obs = Float64Array.from(observations);
    const T = obs.length;
    const N = this.N;
    let prevLL = -Infinity;

    for (let iter = 0; iter < this.maxIter; iter++) {
      // E-step
      const alpha = this._forward(obs);
      const beta = this._backward(obs);
      const gamma = this._computeGamma(alpha, beta);
      const xi = this._computeXi(obs, alpha, beta);

      // Log-likelihood
      const ll = logSumExp(Array.from(alpha[T - 1]));

      // Check convergence
      if (Math.abs(ll - prevLL) < this.tol) {
        this.trained = true;
        this._reorderStates();
        return { iterations: iter + 1, logLikelihood: ll, converged: true };
      }
      prevLL = ll;

      // M-step: update parameters
      // Initial distribution
      for (let i = 0; i < N; i++) {
        this.pi[i] = Math.max(gamma[0][i], 1e-10);
      }

      // Transition matrix
      for (let i = 0; i < N; i++) {
        let gammaSum = 0;
        for (let t = 0; t < T - 1; t++) gammaSum += gamma[t][i];
        for (let j = 0; j < N; j++) {
          let xiSum = 0;
          for (let t = 0; t < T - 1; t++) xiSum += xi[t][i][j];
          this.A[i][j] = Math.max(xiSum / (gammaSum + 1e-300), 1e-10);
        }
        // Renormalize row
        const rowSum = this.A[i].reduce((a, b) => a + b, 0);
        for (let j = 0; j < N; j++) this.A[i][j] /= rowSum;
      }

      // Emission means and variances
      for (let i = 0; i < N; i++) {
        let gammaSum = 0, weightedSum = 0, weightedSqSum = 0;
        for (let t = 0; t < T; t++) {
          gammaSum += gamma[t][i];
          weightedSum += gamma[t][i] * obs[t];
          weightedSqSum += gamma[t][i] * obs[t] * obs[t];
        }
        this.means[i] = weightedSum / (gammaSum + 1e-300);
        const variance = (weightedSqSum / (gammaSum + 1e-300)) - this.means[i] ** 2;
        this.stds[i] = Math.sqrt(Math.max(variance, this.minVar));
      }
    }

    this.trained = true;
    this._reorderStates();
    return { iterations: this.maxIter, logLikelihood: prevLL, converged: false };
  }

  /**
   * Reorder states after training so labels match economic meaning.
   *
   * Composite score = stress index (higher = more stress), so we sort
   * learned emission means and assign:
   *   sorted[0] → Euphoria (id 1): lowest stress, complacency
   *   sorted[1] → Bull (id 0): low stress, healthy
   *   sorted[2] → Recovery (id 4): moderate stress, improving
   *   sorted[3] → Correction (id 2): elevated stress
   *   sorted[4] → Crisis (id 3): extreme stress
   *
   * This solves the HMM "label switching" problem.
   */
  _reorderStates() {
    const N = this.N;
    // Target: sorted emission mean maps to regime ids in this order
    const TARGET_ORDER = [1, 0, 4, 2, 3]; // Euph, Bull, Recv, Corr, Crisis

    // Get current sort order by emission mean (ascending)
    const indexed = Array.from(this.means).map((m, i) => ({ mean: m, origIdx: i }));
    indexed.sort((a, b) => a.mean - b.mean);

    // Build permutation: newStateId -> oldStateId
    // sorted[k] has origIdx, and should become TARGET_ORDER[k]
    const oldToNew = new Array(N);
    for (let k = 0; k < N; k++) {
      oldToNew[indexed[k].origIdx] = TARGET_ORDER[k];
    }

    // Permute pi
    const newPi = new Float64Array(N);
    for (let i = 0; i < N; i++) newPi[oldToNew[i]] = this.pi[i];
    this.pi = newPi;

    // Permute means and stds
    const newMeans = new Float64Array(N);
    const newStds = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      newMeans[oldToNew[i]] = this.means[i];
      newStds[oldToNew[i]] = this.stds[i];
    }
    this.means = newMeans;
    this.stds = newStds;

    // Permute transition matrix
    const newA = Array.from({ length: N }, () => new Array(N).fill(0));
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        newA[oldToNew[i]][oldToNew[j]] = this.A[i][j];
      }
    }
    this.A = newA;
  }

  /**
   * Viterbi decoding — most likely state sequence
   * @param {number[]} observations
   * @returns {number[]} Most likely state indices
   */
  viterbi(observations) {
    const obs = Float64Array.from(observations);
    const T = obs.length;
    const N = this.N;
    const delta = [];
    const psi = [];

    // Init
    const d0 = new Float64Array(N);
    const p0 = new Int32Array(N);
    for (let i = 0; i < N; i++) {
      d0[i] = Math.log(this.pi[i] + 1e-300) + gaussianLogPdf(obs[0], this.means[i], this.stds[i]);
      p0[i] = 0;
    }
    delta.push(d0);
    psi.push(p0);

    // Recursion
    for (let t = 1; t < T; t++) {
      const dt = new Float64Array(N);
      const pt = new Int32Array(N);
      for (let j = 0; j < N; j++) {
        let bestVal = -Infinity, bestIdx = 0;
        for (let i = 0; i < N; i++) {
          const val = delta[t - 1][i] + Math.log(this.A[i][j] + 1e-300);
          if (val > bestVal) { bestVal = val; bestIdx = i; }
        }
        dt[j] = bestVal + gaussianLogPdf(obs[t], this.means[j], this.stds[j]);
        pt[j] = bestIdx;
      }
      delta.push(dt);
      psi.push(pt);
    }

    // Backtrack
    const states = new Int32Array(T);
    let bestFinal = -Infinity;
    for (let i = 0; i < N; i++) {
      if (delta[T - 1][i] > bestFinal) {
        bestFinal = delta[T - 1][i];
        states[T - 1] = i;
      }
    }
    for (let t = T - 2; t >= 0; t--) {
      states[t] = psi[t + 1][states[t + 1]];
    }
    return Array.from(states);
  }

  /**
   * Filtered state probabilities — P(state | observations up to now)
   * This is what you use for LIVE regime detection
   * @param {number[]} observations
   * @returns {number[][]} probs[t] = [P(Bull), P(Euph), P(Corr), P(Crisis), P(Recv)]
   */
  filter(observations) {
    const alpha = this._forward(Float64Array.from(observations));
    return alpha.map(a => normalizeLogProbs(Array.from(a)));
  }

  /**
   * Smoothed state probabilities — P(state | ALL observations)
   * More accurate but requires full dataset (not real-time)
   * @param {number[]} observations
   * @returns {number[][]} probs[t] = [P(Bull), ...]
   */
  smooth(observations) {
    const obs = Float64Array.from(observations);
    const alpha = this._forward(obs);
    const beta = this._backward(obs);
    return this._computeGamma(alpha, beta);
  }

  /**
   * Predict future regime probabilities using transition matrix
   * @param {number[]} currentProbs - Current regime probability vector
   * @param {number} steps - Number of steps to forecast
   * @returns {number[][]} Forecast probabilities for each future step
   */
  forecast(currentProbs, steps = 10) {
    const N = this.N;
    const forecasts = [];
    let probs = [...currentProbs];

    for (let s = 0; s < steps; s++) {
      const next = new Array(N).fill(0);
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          next[j] += probs[i] * this.A[i][j];
        }
      }
      forecasts.push(next);
      probs = next;
    }
    return forecasts;
  }

  /**
   * Compute stationary (long-run equilibrium) distribution
   * @returns {number[]} Stationary probabilities
   */
  stationaryDistribution() {
    const N = this.N;
    // Solve π = πA via power iteration
    let pi = new Array(N).fill(1 / N);
    for (let iter = 0; iter < 1000; iter++) {
      const next = new Array(N).fill(0);
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          next[j] += pi[i] * this.A[i][j];
        }
      }
      pi = next;
    }
    return pi;
  }

  /**
   * Expected regime duration (in periods) for each state
   * @returns {number[]} Expected duration per state
   */
  expectedDurations() {
    return this.A.map((row, i) => 1 / (1 - row[i] + 1e-300));
  }

  /**
   * Export model parameters for persistence
   */
  serialize() {
    return {
      N: this.N,
      pi: Array.from(this.pi),
      A: this.A.map(r => Array.from(r)),
      means: Array.from(this.means),
      stds: Array.from(this.stds),
      trained: this.trained,
    };
  }

  /**
   * Load model parameters
   */
  static deserialize(data) {
    const hmm = new GaussianHMM(data.N);
    hmm.pi = Float64Array.from(data.pi);
    hmm.A = data.A.map(r => [...r]);
    hmm.means = Float64Array.from(data.means);
    hmm.stds = Float64Array.from(data.stds);
    hmm.trained = data.trained;
    return hmm;
  }
}


// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: MULTI-SIGNAL COMPOSITE SCORING
// ═══════════════════════════════════════════════════════════════════

/**
 * Default signal configuration for FRED-based macro signals
 * weight: relative importance in composite
 * direction: +1 means higher = more stress, -1 means higher = less stress
 * transform: optional pre-processing
 */
export const DEFAULT_SIGNAL_CONFIG = {
  hyOas: {
    name: 'HY OAS (ICE BofA)',
    fredId: 'BAMLH0A0HYM2',
    weight: 0.30,
    direction: 1,       // Higher spread = more stress
    description: 'High-yield credit spread over Treasuries',
  },
  vixLevel: {
    name: 'VIX Level',
    fredId: 'VIXCLS',
    weight: 0.25,
    direction: 1,       // Higher VIX = more stress
    description: 'CBOE Volatility Index',
  },
  nfci: {
    name: 'Chicago Fed NFCI',
    fredId: 'NFCI',
    weight: 0.20,
    direction: 1,       // Positive NFCI = tighter conditions = stress
    description: 'National Financial Conditions Index',
  },
  termSpread: {
    name: '10Y-2Y Treasury Spread',
    fredId: 'T10Y2Y',
    weight: 0.10,
    direction: -1,      // Inversion (negative) = stress
    description: 'Yield curve slope',
  },
  unemployRate: {
    name: 'Unemployment Rate',
    fredId: 'UNRATE',
    weight: 0.10,
    direction: 1,       // Rising unemployment = stress
    description: 'U.S. civilian unemployment rate',
  },
  leIndex: {
    name: 'Leading Economic Index (YoY%)',
    fredId: null,        // Derived or from Conference Board
    weight: 0.05,
    direction: -1,       // Negative growth = stress
    description: 'Conference Board Leading Indicators',
  },
};

/**
 * Compute composite regime stress score from multiple signals.
 *
 * @param {Object} signalData - { signalKey: number[] } raw signal time series
 * @param {Object} [config] - Signal config (default: DEFAULT_SIGNAL_CONFIG)
 * @param {Object} [opts] - { zScoreWindow: 252, useRollingZ: true }
 * @returns {Object} {
 *   composite: number[],       - Composite stress score (higher = more stress)
 *   zScores: { key: number[] },- Z-scored individual signals
 *   contributions: { key: number[] }, - Weighted contribution of each signal
 *   weights: { key: number },  - Normalized weights used
 *   latestDecomposition: { key: { raw, z, contribution, weight } }
 * }
 */
export function computeCompositeScore(signalData, config = DEFAULT_SIGNAL_CONFIG, opts = {}) {
  const { zScoreWindow = 252, useRollingZ = true } = opts;

  // Filter to signals that have data
  const activeSignals = Object.keys(config).filter(key => signalData[key]?.length > 0);
  if (activeSignals.length === 0) {
    throw new Error('No signal data provided');
  }

  // Normalize weights to sum to 1
  const totalWeight = activeSignals.reduce((sum, key) => sum + config[key].weight, 0);
  const normWeights = {};
  activeSignals.forEach(key => {
    normWeights[key] = config[key].weight / totalWeight;
  });

  // Find common length (shortest series)
  const minLen = Math.min(...activeSignals.map(key => signalData[key].length));

  // Z-score each signal
  const zScores = {};
  activeSignals.forEach(key => {
    const raw = signalData[key].slice(-minLen);
    const direction = config[key].direction;
    const directed = raw.map(v => v * direction);
    zScores[key] = useRollingZ
      ? rollingZScore(directed, zScoreWindow)
      : zScore(directed);
  });

  // Compute weighted composite and contributions
  const contributions = {};
  activeSignals.forEach(key => {
    contributions[key] = zScores[key].map(z => z * normWeights[key]);
  });

  const composite = new Array(minLen).fill(0);
  for (let t = 0; t < minLen; t++) {
    for (const key of activeSignals) {
      composite[t] += contributions[key][t];
    }
  }

  // Latest decomposition snapshot
  const latestDecomposition = {};
  activeSignals.forEach(key => {
    const lastIdx = minLen - 1;
    latestDecomposition[key] = {
      name: config[key].name,
      raw: signalData[key][signalData[key].length - 1],
      z: zScores[key][lastIdx],
      contribution: contributions[key][lastIdx],
      weight: normWeights[key],
      direction: config[key].direction,
    };
  });

  return {
    composite,
    zScores,
    contributions,
    weights: normWeights,
    latestDecomposition,
    activeSignals,
  };
}


// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: REGIME-CONDITIONAL PORTFOLIO ANALYTICS
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute return distribution statistics per regime.
 *
 * @param {number[]} returns - Portfolio or asset return series
 * @param {number[]} regimeLabels - Regime index per period (from Viterbi)
 * @param {number[][]} [regimeProbs] - Soft regime probs (for weighted stats)
 * @returns {Object[]} Per-regime stats: { mean, vol, sharpe, skew, kurtosis, maxDD, count, ... }
 */
export function regimeConditionalStats(returns, regimeLabels, regimeProbs = null) {
  const stats = [];

  for (let regime = 0; regime < NUM_STATES; regime++) {
    const regimeName = REGIME_LIST[regime].name;

    if (regimeProbs) {
      // Weighted statistics using soft probabilities
      const weights = regimeProbs.map(p => p[regime]);
      const totalW = weights.reduce((a, b) => a + b, 0);

      if (totalW < 1) {
        stats.push(_emptyStats(regime, regimeName));
        continue;
      }

      const wMean = returns.reduce((s, r, t) => s + weights[t] * r, 0) / totalW;
      const wVar = returns.reduce((s, r, t) => s + weights[t] * (r - wMean) ** 2, 0) / totalW;
      const wStd = Math.sqrt(wVar) || 0.001;
      const wSkew = returns.reduce((s, r, t) => s + weights[t] * ((r - wMean) / wStd) ** 3, 0) / totalW;
      const wKurt = returns.reduce((s, r, t) => s + weights[t] * ((r - wMean) / wStd) ** 4, 0) / totalW - 3;

      stats.push({
        regime, name: regimeName,
        mean: wMean,
        annualizedReturn: wMean * 252,
        vol: wStd,
        annualizedVol: wStd * Math.sqrt(252),
        sharpe: (wMean / wStd) * Math.sqrt(252),
        skew: wSkew,
        excessKurtosis: wKurt,
        effectiveCount: totalW,
        maxDrawdown: _regimeDrawdown(returns, weights),
        var95: wMean - 1.645 * wStd,
        cvar95: _conditionalVaR(returns, weights, 0.05),
      });
    } else {
      // Hard classification
      const regimeReturns = returns.filter((_, t) => regimeLabels[t] === regime);
      const n = regimeReturns.length;

      if (n < 5) {
        stats.push(_emptyStats(regime, regimeName));
        continue;
      }

      const mean = regimeReturns.reduce((a, b) => a + b, 0) / n;
      const variance = regimeReturns.reduce((a, r) => a + (r - mean) ** 2, 0) / n;
      const std = Math.sqrt(variance) || 0.001;
      const skew = regimeReturns.reduce((a, r) => a + ((r - mean) / std) ** 3, 0) / n;
      const kurt = regimeReturns.reduce((a, r) => a + ((r - mean) / std) ** 4, 0) / n - 3;

      // Max drawdown within regime periods
      const dd = _simpleMaxDrawdown(regimeReturns);

      // VaR & CVaR
      const sorted = [...regimeReturns].sort((a, b) => a - b);
      const varIdx = Math.floor(n * 0.05);
      const var95 = sorted[varIdx] || sorted[0];
      const cvar95 = sorted.slice(0, varIdx + 1).reduce((a, b) => a + b, 0) / (varIdx + 1);

      stats.push({
        regime, name: regimeName,
        mean,
        annualizedReturn: mean * 252,
        vol: std,
        annualizedVol: std * Math.sqrt(252),
        sharpe: (mean / std) * Math.sqrt(252),
        skew,
        excessKurtosis: kurt,
        count: n,
        pctTime: n / returns.length,
        maxDrawdown: dd,
        var95,
        cvar95,
      });
    }
  }
  return stats;
}

function _emptyStats(regime, name) {
  return {
    regime, name,
    mean: 0, annualizedReturn: 0, vol: 0, annualizedVol: 0,
    sharpe: 0, skew: 0, excessKurtosis: 0, count: 0, pctTime: 0,
    maxDrawdown: 0, var95: 0, cvar95: 0,
  };
}

function _simpleMaxDrawdown(returns) {
  let peak = 0, maxDD = 0, cumulative = 0;
  for (const r of returns) {
    cumulative += r;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

function _regimeDrawdown(returns, weights) {
  let peak = 0, maxDD = 0, cumulative = 0;
  for (let t = 0; t < returns.length; t++) {
    cumulative += returns[t] * weights[t];
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

function _conditionalVaR(returns, weights, alpha) {
  const weighted = returns.map((r, t) => ({ r, w: weights[t] }))
    .filter(x => x.w > 0.1)
    .sort((a, b) => a.r - b.r);
  const cutoff = Math.floor(weighted.length * alpha);
  if (cutoff === 0) return weighted[0]?.r || 0;
  return weighted.slice(0, cutoff).reduce((s, x) => s + x.r, 0) / cutoff;
}

/**
 * Compute correlation matrix per regime
 * @param {Object} assetReturns - { ticker: number[] }
 * @param {number[]} regimeLabels
 * @returns {Object} { [regimeId]: { tickers: string[], matrix: number[][] } }
 */
export function regimeCorrelations(assetReturns, regimeLabels) {
  const tickers = Object.keys(assetReturns);
  const n = tickers.length;
  const result = {};

  for (let regime = 0; regime < NUM_STATES; regime++) {
    const indices = regimeLabels
      .map((r, t) => r === regime ? t : -1)
      .filter(t => t >= 0);

    if (indices.length < 10) {
      result[regime] = { tickers, matrix: Array(n).fill(null).map(() => Array(n).fill(0)) };
      continue;
    }

    // Extract regime-specific returns
    const regReturns = {};
    tickers.forEach(tk => {
      regReturns[tk] = indices.map(t => assetReturns[tk][t] || 0);
    });

    // Compute correlation matrix
    const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const corr = _pearsonCorrelation(regReturns[tickers[i]], regReturns[tickers[j]]);
        matrix[i][j] = corr;
        matrix[j][i] = corr;
      }
    }
    result[regime] = { tickers, matrix };
  }
  return result;
}

function _pearsonCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let cov = 0, sx = 0, sy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    cov += dx * dy;
    sx += dx * dx;
    sy += dy * dy;
  }
  const denom = Math.sqrt(sx * sy);
  return denom > 0 ? cov / denom : 0;
}


// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: REGIME-AWARE ALLOCATION TILTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Default allocation tilts per regime (adjustments to base allocation)
 * These multiply against base weights: >1 = overweight, <1 = underweight
 */
export const DEFAULT_REGIME_TILTS = {
  0: { // Bull
    equityMultiplier: 1.15,
    bondMultiplier: 0.85,
    commodityMultiplier: 1.0,
    cashMultiplier: 0.70,
    description: 'Risk-on: overweight equities, underweight bonds & cash',
  },
  1: { // Euphoria
    equityMultiplier: 0.90,
    bondMultiplier: 0.95,
    commodityMultiplier: 1.10,
    cashMultiplier: 1.30,
    description: 'Late-cycle caution: trim equities, raise cash & commodities',
  },
  2: { // Correction
    equityMultiplier: 0.80,
    bondMultiplier: 1.15,
    commodityMultiplier: 0.90,
    cashMultiplier: 1.40,
    description: 'Defensive: underweight equities, overweight bonds & cash',
  },
  3: { // Crisis
    equityMultiplier: 0.65,
    bondMultiplier: 1.30,
    commodityMultiplier: 0.80,
    cashMultiplier: 1.60,
    description: 'Full defense: max underweight equities, max overweight Treasuries & cash',
  },
  4: { // Recovery
    equityMultiplier: 1.25,
    bondMultiplier: 0.90,
    commodityMultiplier: 1.15,
    cashMultiplier: 0.80,
    description: 'Aggressive risk-on: recovery alpha, overweight beaten-down equities',
  },
};

/**
 * Apply regime-based tilts to a base allocation using soft probabilities
 *
 * @param {Object} baseWeights - { ticker: weight } base allocation
 * @param {number[]} regimeProbs - Current regime probability vector [5]
 * @param {Object} assetClassMap - { ticker: 'equity'|'bond'|'commodity'|'cash' }
 * @param {Object} [tilts] - Custom tilts (default: DEFAULT_REGIME_TILTS)
 * @returns {Object} { adjustedWeights, tiltExplanation[], blendedMultipliers }
 */
export function applyRegimeTilts(baseWeights, regimeProbs, assetClassMap, tilts = DEFAULT_REGIME_TILTS) {
  // Compute probability-weighted multipliers
  const blendedMultipliers = {
    equity: 0, bond: 0, commodity: 0, cash: 0,
  };

  for (let regime = 0; regime < NUM_STATES; regime++) {
    const p = regimeProbs[regime];
    const t = tilts[regime];
    blendedMultipliers.equity += p * t.equityMultiplier;
    blendedMultipliers.bond += p * t.bondMultiplier;
    blendedMultipliers.commodity += p * t.commodityMultiplier;
    blendedMultipliers.cash += p * t.cashMultiplier;
  }

  // Apply multipliers
  const adjusted = {};
  let total = 0;
  for (const [ticker, weight] of Object.entries(baseWeights)) {
    const assetClass = assetClassMap[ticker] || 'equity';
    const mult = blendedMultipliers[assetClass] || 1;
    adjusted[ticker] = weight * mult;
    total += adjusted[ticker];
  }

  // Renormalize to sum to 1
  for (const ticker of Object.keys(adjusted)) {
    adjusted[ticker] /= total;
  }

  // Generate explanation
  const dominantRegime = regimeProbs.indexOf(Math.max(...regimeProbs));
  const explanation = [
    `Dominant regime: ${REGIME_LIST[dominantRegime].name} (${(regimeProbs[dominantRegime] * 100).toFixed(1)}%)`,
    tilts[dominantRegime].description,
    `Blended equity tilt: ${((blendedMultipliers.equity - 1) * 100).toFixed(1)}%`,
    `Blended bond tilt: ${((blendedMultipliers.bond - 1) * 100).toFixed(1)}%`,
  ];

  return { adjustedWeights: adjusted, tiltExplanation: explanation, blendedMultipliers };
}


// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: TURBULENCE INDEX (Mahalanobis Distance)
// ═══════════════════════════════════════════════════════════════════

/**
 * Measures statistical unusualness of multi-asset return vectors
 * relative to their historical distribution.
 *
 * High turbulence = correlations are breaking down or returns are
 * abnormally large → classic crisis signature.
 *
 * Based on Kritzman & Li (2010): "Skulls, Financial Turbulence,
 * and Risk Management"
 */
export class TurbulenceIndex {
  /**
   * @param {Object} opts
   * @param {number} opts.lookback - Rolling window for covariance estimation (default 252)
   * @param {number} opts.decayFactor - Exponential decay for EWMA covariance (0 = equal weight, 0.94 = RiskMetrics)
   */
  constructor(opts = {}) {
    this.lookback = opts.lookback || 252;
    this.decay = opts.decayFactor || 0; // 0 = simple, >0 = exponential
  }

  /**
   * Compute turbulence time series from multi-asset returns.
   *
   * @param {Object} assetReturns - { ticker: number[] } — all arrays same length
   * @returns {Object} {
   *   turbulence: number[],        — raw Mahalanobis distance per period
   *   turbulencePctl: number[],    — percentile rank (0-1) vs trailing window
   *   regimeSignal: number[],      — 0=calm, 1=elevated, 2=turbulent (thresholded)
   *   currentTurbulence: number,
   *   currentPercentile: number,
   *   mean: number,
   *   std: number,
   *   threshold75: number,
   *   threshold95: number,
   * }
   */
  compute(assetReturns) {
    const tickers = Object.keys(assetReturns);
    const K = tickers.length; // number of assets
    const T = Math.min(...tickers.map(tk => assetReturns[tk].length));

    if (T < this.lookback + 10 || K < 2) {
      return this._emptyResult(T);
    }

    // Build return matrix: T x K
    const R = [];
    for (let t = 0; t < T; t++) {
      R.push(tickers.map(tk => assetReturns[tk][t]));
    }

    const turbulence = new Array(T).fill(0);

    for (let t = this.lookback; t < T; t++) {
      // Historical window: [t - lookback, t)
      const window = R.slice(t - this.lookback, t);

      // Compute mean vector
      const mu = new Array(K).fill(0);
      for (const row of window) for (let j = 0; j < K; j++) mu[j] += row[j];
      for (let j = 0; j < K; j++) mu[j] /= this.lookback;

      // Compute covariance matrix (with optional exponential weighting)
      const cov = _computeCovMatrix(window, mu, K, this.decay);

      // Invert covariance matrix
      const covInv = _invertMatrix(cov, K);
      if (!covInv) { turbulence[t] = turbulence[t - 1] || 0; continue; }

      // Mahalanobis distance: d_t = (r_t - μ)' Σ^{-1} (r_t - μ)
      const dev = R[t].map((r, j) => r - mu[j]);
      let d = 0;
      for (let i = 0; i < K; i++) {
        let inner = 0;
        for (let j = 0; j < K; j++) inner += covInv[i][j] * dev[j];
        d += dev[i] * inner;
      }
      turbulence[t] = Math.max(0, d);
    }

    // Compute rolling percentiles
    const turbulencePctl = new Array(T).fill(0);
    for (let t = this.lookback; t < T; t++) {
      const window = turbulence.slice(Math.max(0, t - this.lookback), t + 1);
      const sorted = [...window].sort((a, b) => a - b);
      const rank = sorted.filter(v => v <= turbulence[t]).length;
      turbulencePctl[t] = rank / sorted.length;
    }

    // Threshold into regime signal: 0=calm, 1=elevated, 2=turbulent
    const regimeSignal = turbulencePctl.map(p =>
      p >= 0.95 ? 2 : p >= 0.75 ? 1 : 0
    );

    // Summary stats
    const validTurb = turbulence.slice(this.lookback);
    const mean = validTurb.reduce((a, b) => a + b, 0) / validTurb.length;
    const std = Math.sqrt(validTurb.reduce((a, v) => a + (v - mean) ** 2, 0) / validTurb.length) || 1;
    const sortedAll = [...validTurb].sort((a, b) => a - b);

    return {
      turbulence,
      turbulencePctl,
      regimeSignal,
      currentTurbulence: turbulence[T - 1],
      currentPercentile: turbulencePctl[T - 1],
      mean,
      std,
      threshold75: sortedAll[Math.floor(sortedAll.length * 0.75)] || 0,
      threshold95: sortedAll[Math.floor(sortedAll.length * 0.95)] || 0,
    };
  }

  _emptyResult(T) {
    return {
      turbulence: new Array(T).fill(0),
      turbulencePctl: new Array(T).fill(0.5),
      regimeSignal: new Array(T).fill(0),
      currentTurbulence: 0, currentPercentile: 0.5,
      mean: 0, std: 1, threshold75: 0, threshold95: 0,
    };
  }
}

/**
 * Compute covariance matrix with optional exponential weighting.
 */
function _computeCovMatrix(window, mu, K, decay) {
  const N = window.length;
  const cov = Array.from({ length: K }, () => new Array(K).fill(0));

  if (decay > 0) {
    // Exponentially weighted covariance
    let wSum = 0;
    for (let t = 0; t < N; t++) {
      const w = Math.pow(decay, N - 1 - t);
      wSum += w;
      for (let i = 0; i < K; i++) {
        for (let j = i; j < K; j++) {
          cov[i][j] += w * (window[t][i] - mu[i]) * (window[t][j] - mu[j]);
        }
      }
    }
    for (let i = 0; i < K; i++) {
      for (let j = i; j < K; j++) {
        cov[i][j] /= wSum;
        cov[j][i] = cov[i][j];
      }
    }
  } else {
    // Simple covariance
    for (const row of window) {
      for (let i = 0; i < K; i++) {
        for (let j = i; j < K; j++) {
          cov[i][j] += (row[i] - mu[i]) * (row[j] - mu[j]);
        }
      }
    }
    for (let i = 0; i < K; i++) {
      for (let j = i; j < K; j++) {
        cov[i][j] /= N;
        cov[j][i] = cov[i][j];
      }
    }
  }

  // Regularization: add small diagonal for numerical stability
  for (let i = 0; i < K; i++) cov[i][i] += 1e-8;

  return cov;
}

/**
 * Matrix inversion via Gauss-Jordan elimination (for small K).
 * Returns null if singular.
 */
function _invertMatrix(matrix, K) {
  // Augmented matrix [A | I]
  const aug = matrix.map((row, i) => {
    const newRow = [...row];
    for (let j = 0; j < K; j++) newRow.push(i === j ? 1 : 0);
    return newRow;
  });

  for (let col = 0; col < K; col++) {
    // Partial pivoting
    let maxRow = col, maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < K; row++) {
      if (Math.abs(aug[row][col]) > maxVal) { maxVal = Math.abs(aug[row][col]); maxRow = row; }
    }
    if (maxVal < 1e-12) return null; // Singular
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    // Scale pivot row
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * K; j++) aug[col][j] /= pivot;

    // Eliminate column
    for (let row = 0; row < K; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * K; j++) aug[row][j] -= factor * aug[col][j];
    }
  }

  // Extract inverse
  return aug.map(row => row.slice(K));
}


// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: ABSORPTION RATIO (PCA-Based Systemic Risk)
// ═══════════════════════════════════════════════════════════════════

/**
 * Kritzman, Li, Page & Rigobon (2011): "Principal Components as
 * a Measure of Systemic Risk"
 *
 * Absorption Ratio = fraction of total variance explained by
 * the top N eigenvectors. When AR rises, assets are moving
 * together → fragility / herding. When AR drops, diversification
 * is working → stability.
 *
 * This is a fully model-free indicator — no assumptions about
 * the number of regimes or their structure.
 */
export class AbsorptionRatio {
  /**
   * @param {Object} opts
   * @param {number} opts.lookback - Rolling window (default 252)
   * @param {number} opts.numComponents - PCA components to use (default: 20% of assets, min 1)
   * @param {number} opts.halfLife - Exponential half-life for shift detection (default 126)
   */
  constructor(opts = {}) {
    this.lookback = opts.lookback || 252;
    this.numComponents = opts.numComponents || null; // auto-select
    this.halfLife = opts.halfLife || 126;
  }

  /**
   * Compute absorption ratio time series.
   *
   * @param {Object} assetReturns - { ticker: number[] }
   * @returns {Object} {
   *   absorptionRatio: number[],     — AR value per period (0-1)
   *   arShift: number[],             — Standardized shift (AR - trailing mean) / trailing std
   *   regimeSignal: number[],        — 0=diversified, 1=concentrating, 2=fragile
   *   currentAR: number,
   *   currentShift: number,
   *   mean: number,
   * }
   */
  compute(assetReturns) {
    const tickers = Object.keys(assetReturns);
    const K = tickers.length;
    const T = Math.min(...tickers.map(tk => assetReturns[tk].length));
    const nComp = this.numComponents || Math.max(1, Math.floor(K * 0.2));

    if (T < this.lookback + 10 || K < 3) {
      return this._emptyResult(T);
    }

    // Build return matrix
    const R = [];
    for (let t = 0; t < T; t++) {
      R.push(tickers.map(tk => assetReturns[tk][t]));
    }

    const ar = new Array(T).fill(0);

    for (let t = this.lookback; t < T; t++) {
      const window = R.slice(t - this.lookback, t);

      // Compute correlation matrix (not covariance — AR uses correlations)
      const mu = new Array(K).fill(0);
      const sd = new Array(K).fill(0);
      for (const row of window) for (let j = 0; j < K; j++) mu[j] += row[j];
      for (let j = 0; j < K; j++) mu[j] /= this.lookback;
      for (const row of window) for (let j = 0; j < K; j++) sd[j] += (row[j] - mu[j]) ** 2;
      for (let j = 0; j < K; j++) sd[j] = Math.sqrt(sd[j] / this.lookback) || 1e-10;

      const corr = Array.from({ length: K }, () => new Array(K).fill(0));
      for (const row of window) {
        for (let i = 0; i < K; i++) {
          for (let j = i; j < K; j++) {
            corr[i][j] += ((row[i] - mu[i]) / sd[i]) * ((row[j] - mu[j]) / sd[j]);
          }
        }
      }
      for (let i = 0; i < K; i++) {
        for (let j = i; j < K; j++) {
          corr[i][j] /= this.lookback;
          corr[j][i] = corr[i][j];
        }
      }

      // Power iteration for top eigenvalues
      const eigenvalues = _topEigenvalues(corr, K, nComp);
      const totalVar = K; // trace of correlation matrix = K
      ar[t] = eigenvalues.reduce((a, b) => a + b, 0) / totalVar;
    }

    // AR Shift: standardized deviation from trailing mean
    const arShift = new Array(T).fill(0);
    const shiftWindow = Math.floor(this.halfLife * 2);
    for (let t = this.lookback + shiftWindow; t < T; t++) {
      const trail = ar.slice(t - shiftWindow, t);
      const trailMean = trail.reduce((a, b) => a + b, 0) / trail.length;
      const trailStd = Math.sqrt(trail.reduce((a, v) => a + (v - trailMean) ** 2, 0) / trail.length) || 0.001;
      arShift[t] = (ar[t] - trailMean) / trailStd;
    }

    // Threshold: positive shift = concentrating risk, large positive = fragile
    const regimeSignal = arShift.map(s =>
      s >= 1.5 ? 2 : s >= 0.5 ? 1 : 0
    );

    const validAR = ar.slice(this.lookback).filter(v => v > 0);
    const mean = validAR.length ? validAR.reduce((a, b) => a + b, 0) / validAR.length : 0;

    return {
      absorptionRatio: ar,
      arShift,
      regimeSignal,
      currentAR: ar[T - 1],
      currentShift: arShift[T - 1],
      mean,
    };
  }

  _emptyResult(T) {
    return {
      absorptionRatio: new Array(T).fill(0.3),
      arShift: new Array(T).fill(0),
      regimeSignal: new Array(T).fill(0),
      currentAR: 0.3, currentShift: 0, mean: 0.3,
    };
  }
}

/**
 * Compute top-k eigenvalues of a symmetric matrix via deflated power iteration.
 * Good enough for K < 100 assets; avoids needing a full linear algebra library.
 */
function _topEigenvalues(matrix, K, k) {
  const eigenvalues = [];
  // Work on a copy we can deflate
  const M = matrix.map(row => [...row]);

  for (let comp = 0; comp < k; comp++) {
    // Power iteration for dominant eigenvalue
    let v = new Array(K).fill(0).map(() => Math.random() - 0.5);
    let norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
    v = v.map(x => x / norm);

    let eigenvalue = 0;
    for (let iter = 0; iter < 200; iter++) {
      // w = M * v
      const w = new Array(K).fill(0);
      for (let i = 0; i < K; i++) {
        for (let j = 0; j < K; j++) w[i] += M[i][j] * v[j];
      }
      eigenvalue = w.reduce((a, b) => a + b * b, 0);
      eigenvalue = Math.sqrt(eigenvalue);
      if (eigenvalue < 1e-12) break;
      v = w.map(x => x / eigenvalue);
    }

    // Rayleigh quotient for more precise eigenvalue
    const Mv = new Array(K).fill(0);
    for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) Mv[i] += M[i][j] * v[j];
    eigenvalue = v.reduce((s, vi, i) => s + vi * Mv[i], 0);
    eigenvalues.push(Math.max(0, eigenvalue));

    // Deflate: M = M - λ * v * v'
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) {
        M[i][j] -= eigenvalue * v[i] * v[j];
      }
    }
  }

  return eigenvalues;
}


// ═══════════════════════════════════════════════════════════════════
//  SECTION 7: BAYESIAN ONLINE CHANGE-POINT DETECTION (BOCPD)
// ═══════════════════════════════════════════════════════════════════

/**
 * Adams & MacKay (2007): "Bayesian Online Changepoint Detection"
 *
 * Maintains a distribution over "run length" — how long since
 * the last change-point. When the model detects the current data
 * is unlikely under the current run, probability mass shifts to
 * run length 0 (= change-point just occurred).
 *
 * This gives a real-time "something just changed" signal that
 * is completely independent of regime labels — pure anomaly detection.
 */
export class BOCPD {
  /**
   * @param {Object} opts
   * @param {number} opts.hazard - Prior probability of change-point at any step (default 1/100)
   * @param {number} opts.mu0 - Prior mean of data (default 0)
   * @param {number} opts.kappa0 - Prior strength for mean (default 1)
   * @param {number} opts.alpha0 - Prior shape for variance (default 1)
   * @param {number} opts.beta0 - Prior scale for variance (default 1)
   */
  constructor(opts = {}) {
    this.hazard = opts.hazard || 1 / 100;
    this.mu0 = opts.mu0 || 0;
    this.kappa0 = opts.kappa0 || 1;
    this.alpha0 = opts.alpha0 || 1;
    this.beta0 = opts.beta0 || 1;
  }

  /**
   * Run BOCPD on a univariate time series.
   *
   * @param {number[]} data - Observed time series (e.g. composite score)
   * @returns {Object} {
   *   changePointProb: number[],  — P(change-point at t) per timestep
   *   runLength: number[],        — MAP (most likely) run length at each t
   *   changePoints: number[],     — Indices where P(CP) > threshold
   *   alerts: { index, probability, severity }[],
   *   currentRunLength: number,
   *   currentCPProb: number,
   * }
   */
  detect(data) {
    const T = data.length;
    if (T < 10) return this._emptyResult(T);

    const H = this.hazard;

    // Sufficient statistics for Normal-Inverse-Gamma posterior
    // We maintain arrays indexed by run length
    let muN = [this.mu0];
    let kappaN = [this.kappa0];
    let alphaN = [this.alpha0];
    let betaN = [this.beta0];

    // Run-length probability distribution
    // R[r] = P(run_length = r) at current time
    let R = [1.0]; // at t=0, run length is 0 with probability 1

    const changePointProb = new Array(T).fill(0);
    const runLengthMAP = new Array(T).fill(0);

    for (let t = 0; t < T; t++) {
      const x = data[t];
      const prevLen = R.length;

      // 1. Evaluate predictive probability for each run length
      // P(x_t | run_length = r) under Student-t posterior
      const predProbs = new Array(prevLen);
      for (let r = 0; r < prevLen; r++) {
        predProbs[r] = _studentTPdf(
          x,
          muN[r],
          betaN[r] * (kappaN[r] + 1) / (alphaN[r] * kappaN[r]),
          2 * alphaN[r]
        );
      }

      // 2. Growth probabilities: P(r_{t+1} = r+1) = P(r_t = r) * (1-H) * pred
      const growthProbs = new Array(prevLen);
      for (let r = 0; r < prevLen; r++) {
        growthProbs[r] = R[r] * predProbs[r] * (1 - H);
      }

      // 3. Change-point probability: P(r_{t+1} = 0) = sum(P(r_t = r) * H * pred)
      let cpProb = 0;
      for (let r = 0; r < prevLen; r++) {
        cpProb += R[r] * predProbs[r] * H;
      }

      // 4. Build new run-length distribution
      const newR = new Array(prevLen + 1);
      newR[0] = cpProb;
      for (let r = 0; r < prevLen; r++) {
        newR[r + 1] = growthProbs[r];
      }

      // Normalize
      const total = newR.reduce((a, b) => a + b, 0) || 1e-300;
      for (let r = 0; r <= prevLen; r++) newR[r] /= total;

      // 5. Update sufficient statistics
      const newMu = [this.mu0];
      const newKappa = [this.kappa0];
      const newAlpha = [this.alpha0];
      const newBeta = [this.beta0];

      for (let r = 0; r < prevLen; r++) {
        const k = kappaN[r];
        const m = muN[r];
        const a = alphaN[r];
        const b = betaN[r];

        newMu.push((k * m + x) / (k + 1));
        newKappa.push(k + 1);
        newAlpha.push(a + 0.5);
        newBeta.push(b + (k * (x - m) ** 2) / (2 * (k + 1)));
      }

      R = newR;
      muN = newMu;
      kappaN = newKappa;
      alphaN = newAlpha;
      betaN = newBeta;

      // Record results
      changePointProb[t] = R[0]; // P(run_length = 0) = P(change just happened)

      // MAP run length
      let maxP = 0, maxR = 0;
      for (let r = 0; r < R.length; r++) {
        if (R[r] > maxP) { maxP = R[r]; maxR = r; }
      }
      runLengthMAP[t] = maxR;

      // Prune very small run-length probabilities for performance
      if (R.length > 300) {
        const threshold = 1e-6;
        const keepLen = R.findIndex((_, i) => i > 5 && R.slice(i).every(p => p < threshold));
        if (keepLen > 0 && keepLen < R.length) {
          R = R.slice(0, keepLen);
          muN = muN.slice(0, keepLen);
          kappaN = kappaN.slice(0, keepLen);
          alphaN = alphaN.slice(0, keepLen);
          betaN = betaN.slice(0, keepLen);
        }
      }
    }

    // Identify change-points (where P(CP) > threshold)
    const cpThreshold = 0.3;
    const alertThreshold = 0.2;
    const changePoints = [];
    const alerts = [];

    for (let t = 10; t < T; t++) {
      if (changePointProb[t] > cpThreshold) {
        changePoints.push(t);
      }
      if (changePointProb[t] > alertThreshold) {
        alerts.push({
          index: t,
          probability: changePointProb[t],
          severity: changePointProb[t] > 0.5 ? 'high' : changePointProb[t] > 0.3 ? 'medium' : 'low',
        });
      }
    }

    return {
      changePointProb,
      runLength: runLengthMAP,
      changePoints,
      alerts,
      currentRunLength: runLengthMAP[T - 1],
      currentCPProb: changePointProb[T - 1],
    };
  }

  _emptyResult(T) {
    return {
      changePointProb: new Array(T).fill(0),
      runLength: new Array(T).fill(0),
      changePoints: [], alerts: [],
      currentRunLength: 0, currentCPProb: 0,
    };
  }
}

/**
 * Student-t probability density function.
 * Used as the predictive distribution in BOCPD with Normal-IG conjugate prior.
 */
function _studentTPdf(x, mu, sigSq, nu) {
  const sigma = Math.sqrt(Math.max(sigSq, 1e-12));
  const z = (x - mu) / sigma;
  // log pdf of Student-t
  const logPdf = _logGamma((nu + 1) / 2)
    - _logGamma(nu / 2)
    - 0.5 * Math.log(nu * Math.PI)
    - Math.log(sigma)
    - ((nu + 1) / 2) * Math.log(1 + z * z / nu);
  return Math.exp(logPdf);
}

/**
 * Log-gamma function via Stirling approximation + Lanczos.
 */
function _logGamma(x) {
  if (x <= 0) return 0;
  if (x < 0.5) {
    // Reflection formula
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - _logGamma(1 - x);
  }
  x -= 1;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  let sum = c[0];
  for (let i = 1; i < g + 2; i++) sum += c[i] / (x + i);
  const t = x + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(sum);
}


// ═══════════════════════════════════════════════════════════════════
//  SECTION 8: ENSEMBLE REGIME DETECTOR
// ═══════════════════════════════════════════════════════════════════

/**
 * Fuses HMM probabilities with Turbulence, Absorption Ratio, and
 * BOCPD into a single consensus regime assessment.
 *
 * Philosophy: the HMM is the primary signal (it labels *which* regime),
 * while Turbulence, AR, and BOCPD are confirmation/warning signals
 * that can override or adjust HMM confidence.
 *
 * Key insight: when HMM says "Bull" but turbulence is at 95th percentile
 * and BOCPD flags a change-point, the ensemble should reduce confidence
 * in Bull and shift probability toward Correction/Crisis.
 */
export class EnsembleRegimeDetector {
  /**
   * @param {Object} opts
   * @param {number} opts.hmmWeight - Weight for HMM signal (default 0.50)
   * @param {number} opts.turbulenceWeight - Weight for turbulence adjustment (default 0.20)
   * @param {number} opts.absorptionWeight - Weight for absorption ratio adjustment (default 0.15)
   * @param {number} opts.bocpdWeight - Weight for change-point adjustment (default 0.15)
   * @param {number} opts.turbulenceLookback - Lookback for turbulence computation (default 252)
   * @param {number} opts.absorptionLookback - Lookback for AR computation (default 252)
   * @param {number} opts.bocpdHazard - BOCPD hazard rate (default 1/100)
   */
  constructor(opts = {}) {
    this.weights = {
      hmm:        opts.hmmWeight || 0.50,
      turbulence: opts.turbulenceWeight || 0.20,
      absorption: opts.absorptionWeight || 0.15,
      bocpd:      opts.bocpdWeight || 0.15,
    };
    // Normalize
    const wSum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    for (const k of Object.keys(this.weights)) this.weights[k] /= wSum;

    this.turbulenceEngine = new TurbulenceIndex({ lookback: opts.turbulenceLookback || 252 });
    this.absorptionEngine = new AbsorptionRatio({ lookback: opts.absorptionLookback || 252 });
    this.bocpdEngine = new BOCPD({ hazard: opts.bocpdHazard || 1 / 100 });
  }

  /**
   * Run all detectors and fuse into ensemble regime probabilities.
   *
   * @param {Object} params
   * @param {number[][]} params.hmmFilteredProbs - HMM filtered probabilities [T x 5]
   * @param {number[]} params.compositeScore - Composite stress score for BOCPD
   * @param {Object} params.assetReturns - { ticker: number[] } for Turbulence & AR
   * @returns {Object} {
   *   ensembleProbabilities: number[][],  — T x 5 adjusted probabilities
   *   currentEnsemble: number[],          — Latest ensemble probability vector
   *   currentRegime: { id, name, color, probability },
   *   turbulence: TurbulenceResult,
   *   absorption: AbsorptionResult,
   *   bocpd: BOCPDResult,
   *   agreement: number,                 — 0-1 how much detectors agree with HMM
   *   confidenceAdjustment: number,       — How much ensemble shifts from HMM
   *   alerts: { source, message, severity }[],
   * }
   */
  detect(params) {
    const { hmmFilteredProbs, compositeScore, assetReturns } = params;
    const T = hmmFilteredProbs.length;

    // Run subsidiary detectors
    const turbResult = assetReturns
      ? this.turbulenceEngine.compute(assetReturns)
      : this.turbulenceEngine._emptyResult(T);

    const arResult = assetReturns
      ? this.absorptionEngine.compute(assetReturns)
      : this.absorptionEngine._emptyResult(T);

    const bocpdResult = compositeScore
      ? this.bocpdEngine.detect(compositeScore)
      : this.bocpdEngine._emptyResult(T);

    // Fuse signals into adjusted probabilities
    const ensembleProbs = [];
    const minLen = Math.min(T, turbResult.turbulence.length, arResult.absorptionRatio.length, bocpdResult.changePointProb.length);

    for (let t = 0; t < minLen; t++) {
      // Start with HMM base probabilities
      const base = [...hmmFilteredProbs[t]];

      // Turbulence adjustment: high turbulence → shift probability toward Crisis/Correction
      const turbPctl = turbResult.turbulencePctl[t] || 0;
      const turbShift = Math.max(0, (turbPctl - 0.5) * 2); // 0 if calm, 1 if extreme

      // Absorption adjustment: high AR shift → systemic risk rising
      const arShift = Math.max(0, arResult.arShift[t] || 0);
      const arStress = Math.min(1, arShift / 2); // normalize to [0,1]

      // BOCPD adjustment: high CP probability → uncertainty spike
      const cpProb = bocpdResult.changePointProb[t] || 0;

      // Compute stress-weighted adjustment
      // When stress indicators fire, redistribute probability from Bull/Euphoria to Correction/Crisis
      const stressLevel = (
        turbShift * this.weights.turbulence +
        arStress * this.weights.absorption +
        cpProb * this.weights.bocpd
      ) / (this.weights.turbulence + this.weights.absorption + this.weights.bocpd);

      const adjusted = new Array(NUM_STATES);
      const stressFactor = Math.min(stressLevel * 2, 1); // Scale up for impact

      // Bull and Euphoria get penalized under stress
      adjusted[0] = base[0] * (1 - stressFactor * 0.5);  // Bull
      adjusted[1] = base[1] * (1 - stressFactor * 0.3);  // Euphoria

      // Correction and Crisis get boosted under stress
      adjusted[2] = base[2] + stressFactor * 0.15;        // Correction
      adjusted[3] = base[3] + stressFactor * 0.20;        // Crisis

      // Recovery gets mild adjustment
      adjusted[4] = base[4] * (1 - stressFactor * 0.1);   // Recovery

      // Renormalize
      const total = adjusted.reduce((a, b) => a + b, 0) || 1;
      ensembleProbs.push(adjusted.map(p => Math.max(0, p) / total));
    }

    // Current state
    const currentEnsemble = ensembleProbs[ensembleProbs.length - 1] || new Array(NUM_STATES).fill(1 / NUM_STATES);
    const currentMax = Math.max(...currentEnsemble);
    const currentId = currentEnsemble.indexOf(currentMax);

    // Agreement metric: cosine similarity between HMM and ensemble
    const hmmLast = hmmFilteredProbs[T - 1];
    const dotProduct = hmmLast.reduce((s, v, i) => s + v * currentEnsemble[i], 0);
    const hmmNorm = Math.sqrt(hmmLast.reduce((s, v) => s + v * v, 0));
    const ensNorm = Math.sqrt(currentEnsemble.reduce((s, v) => s + v * v, 0));
    const agreement = dotProduct / ((hmmNorm * ensNorm) || 1);

    // Confidence adjustment: L1 distance between HMM and ensemble
    const l1Dist = hmmLast.reduce((s, v, i) => s + Math.abs(v - currentEnsemble[i]), 0) / 2;

    // Generate alerts
    const alerts = [];
    if (turbResult.currentPercentile > 0.90) {
      alerts.push({
        source: 'Turbulence',
        message: `Turbulence at ${(turbResult.currentPercentile * 100).toFixed(0)}th percentile — unusual market stress`,
        severity: turbResult.currentPercentile > 0.95 ? 'high' : 'medium',
        value: turbResult.currentTurbulence,
      });
    }
    if (arResult.currentShift > 1.0) {
      alerts.push({
        source: 'Absorption Ratio',
        message: `AR shift +${arResult.currentShift.toFixed(1)}σ — correlations converging, systemic risk rising`,
        severity: arResult.currentShift > 2.0 ? 'high' : 'medium',
        value: arResult.currentAR,
      });
    }
    if (bocpdResult.currentCPProb > 0.2) {
      alerts.push({
        source: 'Change-Point',
        message: `Change-point probability ${(bocpdResult.currentCPProb * 100).toFixed(0)}% — regime transition may be underway`,
        severity: bocpdResult.currentCPProb > 0.5 ? 'high' : 'medium',
        value: bocpdResult.currentCPProb,
      });
    }

    // Disagreement alert
    if (l1Dist > 0.3) {
      const hmmRegime = REGIME_LIST[hmmLast.indexOf(Math.max(...hmmLast))].name;
      const ensRegime = REGIME_LIST[currentId].name;
      alerts.push({
        source: 'Ensemble',
        message: `HMM says ${hmmRegime} but ensemble tilts toward ${ensRegime} — secondary indicators diverge`,
        severity: l1Dist > 0.5 ? 'high' : 'medium',
        value: l1Dist,
      });
    }

    return {
      ensembleProbabilities: ensembleProbs,
      currentEnsemble,
      currentRegime: {
        id: currentId,
        name: REGIME_LIST[currentId].name,
        color: REGIME_LIST[currentId].color,
        probability: currentMax,
      },
      turbulence: turbResult,
      absorption: arResult,
      bocpd: bocpdResult,
      agreement,
      confidenceAdjustment: l1Dist,
      alerts,
      weights: this.weights,
    };
  }
}


// ═══════════════════════════════════════════════════════════════════
//  SECTION 9: HIGH-LEVEL ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════

/**
 * Full regime analysis pipeline — now with ensemble detection.
 *
 * @param {Object} params
 * @param {Object} params.signalData - { hyOas: number[], vixLevel: number[], ... }
 * @param {number[]} [params.portfolioReturns] - Daily portfolio returns
 * @param {Object} [params.assetReturns] - { ticker: number[] } for Turbulence, AR, correlations
 * @param {Object} [params.signalConfig] - Custom signal config
 * @param {boolean} [params.trainHMM=true] - Whether to run Baum-Welch training
 * @param {boolean} [params.runEnsemble=true] - Whether to run ensemble detection
 * @param {Object} [params.ensembleOpts] - Options for EnsembleRegimeDetector
 * @returns {Object} Complete regime analysis results
 */
export function runRegimeAnalysis(params) {
  const {
    signalData,
    portfolioReturns = null,
    assetReturns = null,
    signalConfig = DEFAULT_SIGNAL_CONFIG,
    trainHMM = true,
    runEnsemble = true,
    ensembleOpts = {},
  } = params;

  // Step 1: Compute composite score
  const scoring = computeCompositeScore(signalData, signalConfig);

  // Step 2: Initialize and optionally train HMM
  const hmm = new GaussianHMM(NUM_STATES);

  let trainingInfo = null;
  if (trainHMM && scoring.composite.length > 50) {
    trainingInfo = hmm.fit(scoring.composite);
  }

  // Step 3: Get regime probabilities and labels
  const smoothedProbs = hmm.smooth(scoring.composite);
  const filteredProbs = hmm.filter(scoring.composite);
  const viterbiPath = hmm.viterbi(scoring.composite);

  // Current state (latest)
  const currentProbs = filteredProbs[filteredProbs.length - 1];
  const currentRegime = currentProbs.indexOf(Math.max(...currentProbs));

  // Step 4: Forecast
  const forecast = hmm.forecast(currentProbs, 20);

  // Step 5: Regime-conditional stats (if returns provided)
  let conditionalStats = null;
  if (portfolioReturns && portfolioReturns.length > 0) {
    const minLen = Math.min(portfolioReturns.length, viterbiPath.length);
    const alignedReturns = portfolioReturns.slice(-minLen);
    const alignedLabels = viterbiPath.slice(-minLen);
    const alignedProbs = smoothedProbs.slice(-minLen);
    conditionalStats = regimeConditionalStats(alignedReturns, alignedLabels, alignedProbs);
  }

  // Step 6: Regime correlations (if asset returns provided)
  let correlations = null;
  if (assetReturns) {
    const minLen = Math.min(
      Math.min(...Object.values(assetReturns).map(r => r.length)),
      viterbiPath.length
    );
    const alignedLabels = viterbiPath.slice(-minLen);
    const alignedAssets = {};
    for (const [tk, rets] of Object.entries(assetReturns)) {
      alignedAssets[tk] = rets.slice(-minLen);
    }
    correlations = regimeCorrelations(alignedAssets, alignedLabels);
  }

  // Step 7: Regime duration analysis
  const durations = _analyzeRegimeDurations(viterbiPath);
  const expectedDurations = hmm.expectedDurations();
  const stationaryDist = hmm.stationaryDistribution();

  // Step 8: Ensemble detection (NEW)
  let ensemble = null;
  if (runEnsemble) {
    const detector = new EnsembleRegimeDetector(ensembleOpts);
    ensemble = detector.detect({
      hmmFilteredProbs: filteredProbs,
      compositeScore: scoring.composite,
      assetReturns: assetReturns || null,
    });
  }

  return {
    // Core results
    currentRegime: {
      id: currentRegime,
      name: REGIME_LIST[currentRegime].name,
      color: REGIME_LIST[currentRegime].color,
      probability: currentProbs[currentRegime],
      allProbabilities: currentProbs,
    },

    // Time series
    compositeScore: scoring.composite,
    signalDecomposition: scoring.latestDecomposition,
    smoothedProbabilities: smoothedProbs,
    filteredProbabilities: filteredProbs,
    viterbiPath,

    // Transition analysis
    transitionMatrix: hmm.A,
    forecast,
    stationaryDistribution: stationaryDist,
    expectedDurations,
    observedDurations: durations,

    // Conditional analytics
    conditionalStats,
    correlations,

    // Ensemble (NEW)
    ensemble,

    // Model info
    trainingInfo,
    modelParams: hmm.serialize(),
    hmm, // expose for direct use
  };
}

/**
 * Analyze observed regime durations from Viterbi path
 */
function _analyzeRegimeDurations(path) {
  const durations = {};
  for (let i = 0; i < NUM_STATES; i++) durations[i] = [];

  let current = path[0];
  let len = 1;
  for (let t = 1; t < path.length; t++) {
    if (path[t] === current) {
      len++;
    } else {
      durations[current].push(len);
      current = path[t];
      len = 1;
    }
  }
  durations[current].push(len); // last segment

  // Compute summary stats
  const summary = {};
  for (let i = 0; i < NUM_STATES; i++) {
    const d = durations[i];
    if (d.length === 0) {
      summary[i] = { mean: 0, median: 0, max: 0, min: 0, count: 0, totalPeriods: 0 };
    } else {
      const sorted = [...d].sort((a, b) => a - b);
      summary[i] = {
        mean: d.reduce((a, b) => a + b, 0) / d.length,
        median: sorted[Math.floor(sorted.length / 2)],
        max: sorted[sorted.length - 1],
        min: sorted[0],
        count: d.length,
        totalPeriods: d.reduce((a, b) => a + b, 0),
        episodes: d,
      };
    }
  }
  return summary;
}

export default {
  GaussianHMM,
  TurbulenceIndex,
  AbsorptionRatio,
  BOCPD,
  EnsembleRegimeDetector,
  REGIMES,
  REGIME_LIST,
  NUM_STATES,
  DEFAULT_SIGNAL_CONFIG,
  DEFAULT_REGIME_TILTS,
  computeCompositeScore,
  regimeConditionalStats,
  regimeCorrelations,
  applyRegimeTilts,
  runRegimeAnalysis,
};
