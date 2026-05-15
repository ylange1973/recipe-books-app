import { useState, useRef } from "react";
import { THEME } from "../constants.js";
import { compressImage, readFileAsDataURL } from "../utils.js";

export default function BookImagePicker({ cover, setCover }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const camRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    setUploading(true);
    const compressed = await compressImage(await readFileAsDataURL(f));
    setCover(compressed);
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div>
      <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-s btn-sm" onClick={() => fileRef.current.click()}>📁 Upload</button>
        <button type="button" className="btn btn-s btn-sm" onClick={() => camRef.current.click()}>📷 Camera</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFile} />
      </div>
      {uploading && <div style={{ fontSize: ".8rem", color: THEME.brown, marginBottom: ".4rem" }}>⏳ Processing image…</div>}
      {cover && (
        <div style={{ position: "relative", display: "inline-block", marginBottom: ".5rem" }}>
          <img src={cover} alt="Cover" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, border: `2px solid ${THEME.tan}`, display: "block" }} />
          <button onClick={() => setCover(null)} style={{ position: "absolute", top: 3, right: 3, background: "rgba(44,26,14,.7)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
      )}
    </div>
  );
}
