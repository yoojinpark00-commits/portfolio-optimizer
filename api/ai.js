// api/ai.js — Vercel Serverless Function
// Proxies AI advisor requests to Anthropic Claude API
//
// SETUP: In Vercel dashboard → Settings → Environment Variables:
//   ANTHROPIC_API_KEY = "your_anthropic_api_key_here"
//
// Usage: POST /api/ai  { prompt: "..." }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY not set. Add it in Vercel → Settings → Environment Variables.",
    });
  }

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Missing prompt in request body" });

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({
        error: "Anthropic API error",
        status: resp.status,
        detail: text,
      });
    }

    const data = await resp.json();
    const text = data.content
      ?.map((b) => (b.type === "text" ? b.text : ""))
      .filter(Boolean)
      .join("\n\n") || "Unable to generate advice.";

    return res.status(200).json({ text, model: data.model });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to call Anthropic API",
      detail: err.message,
    });
  }
}
