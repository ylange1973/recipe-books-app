export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { prompt, imageBase64, imageType } = req.body;

  try {
    const content = [];
    if (imageBase64) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: imageType || "image/jpeg", data: imageBase64 }
      });
    }
    content.push({ type: "text", text: prompt });

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
    catch { return res.status(500).json({ error: `HTTP ${response.status}: ${raw.slice(0,300)}` }); }

    if (data.error) return res.status(500).json({ error: data.error.message || JSON.stringify(data.error) });
    const text = data.content?.map(b => b.text || "").join("") || "";
    return res.status(200).json({ text });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};