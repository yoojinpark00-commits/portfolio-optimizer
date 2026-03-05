// api/history.js — Vercel Serverless Function
// Fetches monthly historical close prices from Twelve Data
//
// Usage: GET /api/history?symbols=VTI,BND,SPY&start=2015-01-01&end=2025-12-31
//
// Returns: { data: { VTI: [{date,close},...], BND: [...] }, errors: [] }
// Rate limited: fetches one symbol at a time with delay to respect free tier (8/min)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "TWELVEDATA_API_KEY not set" });
  }

  const { symbols, start, end } = req.query;
  if (!symbols) return res.status(400).json({ error: "Missing symbols parameter" });

  const tickers = symbols.split(",").map((s) => s.trim()).filter(Boolean);
  const startDate = start || "2015-01-01";
  const endDate = end || "2025-12-31";

  const data = {};
  const errors = [];

  // Fetch one at a time to stay within rate limits
  for (const sym of tickers) {
    try {
      const url = `https://api.twelvedata.com/time_series?symbol=${sym}&interval=1month&start_date=${startDate}&end_date=${endDate}&apikey=${apiKey}&format=JSON&order=ASC`;
      const resp = await fetch(url);
      const json = await resp.json();

      if (json.status === "error") {
        errors.push({ symbol: sym, message: json.message || "Unknown error" });
        continue;
      }

      if (json.values && Array.isArray(json.values)) {
        data[sym] = json.values.map((v) => ({
          date: v.datetime,
          close: parseFloat(v.close),
        }));
      } else {
        errors.push({ symbol: sym, message: "No data returned" });
      }

      // Small delay between requests to respect rate limits (8 req/min free tier)
      if (tickers.indexOf(sym) < tickers.length - 1) {
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch (err) {
      errors.push({ symbol: sym, message: err.message });
    }
  }

  return res.status(200).json({ data, errors });
}
