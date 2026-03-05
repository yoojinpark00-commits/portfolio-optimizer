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

  const series = {
    hy_oas: "BAMLH0A0HYM2",
    vix: "VIXCLS",
    vix3m: "VXVCLS",
    nfci: "NFCI",
    sp500: "SP500",
    t10y2y: "T10Y2Y",
  };

  // For history mode, go back to 2012 (3yr lookback before 2015 for z-scores)
  // For live mode, just 3 years
  const startDate = isHistory ? "2012-01-01" : new Date(Date.now() - 3 * 365.25 * 86400000).toISOString().slice(0, 10);

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
  if (isHistory) {
    monthlyRegimes = computeMonthlyRegimes(data);
  }

  return res.status(200).json({ data: isHistory ? undefined : data, regime, monthlyRegimes, errors });
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
