// api/search.js — Vercel Serverless Function
// Free ticker search via Yahoo Finance autosuggest (no auth needed)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q } = req.query;
  if (!q || q.length < 1) return res.status(400).json({ error: "Missing ?q= param" });

  try {
    // Yahoo Finance autosuggest — free, no auth, returns tickers with names
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0&listsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!resp.ok) throw new Error(`Yahoo search returned ${resp.status}`);

    const json = await resp.json();
    const quotes = json?.quotes || [];

    // Filter to equities and ETFs only (exclude futures, options, currencies, crypto)
    const results = quotes
      .filter(q => q.quoteType === "EQUITY" || q.quoteType === "ETF")
      .map(q => ({
        t: (q.symbol || "").replace("-", "."), // BRK-B → BRK.B for our system
        n: q.shortname || q.longname || q.symbol || "",
        s: q.quoteType === "ETF" ? "ETF" : (q.industry || q.sector || "Stock"),
        type: q.quoteType === "ETF" ? "etf" : "stock",
        exchange: q.exchange || "",
      }))
      .slice(0, 10);

    return res.status(200).json({ results, count: results.length, query: q });
  } catch (err) {
    console.warn("Yahoo search failed:", err.message);
    return res.status(500).json({ error: "Search failed", detail: err.message });
  }
}
