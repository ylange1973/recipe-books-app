export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, imageBase64, imageType, url, fileBase64, fileType, action, imagenPrompt, videoId } = req.body;

  // --- YouTube transcript extraction ---
  if (action === "youtubeTranscript") {
    try {
      const { getSubtitles } = await import("youtube-caption-extractor");
      const subtitles = await getSubtitles({ videoID: videoId, lang: "en" });
      return res.status(200).json({ subtitles });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // --- Image generation via OpenAI ---
  if (action === "generateImage") {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY not set" });
    if (!imagenPrompt) return res.status(400).json({ error: "imagenPrompt required" });

    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
          prompt: imagenPrompt,
          n: 1,
          size: "1024x1024",
          quality: "low",
        }),
      });
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch { data = {}; }
      if (!response.ok) {
        const message = data.error?.message || raw.slice(0, 500) || "OpenAI image API error";
        console.error("OpenAI image generation failed", { status: response.status, message });
        return res.status(response.status >= 400 && response.status < 500 ? 400 : 502).json({ error: message });
      }

      const b64 = data.data?.[0]?.b64_json;
      if (!b64) return res.status(502).json({ error: "No image returned from OpenAI" });

      return res.status(200).json({ imageBase64: b64, mimeType: "image/png" });
    } catch (e) {
      console.error("Image generation exception", e);
      return res.status(500).json({ error: e.message });
    }
  }

  // --- Existing Anthropic AI logic ---
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  try {
    let userContent = [];

    if (url) {
      try {
        const pageRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) });
        const html = await pageRes.text();
        const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 12000);
        userContent.push({ type: "text", text: prompt + "\n\nPage content:\n" + text });
      } catch {
        userContent.push({ type: "text", text: prompt + "\n\n(Could not fetch page content from: " + url + ")" });
      }
    }
    else if (imageBase64) {
      userContent.push({ type: "image", source: { type: "base64", media_type: imageType || "image/jpeg", data: imageBase64 } });
      userContent.push({ type: "text", text: prompt });
    }
    else if (fileBase64) {
      userContent.push({ type: "text", text: prompt + "\n\n[File content (base64, type: " + fileType + ") attached — extract recipe from it.]" });
    }
    else {
      userContent.push({ type: "text", text: prompt });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: imageBase64 ? "claude-sonnet-4-6" : "claude-haiku-4-5",
        max_tokens: 4096,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || "API error" });

    const text = data.content?.find(b => b.type === "text")?.text || "";
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
