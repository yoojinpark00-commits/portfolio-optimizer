// api/history.js — Vercel Serverless Function
// Historical monthly prices: Yahoo Finance (primary) → Twelve Data (fallback)
//
// Usage: GET /api/history?symbols=VTI,BND,SPY&start=2015-01-01&end=2025-12-31
//        GET /api/history?symbols=VTI&provider=twelvedata  (force Twelve Data)
//        GET /api/history?symbols=VTI&provider=yahoo       (force Yahoo)
//
// SETUP: npm install yahoo-finance2
//        (Optional) TWELVEDATA_API_KEY for fallback

import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { symbols, start, end, provider } = req.query;
  if (!symbols) return res.status(400).json({ error: "Missing symbols parameter" });

  const tickers = symbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const startDate = start || "2015-01-01";
  const endDate = end || "2025-12-31";
  const forceTD = provider === "twelvedata";
  const forceYahoo = provider === "yahoo";

  const data = {};
  const errors = [];

  // ── Try Yahoo Finance first (unless forced to Twelve Data) ──
  if (!forceTD) {
    let yahooSuccess = 0;
    for (const sym of tickers) {
      try {
        const result = await yahooFinance.chart(sym, {
          period1: startDate,
          period2: endDate,
          interval: "1mo",
        });

        if (result?.quotes?.length > 0) {
          data[sym] = result.quotes
            .filter((q) => q.close != null && q.date != null)
            .map((q) => ({
              date: q.date instanceof Date ? q.date.toISOString().slice(0, 10) : String(q.date).slice(0, 10),
              close: +q.close.toFixed(2),
            }));
          yahooSuccess++;
        } else {
          errors.push({ symbol: sym, message: "No Yahoo data", provider: "yahoo" });
        }
      } catch (err) {
        errors.push({ symbol: sym, message: err.message, provider: "yahoo" });
      }
    }

    // If Yahoo got most of the data, return it
    if (yahooSuccess > 0 && (yahooSuccess >= tickers.length * 0.5 || forceYahoo)) {
      return res.status(200).json({
        data,
        errors: errors.filter((e) => !data[e.symbol]),
        provider: "yahoo",
        fetched: yahooSuccess,
        requested: tickers.length,
      });
    }

    // If forced Yahoo but failed, return error
    if (forceYahoo) {
      return res.status(500).json({ error: "Yahoo Finance failed for most symbols", errors, provider: "yahoo" });
    }
  }

  // ── Fallback: Twelve Data ──
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    // If Yahoo got some data, return what we have
    if (Object.keys(data).length > 0) {
      return res.status(200).json({
        data,
        errors,
        provider: "yahoo-partial",
        fetched: Object.keys(data).length,
        requested: tickers.length,
      });
    }
    return res.status(500).json({
      error: "Yahoo Finance unavailable and TWELVEDATA_API_KEY not set",
      errors,
    });
  }

  // Only fetch from Twelve Data for symbols Yahoo missed
  const missingSymbols = tickers.filter((s) => !data[s]);

  for (const sym of missingSymbols) {
    try {
      const url = `https://api.twelvedata.com/time_series?symbol=${sym}&interval=1month&start_date=${startDate}&end_date=${endDate}&apikey=${apiKey}&format=JSON&order=ASC`;
      const resp = await fetch(url);
      const json = await resp.json();

      if (json.status === "error") {
        errors.push({ symbol: sym, message: json.message || "Unknown error", provider: "twelvedata" });
        continue;
      }

      if (json.values && Array.isArray(json.values)) {
        data[sym] = json.values.map((v) => ({
          date: v.datetime,
          close: parseFloat(v.close),
        }));
      } else {
        errors.push({ symbol: sym, message: "No data returned", provider: "twelvedata" });
      }

      // Rate limit delay for Twelve Data
      if (missingSymbols.indexOf(sym) < missingSymbols.length - 1) {
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch (err) {
      errors.push({ symbol: sym, message: err.message, provider: "twelvedata" });
    }
  }

  return res.status(200).json({
    data,
    errors: errors.filter((e) => !data[e.symbol]),
    provider: missingSymbols.length > 0 ? "yahoo+twelvedata" : "yahoo",
    fetched: Object.keys(data).length,
    requested: tickers.length,
  });
}
