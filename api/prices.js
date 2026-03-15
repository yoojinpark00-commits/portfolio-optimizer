// api/prices.js — Vercel Serverless Function
// Live quotes via Yahoo Finance public API (no package needed)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: "Missing ?tickers= param" });

  const symbols = tickers.split(",").map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 50);
  if (!symbols.length) return res.status(400).json({ error: "No valid symbols" });

  const results = {};

  try {
    // Yahoo Finance v7 quote endpoint — public, no auth needed
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!resp.ok) throw new Error(`Yahoo returned ${resp.status}`);

    const json = await resp.json();
    const quotes = json?.quoteResponse?.result || [];

    for (const q of quotes) {
      if (!q.symbol) continue;
      results[q.symbol] = {
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChangePercent != null ? +q.regularMarketChangePercent.toFixed(2) : 0,
        prevClose: q.regularMarketPreviousClose || 0,
        open: q.regularMarketOpen || 0,
        dayHigh: q.regularMarketDayHigh || 0,
        dayLow: q.regularMarketDayLow || 0,
        volume: q.regularMarketVolume || 0,
        name: q.shortName || q.longName || "",
        exchange: q.exchange || "",
        currency: q.currency || "USD",
        datetime: "",
        ts: Date.now(),
      };
    }

    if (Object.keys(results).length > 0) {
      return res.status(200).json({
        data: results,
        fetched: Object.keys(results).length,
        requested: symbols.length,
        provider: "yahoo",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("Yahoo Finance quote failed:", err.message);
  }

  // ── Fallback: Twelve Data ──
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Yahoo Finance unavailable and TWELVEDATA_API_KEY not set",
    });
  }

  try {
    const url = `https://api.twelvedata.com/quote?symbol=${symbols.join(",")}&apikey=${apiKey}`;
    const resp = await fetch(url);
    const data = await resp.json();

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
      const parsed = parseQuote(data);
      if (parsed) results[symbols[0]] = parsed;
    } else {
      for (const sym of symbols) {
        const parsed = parseQuote(data[sym]);
        if (parsed) results[sym] = parsed;
      }
    }

    return res.status(200).json({
      data: results,
      fetched: Object.keys(results).length,
      requested: symbols.length,
      provider: "twelvedata",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Both providers failed", detail: err.message });
  }
}
