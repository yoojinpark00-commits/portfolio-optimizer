export default async function handler(req, res) {
  try {
    const symbol = (req.query.symbol || "").toUpperCase();
    const interval = req.query.interval || "1day";
    const outputsize = req.query.outputsize || "365";

    if (!symbol) {
      return res.status(400).json({ error: "Missing symbol" });
    }

    const key = process.env.TWELVEDATA_API_KEY;

    if (!key) {
      return res.status(500).json({ error: "Missing TWELVEDATA_API_KEY env var" });
    }

    const url =
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}` +
      `&interval=${encodeURIComponent(interval)}` +
      `&outputsize=${encodeURIComponent(outputsize)}` +
      `&apikey=${encodeURIComponent(key)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data?.status === "error") {
      return res.status(502).json({
        error: data.message || "Provider error",
        provider: data,
      });
    }

    // Cache results for 1 hour
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}