import { useState, useRef, useEffect } from "react";
import { THEME, LANGUAGES } from "../constants.js";
import { uid, now, compressImage, readFileAsDataURL, prepareImageForExtraction } from "../utils.js";
import { callAI, extractJSON, extractFromPastedText, extractAndTranslate, RECIPE_JSON_SHAPE as AI_SHAPE } from "../ai.js";
import ImageInput from "./ImageInput.jsx";
import TagInput from "./TagInput.jsx";

export default function RecipeForm({ initial, onSave, currentUser, books, allUsers, t, saveRef, dirtyRef }) {
  const isMobile = navigator.maxTouchPoints > 0;
  const [name, setName] = useState(initial?.name || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const [foodType, setFoodType] = useState(initial?.foodType || "");
  const [diff, setDiff] = useState(initial?.difficulty || "");
  const [tags, setTags] = useState(initial?.customTags || []);
  const [ings, setIngs] = useState(initial?.ingredients || [{ id: uid(), amount: "", unit: "", name: "" }]);
  const [steps, setSteps] = useState(initial?.steps || [{ id: uid(), text: "", images: [] }]);
  const [notes, setNotes] = useState(initial?.notes || "");
  const [serves, setServes] = useState(initial?.serves || "");
  const [isPrivate, setIsPrivate] = useState(initial?.isPrivate || false);
  const [images, setImages] = useState(initial?.images || []);
  const [bookIds, setBookIds] = useState(initial?.bookIds || []);
  const [srcType, setSrcType] = useState(initial?.source?.type || "manual");
  const [srcUrl, setSrcUrl] = useState(initial?.source?.url || "");
  const [pastedText, setPastedText] = useState("");
  const [perms, setPerms] = useState(initial?.editPerms || []);
  const [aiSt, setAiSt] = useState("");
  const [aiErr, setAiErr] = useState("");
  const [fileInfo, setFileInfo] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef();
  const cameraInputRef = useRef();

  const markDirty = () => { setIsDirty(true); if (dirtyRef) dirtyRef.current = true; };

  const applyExtracted = r => {
    if (r.name) setName(r.name);
    if (r.description) setDesc(r.description);
    if (r.foodType) setFoodType(r.foodType);
    if (r.difficulty) setDiff(r.difficulty);
    if (r.notes) setNotes(r.notes);
    if (r.serves) setServes(String(r.serves));
    if (r.ingredients?.length) setIngs(r.ingredients.map(i => ({
      id: uid(),
      ...(i.type === "section" ? { type: "section", title: i.title || i.name || "" } : { type: "ingredient", amount: i.amount || "", unit: i.unit || "", name: i.name || "" })
    })));
    if (r.steps?.length) setSteps(r.steps.map(s => ({ id: uid(), text: typeof s === "string" ? s : s.text || "", images: [] })));
  };

  const getLangName = () => (currentUser.lang || "en") === "en" ? "English" : LANGUAGES.find(l => l.code === (currentUser.lang || "en"))?.nativeLabel || "English";

  const handleFileExtract = async e => {
    const f = e.target.files[0]; if (!f) return;
    setFileInfo({ name: f.name, type: f.type });
    setAiSt("extracting"); setAiErr("");
    try {
      const langName = getLangName();
      if (f.type.startsWith("image/")) {
        const original = await readFileAsDataURL(f);
        const forExtraction = await prepareImageForExtraction(original);
        alert("Extraction image size: " + Math.round(forExtraction.length / 1024) + "KB");
        const compressed = await compressImage(original); // for storage
        alert("About to call extractAndTranslate");
        applyExtracted(await extractAndTranslate(forExtraction, "image", currentUser.lang || "en"));
        alert("extractAndTranslate completed");
      } else {
        const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = ev => res(ev.target.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(f); });
        const apiRes = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: `Extract the recipe and return JSON translated into ${langName}. ${AI_SHAPE}`, fileBase64: b64, fileType: f.type }) });
        const data = await apiRes.json();
        if (data.error) throw new Error(data.error);
        applyExtracted(extractJSON(data.text));
      }
      setAiSt("done");
    } catch (err) { setAiSt("error"); setAiErr(String(err?.message || err)); }
    e.target.value = "";
  };

  const handleExtractUrl = async () => {
    if (!srcUrl.trim()) return;
    setAiSt("extracting"); setAiErr("");
    try { applyExtracted(await extractAndTranslate(srcUrl, "url", currentUser.lang || "en")); setAiSt("done"); }
    catch (e) { setAiSt("error"); setAiErr(String(e?.message || e)); }
  };

  const handleExtractPaste = async () => {
    if (!pastedText.trim()) return; setAiSt("extracting"); setAiErr("");
    try { applyExtracted(await extractFromPastedText(pastedText, getLangName())); setAiSt("done"); }
    catch (e) { setAiSt("error"); setAiErr(String(e?.message || e)); }
  };

  const handleGenerateImage = async () => {
    if (!name.trim()) {
      alert(t.enterRecipeName || "Please enter a recipe name first.");
      return null;
    }
    // Build prompt from name + key ingredients (up to 5) + foodType
    const keyIngs = ings
      .filter(i => i.type !== "section" && i.name?.trim())
      .slice(0, 5)
      .map(i => i.name.trim())
      .join(", ");
    const foodTypePart = foodType ? `, ${foodType}` : "";
    const ingsPart = keyIngs ? `. Key ingredients: ${keyIngs}` : "";
    const imagenPrompt = `Professional food photography of ${name}${foodTypePart}${ingsPart}. Natural lighting, clean background, top-down or 45-degree angle, appetizing presentation, high quality.`;

    const apiRes = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generateImage", imagenPrompt }),
    });
    const data = await apiRes.json();
    if (data.error) throw new Error(data.error);
    markDirty();
    return data.imageBase64 || null;
  };

  const addIng = () => setIngs([...ings, { id: uid(), amount: "", unit: "", name: "" }]);
  const upIng = (id, f, v) => { setIngs(ings.map(i => i.id === id ? { ...i, [f]: v } : i)); markDirty(); };
  const rmIng = id => { setIngs(ings.filter(i => i.id !== id)); markDirty(); };
  const insertSectionAbove = id => {
    const idx = ings.findIndex(i => i.id === id); if (idx === -1) return;
    const sec = { id: uid(), type: "section", title: "" };
    const next = [...ings]; next.splice(idx, 0, sec); setIngs(next);
  };
  const insertStepAfter = id => {
    const idx = steps.findIndex(s => s.id === id); if (idx === -1) return;
    const next = [...steps]; next.splice(idx + 1, 0, { id: uid(), text: "", images: [] }); setSteps(next);
  };
  const upStep = (id, f, v) => setSteps(steps.map(s => s.id === id ? { ...s, [f]: v } : s));
  const rmStep = id => setSteps(steps.filter(s => s.id !== id));
  const togBook = bid => setBookIds(bookIds.includes(bid) ? bookIds.filter(b => b !== bid) : [...bookIds, bid]);
  const togPerm = uid2 => setPerms(perms.includes(uid2) ? perms.filter(u => u !== uid2) : [...perms, uid2]);

  const handleSave = () => {
    if (!name.trim()) { alert(t.enterRecipeName); return; }
    onSave({
      id: initial?.id || uid(), name, description: desc, foodType, difficulty: diff, customTags: tags,
      ingredients: ings.filter(i => i.type === "section" ? i.title.trim() : i.name.trim()),
      steps: steps.filter(s => s.text.trim()),
      notes, serves, isPrivate, images, bookIds,
      source: { type: srcType, url: srcType === "url" ? srcUrl : "" },
      ownerId: initial?.ownerId || currentUser.id,
      originalLang: initial?.originalLang || currentUser.lang || "en",
      editPerms: perms,
      meta: { createdAt: initial?.meta?.createdAt || now(), lastEdited: now(), timesOpened: initial?.meta?.timesOpened || 0, lastOpened: initial?.meta?.lastOpened || null }
    });
  };
  useEffect(() => { if (saveRef) saveRef.current = handleSave; });

  const others = allUsers.filter(u => u.id !== currentUser.id && u.email !== "guest@myrecipebooks.com");

  return (
    <div>
      {/* Import button — show when adding new recipe or editing existing */}
      <div className="field">
          <div style={{ position: "relative", display: "inline-block" }}>
            <button type="button" className="btn btn-s" onClick={() => setShowImport(v => !v)}>
              ✨ {t.importBtn || "Import"}
            </button>
            {showImport && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", insetInlineStart: 0, background: "#fff", border: `1px solid ${THEME.tan}`, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.12)", zIndex: 300, minWidth: 160 }}>
                {[
                  { key: "url",   label: "🔗 URL" },
                  { key: "paste", label: t.pasteText },
                  { key: "file",  label: t.fileImport || "📄 File" },
                  ...(isMobile ? [{ key: "cam", label: t.camera || "📷 Camera" }] : []),
                ].map(({ key, label }, i) => (
                  <button key={key} type="button"
                    onClick={() => {
                      setShowImport(false);
                      if (key === "file") { setSrcType("file"); fileInputRef.current?.click(); }
                      else if (key === "cam") { setSrcType("file"); cameraInputRef.current?.click(); }
                      else setSrcType(key);
                    }}
                    style={{ width: "100%", padding: ".6rem 1rem", background: "none", border: "none", borderTop: i > 0 ? `1px solid ${THEME.parchment}` : "none", cursor: "pointer", textAlign: "start", fontSize: ".88rem", color: THEME.darkBrown, fontFamily: "'Source Sans 3',sans-serif" }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hidden file inputs */}
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,image/*" style={{ display: "none" }} onChange={handleFileExtract} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileExtract} />

          {srcType === "url" && (
            <div style={{ display: "flex", gap: ".4rem", marginTop: ".5rem" }}>
              <input className="fi" style={{ fontSize: ".88rem" }} type="url" placeholder="https://…" value={srcUrl} onChange={e => setSrcUrl(e.target.value)} />
              <button type="button" className="btn btn-s btn-sm" onClick={handleExtractUrl}>{t.extractBtn}</button>
            </div>
          )}
          {srcType === "paste" && (
            <div style={{ marginTop: ".5rem" }}>
              <textarea className="fi" style={{ minHeight: 140, fontSize: ".85rem", marginBottom: ".5rem" }}
                placeholder={t.pasteTextPh} value={pastedText} onChange={e => setPastedText(e.target.value)} />
              <button type="button" className="btn btn-p btn-sm" onClick={handleExtractPaste} disabled={!pastedText.trim()}>{t.pasteExtractBtn}</button>
            </div>
          )}
          {aiSt === "extracting" && <div className="ai-st"><span className="spinner" />{t.extracting}</div>}
          {aiSt === "done" && <div className="ai-st">✅ {t.extractDone}</div>}
          {aiSt === "error" && <div className="ai-st" style={{ flexDirection: "column", alignItems: "flex-start", gap: ".2rem" }}>
            <span>⚠️ {t.extractError}</span>
            {aiErr && <span style={{ fontSize: ".75rem", color: THEME.brown, fontFamily: "monospace", wordBreak: "break-all" }}>{aiErr}</span>}
          </div>}
        </div>
      <div className="divider" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".8rem" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: THEME.darkBrown, marginBottom: ".3rem", textTransform: "uppercase", letterSpacing: ".05em" }}>{t.recipeName}</label>
          <input className="fi" style={{ margin: 0 }} value={name} onChange={e => { setName(e.target.value); markDirty(); }} placeholder={t.recipeNamePh} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: ".4rem", cursor: "pointer", marginLeft: "1rem", flexShrink: 0, fontSize: ".85rem", color: THEME.brown }}>
          <input type="checkbox" checked={isPrivate} onChange={e => { setIsPrivate(e.target.checked); markDirty(); }} style={{ accentColor: THEME.rust, width: 16, height: 16, cursor: "pointer" }} />
          🔒 {t.privateRecipe}
        </label>
      </div>
      <div className="field"><label>{t.description}</label><textarea className="fi" value={desc} onChange={e => { setDesc(e.target.value); markDirty(); }} placeholder={t.descPh} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".8rem" }}>
        <div className="field">
          <label>{t.foodType}</label>
          <select className="fi" value={foodType} onChange={e => { setFoodType(e.target.value); markDirty(); }}>
            <option value="">{t.selectOpt}</option>
            {t.FOOD_TYPES.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="field">
          <label>{t.difficulty}</label>
          <select className="fi" value={diff} onChange={e => { setDiff(e.target.value); markDirty(); }}>
            <option value="">{t.selectOpt}</option>
            {t.DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="field" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <label style={{ minWidth: "fit-content", margin: 0 }}>{t.serves}</label>
          <input className="fi" type="number" min="1" max="100" value={serves} onChange={e => { setServes(e.target.value); markDirty(); }} placeholder={t.servesPlaceholder} style={{ maxWidth: 80, margin: 0 }} />
        </div>
        <button type="button" className="btn btn-s btn-sm" onClick={() => { const tag = window.prompt(t.tagPh || "Add tag"); if (tag?.trim()) { setTags([...tags, tag.trim()]); markDirty(); } }}>
          + {t.customTags || "Tags"}
        </button>
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
            {tags.map(tg => (
              <span key={tg} className="tpill">{tg}
                <button type="button" onClick={() => setTags(tags.filter(x => x !== tg))}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="divider" />
      {/* Main recipe images — onGenerate wired in for AI image generation */}
      <div className="field">
        <ImageInput
          images={images}
          onChange={imgs => { setImages(imgs); markDirty(); }}
          label={t.recipeImages}
          onGenerate={handleGenerateImage}
        />
      </div>
      <div className="divider" />
      <div className="field">
        <label>{t.ingredients}</label>
        <div className="le">
          {ings.map(i => (
            i.type === "section" ? (
              <div key={i.id} className="le-row" style={{ alignItems: "center" }}>
                <input placeholder="Section name…" value={i.title} onChange={e => upIng(i.id, "title", e.target.value)}
                  style={{ flex: 1, fontWeight: 600, fontSize: ".88rem", fontStyle: "italic", color: THEME.brown, border: "none", borderBottom: `1.5px solid ${THEME.tan}`, outline: "none", background: "transparent", padding: ".3rem 0" }} />
                <button type="button" className="btn btn-ic btn-s btn-sm" onClick={() => rmIng(i.id)}>×</button>
              </div>
            ) : (
              <div key={i.id} className="le-row">
                <button type="button" title={t.addSection}
                  style={{ background: "none", border: "none", cursor: "pointer", color: THEME.brown, fontSize: ".95rem", padding: "0 .3rem", flexShrink: 0, opacity: 0.6 }}
                  onClick={() => insertSectionAbove(i.id)}>÷</button>
                <input style={{ maxWidth: 65 }} placeholder={t.qty} value={i.amount} onChange={e => upIng(i.id, "amount", e.target.value)} />
                <input style={{ maxWidth: 55 }} placeholder={t.unit} value={i.unit} onChange={e => upIng(i.id, "unit", e.target.value)} />
                <input placeholder={t.ingName} value={i.name} onChange={e => upIng(i.id, "name", e.target.value)} />
                <button type="button" className="btn btn-ic btn-s btn-sm" onClick={() => rmIng(i.id)}>×</button>
              </div>
            )
          ))}
          <div style={{ display: "flex", gap: ".4rem" }}>
            <button type="button" className="le-add" onClick={addIng}>{t.addIngredient}</button>
          </div>
        </div>
      </div>
      <div className="divider" />
      <div className="field">
        <label>{t.steps}</label>
        {steps.map((step, idx) => (
          <div key={step.id || idx} className="step-ed" style={{ position: "relative" }}>
            <div className="step-ed-n">{t.stepLabel} {idx + 1}</div>
            {steps.length > 1 && (
              <button type="button" onClick={() => rmStep(step.id)}
                style={{ position: "absolute", top: ".4rem", insetInlineEnd: ".4rem", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: THEME.tan, lineHeight: 1, padding: "0 .2rem" }}>×</button>
            )}
            <textarea style={{ width: "100%", border: "none", outline: "none", fontSize: ".9rem", fontFamily: "'Source Sans 3',sans-serif", resize: "vertical", minHeight: 60, background: "transparent" }}
              placeholder={t.stepPh} value={step.text} onChange={e => { upStep(step.id, "text", e.target.value); markDirty(); }} />
            <div style={{ marginTop: ".4rem" }}><ImageInput images={step.images || []} onChange={imgs => upStep(step.id, "images", imgs)} maxImages={3} label={t.stepImage} /></div>
            <div style={{ marginTop: ".4rem" }}>
              <button type="button" className="btn btn-s btn-sm" onClick={() => insertStepAfter(step.id)}>{t.insertStep || "+ Add step below"}</button>
            </div>
          </div>
        ))}
      </div>
      <div className="divider" />
      <div className="field"><label>{t.notes}</label><textarea className="fi" value={notes} onChange={e => { setNotes(e.target.value); markDirty(); }} placeholder={t.notesPh} style={{ minHeight: 90 }} /></div>
      <div className="divider" />
      <div className="field">
        <label>{t.addToBooks}</label>
        <div className="bk-cbs">
          {books.length === 0 && <div style={{ fontSize: ".82rem", color: THEME.tan }}>{t.noBooksYet}</div>}
          {books.map(b => (
            <label key={b.id} className="bk-cb">
              <input type="checkbox" style={{ accentColor: THEME.rust }} checked={bookIds.includes(b.id)} onChange={() => togBook(b.id)} />{b.name}
            </label>
          ))}
        </div>
      </div>
      {others.length > 0 && (
        <div className="field">
          <label>{t.editPerms}</label>
          {others.map(u => (
            <div key={u.id} className="perm-row">
              <span>{u.name}</span>
              <input type="checkbox" style={{ accentColor: THEME.rust, width: 16, height: 16, cursor: "pointer" }} checked={perms.includes(u.id)} onChange={() => togPerm(u.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
