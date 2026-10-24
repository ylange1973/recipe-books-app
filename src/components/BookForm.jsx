import { useState } from "react";
import { THEME } from "../constants.js";
import { uid, now } from "../utils.js";
import BookImagePicker from "./BookImagePicker.jsx";
import { compressImage } from "../utils.js";

export default function BookForm({ initial, onSave, onCancel, currentUser, t }) {
  const [name, setName] = useState(initial?.name || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const [cover, setCover] = useState(initial?.coverImage || null);
  const [generating, setGenerating] = useState(false);
  const [imageError, setImageError] = useState("");

  const generateCover = async () => {
    if (!name.trim()) { alert(t.enterBookName || "Enter a book name first."); return; }
    setGenerating(true);
    setImageError("");
    try {
      const imagenPrompt = `Square, professional cookbook cover photograph inspired by the collection title: "${name.trim()}". ${desc.trim() ? `Theme: ${desc.trim().slice(0, 250)}.` : ""} Beautiful food styling, appealing dishes representative of the collection, warm natural lighting, editorial quality, balanced composition, no words, no lettering, no typography, no watermarks.`;
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generateImage", imagenPrompt }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Image generation failed");
      if (!data.imageBase64) throw new Error("No image returned");
      const image = `data:${data.mimeType || "image/png"};base64,${data.imageBase64}`;
      setCover(await compressImage(image));
    } catch (error) {
      setImageError(error.message || "Could not generate cover");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) { alert(t.enterBookName); return; }
    onSave({
      id: initial?.id || uid(),
      name, description: desc, coverImage: cover,
      ownerId: initial?.ownerId || currentUser.id,
      originalLang: initial?.originalLang || currentUser.lang || "en",
      meta: { createdAt: initial?.meta?.createdAt || now(), timesOpened: initial?.meta?.timesOpened || 0, lastOpened: initial?.meta?.lastOpened || null }
    });
  };

  return (
    <div>
      <div className="field"><label>{t.bookName}</label><input className="fi" value={name} onChange={e => setName(e.target.value)} placeholder={t.bookNamePh} /></div>
      <div className="field"><label>{t.bookDesc}</label><textarea className="fi" value={desc} onChange={e => setDesc(e.target.value)} placeholder={t.bookDescPh} /></div>
      <div className="field">
        <div className="sl">{t.coverImage}</div>
        <BookImagePicker cover={cover} setCover={setCover} t={t} />
        <button type="button" className="btn btn-s btn-sm" onClick={generateCover} disabled={generating || !name.trim()} style={{ marginBottom: ".5rem" }}>
          {generating ? "⏳ Generating cover…" : cover ? "✨ Regenerate AI cover" : "✨ Generate AI cover"}
        </button>
        {imageError && <div role="alert" style={{ color: "#a22", fontSize: ".85rem", marginBottom: ".5rem" }}>{imageError}</div>}
        {cover && (
          <div style={{ marginTop: ".6rem", position: "relative", display: "inline-block" }}>
            <img src={cover} alt="" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, border: `2px solid ${THEME.tan}` }} />
            <button onClick={() => setCover(null)} style={{ position: "absolute", top: 3, right: 3, background: "rgba(44,26,14,.7)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10 }}>×</button>
          </div>
        )}
      </div>
      <div className="modal-ft" style={{ padding: "1rem 0 0", border: "none" }}>
        <button className="btn btn-s" onClick={onCancel}>{t.cancel}</button>
        <button className="btn btn-p" onClick={handleSave}>{t.saveBook}</button>
      </div>
    </div>
  );
}
