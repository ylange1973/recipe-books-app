import { useState, useRef } from "react";
import { THEME } from "../constants.js";
import { uid, compressImage, readFileAsDataURL } from "../utils.js";

export default function ImageInput({ images = [], onChange, maxImages = 10, label = "" }) {
  const [uploading, setUploading] = useState(false);
  const [showOpts, setShowOpts] = useState(false);
  const fileRef = useRef();
  const camRef = useRef();

  const addImg = (src, role = "inline") => {
    if (images.length >= maxImages) return;
    onChange([...images, { id: uid(), src, role }]);
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const f of files) {
      const compressed = await compressImage(await readFileAsDataURL(f));
      addImg(compressed, images.length === 0 ? "header" : "inline");
    }
    setUploading(false);
    e.target.value = "";
  };

  const atLimit = images.length >= maxImages;

  return (
    <div>
      {label && <div className="sl">{label}</div>}
      <div style={{ position: "relative", display: "inline-block", marginBottom: ".5rem" }}>
        <button type="button" className="btn btn-s btn-sm"
          disabled={atLimit}
          style={{ opacity: atLimit ? 0.4 : 1, cursor: atLimit ? "not-allowed" : "pointer" }}
          onClick={() => !atLimit && setShowOpts(v => !v)}>
          📷 {label ? "Add image" : "Add image"}
        </button>
        {showOpts && !atLimit && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", insetInlineStart: 0, background: "#fff", border: `1px solid ${THEME.tan}`, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.12)", zIndex: 300, minWidth: 140 }}>
            <button type="button" onClick={() => { setShowOpts(false); fileRef.current.click(); }}
              style={{ width: "100%", padding: ".6rem 1rem", background: "none", border: "none", cursor: "pointer", textAlign: "start", fontSize: ".88rem", color: THEME.darkBrown, fontFamily: "'Source Sans 3',sans-serif" }}>
              📁 File / Gallery
            </button>
            <button type="button" onClick={() => { setShowOpts(false); camRef.current.click(); }}
              style={{ width: "100%", padding: ".6rem 1rem", background: "none", border: "none", cursor: "pointer", textAlign: "start", fontSize: ".88rem", color: THEME.darkBrown, fontFamily: "'Source Sans 3',sans-serif", borderTop: `1px solid ${THEME.parchment}` }}>
              📷 Camera
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFiles} />
      </div>
      {atLimit && <div style={{ fontSize: ".78rem", color: THEME.rust, marginBottom: ".4rem" }}>Max {maxImages} images reached — remove one to add more.</div>}
      {uploading && <div style={{ fontSize: ".8rem", color: THEME.brown, marginBottom: ".4rem" }}>⏳ Processing image…</div>}
      {images.length > 0 && (
        <div className="img-previews">
          {images.map(img => (
            <div key={img.id} className="img-prev">
              <img src={img.src} alt="" />
              <button className="img-rm" onClick={() => onChange(images.filter(i => i.id !== img.id))}>×</button>
              <div className="img-role" onClick={() => onChange(images.map(i => i.id === img.id ? { ...i, role: i.role === "header" ? "inline" : "header" } : i))}>
                {img.role === "header" ? "⭐ hdr" : "inline"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
