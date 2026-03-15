// api/regime.js — Vercel Serverless Function
// Fetches macro data from FRED for regime-adaptive optimization
//
// SETUP: Get a free API key at https://fred.stlouisfed.org/docs/api/api_key.html
//   Then add to Vercel: FRED_API_KEY = "your_key"
//
// Usage:
//   GET /api/regime              → latest regime + signals
//   GET /api/regime?history=true → monthly regime from 2015-2025 for backtest

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "FRED_API_KEY not set. Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html",
    });
  }

  const isHistory = req.query.history === "true";
  const isAnalytics = req.query.analytics === "true";

  const series = {
    hy_oas: "BAMLH0A0HYM2",
    vix: "VIXCLS",
    vix3m: "VXVCLS",
    nfci: "NFCI",
    sp500: "SP500",
    t10y2y: "T10Y2Y",
  };

  // For history/analytics mode, go back to 2012 (3yr lookback before 2015)
  const startDate = (isHistory || isAnalytics) ? "2012-01-01" : new Date(Date.now() - 3 * 365.25 * 86400000).toISOString().slice(0, 10);

  const data = {};
  const errors = [];

  for (const [key, seriesId] of Object.entries(series)) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&observation_start=${startDate}&api_key=${apiKey}&file_type=json&sort_order=asc`;
      const resp = await fetch(url);
      const json = await resp.json();

      if (json.observations) {
        data[key] = json.observations
          .filter((o) => o.value !== ".")
          .map((o) => ({
            date: o.date,
            value: parseFloat(o.value),
          }));
      } else {
        errors.push({ series: key, message: json.error_message || "No data" });
      }
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      errors.push({ series: key, message: err.message });
    }
  }

  // Compute current regime (always)
  const regime = computeRegime(data);

  // If history mode, compute monthly regime for every month from 2015-01 to 2025-12
  let monthlyRegimes = null;
  if (isHistory || isAnalytics) {
    monthlyRegimes = computeMonthlyRegimes(data);
  }

  // If analytics mode, compute regime episodes, transitions, and forward returns
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
  });
}

// ─── Z-score over a rolling window of values ───
function rollingZScore(allVals, endIdx, windowSize) {
  const start = Math.max(0, endIdx - windowSize + 1);
  const window = allVals.slice(start, endIdx + 1);
  if (window.length < 20) return 0;
  const mean = window.reduce((s, v) => s + v, 0) / window.length;
  const std = Math.sqrt(window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length) || 1;
  return (allVals[endIdx] - mean) / std;
}

// ─── Find the closest observation on or before a target date ───
function findClosest(series, targetDate) {
  if (!series || series.length === 0) return null;
  let best = null;
  for (const obs of series) {
    if (obs.date <= targetDate) best = obs;
    else break;
  }
  return best;
}

// ─── Compute monthly regimes from 2015-01 to 2025-12 ───
function computeMonthlyRegimes(data) {
  const results = [];

  for (let year = 2015; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-28`;

      // 1. HY OAS z-score (using ~3yr rolling window)
      let zHY = 0;
      if (data.hy_oas?.length > 0) {
        const idx = data.hy_oas.findLastIndex((d) => d.date <= dateStr);
        if (idx >= 0) {
          // ~3 years of daily data ≈ 750 observations
          zHY = rollingZScore(data.hy_oas.map((d) => d.value), idx, 750);
        }
      }

      // 2. VIX term structure slope
      let zSlope = 0;
      const vixObs = findClosest(data.vix, dateStr);
      const vix3mObs = findClosest(data.vix3m, dateStr);
      if (vixObs && vix3mObs && vixObs.value > 0) {
        const slope = vix3mObs.value / vixObs.value - 1;
        zSlope = -slope * 5; // negate so backwardation = positive (stress)
      }

      // 3. NFCI z-score
      let zNFCI = 0;
      if (data.nfci?.length > 0) {
        const idx = data.nfci.findLastIndex((d) => d.date <= dateStr);
        if (idx >= 0) {
          // ~3 years of weekly data ≈ 156 observations
          zNFCI = rollingZScore(data.nfci.map((d) => d.value), idx, 156);
        }
      }

      // Composite score
      const score = 0.45 * zHY + 0.35 * zSlope + 0.20 * zNFCI;
      const probBear = 1 / (1 + Math.exp(-score));
      const regime = score < -0.5 ? "bull" : score > 0.5 ? "bear" : "neutral";

      // Supplementary: VIX level, SP500 vs MA200, drawdown
      const vixLevel = vixObs?.value || null;
      let aboveMa200 = null;
      let drawdownPct = null;
      let momentum12m = null;

      if (data.sp500?.length > 0) {
        const spIdx = data.sp500.findLastIndex((d) => d.date <= dateStr);
        if (spIdx >= 200) {
          const prices = data.sp500.map((d) => d.value);
          const ma200 = prices.slice(spIdx - 199, spIdx + 1).reduce((s, v) => s + v, 0) / 200;
          aboveMa200 = prices[spIdx] > ma200;
          const peak = Math.max(...prices.slice(Math.max(0, spIdx - 260), spIdx + 1));
          drawdownPct = ((peak - prices[spIdx]) / peak) * 100;
          if (spIdx >= 260) {
            momentum12m = ((prices[spIdx] - prices[spIdx - 260]) / prices[spIdx - 260]) * 100;
          }
        }
      }

      results.push({
        date: `${year}-${String(month).padStart(2, "0")}`,
        score: Math.round(score * 100) / 100,
        probBear: Math.round(probBear * 100) / 100,
        regime,
        zHY: Math.round(zHY * 100) / 100,
        zSlope: Math.round(zSlope * 100) / 100,
        zNFCI: Math.round(zNFCI * 100) / 100,
        vixLevel,
        aboveMa200,
        drawdownPct: drawdownPct != null ? Math.round(drawdownPct * 10) / 10 : null,
        momentum12m: momentum12m != null ? Math.round(momentum12m * 10) / 10 : null,
      });
    }
  }

  return results;
}

// ─── Regime Analytics: episodes, transitions, forward returns, entry signals ───
function computeRegimeAnalytics(monthlyRegimes, data) {
  if (!monthlyRegimes || monthlyRegimes.length < 12) return null;

  // ── 1. Extract regime episodes (continuous periods of same regime) ──
  const episodes = [];
  let currentEp = { regime: monthlyRegimes[0].regime, start: monthlyRegimes[0].date, months: 1, startScore: monthlyRegimes[0].score };
  
  for (let i = 1; i < monthlyRegimes.length; i++) {
    if (monthlyRegimes[i].regime === currentEp.regime) {
      currentEp.months++;
    } else {
      currentEp.end = monthlyRegimes[i - 1].date;
      currentEp.endScore = monthlyRegimes[i - 1].score;
      currentEp.nextRegime = monthlyRegimes[i].regime;
      episodes.push({ ...currentEp });
      currentEp = { regime: monthlyRegimes[i].regime, start: monthlyRegimes[i].date, months: 1, startScore: monthlyRegimes[i].score };
    }
  }
  // Close final episode
  currentEp.end = monthlyRegimes[monthlyRegimes.length - 1].date;
  currentEp.endScore = monthlyRegimes[monthlyRegimes.length - 1].score;
  currentEp.nextRegime = null; // still ongoing
  episodes.push(currentEp);

  // ── 2. Compute monthly SPY returns from FRED data ──
  const spyMonthly = {};
  if (data.sp500?.length > 0) {
    // Group SP500 daily data into monthly close prices
    const byMonth = {};
    for (const d of data.sp500) {
      const key = d.date.slice(0, 7); // "YYYY-MM"
      byMonth[key] = d.value; // last value in month = close
    }
    const months = Object.keys(byMonth).sort();
    for (let i = 1; i < months.length; i++) {
      spyMonthly[months[i]] = {
        close: byMonth[months[i]],
        ret: (byMonth[months[i]] - byMonth[months[i - 1]]) / byMonth[months[i - 1]],
      };
    }
  }

  // ── 3. Forward return computation for each month ──
  // For each month in the regime series, compute forward 1m, 3m, 6m, 12m SPY returns
  const regimeDates = monthlyRegimes.map(r => r.date);
  const forwardReturns = {};
  for (let i = 0; i < monthlyRegimes.length; i++) {
    const d = monthlyRegimes[i].date;
    const spyNow = spyMonthly[d]?.close;
    if (!spyNow) continue;
    const fwd = {};
    for (const [label, offset] of [["1m", 1], ["3m", 3], ["6m", 6], ["12m", 12]]) {
      if (i + offset < monthlyRegimes.length) {
        const futureDate = monthlyRegimes[i + offset].date;
        const spyFuture = spyMonthly[futureDate]?.close;
        if (spyFuture) fwd[label] = ((spyFuture - spyNow) / spyNow) * 100;
      }
    }
    forwardReturns[d] = fwd;
  }

  // ── 4. Transition matrix: P(next regime | current regime) ──
  const transitions = { bull: { bull: 0, neutral: 0, bear: 0 }, neutral: { bull: 0, neutral: 0, bear: 0 }, bear: { bull: 0, neutral: 0, bear: 0 } };
  for (let i = 1; i < monthlyRegimes.length; i++) {
    const from = monthlyRegimes[i - 1].regime;
    const to = monthlyRegimes[i].regime;
    if (transitions[from]) transitions[from][to]++;
  }
  // Normalize to probabilities
  const transitionProb = {};
  for (const from of ["bull", "neutral", "bear"]) {
    const total = transitions[from].bull + transitions[from].neutral + transitions[from].bear;
    transitionProb[from] = {};
    for (const to of ["bull", "neutral", "bear"]) {
      transitionProb[from][to] = total > 0 ? Math.round((transitions[from][to] / total) * 100) : 0;
    }
  }

  // ── 5. Duration statistics by regime ──
  const durationStats = {};
  for (const regime of ["bull", "neutral", "bear"]) {
    const eps = episodes.filter(e => e.regime === regime);
    const durations = eps.map(e => e.months);
    if (durations.length === 0) { durationStats[regime] = { count: 0, avg: 0, min: 0, max: 0, median: 0 }; continue; }
    durations.sort((a, b) => a - b);
    durationStats[regime] = {
      count: eps.length,
      avg: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length * 10) / 10,
      min: durations[0],
      max: durations[durations.length - 1],
      median: durations[Math.floor(durations.length / 2)],
      totalMonths: durations.reduce((s, d) => s + d, 0),
    };
  }

  // ── 6. Forward returns by regime AND duration bucket ──
  // Group: { regime: "bull", durationBucket: "1-3m" } → average forward returns
  const buckets = [
    { label: "1-2m", min: 1, max: 2 },
    { label: "3-5m", min: 3, max: 5 },
    { label: "6-11m", min: 6, max: 11 },
    { label: "12m+", min: 12, max: 999 },
  ];
  
  const durationReturns = {};
  for (const regime of ["bull", "neutral", "bear"]) {
    durationReturns[regime] = {};
    for (const bucket of buckets) {
      const samples = [];
      // Find all months where regime = X and consecutive duration so far falls in bucket
      let runLength = 0;
      let prevRegime = null;
      for (let i = 0; i < monthlyRegimes.length; i++) {
        if (monthlyRegimes[i].regime === regime) {
          runLength = (prevRegime === regime) ? runLength + 1 : 1;
        } else {
          runLength = 0;
        }
        prevRegime = monthlyRegimes[i].regime;
        
        if (monthlyRegimes[i].regime === regime && runLength >= bucket.min && runLength <= bucket.max) {
          const fwd = forwardReturns[monthlyRegimes[i].date];
          if (fwd) samples.push(fwd);
        }
      }
      
      if (samples.length > 0) {
        const avg = {};
        for (const horizon of ["1m", "3m", "6m", "12m"]) {
          const vals = samples.filter(s => s[horizon] != null).map(s => s[horizon]);
          avg[horizon] = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null;
        }
        durationReturns[regime][bucket.label] = { avg, n: samples.length };
      }
    }
  }

  // ── 7. Transition-based forward returns (key insight for entry signals) ──
  // "After switching from bear → neutral, how did markets perform at month N of neutral?"
  const transitionReturns = [];
  for (let i = 1; i < episodes.length; i++) {
    const prev = episodes[i - 1];
    const curr = episodes[i];
    // Find the monthly index where this episode starts
    const startIdx = monthlyRegimes.findIndex(m => m.date === curr.start);
    if (startIdx < 0) continue;
    
    const entry = {
      from: prev.regime,
      to: curr.regime,
      duration: curr.months,
      startDate: curr.start,
      fwdReturns: {},
    };
    
    // Forward returns from the START of the new regime
    for (const [label, offset] of [["1m", 1], ["3m", 3], ["6m", 6], ["12m", 12]]) {
      const fwd = forwardReturns[curr.start];
      if (fwd?.[label] != null) entry.fwdReturns[label] = fwd[label];
    }
    transitionReturns.push(entry);
  }
  
  // Aggregate transition returns by pattern
  const transitionPatterns = {};
  for (const tr of transitionReturns) {
    const key = `${tr.from}→${tr.to}`;
    if (!transitionPatterns[key]) transitionPatterns[key] = { transitions: [], avgFwd: {} };
    transitionPatterns[key].transitions.push(tr);
  }
  for (const [key, pat] of Object.entries(transitionPatterns)) {
    for (const horizon of ["1m", "3m", "6m", "12m"]) {
      const vals = pat.transitions.filter(t => t.fwdReturns[horizon] != null).map(t => t.fwdReturns[horizon]);
      pat.avgFwd[horizon] = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null;
    }
    pat.count = pat.transitions.length;
    pat.avgDuration = Math.round(pat.transitions.reduce((s, t) => s + t.duration, 0) / pat.transitions.length * 10) / 10;
  }

  // ── 8. Current regime position and signal ──
  const lastRegime = monthlyRegimes[monthlyRegimes.length - 1];
  let currentRunLength = 0;
  for (let i = monthlyRegimes.length - 1; i >= 0; i--) {
    if (monthlyRegimes[i].regime === lastRegime.regime) currentRunLength++;
    else break;
  }
  
  // Find the transition that led to current regime
  const lastEpisode = episodes[episodes.length - 1];
  const prevEpisode = episodes.length > 1 ? episodes[episodes.length - 2] : null;
  const currentTransition = prevEpisode ? `${prevEpisode.regime}→${lastEpisode.regime}` : null;
  
  // Historical pattern match: what happened historically when this transition + duration occurred?
  let signalMatch = null;
  if (currentTransition && transitionPatterns[currentTransition]) {
    const pat = transitionPatterns[currentTransition];
    // Find episodes with similar duration
    const similar = pat.transitions.filter(t => Math.abs(t.duration - currentRunLength) <= 2);
    if (similar.length > 0) {
      const avgFwd = {};
      for (const horizon of ["1m", "3m", "6m", "12m"]) {
        const vals = similar.filter(t => t.fwdReturns[horizon] != null).map(t => t.fwdReturns[horizon]);
        avgFwd[horizon] = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null;
      }
      signalMatch = {
        pattern: currentTransition,
        currentDuration: currentRunLength,
        historicalMatches: similar.length,
        avgForwardReturns: avgFwd,
        dates: similar.map(t => t.startDate),
      };
    }
  }

  // ── 9. Optimal entry signals summary ──
  // Rank all transition patterns by 6m forward return
  const entrySignals = Object.entries(transitionPatterns)
    .filter(([, p]) => p.avgFwd["6m"] != null && p.count >= 2)
    .map(([pattern, p]) => ({
      pattern,
      count: p.count,
      avgDuration: p.avgDuration,
      fwd1m: p.avgFwd["1m"],
      fwd3m: p.avgFwd["3m"],
      fwd6m: p.avgFwd["6m"],
      fwd12m: p.avgFwd["12m"],
    }))
    .sort((a, b) => (b.fwd6m || 0) - (a.fwd6m || 0));

  return {
    episodes,
    durationStats,
    transitionProb,
    durationReturns,
    transitionPatterns: Object.fromEntries(
      Object.entries(transitionPatterns).map(([k, v]) => [k, { count: v.count, avgDuration: v.avgDuration, avgFwd: v.avgFwd }])
    ),
    entrySignals,
    current: {
      regime: lastRegime.regime,
      score: lastRegime.score,
      runLength: currentRunLength,
      transition: currentTransition,
      prevRegime: prevEpisode?.regime || null,
      prevDuration: prevEpisode?.months || null,
      signalMatch,
    },
    totalMonths: monthlyRegimes.length,
  };
}

// ─── Compute latest regime (for live dashboard) ───
function computeRegime(data) {
  const result = {
    signals: {},
    score: null,
    regime: "unknown",
    probBear: null,
    details: {},
  };

  if (data.hy_oas?.length > 0) {
    const vals = data.hy_oas.map((d) => d.value);
    const latest = vals[vals.length - 1];
    const prev = vals.length > 5 ? vals[vals.length - 6] : latest;
    result.signals.hy_oas = latest;
    result.details.hy_oas = { level: latest, roc: latest - prev, signal: latest < 400 ? "risk-on" : latest > 500 ? "risk-off" : "neutral" };
  }

  if (data.vix?.length > 0 && data.vix3m?.length > 0) {
    const vixLatest = data.vix[data.vix.length - 1].value;
    const vix3mLatest = data.vix3m[data.vix3m.length - 1].value;
    const slope = vix3mLatest / vixLatest - 1;
    result.signals.vix_slope = slope;
    result.details.vix_slope = { vix: vixLatest, vix3m: vix3mLatest, slope, signal: slope > 0 ? "risk-on" : "risk-off" };
  }

  if (data.nfci?.length > 0) {
    const latest = data.nfci[data.nfci.length - 1].value;
    const prev = data.nfci.length > 4 ? data.nfci[data.nfci.length - 5].value : latest;
    result.signals.nfci = latest;
    result.details.nfci = { level: latest, trend: latest - prev, signal: latest < 0 ? "risk-on" : "risk-off" };
  }

  if (data.sp500?.length >= 200) {
    const prices = data.sp500.map((d) => d.value);
    const latest = prices[prices.length - 1];
    const ma200 = prices.slice(-200).reduce((s, v) => s + v, 0) / 200;
    const ma50 = prices.slice(-50).reduce((s, v) => s + v, 0) / 50;
    result.signals.sp500_ma = latest > ma200 ? 1 : -1;
    result.details.sp500_ma = { price: latest, ma200, ma50, aboveMa200: latest > ma200, goldenCross: ma50 > ma200, signal: latest > ma200 ? "risk-on" : "risk-off" };
  }

  if (data.vix?.length > 0) {
    const latest = data.vix[data.vix.length - 1].value;
    result.signals.vix_level = latest;
    result.details.vix_level = { level: latest, signal: latest < 20 ? "risk-on" : latest > 25 ? "risk-off" : "neutral" };
  }

  if (data.t10y2y?.length > 0) {
    const latest = data.t10y2y[data.t10y2y.length - 1].value;
    result.signals.yield_curve = latest;
    result.details.yield_curve = { spread: latest, signal: latest > 0.5 ? "risk-on" : latest < 0 ? "risk-off" : "neutral" };
  }

  if (data.sp500?.length >= 50) {
    const prices = data.sp500.map((d) => d.value);
    const peak = Math.max(...prices.slice(-260));
    const latest = prices[prices.length - 1];
    const drawdown = ((peak - latest) / peak) * 100;
    result.signals.drawdown = -drawdown;
    result.details.drawdown = { peak, current: latest, drawdownPct: drawdown, signal: drawdown < 5 ? "risk-on" : drawdown > 10 ? "risk-off" : "neutral" };
  }

  if (data.sp500?.length >= 260) {
    const prices = data.sp500.map((d) => d.value);
    const latest = prices[prices.length - 1];
    const yearAgo = prices[prices.length - 260] || prices[0];
    const momentum = ((latest - yearAgo) / yearAgo) * 100;
    result.signals.momentum = momentum;
    result.details.momentum = { return12m: momentum, signal: momentum > 0 ? "risk-on" : "risk-off" };
  }

  const zScore = (vals) => {
    if (!vals || vals.length < 20) return 0;
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length) || 1;
    return (vals[vals.length - 1] - mean) / std;
  };

  const zHY = data.hy_oas ? zScore(data.hy_oas.map((d) => d.value)) : 0;
  const zSlope = result.signals.vix_slope != null ? -result.signals.vix_slope * 5 : 0;
  const zNFCI = data.nfci ? zScore(data.nfci.map((d) => d.value)) : 0;

  const compositeScore = 0.45 * zHY + 0.35 * zSlope + 0.2 * zNFCI;
  const probBear = 1 / (1 + Math.exp(-compositeScore));

  result.score = compositeScore;
  result.probBear = probBear;
  result.regime = compositeScore < -0.5 ? "bull" : compositeScore > 0.5 ? "bear" : "neutral";
  result.zScores = { hy: zHY, slope: zSlope, nfci: zNFCI };

  return result;
}
