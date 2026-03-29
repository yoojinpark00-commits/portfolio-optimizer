# Portfolio Optimizer Alpha Enhancement — Implementation Plan

## Overview
Add 18 quant strategies across 5 modules to significantly improve the optimizer's alpha generation, risk management, and signal quality. Changes touch `api/regime.js`, `api/RegimeEngine.js`, and `src/App.jsx`.

---

## Phase 1: Momentum Signal Enhancements (src/App.jsx)

### 1.1 Volatility-Scaled Momentum (Barroso & Santa-Clara 2015)
**Expected impact: ~2x Sharpe ratio improvement on momentum signal**

- In `computeFactorScores()`, after computing `mom12_1`, compute the realized volatility of the momentum L/S spread over the trailing 126 days (6 months)
- Scale momentum signal: `volScaledMom = mom12_1 * (targetVol / realizedMomVol)` where `targetVol = 12%`
- Apply the same scaling to `mom6_1` and `mom3_1`
- Add `volScaledMom` as a new factor in the composite scoring, replacing raw `mom12_1` as the primary momentum signal
- **Formula:**
  ```js
  const momReturns = []; // collect monthly L/S momentum returns over trailing 126d
  const momVol = std(momReturns) * Math.sqrt(12); // annualize
  const volScale = Math.min(2.0, Math.max(0.3, 0.12 / (momVol || 0.12)));
  const volScaledMom12 = mom12_1 * volScale;
  ```

### 1.2 Frog-in-the-Pan (FIP) Momentum Quality (Da, Gurun, Warachka 2014)
**Expected impact: +3-4% spread improvement on momentum signal**

- In `computeFactorScores()`, for each asset, compute Information Discreteness:
  ```js
  const pctPos = dailyRets.filter(r => r > 0).length / dailyRets.length;
  const pctNeg = dailyRets.filter(r => r < 0).length / dailyRets.length;
  const ID = Math.sign(cumReturn) * (pctNeg - pctPos);
  // More negative ID = more continuous (higher quality) momentum
  ```
- Use `ID` as a momentum quality overlay: multiply momentum rank by `(1 - ID_rank)` to boost continuous momentum and penalize jumpy momentum
- Add as `fipQuality` factor in the factor scoring system

### 1.3 52-Week High Momentum (George & Hwang 2004)
**Expected impact: 0.65%/mo with no long-term reversal**

- In `computeFactorScores()`, compute nearness to 52-week high:
  ```js
  const high252 = Math.max(...dailyPrices.slice(-252));
  const nearHigh = currentPrice / high252; // 0 to 1
  ```
- Add `nearHigh` as a new factor signal. Rank cross-sectionally.
- Particularly valuable because it has **no reversal** (unlike standard momentum)

### 1.4 Momentum Acceleration
**Expected impact: improved signal timing, overlay on existing momentum**

- In `computeFactorScores()`, compute acceleration:
  ```js
  const momAccel = mom6_1 - (mom12_1 - mom6_1); // recent half vs earlier half
  ```
- Add as `momAccel` factor — among high-momentum stocks, favor those with accelerating momentum

### 1.5 Multi-Speed EWMAC Trend Ensemble (Carver/Man AHL)
**Expected impact: better trend capture across multiple timeframes**

- Add new function `computeEWMACEnsemble(prices)`:
  ```js
  function ewmac(prices, fast, slow) {
    const emaFast = ema(prices, fast);
    const emaSlow = ema(prices, slow);
    const signal = emaFast[emaFast.length-1] - emaSlow[emaSlow.length-1];
    const priceVol = rollingStd(dailyPriceChanges, 25);
    return signal / (priceVol || 1); // normalized forecast
  }
  // Ensemble: combine 3 speeds
  const fast = ewmac(prices, 8, 32) * 5.95;   // scalar from Carver
  const med  = ewmac(prices, 16, 64) * 4.10;
  const slow = ewmac(prices, 32, 128) * 2.79;
  const ensemble = clip(0.42*fast + 0.16*med + 0.42*slow, -20, 20) * 1.3; // FDM=1.3
  ```
- Integrate as `trendEnsemble` factor signal in factor scoring

---

## Phase 2: Portfolio Construction Improvements (src/App.jsx)

### 2.1 Hierarchical Risk Parity (HRP) — López de Prado 2016
**Expected impact: 72% lower variance, 31% higher OOS Sharpe vs MVO**

- Add new function `computeHRP(covMatrix, candidates)`:
  - **Step 1 — Clustering:** Build distance matrix `d(i,j) = sqrt(0.5*(1-corr_ij))`, apply single-linkage hierarchical clustering
  - **Step 2 — Quasi-diagonalization:** Reorder covariance matrix using dendrogram leaf order
  - **Step 3 — Recursive bisection:** Allocate weights inversely proportional to cluster variance
- Use HRP weights as warm-start for the Monte Carlo optimizer (replace random initialization in 50% of iterations)
- Also offer HRP as a standalone optimization target (like `risk_parity`)

### 2.2 Ledoit-Wolf Covariance Shrinkage
**Expected impact: stabilized covariance estimates, especially with many assets**

- Add function `ledoitWolfShrinkage(sampleCov, T)`:
  ```js
  // Shrink toward scaled identity (constant correlation model)
  // delta = optimal shrinkage intensity (Ledoit-Wolf 2004 formula)
  // Sigma_shrunk = delta * F + (1-delta) * S
  ```
- Apply in `optimizeCash()` when building the correlation/covariance matrix
- Also apply in HRP's input covariance matrix

### 2.3 No-Trade Zones (Leland 1999)
**Expected impact: ~50% reduction in transaction costs**

- Add function `computeNoTradeZones(targetWeights, transactionCosts, vols, riskAversion)`:
  ```js
  // Half-width per position: delta_w = (3*c*sigma^2 / (2*lambda))^(1/3)
  // Only trade if current weight is outside [target - delta, target + delta]
  // When trading, move to nearest boundary (not to target center)
  ```
- Integrate into the rebalancing decision in the backtest loop
- Make bandwidth regime-adaptive: wider in high-vol regimes, narrower in low-vol

### 2.4 CPPI Drawdown Floor Protection
**Expected impact: explicit catastrophic loss prevention**

- Add function `cppiExposure(portfolioValue, peakValue, maxDD, multiplier)`:
  ```js
  const floor = (1 - maxDD) * peakValue; // e.g., 80% of peak for 20% max DD
  const cushion = Math.max(0, portfolioValue - floor);
  const exposure = Math.min(1.5, multiplier * cushion / portfolioValue);
  // Dynamically adjust multiplier: m_t = m_base * (sigmaTarget / sigmaRealized)
  ```
- Layer on top of existing drawdown protection in the backtest loop
- Use as a continuous exposure scalar rather than discrete level triggers

---

## Phase 3: Enhanced Macro Signals (api/regime.js)

### 3.1 Inflation Regime Detection
**New FRED series: `T5YIE`, `T10YIE`, `DFII10`**

- Add 3 new series to the `series` object in `regime.js`
- Compute inflation regime using CFM methodology:
  ```js
  const breakevenZ = rollingZScore(t10yie_values, idx, 1750); // 7-year window
  const inflationAccel = rollingZScore(delta(t10yie_values), idx, 1750);
  // High inflation: breakevenZ > 1.5, Low: < -1.5, Normal: between
  ```
- Map inflation regime to factor tilts:
  - Rising growth + falling inflation → Momentum, Growth
  - Rising growth + rising inflation → Value, Commodities
  - Falling growth + low inflation → Quality, Low Volatility
  - Falling growth + rising inflation → Defensive, Real assets
- Pass `inflationRegime` to the optimizer via `regimeCtx`

### 3.2 Funding Liquidity Composite
**New FRED series: `RIFSPPAAAD90NB`, `STLFSI4`**

- Add CP-TBill spread as a funding stress indicator:
  ```js
  const cpTbillGap = cp90d_value - tbill3m_value;
  const fundingStressZ = rollingZScore(cpTbillGap_values, idx, 750);
  ```
- Add St. Louis Fed Financial Stress Index as additional stress confirmation
- Blend into composite score with weight 0.05 each

### 3.3 Real Rate Factor Signal
**Uses `DFII10` (already added in 3.1)**

- Compute real rate regime:
  ```js
  const realRate = dfii10_value;
  const realRateChange3m = dfii10_value - dfii10_3mAgo;
  // Rising real rates (> 1.5% and rising): tilt Value, underweight Growth
  // Falling real rates (< 0.5% and falling): tilt Growth, underweight Value
  ```
- Pass as `realRateSignal` to optimizer for factor weight adjustment

### 3.4 Credit Spread Momentum
**Uses existing `BAMLH0A0HYM2` — no new data needed**

- Compute 3-month OAS momentum and acceleration:
  ```js
  const oasMom3m = hy_oas_value - hy_oas_3mAgo;
  const oasAccel = oasMom3m - prevOasMom3m;
  // Rising OAS with positive acceleration = stress building
  // Falling OAS with negative acceleration = conditions improving
  ```
- Add as supplementary signal (weight 0.05) in `computeScoreAtDate()`

### 3.5 Dollar Strength Signal
**New FRED series: `DTWEXBGS`**

- Compute 6-month rate of change, z-scored:
  ```js
  const dollarRoC6m = (dtwexbgs_value - dtwexbgs_6mAgo) / dtwexbgs_6mAgo;
  const dollarZ = rollingZScore(dollarRoC6m_values, idx, 750);
  // Strong dollar (z > 1.5): underweight EM, multinationals, commodities
  // Weak dollar (z < -1.5): overweight EM, exporters, commodities
  ```
- Pass `dollarSignal` to optimizer for category-level tilt adjustments

### 3.6 Recession Probability Overlay
**New FRED series: `RECPROUSM156N`**

- Smoothed recession probability (Chauvet-Piger model)
- When probability > 30%: amplify defensive tilts by 1.3x
- When probability > 50%: amplify defensive tilts by 1.6x, reduce Kelly multiplier
- When probability < 10%: amplify aggressive tilts by 1.1x

---

## Phase 4: Regime-Aware Risk Management (api/RegimeEngine.js + src/App.jsx)

### 4.1 Regime-Dependent Covariance Matrices
**Expected impact: much better crisis-period risk estimation**

- In RegimeEngine.js, add function `regimeCovarianceMatrices(assetReturns, regimeLabels)`:
  - Estimate separate covariance matrices for each of the 5 regimes
  - During optimization, blend: `Sigma = sum_k P(regime_k) * Sigma_k`
  - During crisis (P(crisis) > 0.5), the crisis covariance matrix naturally dominates, capturing correlation spikes
- Apply Ledoit-Wolf shrinkage to each regime's covariance matrix (smaller sample sizes make shrinkage even more important)

### 4.2 CVaR Constraints in Crisis Regimes
- In `optimizeCash()`, when `state5` is `mild_risk_off` or `strong_risk_off`:
  - Switch scoring from VaR-Sharpe to CVaR-Sharpe (the system already has this option)
  - Add hard CVaR budget: reject allocations where empirical CVaR exceeds regime-dependent threshold
  ```js
  const cvarBudget = state5 === "strong_risk_off" ? 25 : state5 === "mild_risk_off" ? 35 : 50;
  if (cvar > cvarBudget) continue; // reject allocation
  ```

---

## Phase 5: Signal Processing & Factor Improvements (src/App.jsx)

### 5.1 Signal Orthogonalization (Gram-Schmidt)
**Expected impact: removes redundant alpha, improves signal combination**

- Add function `orthogonalizeSignals(factorScores, priorityOrder)`:
  ```js
  // Modified Gram-Schmidt: order factors by IC, orthogonalize each against prior
  // For each factor k (in IC-descending order):
  //   factor_k_orth = factor_k - sum_{j<k} proj(factor_k, factor_j_orth)
  //   If residual norm < threshold, drop factor (redundant)
  ```
- Apply before computing composite factor score in `computeFactorScores()`
- This prevents the current issue where momentum variants (12-1, 6-1, 3-1) are highly correlated and effectively triple-count the same signal

### 5.2 Enhanced Quality Factor (Gross Profitability + Cash-Based OP)
- Upgrade the quality factor in `computeFactorScores()`:
  - Currently: `qual = (ts.r > 0 ? 1 : 0) * 2 + (1 / (1 + (ts.er || 0.1))) + (ts.v < 15 ? 1 : ts.v < 25 ? 0.5 : 0)`
  - Enhanced: Add gross profitability proxy (revenue growth / total assets) and cash flow quality
  - For ETFs without fundamentals, use expense ratio efficiency + tracking error + AUM stability as quality proxies
  - For stocks: use available fundamental data from Yahoo Finance

### 5.3 Updated Factor Weights
- Update `defaultFactorWeights` to include new factors:
  ```js
  const defaultFactorWeights = {
    volScaledMom12: 0.12,  // was mom12_1 at 0.15
    mom6_1: 0.06,          // was 0.08
    mom3_1: 0.04,          // was 0.05
    tsmom: 0.08,           // was 0.10
    fipQuality: 0.05,      // NEW
    nearHigh: 0.05,        // NEW
    momAccel: 0.04,        // NEW
    trendEnsemble: 0.06,   // NEW
    rev1m: 0.06,           // was 0.08
    val: 0.10,             // was 0.12
    qual: 0.10,            // was 0.10 (enhanced)
    lowvol: 0.08,          // was 0.10
    carry: 0.10,           // was 0.12
    csRev: 0.06,           // was 0.10
  };
  ```
- The adaptive IC system will automatically re-weight based on predictive power

---

## File Change Summary

| File | Changes |
|------|---------|
| `src/App.jsx` | Phases 1, 2, 4.2, 5 — new factors, HRP, no-trade zones, CPPI, signal processing |
| `api/regime.js` | Phase 3 — 6 new FRED series, inflation/liquidity/dollar/recession signals |
| `api/RegimeEngine.js` | Phase 4.1 — regime-dependent covariance matrices |

## Implementation Order
1. Phase 1 (momentum enhancements) — highest alpha impact, uses existing data
2. Phase 3 (macro signals) — new data sources that feed into existing regime system
3. Phase 2 (portfolio construction) — structural improvements to optimization
4. Phase 4 (regime-aware risk) — leverages Phase 3 signals
5. Phase 5 (signal processing) — polish and optimization

## Expected Cumulative Impact
- **Sharpe ratio improvement**: +40-60% (primarily from vol-scaled momentum, HRP, no-trade zones)
- **Max drawdown reduction**: -20-30% (CPPI floor, regime-dependent covariance, CVaR constraints)
- **Transaction cost reduction**: -40-50% (no-trade zones)
- **Signal quality**: +25-35% (orthogonalization, FIP filtering, new factors)
