// api/history.js — Vercel Serverless Function
// Historical monthly prices via Yahoo Finance public API (no package needed)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { symbols, start, end } = req.query;
  if (!symbols) return res.status(400).json({ error: "Missing ?symbols= param" });

  const tickers = symbols.split(",").map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 100);
  if (!tickers.length) return res.status(400).json({ error: "No valid symbols" });

  const startDate = start || "2015-01-01";
  const endDate = end || new Date().toISOString().slice(0, 10);

  // Convert dates to Unix timestamps for Yahoo
  const period1 = Math.floor(new Date(startDate).getTime() / 1000);
  const period2 = Math.floor(new Date(endDate).getTime() / 1000);

  const data = {};
  const errors = [];
  let yahooSuccess = 0;

  // ── Fetch from Yahoo Finance chart endpoint — one symbol at a time ──
  for (const sym of tickers) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1mo&period1=${period1}&period2=${period2}`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (!resp.ok) {
        errors.push({ symbol: sym, message: `Yahoo returned ${resp.status}`, provider: "yahoo" });
        continue;
      }

      const json = await resp.json();
      const result = json?.chart?.result?.[0];

      if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
        errors.push({ symbol: sym, message: "No data in Yahoo response", provider: "yahoo" });
        continue;
      }

      const timestamps = result.timestamp;
      const closes = result.indicators.quote[0].close;

      const points = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] != null) {
          const d = new Date(timestamps[i] * 1000);
          const dateStr = d.toISOString().slice(0, 10);
          points.push({ date: dateStr, close: +closes[i].toFixed(2) });
        }
      }

      if (points.length > 0) {
        data[sym] = points;
        yahooSuccess++;
      } else {
        errors.push({ symbol: sym, message: "Empty price array", provider: "yahoo" });
      }
    } catch (err) {
      errors.push({ symbol: sym, message: err.message, provider: "yahoo" });
    }
  }

  if (yahooSuccess > 0) {
    return res.status(200).json({
      data,
      errors: errors.filter(e => !data[e.symbol]),
      provider: "yahoo",
      fetched: yahooSuccess,
      requested: tickers.length,
    });
  }

  // ── Fallback: Twelve Data ──
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Yahoo Finance failed and TWELVEDATA_API_KEY not set",
      errors,
    });
  }

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${tickers.join(",")}&interval=1month&start_date=${startDate}&end_date=${endDate}&apikey=${apiKey}`;
    const resp = await fetch(url);
    const tdData = await resp.json();

    const parseSeries = (series) => {
      if (!series?.values || !Array.isArray(series.values)) return null;
      return series.values
        .filter(v => v.close)
        .map(v => ({ date: v.datetime, close: parseFloat(v.close) }))
        .reverse();
    };

    if (tickers.length === 1) {
      const parsed = parseSeries(tdData);
      if (parsed) data[tickers[0]] = parsed;
    } else {
      for (const sym of tickers) {
        const parsed = parseSeries(tdData[sym]);
        if (parsed) data[sym] = parsed;
      }
    }

    return res.status(200).json({
      data,
      errors: errors.filter(e => !data[e.symbol]),
      provider: "twelvedata",
      fetched: Object.keys(data).length,
      requested: tickers.length,
    });
  } catch (err) {
    return res.status(500).json({ error: "Both providers failed", detail: err.message, errors });
  }
}
