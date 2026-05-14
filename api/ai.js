import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { prompt, imageBase64, imageType, url, fileBase64, fileType } = req.body;

  try {
    let finalPrompt = prompt;

    // ── URL fetch ──────────────────────────────────────────────────────────
    if (url) {
      try {
        const pageRes = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(10000)
        });

        if (!pageRes.ok) {
          return res.status(500).json({ error: `Could not access this URL — the website may require login or block automated access (HTTP ${pageRes.status}). Try copying the recipe text and using the Paste Text option instead.` });
        }

        const html = await pageRes.text();
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

        if (text.length < 100) {
          return res.status(500).json({ error: "Page fetched but no readable content found. Try copying the recipe text and using Paste Text instead." });
        }
        finalPrompt = prompt + "\n\nPage content:\n" + text;

      } catch (fetchErr) {
        return res.status(500).json({ error: "Could not access this URL — the website may be blocking automated access. Try copying the recipe text and using the Paste Text option instead." });
      }
    }

    // ── File extraction (PDF or Word) ──────────────────────────────────────
    if (fileBase64 && fileType) {
      try {
        const buffer = Buffer.from(fileBase64, "base64");
        let extractedText = "";

        if (fileType === "application/pdf") {
          const data = await pdfParse(buffer);
          extractedText = data.text?.trim() || "";
        } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value?.trim() || "";
        } else if (fileType === "application/msword") {
          return res.status(400).json({ error: "Old .doc format is not supported. Please save as .docx and try again." });
        } else {
          return res.status(400).json({ error: "Unsupported file type. Please use PDF or Word (.docx)." });
        }

        if (!extractedText || extractedText.length < 50) {
          return res.status(500).json({ error: "Could not extract text from this file. The file may be scanned/image-based. Try the Image option instead." });
        }

        finalPrompt = prompt + "\n\nFile content:\n" + extractedText.slice(0, 12000);

      } catch (fileErr) {
        return res.status(500).json({ error: "Error reading file: " + fileErr.message });
      }
    }

    // ── Call Claude ────────────────────────────────────────────────────────
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
    return res.status(500).json({ error: e.message });
  }
}
