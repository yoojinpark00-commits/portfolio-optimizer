// api/regime.js — Vercel Serverless Function
// Fetches macro data from FRED for regime-adaptive optimization
//
// SETUP: Get a free API key at https://fred.stlouisfed.org/docs/api/api_key.html
//   Then add to Vercel: FRED_API_KEY = "your_key"
//
// Usage: GET /api/regime
// Returns: { hy_oas, vix, vix3m, nfci, sp500, t10y2y, regime }

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

  // Series to fetch (last ~3 years for z-score rolling window)
  const series = {
    hy_oas: "BAMLH0A0HYM2",   // ICE BofA US High Yield OAS (daily)
    vix: "VIXCLS",             // VIX Spot (daily)
    vix3m: "VXVCLS",           // VIX 3-Month (daily)  
    nfci: "NFCI",              // Chicago Fed NFCI (weekly)
    sp500: "SP500",            // S&P 500 (daily)
    t10y2y: "T10Y2Y",         // 10Y-2Y spread (daily)
  };

  // Fetch ~3 years of data for rolling z-scores
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 3);
  const startStr = startDate.toISOString().slice(0, 10);

  const data = {};
  const errors = [];

  for (const [key, seriesId] of Object.entries(series)) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&observation_start=${startStr}&api_key=${apiKey}&file_type=json&sort_order=asc`;
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

      // Small delay between requests
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      errors.push({ series: key, message: err.message });
    }
  }

  // Compute regime signals from latest data
  const regime = computeRegime(data);

  return res.status(200).json({ data, regime, errors });
}

function computeRegime(data) {
  const result = {
    signals: {},
    score: null,
    regime: "unknown",
    probBear: null,
    details: {},
  };

  // 1. HY OAS Signal
  if (data.hy_oas?.length > 0) {
    const vals = data.hy_oas.map((d) => d.value);
    const latest = vals[vals.length - 1];
    const prev = vals.length > 5 ? vals[vals.length - 6] : latest;
    const rateOfChange = latest - prev; // bps change over ~1 week
    result.signals.hy_oas = latest;
    result.details.hy_oas = {
      level: latest,
      roc: rateOfChange,
      signal: latest < 400 ? "risk-on" : latest > 500 ? "risk-off" : "neutral",
    };
  }

  // 2. VIX Term Structure Slope
  if (data.vix?.length > 0 && data.vix3m?.length > 0) {
    const vixLatest = data.vix[data.vix.length - 1].value;
    const vix3mLatest = data.vix3m[data.vix3m.length - 1].value;
    const slope = vix3mLatest / vixLatest - 1;
    result.signals.vix_slope = slope;
    result.details.vix_slope = {
      vix: vixLatest,
      vix3m: vix3mLatest,
      slope,
      signal: slope > 0 ? "risk-on" : "risk-off",
    };
  }

  // 3. NFCI Signal
  if (data.nfci?.length > 0) {
    const latest = data.nfci[data.nfci.length - 1].value;
    const prev = data.nfci.length > 4 ? data.nfci[data.nfci.length - 5].value : latest;
    result.signals.nfci = latest;
    result.details.nfci = {
      level: latest,
      trend: latest - prev,
      signal: latest < 0 ? "risk-on" : "risk-off",
    };
  }

  // 4. S&P 500 MA200 Signal
  if (data.sp500?.length >= 200) {
    const prices = data.sp500.map((d) => d.value);
    const latest = prices[prices.length - 1];
    const ma200 = prices.slice(-200).reduce((s, v) => s + v, 0) / 200;
    const ma50 = prices.slice(-50).reduce((s, v) => s + v, 0) / 50;
    result.signals.sp500_ma = latest > ma200 ? 1 : -1;
    result.details.sp500_ma = {
      price: latest,
      ma200,
      ma50,
      aboveMa200: latest > ma200,
      goldenCross: ma50 > ma200,
      signal: latest > ma200 ? "risk-on" : "risk-off",
    };
  }

  // 5. VIX Level Signal
  if (data.vix?.length > 0) {
    const latest = data.vix[data.vix.length - 1].value;
    result.signals.vix_level = latest;
    result.details.vix_level = {
      level: latest,
      signal: latest < 20 ? "risk-on" : latest > 25 ? "risk-off" : "neutral",
    };
  }

  // 6. Yield Curve Signal
  if (data.t10y2y?.length > 0) {
    const latest = data.t10y2y[data.t10y2y.length - 1].value;
    result.signals.yield_curve = latest;
    result.details.yield_curve = {
      spread: latest,
      signal: latest > 0.5 ? "risk-on" : latest < 0 ? "risk-off" : "neutral",
    };
  }

  // 7. Drawdown Signal
  if (data.sp500?.length >= 50) {
    const prices = data.sp500.map((d) => d.value);
    const peak = Math.max(...prices.slice(-260)); // ~1 year
    const latest = prices[prices.length - 1];
    const drawdown = ((peak - latest) / peak) * 100;
    result.signals.drawdown = -drawdown;
    result.details.drawdown = {
      peak,
      current: latest,
      drawdownPct: drawdown,
      signal: drawdown < 5 ? "risk-on" : drawdown > 10 ? "risk-off" : "neutral",
    };
  }

  // 8. 12-Month Momentum
  if (data.sp500?.length >= 260) {
    const prices = data.sp500.map((d) => d.value);
    const latest = prices[prices.length - 1];
    const yearAgo = prices[prices.length - 260] || prices[0];
    const momentum = ((latest - yearAgo) / yearAgo) * 100;
    result.signals.momentum = momentum;
    result.details.momentum = {
      return12m: momentum,
      signal: momentum > 0 ? "risk-on" : "risk-off",
    };
  }

  // Composite Regime Score (3-signal core)
  // z-score approximation using rolling mean/std from available data
  const zScore = (vals) => {
    if (!vals || vals.length < 20) return 0;
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length) || 1;
    return (vals[vals.length - 1] - mean) / std;
  };

  const zHY = data.hy_oas ? zScore(data.hy_oas.map((d) => d.value)) : 0;
  const zSlope = result.signals.vix_slope != null ? -result.signals.vix_slope * 5 : 0; // scale & negate
  const zNFCI = data.nfci ? zScore(data.nfci.map((d) => d.value)) : 0;

  const compositeScore = 0.45 * zHY + 0.35 * zSlope + 0.2 * zNFCI;
  const probBear = 1 / (1 + Math.exp(-compositeScore));

  result.score = compositeScore;
  result.probBear = probBear;
  result.regime =
    compositeScore < -0.5 ? "bull" : compositeScore > 0.5 ? "bear" : "neutral";
  result.zScores = { hy: zHY, slope: zSlope, nfci: zNFCI };

  return result;
}
