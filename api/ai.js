export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, imageBase64, imageType, url, fileBase64, fileType, action, imagenPrompt } = req.body;

  // --- Image generation via Gemini Imagen ---
if (action === "generateImage") {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" });
    if (!imagenPrompt) return res.status(400).json({ error: "imagenPrompt required" });

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt: imagenPrompt }],
            parameters: { sampleCount: 1 }
          }),
        }
      );
      const data = await response.json();
      console.log("Imagen status:", response.status);
      console.log("Imagen response:", JSON.stringify(data).slice(0, 500));
      if (!response.ok) return res.status(500).json({ error: data.error?.message || "Imagen API error" });

      const b64 = data.predictions?.[0]?.bytesBase64Encoded;
      if (!b64) return res.status(500).json({ error: "No image returned from Imagen" });

      return res.status(200).json({ imageBase64: b64, mimeType: "image/png" });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // --- Existing Anthropic AI logic ---
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  try {
    let userContent = [];

    // URL fetch: get page text first
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
    // Image extraction
    else if (imageBase64) {
      userContent.push({ type: "image", source: { type: "base64", media_type: imageType || "image/jpeg", data: imageBase64 } });
      userContent.push({ type: "text", text: prompt });
    }
    // File extraction (PDF/docx passed as base64)
    else if (fileBase64) {
      userContent.push({ type: "text", text: prompt + "\n\n[File content (base64, type: " + fileType + ") attached — extract recipe from it.]" });
    }
    // Plain text prompt
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
