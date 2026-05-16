import { useState, useRef } from "react";
import { THEME } from "../constants.js";
import { uid, compressImage, readFileAsDataURL } from "../utils.js";

export default function ImageInput({ images = [], onChange, maxImages = 10, label = "" }) {
  const [uploading, setUploading] = useState(false);
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
      <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="btn btn-s btn-sm" onClick={() => !atLimit && fileRef.current.click()}
          disabled={atLimit} style={{ opacity: atLimit ? 0.4 : 1, cursor: atLimit ? "not-allowed" : "pointer" }}>📁 Upload</button>
        <button type="button" className="btn btn-s btn-sm" onClick={() => !atLimit && camRef.current.click()}
          disabled={atLimit} style={{ opacity: atLimit ? 0.4 : 1, cursor: atLimit ? "not-allowed" : "pointer" }}>📷 Camera</button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFiles} />
        {atLimit && <span style={{ fontSize: ".78rem", color: THEME.rust }}>Max {maxImages} images reached — remove one to add more.</span>}
      </div>
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
