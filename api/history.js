// api/history.js — Vercel Serverless Function
// Historical monthly prices: Yahoo Finance (primary) → Twelve Data (fallback)

import yahooFinance from "yahoo-finance2";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { symbols, start, end, provider } = req.query;
  if (!symbols) return res.status(400).json({ error: "Missing ?symbols= param" });

  const tickers = symbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 100);
  if (!tickers.length) return res.status(400).json({ error: "No valid symbols" });

  const startDate = start || "2015-01-01";
  const endDate = end || new Date().toISOString().slice(0, 10);
  const forceTD = provider === "twelvedata";
  const forceYahoo = provider === "yahoo";

  const data = {};
  const errors = [];

  // ── Try Yahoo Finance first ──
  if (!forceTD) {
    let yahooSuccess = 0;
    for (const sym of tickers) {
      try {
        const result = await yahooFinance.historical(sym, {
          period1: startDate,
          period2: endDate,
          interval: "1mo",
        });

        if (result && result.length > 0) {
          data[sym] = result
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

    if (yahooSuccess > 0 && (yahooSuccess >= tickers.length * 0.5 || forceYahoo)) {
      return res.status(200).json({
        data,
        errors: errors.filter((e) => !data[e.symbol]),
        provider: "yahoo",
        fetched: yahooSuccess,
        requested: tickers.length,
      });
    }

    if (forceYahoo) {
      return res.status(500).json({ error: "Yahoo Finance failed for most symbols", errors, provider: "yahoo" });
    }
  }

  // ── Fallback: Twelve Data ──
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
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
      hint: "Check that yahoo-finance2 is installed, or add TWELVEDATA_API_KEY in Vercel env vars",
    });
  }

  try {
    const url =
      "https://api.twelvedata.com/time_series?symbol=" +
      tickers.join(",") +
      "&interval=1month&start_date=" + startDate +
      "&end_date=" + endDate +
      "&apikey=" + apiKey;

    const resp = await fetch(url);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: "Twelve Data API error", status: resp.status });
    }
    const tdData = await resp.json();

    const parseSeries = (series) => {
      if (!series?.values || !Array.isArray(series.values)) return null;
      return series.values
        .filter((v) => v.close)
        .map((v) => ({ date: v.datetime, close: parseFloat(v.close) }))
        .reverse();
    };

    if (tickers.length === 1) {
      const parsed = parseSeries(tdData);
      if (parsed) data[tickers[0]] = parsed;
      else errors.push({ symbol: tickers[0], message: "No Twelve Data data" });
    } else {
      for (const sym of tickers) {
        const parsed = parseSeries(tdData[sym]);
        if (parsed) data[sym] = parsed;
        else errors.push({ symbol: sym, message: "No Twelve Data data" });
      }
    }

    return res.status(200).json({
      data,
      errors: errors.filter((e) => !data[e.symbol]),
      provider: "twelvedata",
      fetched: Object.keys(data).length,
      requested: tickers.length,
    });
  } catch (err) {
    return res.status(500).json({ error: "Both providers failed", detail: err.message });
  }
}
