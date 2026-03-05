// api/prices.js — Vercel Serverless Function
// Proxies stock price requests to Twelve Data's /quote endpoint
//
// SETUP: In Vercel dashboard → Settings → Environment Variables:
//   TWELVE_DATA_API_KEY = "your_key_here"
//
// Usage: GET /api/prices?tickers=AAPL,MSFT,VOO

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: "Missing ?tickers= param" });

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "TWELVE_DATA_API_KEY not set. Add it in Vercel → Settings → Environment Variables.",
    });
  }

  const symbols = tickers
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 50);

  if (!symbols.length) return res.status(400).json({ error: "No valid symbols" });

  const results = {};

  try {
    // Twelve Data /quote supports comma-separated batch symbols
    const url = `https://api.twelvedata.com/quote?symbol=${symbols.join(",")}&apikey=${apiKey}`;
    const resp = await fetch(url);

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({
        error: "Twelve Data API error",
        status: resp.status,
        detail: text,
      });
    }

    const data = await resp.json();

    // --- Parse response ---
    // Single symbol: data is a flat object { symbol, close, ... }
    // Multiple symbols: data is keyed { "AAPL": { symbol, close, ... }, "MSFT": { ... } }

    const parseQuote = (q) => {
      if (!q || q.status === "error" || !q.symbol) return null;
      return {
        price: parseFloat(q.close) || parseFloat(q.previous_close) || 0,
        change: parseFloat(q.percent_change) || 0,
        prevClose: parseFloat(q.previous_close) || 0,
        open: parseFloat(q.open) || 0,
        dayHigh: parseFloat(q.high) || 0,
        dayLow: parseFloat(q.low) || 0,
        volume: parseInt(q.volume) || 0,
        name: q.name || "",
        exchange: q.exchange || "",
        currency: q.currency || "USD",
        datetime: q.datetime || "",
        ts: Date.now(),
      };
    };

    if (symbols.length === 1) {
      // Single symbol — response is a flat object
      const parsed = parseQuote(data);
      if (parsed) results[symbols[0]] = parsed;
    } else {
      // Multiple symbols — response is keyed by symbol
      for (const sym of symbols) {
        const q = data[sym];
        const parsed = parseQuote(q);
        if (parsed) results[sym] = parsed;
      }
    }

    return res.status(200).json({
      data: results,
      fetched: Object.keys(results).length,
      requested: symbols.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch from Twelve Data",
      detail: err.message,
    });
  }
}
