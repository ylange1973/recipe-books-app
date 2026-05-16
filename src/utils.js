import { UNIT_MAP, UNIT_DISPLAY } from "./constants.js";

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const now = () => new Date().toISOString();

// Translation cache (localStorage)
export const tcLoad = () => { try { return JSON.parse(localStorage.getItem("rb3_tc") || "{}"); } catch { return {}; } };
export const tcSave = v => { try { localStorage.setItem("rb3_tc", JSON.stringify(v)); } catch {} };

// Image helpers
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function compressImage(dataUrl, maxPx = 600, quality = 0.65) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Unit helpers
export function normalizeUnit(unit) {
  if (!unit) return "";
  return UNIT_MAP[unit.toLowerCase().trim().replace(/\.$/, "")] || unit;
}

export function displayUnit(normalizedUnit, lang) {
  if (!normalizedUnit) return "";
  return UNIT_DISPLAY[lang]?.[normalizedUnit] || normalizedUnit;
}

export function parseIngredient(ing, lang = "en") {
  const rawAmt = (ing.amount || "").trim();
  const rawUnit = (ing.unit || "").trim();
  if (rawUnit) return { qty: rawAmt, unit: displayUnit(normalizeUnit(rawUnit), lang) };
  const match = rawAmt.match(/^([\d\/\.\s½¼¾⅓⅔⅛]+)\s+(.+)$/);
  if (match) {
    const possibleUnit = match[2].trim();
    const normalized = normalizeUnit(possibleUnit);
    if (normalized !== possibleUnit || UNIT_MAP[possibleUnit.toLowerCase()]) {
      return { qty: match[1].trim(), unit: displayUnit(normalized, lang) };
    }
  }
  return { qty: rawAmt, unit: "" };
}
