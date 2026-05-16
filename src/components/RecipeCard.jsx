import { useState, useEffect } from "react";
import { THEME, LANGUAGES } from "../constants.js";
import { tcLoad, tcSave } from "../utils.js";
import { callAI, extractJSON } from "../ai.js";
import { fbGetTranslation, fbSaveTranslation } from "../firestore.js";

export default function RecipeCard({ recipe, onClick, users, userLang, likeCount = 0, isLiked = false, onLike }) {
  const hdr = recipe.images?.find(i => i.role === "header") || recipe.images?.[0];
  const [display, setDisplay] = useState({ name: recipe.name, foodType: recipe.foodType, difficulty: recipe.difficulty });

  useEffect(() => {
    const lang = userLang || "en";
    const origLang = recipe.originalLang || "en";
    if (lang === origLang) { setDisplay({ name: recipe.name, foodType: recipe.foodType, difficulty: recipe.difficulty }); return; }

    const ck = `${recipe.id}__${lang}`;

    async function loadDisplay() {
      // 1. Check localStorage cache first
      const cache = tcLoad() || {};
      if (cache[ck]?.name) {
        setDisplay({ name: cache[ck].name || recipe.name, foodType: cache[ck].foodType || recipe.foodType, difficulty: cache[ck].difficulty || recipe.difficulty });
        return;
      }

      // 2. Check Firestore — reuse name/foodType/difficulty if already stored by RecipeDetail
      const fbTr = await fbGetTranslation(recipe.id, lang);
      if (fbTr?.name) {
        const c = tcLoad() || {}; c[ck] = { ...(c[ck] || {}), ...fbTr }; tcSave(c);
        setDisplay({ name: fbTr.name || recipe.name, foodType: fbTr.foodType || recipe.foodType, difficulty: fbTr.difficulty || recipe.difficulty });
        return;
      }

      // 3. Fall back to AI — only if nothing stored yet
      const langName = LANGUAGES.find(l => l.code === lang)?.nativeLabel || "English";
      try {
        const raw = await callAI(`Translate into ${langName}, return ONLY valid JSON {name,foodType,difficulty}, no markdown: ${JSON.stringify({ name: recipe.name, foodType: recipe.foodType, difficulty: recipe.difficulty })}`);
        const j = extractJSON(raw);
        // Store partial translation to Firestore so RecipeDetail reuses this name
        const existing = await fbGetTranslation(recipe.id, lang);
        if (!existing) {
          await fbSaveTranslation(recipe.id, lang, { name: j.name, foodType: j.foodType, difficulty: j.difficulty, stale: false });
        }
        // Update localStorage cache
        const c = tcLoad() || {}; c[ck] = { ...(c[ck] || {}), ...j }; tcSave(c);
        setDisplay({ name: j.name || recipe.name, foodType: j.foodType || recipe.foodType, difficulty: j.difficulty || recipe.difficulty });
      } catch {}
    }

    loadDisplay();
  }, [recipe.id, userLang]);

  return (
    <div className="card" onClick={onClick}>
      <div className="card-rimg" style={{ position: "relative" }}>
        {hdr ? <img src={hdr.src} alt="" /> : <span style={{ fontSize: "3.5rem" }}>🍽</span>}
        <div onClick={e => { e.stopPropagation(); onLike && onLike(recipe.id, e); }}
          style={{ position: "absolute", bottom: 6, insetInlineEnd: 8, display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, cursor: onLike ? "pointer" : "default" }}>
          <span style={{ fontSize: "2rem", color: isLiked ? "#e74c3c" : "rgba(255,255,255,0.85)", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>{isLiked ? "♥" : "♡"}</span>
          {likeCount > 0 && <span style={{ fontSize: ".7rem", color: "#fff", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>{likeCount}</span>}
        </div>
      </div>
      <div className="card-body">
        <div className="card-name">{display.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: ".4rem" }}>
          {recipe.isPrivate
            ? <span style={{ fontSize: ".78rem", color: THEME.tan }}>🔒</span>
            : <span />}
        </div>
      </div>
    </div>
  );
}
