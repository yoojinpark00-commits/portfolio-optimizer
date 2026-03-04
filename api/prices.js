// api/prices.js — Vercel Serverless Function
// Fetches real closing/current prices from Yahoo Finance
// Usage: GET /api/prices?tickers=AAPL,MSFT,VOO

export default async function handler(req, res) {
  // CORS headers for client-side fetch
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: "Missing ?tickers= param" });

  const symbols = tickers
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 25); // cap at 25 per request

  const results = {};

  try {
    // Yahoo Finance v8 quote endpoint — returns real market data
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols.join(",")}&range=2d&interval=1d`;

    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (resp.ok) {
      const data = await resp.json();
      const sparks = data?.spark?.result || [];

      for (const item of sparks) {
        const sym = item.symbol;
        const closes = item.response?.[0]?.indicators?.quote?.[0]?.close || [];
        const meta = item.response?.[0]?.meta || {};

        // Get the most recent valid close price
        const validCloses = closes.filter((c) => c !== null && !isNaN(c));
        const currentPrice =
          meta.regularMarketPrice || validCloses[validCloses.length - 1] || 0;
        const prevClose =
          meta.chartPreviousClose ||
          meta.previousClose ||
          validCloses[validCloses.length - 2] ||
          currentPrice;
        const change =
          prevClose > 0
            ? +(((currentPrice - prevClose) / prevClose) * 100).toFixed(2)
            : 0;

        results[sym] = {
          price: +currentPrice.toFixed(2),
          change,
          prevClose: +prevClose.toFixed(2),
          marketState: meta.tradingPeriods
            ? "closed"
            : meta.regularMarketTime
              ? "open"
              : "unknown",
          currency: meta.currency || "USD",
          ts: Date.now(),
        };
      }
    }

    // Fallback: try v7 quote API for any symbols that failed
    const missing = symbols.filter((s) => !results[s]);
    if (missing.length > 0) {
      try {
        const url2 = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${missing.join(",")}`;
        const resp2 = await fetch(url2, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (resp2.ok) {
          const data2 = await resp2.json();
          const quotes = data2?.quoteResponse?.result || [];
          for (const q of quotes) {
            if (q.symbol && q.regularMarketPrice) {
              const change =
                q.regularMarketPreviousClose > 0
                  ? +(
                      ((q.regularMarketPrice - q.regularMarketPreviousClose) /
                        q.regularMarketPreviousClose) *
                      100
                    ).toFixed(2)
                  : 0;
              results[q.symbol] = {
                price: +q.regularMarketPrice.toFixed(2),
                change,
                prevClose: +(q.regularMarketPreviousClose || 0).toFixed(2),
                marketState: q.marketState || "unknown",
                currency: q.currency || "USD",
                ts: Date.now(),
              };
            }
          }
        }
      } catch (e) {
        /* fallback failed, skip */
      }
    }

    return res.status(200).json({
      data: results,
      fetched: Object.keys(results).length,
      requested: symbols.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to fetch prices", detail: err.message });
  }
}
