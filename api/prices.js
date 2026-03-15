// api/prices.js — Vercel Serverless Function
// Live quotes: Yahoo Finance (primary, free, no key) → Twelve Data (fallback)

import yahooFinance from "yahoo-finance2";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { tickers, provider } = req.query;
  if (!tickers) return res.status(400).json({ error: "Missing ?tickers= param" });

  const symbols = tickers.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 50);
  if (!symbols.length) return res.status(400).json({ error: "No valid symbols" });

  const forceTD = provider === "twelvedata";
  const forceYahoo = provider === "yahoo";

  // ── Try Yahoo Finance first ──
  if (!forceTD) {
    try {
      const results = {};

      await Promise.all(
        symbols.map(async (sym) => {
          try {
            const q = await yahooFinance.quote(sym);
            if (q && q.regularMarketPrice) {
              results[sym] = {
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
                datetime: q.regularMarketTime instanceof Date ? q.regularMarketTime.toISOString() : "",
                ts: Date.now(),
              };
            }
          } catch (err) {
            console.warn("Yahoo quote failed for " + sym + ": " + err.message);
          }
        })
      );

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
      if (forceYahoo) {
        return res.status(500).json({ error: "Yahoo Finance failed", detail: err.message, provider: "yahoo" });
      }
    }
  }

  // ── Fallback: Twelve Data ──
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Yahoo Finance unavailable and TWELVEDATA_API_KEY not set",
      hint: "Check that yahoo-finance2 is installed, or add TWELVEDATA_API_KEY in Vercel env vars",
    });
  }

  try {
    const url = "https://api.twelvedata.com/quote?symbol=" + symbols.join(",") + "&apikey=" + apiKey;
    const resp = await fetch(url);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: "Twelve Data API error", status: resp.status });
    }
    const data = await resp.json();
    const results = {};

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
