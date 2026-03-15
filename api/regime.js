// api/regime.js — Vercel Serverless Function (v2)
// Enhanced Regime Detection: daily resolution, 5-state, 7 FRED factors, cross-asset correlation
//
// GET /api/regime              → latest regime + all signals
// GET /api/regime?history=true → monthly regimes for backtest
// GET /api/regime?analytics=true → full analytics with episodes, transitions, entry signals

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "FRED_API_KEY not set. Free at https://fred.stlouisfed.org/docs/api/api_key.html" });
  }

  const isHistory = req.query.history === "true";
  const isAnalytics = req.query.analytics === "true";

  // ── 10 FRED series: 6 original + 4 new ──
  const series = {
    hy_oas: "BAMLH0A0HYM2",   // HY Credit Spread (daily)
    vix: "VIXCLS",             // VIX Spot (daily)
    vix3m: "VXVCLS",           // VIX 3-Month (daily)
    nfci: "NFCI",              // Chicago Fed NFCI (weekly)
    sp500: "SP500",            // S&P 500 (daily)
    t10y2y: "T10Y2Y",         // 10Y-2Y spread (daily)
    // New v2 series
    t10y3m: "T10Y3M",         // 10Y-3M spread — best recession predictor
    ted: "TEDRATE",            // TED Spread — interbank stress
    sahm: "SAHMREALTIME",     // Sahm Rule — real-time recession trigger
    claims: "ICSA",            // Initial jobless claims (weekly)
    // For cross-asset correlation
    gold: "GOLDAMGBD228NLBM",  // Gold price (London fix, daily)
    dgs10: "DGS10",            // 10Y Treasury yield (daily, inverse of bond price)
  };

  const startDate = (isHistory || isAnalytics) ? "2012-01-01" : new Date(Date.now() - 3 * 365.25 * 86400000).toISOString().slice(0, 10);

  const data = {};
  const errors = [];

  for (const [key, seriesId] of Object.entries(series)) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&observation_start=${startDate}&api_key=${apiKey}&file_type=json&sort_order=asc`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.observations) {
        data[key] = json.observations.filter(o => o.value !== ".").map(o => ({ date: o.date, value: parseFloat(o.value) }));
      } else {
        errors.push({ series: key, message: json.error_message || "No data" });
      }
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      errors.push({ series: key, message: err.message });
    }
  }

  // Compute regime
  const regime = computeRegimeV2(data);

  let monthlyRegimes = null;
  if (isHistory || isAnalytics) {
    monthlyRegimes = computeMonthlyRegimesV2(data);
  }

  let analytics = null;
  if (isAnalytics && monthlyRegimes) {
    analytics = computeRegimeAnalytics(monthlyRegimes, data);
  }

  return res.status(200).json({
    data: (isHistory || isAnalytics) ? undefined : data,
    regime,
    monthlyRegimes: isHistory ? monthlyRegimes : undefined,
    analytics,
    errors,
    version: 2,
  });

  } catch (err) {
    console.error("Regime handler error:", err);
    return res.status(500).json({ error: "Regime computation failed: " + err.message });
  }
}

// ═══ HELPERS ═══
function rollingZScore(vals, endIdx, windowSize) {
  const start = Math.max(0, endIdx - windowSize + 1);
  const w = vals.slice(start, endIdx + 1);
  if (w.length < 20) return 0;
  const mean = w.reduce((s, v) => s + v, 0) / w.length;
  const std = Math.sqrt(w.reduce((s, v) => s + (v - mean) ** 2, 0) / w.length) || 1;
  return (vals[endIdx] - mean) / std;
}

function ema(values, period) {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  const result = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

function findClosest(series, targetDate) {
  if (!series?.length) return null;
  let best = null;
  for (const obs of series) {
    if (obs.date <= targetDate) best = obs;
    else break;
  }
  return best;
}

function rollingCorrelation(xVals, yVals, window) {
  // Returns correlation for the last `window` observations
  if (xVals.length < window || yVals.length < window) return null;
  const x = xVals.slice(-window), y = yVals.slice(-window);
  const n = Math.min(x.length, y.length);
  if (n < 20) return null;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let cov = 0, vx = 0, vy = 0;
  for (let i = 0; i < n; i++) {
    cov += (x[i] - mx) * (y[i] - my);
    vx += (x[i] - mx) ** 2;
    vy += (y[i] - my) ** 2;
  }
  const denom = Math.sqrt(vx * vy);
  return denom > 0 ? cov / denom : 0;
}

// Convert price series to daily returns
function toReturns(prices) {
  const rets = [];
  for (let i = 1; i < prices.length; i++) {
    rets.push((prices[i] - prices[i - 1]) / (prices[i - 1] || 1));
  }
  return rets;
}

// ── 5-state classification from composite score ──
function classify5State(score) {
  if (score < -1.0) return "strong_risk_on";
  if (score < -0.3) return "mild_risk_on";
  if (score <= 0.3) return "neutral";
  if (score <= 1.0) return "mild_risk_off";
  return "strong_risk_off";
}

// ── Map 5-state to 3-state for backward compat ──
function to3State(state5) {
  if (state5 === "strong_risk_on" || state5 === "mild_risk_on") return "bull";
  if (state5 === "strong_risk_off" || state5 === "mild_risk_off") return "bear";
  return "neutral";
}

// ═══ COMPUTE DAILY COMPOSITE SCORE AT A GIVEN DATE ═══
function computeScoreAtDate(data, dateStr) {
  const scores = {};

  // 1. HY OAS z-score (weight: 0.30)
  if (data.hy_oas?.length > 0) {
    const idx = data.hy_oas.findLastIndex(d => d.date <= dateStr);
    if (idx >= 0) {
      scores.hy_oas = { z: rollingZScore(data.hy_oas.map(d => d.value), idx, 750), val: data.hy_oas[idx].value, w: 0.30 };
    }
  }

  // 2. VIX term structure slope (weight: 0.20)
  const vixObs = findClosest(data.vix, dateStr);
  const vix3mObs = findClosest(data.vix3m, dateStr);
  if (vixObs && vix3mObs && vixObs.value > 0) {
    const slope = vix3mObs.value / vixObs.value - 1;
    scores.vix_slope = { z: -slope * 5, val: slope, w: 0.20 };
  }

  // 3. NFCI (weight: 0.15)
  if (data.nfci?.length > 0) {
    const idx = data.nfci.findLastIndex(d => d.date <= dateStr);
    if (idx >= 0) {
      scores.nfci = { z: rollingZScore(data.nfci.map(d => d.value), idx, 156), val: data.nfci[idx].value, w: 0.15 };
    }
  }

  // 4. 10Y-3M Yield Curve (weight: 0.10) — inversion = stress
  if (data.t10y3m?.length > 0) {
    const idx = data.t10y3m.findLastIndex(d => d.date <= dateStr);
    if (idx >= 0) {
      // Negate: lower spread = more stress
      scores.t10y3m = { z: -rollingZScore(data.t10y3m.map(d => d.value), idx, 750), val: data.t10y3m[idx].value, w: 0.10 };
    }
  }

  // 5. TED Spread (weight: 0.05) — interbank stress
  if (data.ted?.length > 0) {
    const idx = data.ted.findLastIndex(d => d.date <= dateStr);
    if (idx >= 0) {
      scores.ted = { z: rollingZScore(data.ted.map(d => d.value), idx, 750), val: data.ted[idx].value, w: 0.05 };
    }
  }

  // 6. Sahm Rule (weight: 0.10) — recession trigger
  if (data.sahm?.length > 0) {
    const idx = data.sahm.findLastIndex(d => d.date <= dateStr);
    if (idx >= 0) {
      // Sahm > 0.5 historically = 100% recession
      const sahmVal = data.sahm[idx].value;
      scores.sahm = { z: sahmVal > 0.5 ? 2.0 : sahmVal > 0.3 ? 1.0 : sahmVal * 2, val: sahmVal, w: 0.10 };
    }
  }

  // 7. Initial Claims rate-of-change (weight: 0.05)
  if (data.claims?.length > 0) {
    const idx = data.claims.findLastIndex(d => d.date <= dateStr);
    if (idx >= 0) {
      scores.claims = { z: rollingZScore(data.claims.map(d => d.value), idx, 156), val: data.claims[idx].value, w: 0.05 };
    }
  }

  // 8. Cross-asset correlation signal (weight: 0.05)
  // Rising equity-gold correlation = flight-to-safety unwinding; negative = stress
  if (data.sp500?.length > 60 && data.gold?.length > 60) {
    const spIdx = data.sp500.findLastIndex(d => d.date <= dateStr);
    const goldIdx = data.gold.findLastIndex(d => d.date <= dateStr);
    if (spIdx > 60 && goldIdx > 60) {
      const spRets = toReturns(data.sp500.slice(Math.max(0, spIdx - 60), spIdx + 1).map(d => d.value));
      const goldRets = toReturns(data.gold.slice(Math.max(0, goldIdx - 60), goldIdx + 1).map(d => d.value));
      const corr = rollingCorrelation(spRets, goldRets, Math.min(spRets.length, goldRets.length));
      if (corr != null) {
        // Negative stock-gold corr = stress (gold rallying while stocks fall)
        scores.cross_asset = { z: -corr * 3, val: corr, w: 0.05 };
      }
    }
  }

  // Composite weighted score
  let composite = 0, totalW = 0;
  for (const s of Object.values(scores)) {
    composite += s.z * s.w;
    totalW += s.w;
  }
  if (totalW > 0) composite /= totalW; // normalize by actual weights present
  composite *= totalW / 1.0; // scale back (all weights sum to 1.0)

  return { composite, scores };
}

// ═══ COMPUTE LATEST REGIME (v2 — daily, 5-state, with acceleration) ═══
function computeRegimeV2(data) {
  const result = { signals: {}, score: null, regime: "unknown", state5: null, probBear: null, details: {}, acceleration: null, emaFast: null, emaSlow: null, crossAsset: {} };

  // Compute score at latest date
  const latestDate = data.sp500?.length > 0 ? data.sp500[data.sp500.length - 1].date : new Date().toISOString().slice(0, 10);
  const { composite, scores } = computeScoreAtDate(data, latestDate);

  result.score = Math.round(composite * 100) / 100;
  result.state5 = classify5State(composite);
  result.regime = to3State(result.state5);
  result.probBear = Math.round((1 / (1 + Math.exp(-composite))) * 100) / 100;

  // Extract individual signal details
  for (const [key, s] of Object.entries(scores)) {
    result.signals[key] = s.val;
    result.details[key] = {
      value: s.val,
      zScore: Math.round(s.z * 100) / 100,
      weight: s.w,
      signal: s.z < -0.3 ? "risk-on" : s.z > 0.3 ? "risk-off" : "neutral",
    };
  }

  // ── EMA smoothing: compute daily scores for last 90 days, apply fast/slow EMA ──
  if (data.sp500?.length >= 90) {
    const recentDates = data.sp500.slice(-90).map(d => d.date);
    const dailyScores = recentDates.map(date => computeScoreAtDate(data, date).composite);

    const fast = ema(dailyScores, 10);  // 10-day EMA
    const slow = ema(dailyScores, 60);  // 60-day EMA

    result.emaFast = Math.round(fast[fast.length - 1] * 100) / 100;
    result.emaSlow = Math.round(slow[slow.length - 1] * 100) / 100;

    // Acceleration: rate of change of score (fast EMA - slow EMA)
    result.acceleration = Math.round((fast[fast.length - 1] - slow[slow.length - 1]) * 100) / 100;

    // EMA crossover signal
    const prevFast = fast.length > 1 ? fast[fast.length - 2] : fast[fast.length - 1];
    const prevSlow = slow.length > 1 ? slow[slow.length - 2] : slow[slow.length - 1];
    const crossoverNow = fast[fast.length - 1] > slow[slow.length - 1];
    const crossoverPrev = prevFast > prevSlow;
    result.emaCrossover = crossoverNow !== crossoverPrev ? (crossoverNow ? "bearish_cross" : "bullish_cross") : "none";

    // 2D regime: level × momentum
    const level = result.state5;
    const momentum = result.acceleration > 0.15 ? "deteriorating" : result.acceleration < -0.15 ? "improving" : "stable";
    result.momentum = momentum;
    result.regimeDetail = `${level} / ${momentum}`;
  }

  // ── Cross-asset correlation details ──
  if (data.sp500?.length > 60 && data.gold?.length > 60) {
    const spRets = toReturns(data.sp500.slice(-61).map(d => d.value));
    const goldRets = toReturns(data.gold.slice(-61).map(d => d.value));
    result.crossAsset.spyGold60d = rollingCorrelation(spRets, goldRets, Math.min(spRets.length, goldRets.length));
  }
  if (data.sp500?.length > 60 && data.dgs10?.length > 60) {
    // Bond returns = negative yield changes
    const spRets = toReturns(data.sp500.slice(-61).map(d => d.value));
    const bondRets = data.dgs10.slice(-60).map((d, i) => i > 0 ? -(d.value - data.dgs10.slice(-60)[i - 1].value) : 0);
    result.crossAsset.spyBond60d = rollingCorrelation(spRets, bondRets.slice(1), Math.min(spRets.length, bondRets.length - 1));
  }
  if (data.sp500?.length > 60 && data.hy_oas?.length > 60) {
    const spRets = toReturns(data.sp500.slice(-61).map(d => d.value));
    const hyChanges = data.hy_oas.slice(-60).map((d, i) => i > 0 ? d.value - data.hy_oas.slice(-60)[i - 1].value : 0);
    result.crossAsset.spyHY60d = rollingCorrelation(spRets, hyChanges.slice(1), Math.min(spRets.length, hyChanges.length - 1));
  }

  // Round cross-asset correlations
  for (const k of Object.keys(result.crossAsset)) {
    if (result.crossAsset[k] != null) result.crossAsset[k] = Math.round(result.crossAsset[k] * 100) / 100;
  }

  // ── Supplementary signals (carried forward from v1) ──
  if (data.sp500?.length >= 200) {
    const prices = data.sp500.map(d => d.value);
    const latest = prices[prices.length - 1];
    const ma200 = prices.slice(-200).reduce((s, v) => s + v, 0) / 200;
    const ma50 = prices.slice(-50).reduce((s, v) => s + v, 0) / 50;
    result.details.sp500_ma = { price: latest, ma200, ma50, aboveMa200: latest > ma200, goldenCross: ma50 > ma200, signal: latest > ma200 ? "risk-on" : "risk-off" };
  }
  if (data.vix?.length > 0) {
    const v = data.vix[data.vix.length - 1].value;
    result.details.vix_level = { level: v, signal: v < 20 ? "risk-on" : v > 25 ? "risk-off" : "neutral" };
  }
  if (data.sp500?.length >= 260) {
    const prices = data.sp500.map(d => d.value);
    const latest = prices[prices.length - 1];
    const peak = Math.max(...prices.slice(-260));
    result.details.drawdown = { drawdownPct: ((peak - latest) / peak) * 100, signal: ((peak - latest) / peak) < 0.05 ? "risk-on" : ((peak - latest) / peak) > 0.1 ? "risk-off" : "neutral" };
    const yearAgo = prices[prices.length - 260] || prices[0];
    result.details.momentum = { return12m: ((latest - yearAgo) / yearAgo) * 100, signal: latest > yearAgo ? "risk-on" : "risk-off" };
  }

  // Label mapping for v2
  result.zScores = {};
  for (const [key, s] of Object.entries(scores)) {
    result.zScores[key] = Math.round(s.z * 100) / 100;
  }

  return result;
}

// ═══ MONTHLY REGIMES (for backtest compatibility) ═══
function computeMonthlyRegimesV2(data) {
  const results = [];
  for (let year = 2015; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-28`;
      const { composite, scores } = computeScoreAtDate(data, dateStr);

      const state5 = classify5State(composite);
      const regime = to3State(state5);
      const probBear = 1 / (1 + Math.exp(-composite));

      // Compute acceleration: compare to score 30 days ago
      const prevDateStr = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}-28`;
      const prevScore = computeScoreAtDate(data, prevDateStr).composite;
      const acceleration = composite - prevScore;

      results.push({
        date: `${year}-${String(month).padStart(2, "0")}`,
        score: Math.round(composite * 100) / 100,
        probBear: Math.round(probBear * 100) / 100,
        regime,
        state5,
        acceleration: Math.round(acceleration * 100) / 100,
        zScores: Object.fromEntries(Object.entries(scores).map(([k, s]) => [k, Math.round(s.z * 100) / 100])),
      });
    }
  }
  return results;
}

// ═══ ANALYTICS ENGINE (episodes, transitions, forward returns, entry signals) ═══
function computeRegimeAnalytics(monthlyRegimes, data) {
  if (!monthlyRegimes || monthlyRegimes.length < 12) return null;

  // ── 1. Extract regime episodes ──
  const episodes = [];
  let currentEp = { regime: monthlyRegimes[0].regime, state5: monthlyRegimes[0].state5, start: monthlyRegimes[0].date, months: 1, startScore: monthlyRegimes[0].score };
  for (let i = 1; i < monthlyRegimes.length; i++) {
    if (monthlyRegimes[i].regime === currentEp.regime) {
      currentEp.months++;
    } else {
      currentEp.end = monthlyRegimes[i - 1].date;
      currentEp.endScore = monthlyRegimes[i - 1].score;
      currentEp.nextRegime = monthlyRegimes[i].regime;
      episodes.push({ ...currentEp });
      currentEp = { regime: monthlyRegimes[i].regime, state5: monthlyRegimes[i].state5, start: monthlyRegimes[i].date, months: 1, startScore: monthlyRegimes[i].score };
    }
  }
  currentEp.end = monthlyRegimes[monthlyRegimes.length - 1].date;
  currentEp.endScore = monthlyRegimes[monthlyRegimes.length - 1].score;
  currentEp.nextRegime = null;
  episodes.push(currentEp);

  // ── 2. Monthly SPY returns ──
  const spyMonthly = {};
  if (data.sp500?.length > 0) {
    const byMonth = {};
    for (const d of data.sp500) { byMonth[d.date.slice(0, 7)] = d.value; }
    const months = Object.keys(byMonth).sort();
    for (let i = 1; i < months.length; i++) {
      spyMonthly[months[i]] = { close: byMonth[months[i]], ret: (byMonth[months[i]] - byMonth[months[i - 1]]) / byMonth[months[i - 1]] };
    }
  }

  // ── 3. Forward returns ──
  const forwardReturns = {};
  for (let i = 0; i < monthlyRegimes.length; i++) {
    const d = monthlyRegimes[i].date;
    const spyNow = spyMonthly[d]?.close;
    if (!spyNow) continue;
    const fwd = {};
    for (const [label, offset] of [["1m", 1], ["3m", 3], ["6m", 6], ["12m", 12]]) {
      if (i + offset < monthlyRegimes.length) {
        const spyFuture = spyMonthly[monthlyRegimes[i + offset].date]?.close;
        if (spyFuture) fwd[label] = ((spyFuture - spyNow) / spyNow) * 100;
      }
    }
    forwardReturns[d] = fwd;
  }

  // ── 4. Transition matrix ──
  const transitions = { bull: { bull: 0, neutral: 0, bear: 0 }, neutral: { bull: 0, neutral: 0, bear: 0 }, bear: { bull: 0, neutral: 0, bear: 0 } };
  for (let i = 1; i < monthlyRegimes.length; i++) {
    const from = monthlyRegimes[i - 1].regime, to = monthlyRegimes[i].regime;
    if (transitions[from]) transitions[from][to]++;
  }
  const transitionProb = {};
  for (const from of ["bull", "neutral", "bear"]) {
    const total = transitions[from].bull + transitions[from].neutral + transitions[from].bear;
    transitionProb[from] = {};
    for (const to of ["bull", "neutral", "bear"]) transitionProb[from][to] = total > 0 ? Math.round((transitions[from][to] / total) * 100) : 0;
  }

  // ── 5. Duration stats ──
  const durationStats = {};
  for (const regime of ["bull", "neutral", "bear"]) {
    const eps = episodes.filter(e => e.regime === regime);
    const durations = eps.map(e => e.months).sort((a, b) => a - b);
    if (!durations.length) { durationStats[regime] = { count: 0, avg: 0, min: 0, max: 0, median: 0, totalMonths: 0 }; continue; }
    durationStats[regime] = { count: eps.length, avg: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length * 10) / 10, min: durations[0], max: durations[durations.length - 1], median: durations[Math.floor(durations.length / 2)], totalMonths: durations.reduce((s, d) => s + d, 0) };
  }

  // ── 6. Forward returns by regime + duration + acceleration ──
  const buckets = [{ label: "1-2m", min: 1, max: 2 }, { label: "3-5m", min: 3, max: 5 }, { label: "6-11m", min: 6, max: 11 }, { label: "12m+", min: 12, max: 999 }];
  const durationReturns = {};
  for (const regime of ["bull", "neutral", "bear"]) {
    durationReturns[regime] = {};
    for (const bucket of buckets) {
      const samples = [];
      let runLength = 0, prevRegime = null;
      for (let i = 0; i < monthlyRegimes.length; i++) {
        runLength = monthlyRegimes[i].regime === regime ? (prevRegime === regime ? runLength + 1 : 1) : 0;
        prevRegime = monthlyRegimes[i].regime;
        if (monthlyRegimes[i].regime === regime && runLength >= bucket.min && runLength <= bucket.max) {
          const fwd = forwardReturns[monthlyRegimes[i].date];
          if (fwd) samples.push({ ...fwd, accel: monthlyRegimes[i].acceleration });
        }
      }
      if (samples.length > 0) {
        const avg = {};
        for (const h of ["1m", "3m", "6m", "12m"]) {
          const vals = samples.filter(s => s[h] != null).map(s => s[h]);
          avg[h] = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null;
        }
        // Split by acceleration: improving vs deteriorating
        const improving = samples.filter(s => s.accel < -0.1);
        const deteriorating = samples.filter(s => s.accel > 0.1);
        const accelSplit = {};
        for (const [label, subset] of [["improving", improving], ["deteriorating", deteriorating]]) {
          const aAvg = {};
          for (const h of ["1m", "3m", "6m", "12m"]) {
            const vals = subset.filter(s => s[h] != null).map(s => s[h]);
            aAvg[h] = vals.length >= 2 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null;
          }
          if (subset.length >= 2) accelSplit[label] = { avg: aAvg, n: subset.length };
        }
        durationReturns[regime][bucket.label] = { avg, n: samples.length, accelSplit };
      }
    }
  }

  // ── 7. Transition-based forward returns ──
  const transitionReturns = [];
  for (let i = 1; i < episodes.length; i++) {
    const prev = episodes[i - 1], curr = episodes[i];
    const fwd = forwardReturns[curr.start] || {};
    transitionReturns.push({ from: prev.regime, to: curr.regime, duration: curr.months, startDate: curr.start, fwdReturns: fwd });
  }
  const transitionPatterns = {};
  for (const tr of transitionReturns) {
    const key = `${tr.from}→${tr.to}`;
    if (!transitionPatterns[key]) transitionPatterns[key] = { transitions: [], avgFwd: {} };
    transitionPatterns[key].transitions.push(tr);
  }
  for (const [, pat] of Object.entries(transitionPatterns)) {
    for (const h of ["1m", "3m", "6m", "12m"]) {
      const vals = pat.transitions.filter(t => t.fwdReturns[h] != null).map(t => t.fwdReturns[h]);
      pat.avgFwd[h] = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null;
    }
    pat.count = pat.transitions.length;
    pat.avgDuration = Math.round(pat.transitions.reduce((s, t) => s + t.duration, 0) / pat.transitions.length * 10) / 10;
  }

  // ── 8. Current position + signal match ──
  const lastRegime = monthlyRegimes[monthlyRegimes.length - 1];
  let currentRunLength = 0;
  for (let i = monthlyRegimes.length - 1; i >= 0; i--) {
    if (monthlyRegimes[i].regime === lastRegime.regime) currentRunLength++;
    else break;
  }
  const lastEp = episodes[episodes.length - 1], prevEp = episodes.length > 1 ? episodes[episodes.length - 2] : null;
  const currentTransition = prevEp ? `${prevEp.regime}→${lastEp.regime}` : null;

  let signalMatch = null;
  if (currentTransition && transitionPatterns[currentTransition]) {
    const pat = transitionPatterns[currentTransition];
    const similar = pat.transitions.filter(t => Math.abs(t.duration - currentRunLength) <= 2);
    if (similar.length > 0) {
      const avgFwd = {};
      for (const h of ["1m", "3m", "6m", "12m"]) {
        const vals = similar.filter(t => t.fwdReturns[h] != null).map(t => t.fwdReturns[h]);
        avgFwd[h] = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null;
      }
      signalMatch = { pattern: currentTransition, currentDuration: currentRunLength, historicalMatches: similar.length, avgForwardReturns: avgFwd, dates: similar.map(t => t.startDate) };
    }
  }

  // ── 9. Entry signals ranked ──
  const entrySignals = Object.entries(transitionPatterns)
    .filter(([, p]) => p.avgFwd["6m"] != null && p.count >= 2)
    .map(([pattern, p]) => ({ pattern, count: p.count, avgDuration: p.avgDuration, fwd1m: p.avgFwd["1m"], fwd3m: p.avgFwd["3m"], fwd6m: p.avgFwd["6m"], fwd12m: p.avgFwd["12m"] }))
    .sort((a, b) => (b.fwd6m || 0) - (a.fwd6m || 0));

  return {
    episodes,
    durationStats,
    transitionProb,
    durationReturns,
    transitionPatterns: Object.fromEntries(Object.entries(transitionPatterns).map(([k, v]) => [k, { count: v.count, avgDuration: v.avgDuration, avgFwd: v.avgFwd }])),
    entrySignals,
    current: {
      regime: lastRegime.regime, state5: lastRegime.state5, score: lastRegime.score,
      acceleration: lastRegime.acceleration,
      runLength: currentRunLength, transition: currentTransition,
      prevRegime: prevEp?.regime || null, prevDuration: prevEp?.months || null,
      signalMatch,
    },
    totalMonths: monthlyRegimes.length,
  };
}
