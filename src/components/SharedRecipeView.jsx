import { useState, useEffect } from "react";
import { fbGetShareToken, fbGetRecipeById, fbGetTranslationForShare } from "../shareFirestore.js";
import { parseIngredient } from "../utils.js";
import { buildCSS } from "../styles.js";

const THEME = {
  brown: "#5c3d2e", darkBrown: "#2c1a0e", tan: "#b89a7a",
  parchment: "#f5ede0", warm: "#fdf6ee", rust: "#b5451b",
  sage: "#6b8f71", gold: "#c9a84c",
};

export default function SharedRecipeView() {
  const [state, setState] = useState("loading"); // loading | ready | expired | invalid | error
  const [recipe, setRecipe] = useState(null);
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) { setState("invalid"); return; }
    load(token);
  }, []);

  async function load(token) {
    try {
      const tokenDoc = await fbGetShareToken(token);
      if (!tokenDoc) { setState("invalid"); return; }

      const now = Date.now();
      if (tokenDoc.expiresAt < now) { setState("expired"); return; }

      const recipe = await fbGetRecipeById(tokenDoc.recipeId);
      if (!recipe || recipe.isPrivate) { setState("invalid"); return; }

      setRecipe(recipe);

      // Load translation if lang differs from original
      const lang = tokenDoc.lang || "en";
      const needsTrans = lang !== (recipe.originalLang || "en");
      if (needsTrans) {
        const tr = await fbGetTranslationForShare(recipe.id, lang);
        if (tr?.ingredients) {
          setDisplay({ ...recipe, ...tr });
        } else {
          setDisplay(recipe);
        }
      } else {
        setDisplay(recipe);
      }

      setState("ready");
    } catch (e) {
      console.error("SharedRecipeView load error:", e);
      setState("error");
    }
  }

  const headerImg = recipe?.images?.find(i => i.role === "header") || recipe?.images?.[0];

  const containerStyle = {
    maxWidth: 680,
    margin: "0 auto",
    padding: "1.5rem 1rem 4rem",
    fontFamily: "'Source Sans 3', sans-serif",
    color: THEME.darkBrown,
  };

  const brandStyle = {
    textAlign: "center",
    padding: "1rem 0 1.5rem",
    borderBottom: `1px solid ${THEME.parchment}`,
    marginBottom: "1.5rem",
    fontSize: ".85rem",
    color: THEME.tan,
    fontFamily: "'Playfair Display', serif",
  };

  if (state === "loading") return (
    <>
      <style>{buildCSS(false)}</style>
      <div style={containerStyle}>
        <div style={brandStyle}>📚 My Recipe Books</div>
        <div style={{ textAlign: "center", color: THEME.brown, padding: "3rem 0" }}>Loading recipe…</div>
      </div>
    </>
  );

  if (state === "expired") return (
    <>
      <style>{buildCSS(false)}</style>
      <div style={containerStyle}>
        <div style={brandStyle}>📚 My Recipe Books</div>
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⏳</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", marginBottom: ".5rem", color: THEME.darkBrown }}>This link has expired</div>
          <div style={{ color: THEME.tan, fontSize: ".9rem" }}>Recipe share links are valid for 7 days. Ask the owner to share it again.</div>
        </div>
      </div>
    </>
  );

  if (state === "invalid" || state === "error") return (
    <>
      <style>{buildCSS(false)}</style>
      <div style={containerStyle}>
        <div style={brandStyle}>📚 My Recipe Books</div>
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", marginBottom: ".5rem", color: THEME.darkBrown }}>Recipe not found</div>
          <div style={{ color: THEME.tan, fontSize: ".9rem" }}>This link may be invalid or the recipe may have been removed.</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{buildCSS(false)}</style>
      <div style={containerStyle}>
        <div style={brandStyle}>📚 My Recipe Books</div>

        {headerImg && (
          <img src={headerImg.src} alt={display.name}
            style={{ width: "100%", maxHeight: 340, objectFit: "cover", borderRadius: 12, marginBottom: "1.2rem" }} />
        )}

        <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: ".8rem" }}>
          {display.foodType && <span className="tag tag-t">{display.foodType}</span>}
          {display.difficulty && <span className="tag tag-d">{display.difficulty}</span>}
          {(recipe.customTags || []).map(tg => <span key={tg} className="tag tag-c">{tg}</span>)}
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: THEME.darkBrown, margin: "0 0 .5rem" }}>{display.name}</h1>
        {display.description && <p style={{ color: THEME.brown, fontSize: ".95rem", lineHeight: 1.6, marginBottom: "1rem" }}>{display.description}</p>}

        {recipe.serves && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", marginBottom: "1rem", padding: ".4rem .9rem", background: THEME.warm, borderRadius: 8 }}>
            <span>🍽</span>
            <span style={{ fontSize: ".95rem", fontWeight: 500 }}>Serves: {recipe.serves}</span>
          </div>
        )}

        {display.ingredients?.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 600, borderBottom: `2px solid ${THEME.parchment}`, paddingBottom: ".4rem", marginBottom: ".8rem" }}>Ingredients</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {display.ingredients.map((ing, i) => (
                ing.type === "section" ? (
                  <li key={ing.id || i} style={{ padding: ".6rem 0 .2rem", borderBottom: `2px solid ${THEME.tan}`, fontWeight: 600, fontSize: ".9rem", color: THEME.brown, fontStyle: "italic" }}>
                    {ing.title}
                  </li>
                ) : (
                  <li key={ing.id || i} style={{ display: "flex", gap: ".5rem", padding: ".4rem 0", borderBottom: `1px solid ${THEME.parchment}`, fontSize: ".95rem" }}>
                    {(() => { const { qty, unit } = parseIngredient(ing, "en"); return (<><span style={{ minWidth: 40, color: THEME.brown, fontWeight: 600 }}>{qty}</span><span style={{ minWidth: 50, color: THEME.tan }}>{unit}</span><span>{ing.name}</span></>); })()}
                  </li>
                )
              ))}
            </ul>
          </div>
        )}

        {display.steps?.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 600, borderBottom: `2px solid ${THEME.parchment}`, paddingBottom: ".4rem", marginBottom: ".8rem" }}>Steps</div>
            <ol style={{ padding: 0, margin: 0, listStyle: "none" }}>
              {display.steps.map((step, idx) => (
                <li key={step.id || idx} style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: THEME.sage, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".85rem", fontWeight: 700, marginTop: ".1rem" }}>{idx + 1}</span>
                  <div>
                    <div style={{ fontSize: ".95rem", lineHeight: 1.6 }}>{step.text}</div>
                    {(recipe.steps?.find(s => s.id === step.id)?.images || recipe.steps?.[idx]?.images || []).filter(i => i.src).map(img => (
                      <img key={img.id} src={img.src} alt="" style={{ maxWidth: "100%", borderRadius: 8, marginTop: ".5rem" }} />
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {display.notes && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 600, borderBottom: `2px solid ${THEME.parchment}`, paddingBottom: ".4rem", marginBottom: ".8rem" }}>Notes</div>
            <div style={{ background: THEME.warm, borderRadius: 8, padding: "1rem", fontSize: ".9rem", lineHeight: 1.6, color: THEME.brown }}>{display.notes}</div>
          </div>
        )}

        <div style={{ marginTop: "2rem", padding: "1rem", background: THEME.parchment, borderRadius: 8, textAlign: "center", fontSize: ".82rem", color: THEME.tan }}>
          Shared via 📚 My Recipe Books
        </div>
      </div>
    </>
  );
}
