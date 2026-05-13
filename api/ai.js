export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { prompt, imageBase64, imageType, url } = req.body;

  console.log("[ai.js] url:", url ? url.slice(0,80) : "none");
  console.log("[ai.js] prompt length:", prompt?.length);

  try {
    let finalPrompt = prompt;

    if (url) {
      try {
        console.log("[ai.js] fetching URL...");
        const pageRes = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(10000)
        });

        console.log("[ai.js] page status:", pageRes.status);

        if (!pageRes.ok) {
          return res.status(500).json({ error: `Could not fetch URL (HTTP ${pageRes.status}). Try the Paste Text option instead.` });
        }

        const html = await pageRes.text();
        console.log("[ai.js] html length:", html.length);

        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<!--[\s\S]*?-->/g, "")