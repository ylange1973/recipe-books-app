import { useState, useEffect } from "react";
import { THEME, LANGUAGES, GUEST_EMAIL, T } from "../constants.js";
import { tcLoad, tcSave, now, parseIngredient } from "../utils.js";
import { translateRecipe } from "../ai.js";
import { mergeTranslationIngredients } from "../translationIngredients.js";
import { fbTrackRecipeOpen, fbGetTranslation, fbSaveTranslation, fbDeleteTranslation, fbCreateShareToken } from "../firestore.js";

// Builds a translation object to store in Firestore.
// Takes translated text fields from AI response, but preserves
// amount and unit from the original recipe matched by ingredient id.
function buildTranslationStore(tr, originalRecipe) {
  return {
    name: tr.name, description: tr.description,
    foodType: tr.foodType, difficulty: tr.difficulty, notes: tr.notes,
    ingredients: mergeTranslationIngredients(tr.ingredients, originalRecipe.ingredients),
    steps: (tr.steps || []).map(s => ({ id: s.id, text: s.text })),
    stale: false,
  };
}

export default function RecipeDetail({ recipe, onBack, onEdit, onDelete, onTrackOpen, currentUser, allUsers, books, t, isGuest = false, likeCount = 0, isLiked = false, onLike, onShareToast }) {
  const canEdit = !isGuest && !!currentUser?.id;
  const isOwner = !isGuest && recipe.ownerId === currentUser.id;
  const owner = allUsers.find(u => u.id === recipe.ownerId);
  const rBooks = books.filter(b => recipe.bookIds?.includes(b.id));
  const headerImg = recipe.images?.find(i => i.role === "header") || recipe.images?.[0];
  const lang = currentUser.lang || "en";
  const needsTrans = lang !== (recipe.originalLang || "en");
  const [display, setDisplay] = useState(recipe);
  const [ts, setTs] = useState("pending");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!isGuest) {
      const newTimesOpened = (recipe.meta?.timesOpened || 0) + 1;
      fbTrackRecipeOpen(recipe.id, newTimesOpened).catch(() => {});
      onTrackOpen({ ...recipe, meta: { ...recipe.meta, timesOpened: newTimesOpened, lastOpened: now() } });
    }
    if (!needsTrans) { setDisplay(recipe); setTs("none"); return; }

    const ck = `${recipe.id}__${lang}`;

    async function loadTranslation() {
      setTs("loading");

      // 1. Check localStorage cache first
      const cache = tcLoad() || {};
      if (cache[ck]?.ingredients && !cache[ck]?.stale) {
        setDisplay({ ...recipe, ...cache[ck], ingredients: mergeTranslationIngredients(cache[ck].ingredients, recipe.ingredients) });
        setTs(cache[ck].stale ? "stale" : "done");
        return;
      }

      // 2. Check Firestore
      const fbTr = await fbGetTranslation(recipe.id, lang);
      if (fbTr?.ingredients) {
        // Update localStorage cache
        const c = tcLoad() || {};
        c[ck] = fbTr;
        tcSave(c);
        setDisplay({ ...recipe, ...fbTr, ingredients: mergeTranslationIngredients(fbTr.ingredients, recipe.ingredients) });
        setTs(fbTr.stale ? "stale" : "done");
        return;
      }

      // 3. Fall back to AI translation
      try {
        const tr = await translateRecipe(recipe, lang);
        const toStore = buildTranslationStore(tr, recipe);
        await fbSaveTranslation(recipe.id, lang, toStore);
        // Cache in localStorage
        const c = tcLoad() || {}; c[ck] = toStore; tcSave(c);
        setDisplay({ ...recipe, ...toStore });
        setTs("done");
      } catch (e) {
        console.error("[RecipeDetail translate error]", e?.message);
        setDisplay(recipe);
        setTs("error");
      }
    }

    loadTranslation();
  }, [recipe.id, lang]);

  const handleRetranslate = async () => {
    const ck = `${recipe.id}__${lang}`;
    await fbDeleteTranslation(recipe.id, lang);
    const c = tcLoad() || {};
    delete c[ck];
    tcSave(c);
    setDisplay(recipe);
    setTs("loading");
    try {
      const tr = await translateRecipe(recipe, lang);
      const toStore = buildTranslationStore(tr, recipe);
      await fbSaveTranslation(recipe.id, lang, toStore);
      const c2 = tcLoad() || {}; c2[ck] = toStore; tcSave(c2);
      setDisplay({ ...recipe, ...toStore });
      setTs("done");
    } catch (e) {
      console.error("[retranslate error]", e?.message);
      setDisplay(recipe);
      setTs("error");
    }
  };

  const [shareUrl, setShareUrl] = useState(null);
  const [showSharePopover, setShowSharePopover] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const token = await fbCreateShareToken(recipe.id, currentUser.id, lang);
      const url = `${window.location.origin}/share.html?token=${token}`;
      setShareUrl(url);
      setShowSharePopover(true);
    } catch (e) {
      console.error("Share failed:", e);
      if (onShareToast) onShareToast("⚠️ Could not create share link.");
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowSharePopover(false);
      if (onShareToast) onShareToast("🔗 Share link copied! Valid for 7 days.");
    } catch {
      if (onShareToast) onShareToast("⚠️ Could not copy link.");
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent("Check out this recipe: " + shareUrl)}`, "_blank");
    setShowSharePopover(false);
  };

  return (
    <div className="rdetail">
      <button className="back-btn" onClick={onBack}>{t.back}</button>
      {ts === "loading" && <div className="trans-banner"><span className="spinner" />{t.translating}</div>}
      {ts === "done" && needsTrans && (
        <div className="trans-banner" style={{ background: "#f0f7ed", borderColor: THEME.sage, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✓ {t.translated} ({LANGUAGES.find(l => l.code === lang)?.nativeLabel})</span>
          {canEdit && <button type="button" onClick={handleRetranslate} title="Re-translate" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "0 .2rem", lineHeight: 1 }}>🔄</button>}
        </div>
      )}
      {ts === "stale" && needsTrans && (
        <div className="trans-banner" style={{ background: "#fff8e6", borderColor: THEME.gold, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {t.transStale || "This translation may be outdated"}</span>
          {canEdit && <button type="button" onClick={handleRetranslate} title="Re-translate" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "0 .2rem", lineHeight: 1 }}>🔄</button>}
        </div>
      )}
      {ts === "error" && <div className="trans-banner" style={{ background: "#fff3f0", borderColor: THEME.rust }}>⚠️ {t.transError}</div>}
      {headerImg && <img className="rhero" src={headerImg.src} alt={display.name} />}
      <div className="rmeta-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
          {display.foodType && <span className="tag tag-t">{(() => { const idx = Object.values(T).reduce((f, lt) => f !== -1 ? f : lt.FOOD_TYPES.indexOf(display.foodType), -1); return idx !== -1 ? (t.FOOD_TYPES[idx] || display.foodType) : display.foodType; })()}</span>}
          {display.difficulty && <span className="tag tag-d">{(() => { const idx = T.en.DIFFICULTIES.indexOf(display.difficulty); return idx !== -1 ? (t.DIFFICULTIES[idx] || display.difficulty) : display.difficulty; })()}</span>}
          {(recipe.customTags || []).map(tg => <span key={tg} className="tag tag-c">{tg}</span>)}
        </div>
        {onLike && !isGuest && (
          <button type="button" onClick={e => onLike(recipe.id, e)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: ".3rem", color: isLiked ? "#e74c3c" : THEME.tan, padding: ".2rem .4rem", flexShrink: 0 }}>
            <span style={{ fontSize: "2.8rem", lineHeight: 1, color: isLiked ? "#e74c3c" : THEME.tan }}>♡</span>
            {likeCount > 0 && <span style={{ fontSize: ".95rem", color: THEME.brown, fontWeight: 500 }}>{likeCount}</span>}
          </button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".4rem", flexWrap: "wrap" }}>
        {recipe.isPrivate && <div style={{ display: "inline-flex", alignItems: "center", gap: ".3rem", fontSize: ".78rem", color: THEME.brown, padding: ".2rem .6rem", background: THEME.warm, borderRadius: 6, border: `1px solid ${THEME.tan}` }}>🔒 {t.privateRecipeHint}</div>}
      </div>
      <h1 className="rtitle">{display.name}</h1>
      {display.description && <p className="rdesc">{display.description}</p>}
      {recipe.source?.url && <div className="rsource">{t.sourceUrl} <a href={recipe.source.url} target="_blank" rel="noreferrer" style={{ color: THEME.sage, textDecoration: "none" }}>🔗 {(() => { try { return new URL(recipe.source.url).hostname.replace(/^www\./, ""); } catch { return recipe.source.url.slice(0, 40) + "…"; } })()}</a></div>}
      {recipe.source?.type === "image" && <div className="rsource">{t.sourcePhoto}</div>}
      {rBooks.length > 0 && <div style={{ marginTop: ".5rem", display: "flex", gap: ".3rem", flexWrap: "wrap" }}>{rBooks.map(b => <span key={b.id} style={{ fontSize: ".78rem", background: THEME.parchment, padding: ".1rem .5rem", borderRadius: 10, color: THEME.darkBrown }}>📚 {b.name}</span>)}</div>}
      <div style={{ fontSize: ".82rem", color: THEME.tan, marginTop: "1rem", marginBottom: ".5rem" }}>
        {t.createdBy} {owner?.name || "—"} · {recipe.meta?.createdAt ? new Date(recipe.meta.createdAt).toLocaleDateString() : "—"}
      </div>
      <div className="act-row" style={{ marginBottom: "1.5rem" }}>
        {canEdit && <button className="btn btn-s btn-sm" onClick={onEdit}>{t.edit}</button>}
        {isOwner && <button className="btn btn-d btn-sm" onClick={onDelete}>{t.del}</button>}
        {isOwner && !recipe.isPrivate && (
          <div style={{ position: "relative", display: "inline-block" }}>
            <button className="btn btn-s btn-sm" onClick={handleShare} disabled={sharing}
              title="Share recipe — generates a 7-day link">
              {sharing ? "⏳" : "🔗"} {sharing ? "Creating link…" : (t.share || "Share")}
            </button>
            {showSharePopover && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", insetInlineStart: 0, background: "#fff", border: `1px solid ${THEME.tan}`, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.12)", zIndex: 300, minWidth: 160 }}>
                <button type="button" onClick={handleWhatsApp}
                  style={{ width: "100%", padding: ".6rem 1rem", background: "none", border: "none", cursor: "pointer", textAlign: "start", fontSize: ".88rem", color: THEME.darkBrown, fontFamily: "'Source Sans 3',sans-serif" }}>
                  💬 WhatsApp
                </button>
                <button type="button" onClick={handleCopyLink}
                  style={{ width: "100%", padding: ".6rem 1rem", background: "none", border: "none", cursor: "pointer", textAlign: "start", fontSize: ".88rem", color: THEME.darkBrown, fontFamily: "'Source Sans 3',sans-serif", borderTop: `1px solid ${THEME.parchment}` }}>
                  🔗 {t.copyLink || "Copy link"}
                </button>
                <button type="button" onClick={() => setShowSharePopover(false)}
                  style={{ width: "100%", padding: ".6rem 1rem", background: "none", border: "none", cursor: "pointer", textAlign: "start", fontSize: ".88rem", color: THEME.tan, fontFamily: "'Source Sans 3',sans-serif", borderTop: `1px solid ${THEME.parchment}` }}>
                  ✕ {t.cancel || "Cancel"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {recipe.serves && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", marginBottom: "1rem", padding: ".4rem .9rem", background: THEME.warm, borderRadius: 8 }}>
          <span style={{ fontSize: "1rem" }}>🍽</span>
          <span style={{ fontSize: ".95rem", fontWeight: 500, color: THEME.darkBrown }}>{t.serves}: {recipe.serves}</span>
        </div>
      )}
      {display.ingredients?.length > 0 && (
        <div className="rsec">
          <div className="rsec-title">{t.ingredients}</div>
          <ul className="ing-list">
            {display.ingredients.map((ing, i) => (
              ing.type === "section" ? (
                <li key={ing.id || i} style={{ listStyle: "none", padding: ".6rem 0 .2rem", borderBottom: `2px solid ${THEME.tan}`, fontWeight: 600, fontSize: ".9rem", color: THEME.brown, fontStyle: "italic" }}>
                  {ing.title}
                </li>
              ) : (
                <li key={ing.id || i} className="ing-item">
                  {(() => { const { qty, unit } = parseIngredient(ing, currentUser?.lang || "en"); return (<><span className="ing-qty">{qty}</span><span className="ing-unit">{unit}</span><span className="ing-name">{ing.name}</span></>); })()}
                </li>
              )
            ))}
          </ul>
        </div>
      )}
      {display.steps?.length > 0 && (
        <div className="rsec">
          <div className="rsec-title">{t.steps}</div>
          <ol className="step-list">
            {display.steps.map((step, idx) => (
              <li key={step.id || idx} className="step-item">
                <span className="step-num">{idx + 1}</span>
                <div className="step-con">
                  <div className="step-txt">{step.text}</div>
                  {(recipe.steps?.find(s => s.id === step.id)?.images || recipe.steps?.[idx]?.images || []).filter(i => i.src).map(img => (
                    <img key={img.id} className="step-img" src={img.src} alt="" />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
      {display.notes && (
        <div className="rsec">
          <div className="rsec-title">{t.notes}</div>
          <div className="notes-box">{display.notes}</div>
        </div>
      )}
    </div>
  );
}
