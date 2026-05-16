import { useState, useEffect } from "react";
import { THEME, LANGUAGES } from "../constants.js";
import { tcLoad, tcSave } from "../utils.js";
import { callAI, extractJSON } from "../ai.js";
import { fbGetTranslation, fbSaveTranslation } from "../firestore.js";

export default function RecipeCard({ recipe, onClick, users, userLang, likeCount = 0, isLiked = false, onLike }) {
  const owner = users.find(u => u.id === recipe.ownerId);
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
      <div className="card-rimg">
        {hdr ? <img src={hdr.src} alt="" /> : <span style={{ fontSize: "3.5rem" }}>🍽</span>}
      </div>
      <div className="card-body">
        <div className="card-name">{display.name}</div>
        <div className="card-rtags">
          {display.foodType && <span className="tag tag-t">{display.foodType}</span>}
          {display.difficulty && <span className="tag tag-d">{display.difficulty}</span>}
          {(recipe.customTags || []).slice(0, 2).map(tg => <span key={tg} className="tag tag-c">{tg}</span>)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: ".78rem", color: THEME.sage }}>{owner?.name || ""}</span>
          <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
            {likeCount > 0 && <span style={{ fontSize: ".78rem", display: "flex", alignItems: "center", gap: ".15rem", color: isLiked ? "#e74c3c" : THEME.tan }}>{isLiked ? "♥" : "♡"} {likeCount}</span>}
            <span style={{ fontSize: ".78rem", color: THEME.tan }}>{recipe.isPrivate ? "🔒" : recipe.source?.type === "url" ? "🔗" : recipe.source?.type === "image" ? "🖼" : ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
