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
          return res.status(500).json({ error: `Could not access this URL — the website may require login or block automated access (HTTP ${pageRes.status}). Try copying the recipe text and using the Paste Text option instead.` });
        }

        const html = await pageRes.text();
        console.log("[ai.js] html length:", html.length);

        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<!--[\s\S]*?-->/g, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&nbsp;/g, " ").replace(/&#\d+;/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 12000);

        console.log("[ai.js] extracted text length:", text.length);
        console.log("[ai.js] text preview:", text.slice(0, 200));

        if (text.length < 100) {
          return res.status(500).json({ error: "Page fetched but no readable content found — the site may use JavaScript to load content. Try copying the recipe text and using the Paste Text option instead." });
        }

        finalPrompt = prompt + "\n\nPage content:\n" + text;
        console.log("[ai.js] finalPrompt length:", finalPrompt.length);

      } catch (fetchErr) {
        console.log("[ai.js] fetch error:", fetchErr.message);
        return res.status(500).json({ error: "Could not access this URL — the website may be blocking automated access. Try copying the recipe text and using the Paste Text option instead." });
      }
    }

    const content = [];
    if (imageBase64) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: imageType || "image/jpeg", data: imageBase64 }
      });
    }
    content.push({ type: "text", text: finalPrompt });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content }]
      })
    });

    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); }
    catch { return res.status(500).json({ error: "HTTP " + response.status + ": " + raw.slice(0, 200) }); }

    if (data.error) return res.status(500).json({ error: data.error.message || JSON.stringify(data.error) });
    const text = data.content?.map(b => b.text || "").join("") || "";
    return res.status(200).json({ text });

  } catch (e) {
    console.log("[ai.js] top-level error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
