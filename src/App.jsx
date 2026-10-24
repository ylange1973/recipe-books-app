import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase.js";
import { THEME, LANGUAGES, T, GUEST_EMAIL } from "./constants.js";
import { uid, now, tcLoad, tcSave } from "./utils.js";
import { buildCSS } from "./styles.js";
import { fbGetUser, fbSaveUser, fbGetBooks, fbSaveBook, fbDeleteBook, fbGetRecipes, fbSaveRecipe, fbDeleteRecipe, fbGetAllUsers, fbGetLikes, fbToggleLike, fbMarkTranslationsStale, fbSaveTranslation } from "./firestore.js";
import LoginScreen from "./components/LoginScreen.jsx";
import Toast from "./components/Toast.jsx";
import BookCard from "./components/BookCard.jsx";
import RecipeCard from "./components/RecipeCard.jsx";
import RecipeDetail from "./components/RecipeDetail.jsx";
import RecipeForm from "./components/RecipeForm.jsx";
import { mergeTranslationIngredients } from "./translationIngredients.js";
import BookForm from "./components/BookForm.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [tab, setTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [users, setUsers] = useState([]);
  const [likes, setLikes] = useState([]);
  const [view, setView] = useState("list");
  const [selBook, setSelBook] = useState(null);
  const [selRecipe, setSelRecipe] = useState(null);
  const [showBookForm, setShowBookForm] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("");
  const [fDiff, setFDiff] = useState("");
  const [fBook, setFBook] = useState("");
  const [fLiked, setFLiked] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const saveRef = useRef(null);
  const dirtyRef = useRef(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const unsavedResolveRef = useRef(null);

  const confirmClose = () => new Promise(resolve => {
    if (!dirtyRef.current) { resolve("exit"); return; }
    unsavedResolveRef.current = resolve;
    setShowUnsavedModal(true);
  });

  const handleUnsavedChoice = async (choice) => {
    setShowUnsavedModal(false);
    if (choice === "save") {
      if (saveRef.current) await saveRef.current();
      dirtyRef.current = false;
      unsavedResolveRef.current?.("exit");
    } else if (choice === "exit") {
      dirtyRef.current = false;
      unsavedResolveRef.current?.("exit");
    } else {
      unsavedResolveRef.current?.("cancel");
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      if (fbUser) {
        const userData = await fbGetUser(fbUser.uid);
        const u = userData || { id: fbUser.uid, name: fbUser.displayName || fbUser.email, email: fbUser.email, lang: "en" };
        setUser(u);
        setDataLoading(true);
        await loadData();
        setDataLoading(false);
      } else {
        setUser(null); setBooks([]); setRecipes([]); setUsers([]); setLikes([]);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  async function loadData() {
    const [bks, recs, usrs] = await Promise.all([fbGetBooks(), fbGetRecipes(), fbGetAllUsers()]);
    setBooks(bks); setRecipes(recs); setUsers(usrs);
    fbGetLikes().then(lks => setLikes(lks)).catch(e => console.warn("likes load failed:", e.message));
  }

  const t = user ? T[user.lang || "en"] : T.en;
  const isRTL = user ? LANGUAGES.find(l => l.code === (user.lang || "en"))?.rtl : false;
  const isGuest = user?.email === GUEST_EMAIL;
  const showToast = msg => setToast(msg);
  const handleLogin = u => setUser(u);
  const handleLogout = async () => { await signOut(auth); setView("list"); setSelBook(null); setSelRecipe(null); };

  const handleToggleLike = async (recipeId, e) => {
    e.stopPropagation();
    if (!user || isGuest) return;
    const liked = await fbToggleLike(recipeId, user.id);
    if (liked) setLikes([...likes, { id: uid(), recipeId, userId: user.id, createdAt: now() }]);
    else setLikes(likes.filter(l => !(l.recipeId === recipeId && l.userId === user.id)));
  };

  const handleImport = async () => {
    setImportStatus("running");
    try {
      const parsed = JSON.parse(importJson);
      const bks = parsed.books || [], recs = parsed.recipes || [];
      let ok = 0, fail = 0;
      for (const b of bks) { try { await fbSaveBook(b); ok++; } catch { fail++; } }
      for (const r of recs) { try { await fbSaveRecipe(r); ok++; } catch { fail++; } }
      await loadData();
      setImportStatus(fail === 0 ? `done:${ok}` : `error:${ok} ok, ${fail} failed`);
    } catch (e) { setImportStatus("parseerror:" + e.message); }
  };

  const updateLang = async lang => {
    const updated = { ...user, lang };
    await fbSaveUser(updated);
    setUser(updated);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
  };

  const saveBook = async book => {
    const isNew = !books.find(b => b.id === book.id);
    await fbSaveBook(book);
    setBooks(isNew ? [...books, book] : books.map(b => b.id === book.id ? book : b));
    setShowBookForm(false); setEditBook(null);
    showToast(isNew ? t.bookCreated : t.bookUpdated);
  };

  const deleteBook = async id => {
    if (!confirm(t.delBookConfirm)) return;
    await fbDeleteBook(id);
    setBooks(books.filter(b => b.id !== id));
    setView("list"); setSelBook(null); showToast(t.bookDeleted);
  };

  const saveRecipe = async recipe => {
    const isTranslationEdit = !!recipe._isTranslationEdit;
    const translationLang = recipe._translationLang;
    // Strip internal flags before saving
    const { _isTranslationEdit, _translationLang, ...cleanRecipe } = recipe;

    if (isTranslationEdit) {
      // Save corrected translation only — don't touch original recipe
      const toStore = {
        name: cleanRecipe.name, description: cleanRecipe.description,
        foodType: cleanRecipe.foodType, difficulty: cleanRecipe.difficulty, notes: cleanRecipe.notes,
        ingredients: mergeTranslationIngredients(cleanRecipe.ingredients, selRecipe?.ingredients),
        steps: (cleanRecipe.steps || []).map(s => ({ id: s.id, text: s.text })),
        stale: false,
      };
      await fbSaveTranslation(cleanRecipe.id, translationLang, toStore);
      // Update localStorage cache
      const c = tcLoad() || {};
      c[`${cleanRecipe.id}__${translationLang}`] = toStore;
      tcSave(c);
      setShowRecipeForm(false); setEditRecipe(null);
      showToast(t.recipeSaved);
      return;
    }

    const isNew = !recipes.find(r => r.id === cleanRecipe.id);
    await fbSaveRecipe(cleanRecipe);
    setRecipes(isNew ? [...recipes, cleanRecipe] : recipes.map(r => r.id === cleanRecipe.id ? cleanRecipe : r));
    if (selRecipe?.id === cleanRecipe.id) setSelRecipe(cleanRecipe);
    // If editing an existing recipe, mark all translations stale and clear localStorage cache
    if (!isNew) {
      fbMarkTranslationsStale(cleanRecipe.id).catch(() => {});
      const cache = tcLoad() || {};
      Object.keys(cache).forEach(k => { if (k.startsWith(cleanRecipe.id + "__")) delete cache[k]; });
      tcSave(cache);
    }
    setShowRecipeForm(false); setEditRecipe(null);
    if (!isNew && selRecipe?.id === cleanRecipe.id) setView("recipe-detail");
    showToast(isNew ? t.recipeAdded : t.recipeSaved);
  };

  const deleteRecipe = async id => {
    if (isGuest || !user?.id || selRecipe?.ownerId !== user.id) return;
    if (!confirm(t.delRecipeConfirm)) return;
    await fbDeleteRecipe(id);
    setRecipes(recipes.filter(r => r.id !== id));
    if (selBook) setView("book-detail"); else setView("list");
    setSelRecipe(null); showToast(t.recipeDeleted);
  };

  const openBook = async book => {
    if (!isGuest) {
      const updated = { ...book, meta: { ...book.meta, timesOpened: (book.meta?.timesOpened || 0) + 1, lastOpened: now() } };
      await fbSaveBook(updated);
      setBooks(books.map(b => b.id === updated.id ? updated : b));
      setSelBook(updated);
    } else { setSelBook(book); }
    setView("book-detail");
  };

  const openRecipe = r => { setSelRecipe(r); setView("recipe-detail"); };

  // Seed initial history entry

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClick = e => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Note: Android PWA back button cannot be intercepted via popstate in standalone mode.
  // Users navigate back using the in-app sticky back button.

  const visibleRecipes = recipes.filter(r => !r.isPrivate || r.ownerId === user?.id);
  const myLikedIds = new Set(likes.filter(l => l.userId === user?.id).map(l => l.recipeId));
  const filtered = visibleRecipes.filter(r => {
  const lang = user?.lang || "en";
  const cache = tcLoad() || {};
  const translatedName = cache[`${r.id}__${lang}`]?.name || "";
  const ms = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||     translatedName.toLowerCase().includes(search.toLowerCase());
    const mt = !fType || r.foodType === fType;
    const md = !fDiff || r.difficulty === fDiff;
    const mb = !fBook || r.bookIds?.includes(fBook);
    const ml = !fLiked || myLikedIds.has(r.id);
    return ms && mt && md && mb && ml;
  });

  if (authLoading) return <><style>{buildCSS(false)}</style><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", color: THEME.brown }}>📚 Loading…</div></>;
  if (!user) return <><style>{buildCSS(false)}</style><LoginScreen onLogin={handleLogin} /></>;

  const bookRecipes = selBook ? visibleRecipes.filter(r => r.bookIds?.includes(selBook.id)) : [];
  const bkLang = user?.lang || "en";
  const bkCache = tcLoad() || {};

  return (
    <>
      <style>{buildCSS(isRTL)}</style>
      <div className="app">
        <div className="topbar">
          <div className="logo">📚 <span className="logo-text">{t.appName}</span></div>
          <div className="topbar-right">
            <select className="lang-sel" value={user.lang || "en"} onChange={e => updateLang(e.target.value)} title={t.preferredLang}>
              {LANGUAGES.filter(l => ["en", "he"].includes(l.code)).map(l => <option key={l.code} value={l.code}>{l.nativeLabel}</option>)}
            </select>
            <div ref={userMenuRef} style={{ position: "relative" }}>
              <button className="btn btn-g btn-sm" onClick={() => setShowUserMenu(v => !v)}>
                👤 {user.name}
              </button>
              {showUserMenu && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", insetInlineEnd: 0, background: "#fff", border: `1px solid ${THEME.tan}`, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.12)", minWidth: 140, zIndex: 200 }}>
                  <button onClick={() => { setShowUserMenu(false); handleLogout(); }}
                    style={{ width: "100%", padding: ".7rem 1rem", background: "none", border: "none", cursor: "pointer", textAlign: "start", fontSize: ".88rem", color: THEME.rust, fontFamily: "'Source Sans 3',sans-serif" }}>
                    {t.signOut}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {dataLoading && <div style={{ position: "fixed", inset: 0, background: "rgba(247,240,230,0.8)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: THEME.brown }}>📚 Loading your recipes…</div>}

        <div className="main">
          {view === "list" && (
            <div className="nav-tabs">
              <div className={`nav-tab${tab === "books" ? " act" : ""}`} onClick={() => setTab("books")}>📚 {t.books}</div>
              <div className={`nav-tab${tab === "recipes" ? " act" : ""}`} onClick={() => setTab("recipes")}>🍽 {t.allRecipes}</div>
            </div>
          )}

          {view === "recipe-detail" && selRecipe && (
            <RecipeDetail recipe={selRecipe}
              onBack={() => { setView(selBook ? "book-detail" : "list"); setSelRecipe(null); }}
              onEdit={() => {
                const lang = user?.lang || "en";
                const needsTrans = lang !== (selRecipe.originalLang || "en");
                if (needsTrans) {
                  const cache = tcLoad() || {};
                  const ck = `${selRecipe.id}__${lang}`;
                  const tr = cache[ck];
                  if (tr?.ingredients) {
                    // Merge translated text fields over original recipe for the form
                    setEditRecipe({ ...selRecipe, ...tr, ingredients: mergeTranslationIngredients(tr.ingredients, selRecipe.ingredients), _isTranslationEdit: true, _translationLang: lang });
                  } else {
                    setEditRecipe(selRecipe);
                  }
                } else {
                  setEditRecipe(selRecipe);
                }
                setShowRecipeForm(true); dirtyRef.current = false;
              }}
              onDelete={() => deleteRecipe(selRecipe.id)}
              onTrackOpen={updated => { setSelRecipe(updated); setRecipes(recipes.map(r => r.id === updated.id ? updated : r)); }}
              likeCount={likes.filter(l => l.recipeId === selRecipe?.id).length}
              isLiked={likes.some(l => l.recipeId === selRecipe?.id && l.userId === user?.id)}
              onLike={handleToggleLike}
              currentUser={user} allUsers={users} books={books} t={t} isGuest={isGuest} onShareToast={showToast} />
          )}

          {view === "book-detail" && selBook && (() => {
            const bkOrigLang = selBook.originalLang || "en";
            const bkNeedsTranslation = bkLang !== bkOrigLang;
            const bkCached = bkCache[`${selBook.id}__${bkLang}`];
            const bkDisplayName = bkNeedsTranslation ? (bkCached?.name || selBook.name) : selBook.name;
            const bkDisplayDesc = bkNeedsTranslation ? (bkCached?.description || selBook.description) : selBook.description;
            return (
              <div>
                <div style={{ background: "#fff", borderBottom: `1px solid ${THEME.parchment}`, padding: ".6rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button className="back-btn" style={{ margin: 0 }} onClick={() => { setView("list"); setSelBook(null); }}>{t.backToBooks}</button>
                  {!isGuest && selBook.ownerId === user.id && (
                    <div className="act-row">
                      <button className="btn btn-s btn-sm" onClick={() => { setEditBook(selBook); setShowBookForm(true); }}>{t.edit}</button>
                      <button className="btn btn-d btn-sm" onClick={() => deleteBook(selBook.id)}>{t.del}</button>
                    </div>
                  )}
                </div>
                <div className="bk-hd">
                  <div className="bk-cover">{selBook.coverImage ? <img src={selBook.coverImage} alt="" /> : "📚"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="bk-name">{bkDisplayName}</div>
                    {bkDisplayDesc && <div className="bk-desc">{bkDisplayDesc}</div>}
                    <div className="bk-meta">{bookRecipes.length} {bookRecipes.length === 1 ? t.recipeWord : t.recipesWord} · {t.createdBy} {users.find(u => u.id === selBook.ownerId)?.name || "—"}</div>
                  </div>
                </div>
                <div className="page">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                    <div className="pt" style={{ fontSize: "1.3rem" }}>{t.recipesInBook}</div>
                    {!isGuest && <button className="btn btn-p btn-sm" onClick={() => { setShowRecipeForm(true); dirtyRef.current = false; }}>{t.addRecipe}</button>}
                  </div>
                  {bookRecipes.length === 0
                    ? <div className="empty"><div className="empty-icon">🍳</div><div className="empty-txt">{t.noRecipes}</div></div>
                    : <div className="grid">{bookRecipes.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => openRecipe(r)} users={users} userLang={user?.lang || "en"} likeCount={likes.filter(l => l.recipeId === r.id).length} isLiked={likes.some(l => l.recipeId === r.id && l.userId === user?.id)} onLike={handleToggleLike} />)}</div>}
                </div>
              </div>
            );
          })()}

          {view === "list" && (
            <div className="page">
              {tab === "books" && (
                <>
                  <div className="ph">
                    <div><div className="pt">{t.yourBooks}</div><div className="ps">{t.shelfSub}</div></div>
                    {!isGuest && <button className="btn btn-p" onClick={() => { setEditBook(null); setShowBookForm(true); }}>{t.newBook}</button>}
                  </div>
                  {books.length === 0
                    ? <div className="empty"><div className="empty-icon">📚</div><div className="empty-txt">{t.noBooks}</div></div>
                    : <div className="grid">
                      {books.map(b => <BookCard key={b.id} book={b} count={visibleRecipes.filter(r => r.bookIds?.includes(b.id)).length} onClick={() => openBook(b)} users={users} userLang={user?.lang || "en"} />)}
                    </div>}
                </>
              )}
              {tab === "recipes" && (
                <>
                  <div className="ph">
                    <div><div className="pt">{t.allRecipes}</div><div className="ps">{recipes.length} {recipes.length === 1 ? t.recipeWord : t.recipesWord}</div></div>
                    {!isGuest && <button className="btn btn-p" onClick={() => { setEditRecipe(null); setShowRecipeForm(true); dirtyRef.current = false; }}>{t.addRecipe}</button>}
                  </div>
                  <div className="search-bar">
                    <span>🔍</span>
                    <input placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <button style={{ background: "none", border: "none", cursor: "pointer", color: THEME.tan }} onClick={() => setSearch("")}>×</button>}
                  </div>
                  <div className="filter-bar">
                    <span className="fl">{t.foodTypeLabel}</span>
                    {t.FOOD_TYPES.map(f => <div key={f} className={`chip${fType === f ? " act" : ""}`} onClick={() => setFType(fType === f ? "" : f)}>{f}</div>)}
                    <span className="fl" style={{ marginLeft: ".5rem" }}>{t.diffLabel}</span>
                    {t.DIFFICULTIES.map(d => <div key={d} className={`chip${fDiff === d ? " act" : ""}`} onClick={() => setFDiff(fDiff === d ? "" : d)}>{d}</div>)}
                    {books.length > 0 && <><span className="fl" style={{ marginLeft: ".5rem" }}>{t.bookLabel}</span>
                      {books.map(b => <div key={b.id} className={`chip${fBook === b.id ? " act" : ""}`} onClick={() => setFBook(fBook === b.id ? "" : b.id)}>{b.name}</div>)}</>}
                    <div className={`chip${fLiked ? " act" : ""}`} style={{ marginLeft: ".5rem" }} onClick={() => setFLiked(!fLiked)}>{t.myLikes}</div>
                  </div>
                  {filtered.length === 0
                    ? <div className="empty"><div className="empty-icon">🍽</div><div className="empty-txt">{recipes.length === 0 ? t.noRecipes : t.noMatch}</div></div>
                    : <div className="grid">{filtered.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => openRecipe(r)} users={users} userLang={user?.lang || "en"} likeCount={likes.filter(l => l.recipeId === r.id).length} isLiked={likes.some(l => l.recipeId === r.id && l.userId === user?.id)} onLike={handleToggleLike} />)}</div>}
                </>
              )}
            </div>
          )}
        </div>

        {showBookForm && !isGuest && (
          <div className="backdrop" onClick={e => e.target === e.currentTarget && (setShowBookForm(false), setEditBook(null))}>
            <div className="modal">
              <div className="modal-hd">
                <div className="modal-title">{editBook ? t.editBook : t.newRecipeBook}</div>
                <button className="btn btn-ic btn-s btn-sm" onClick={() => { setShowBookForm(false); setEditBook(null); }}>×</button>
              </div>
              <div className="modal-body">
                <BookForm initial={editBook} onSave={saveBook} onCancel={() => { setShowBookForm(false); setEditBook(null); }} currentUser={user} t={t} />
              </div>
            </div>
          </div>
        )}

        {showRecipeForm && !isGuest && (
          <div className="backdrop" onClick={async e => { if (e.target === e.currentTarget && await confirmClose() === "exit") { setShowRecipeForm(false); setEditRecipe(null); } }}>
            <div className="modal" style={{ maxWidth: 760 }}>
              <div className="modal-hd">
                <div className="modal-title">{editRecipe ? t.editRecipe : t.addRecipeTitle}</div>
                <button className="btn btn-ic btn-s" style={{ fontSize: "1.4rem", width: 36, height: 36 }} onClick={async () => { if (await confirmClose() === "exit") { setShowRecipeForm(false); setEditRecipe(null); } }}>×</button>
              </div>
              <div className="modal-body">
                <RecipeForm
                  initial={editRecipe ? { ...editRecipe } : (selBook ? { bookIds: [selBook.id] } : {})}
                  onSave={saveRecipe} currentUser={user} books={books} allUsers={users} t={t} saveRef={saveRef} dirtyRef={dirtyRef} />
              </div>
              <div className="modal-ft">
                <button className="btn btn-p" onClick={() => saveRef.current && saveRef.current()}
                  style={{ borderRadius: "50px", padding: ".7rem 1.6rem", boxShadow: "0 4px 12px rgba(44,26,14,.25)", fontSize: "1rem", display: "flex", alignItems: "center", gap: ".4rem" }}>
                  💾 {t.save || "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

        {showImport && (
          <div className="backdrop" onClick={e => e.target === e.currentTarget && (setShowImport(false), setImportStatus(""), setImportJson(""))}>
            <div className="modal" style={{ maxWidth: 500 }}>
              <div className="modal-hd">
                <div className="modal-title">📥 Import Data</div>
                <button className="btn btn-ic btn-s btn-sm" onClick={() => { setShowImport(false); setImportStatus(""); setImportJson(""); }}>×</button>
              </div>
              <div className="modal-body">
                <textarea className="fi" style={{ minHeight: 180, fontSize: ".78rem", fontFamily: "monospace" }}
                  placeholder='{"books":[...],"recipes":[]}'
                  value={importJson} onChange={e => setImportJson(e.target.value)} />
                {importStatus === "running" && <div style={{ color: THEME.brown, fontSize: ".85rem", margin: ".5rem 0" }}>⏳ Importing…</div>}
                {importStatus.startsWith("done") && <div style={{ color: "#1e8449", fontSize: ".85rem", margin: ".5rem 0" }}>🎉 {importStatus.split(":")[1]} items imported!</div>}
                {importStatus.startsWith("error") && <div style={{ color: THEME.rust, fontSize: ".85rem", margin: ".5rem 0" }}>⚠️ {importStatus.split(":")[1]}</div>}
                {importStatus.startsWith("parseerror") && <div style={{ color: THEME.rust, fontSize: ".85rem", margin: ".5rem 0" }}>❌ Invalid JSON</div>}
              </div>
              <div className="modal-ft">
                <button className="btn btn-s" onClick={() => { setShowImport(false); setImportStatus(""); setImportJson(""); }}>Cancel</button>
                <button className="btn btn-p" onClick={handleImport} disabled={!importJson.trim() || importStatus === "running"}>Import</button>
              </div>
            </div>
          </div>
        )}
        {showUnsavedModal && (
          <div className="backdrop" style={{ zIndex: 500 }}>
            <div className="modal" style={{ maxWidth: 360 }}>
              <div className="modal-hd"><div className="modal-title">⚠️ {t.unsavedChanges || "Unsaved changes"}</div></div>
              <div className="modal-body" style={{ padding: "1.2rem 1.5rem", textAlign: "center" }}>
                <p style={{ marginBottom: "1.2rem", color: THEME.darkBrown, fontSize: ".95rem" }}>You have unsaved changes. What would you like to do?</p>
                <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                  <button className="btn btn-p" style={{ justifyContent: "center" }} onClick={() => handleUnsavedChoice("save")}>💾 Save and exit</button>
                  <button className="btn btn-d" style={{ justifyContent: "center" }} onClick={() => handleUnsavedChoice("exit")}>🗑 Exit without saving</button>
                  <button className="btn btn-s" style={{ justifyContent: "center" }} onClick={() => handleUnsavedChoice("cancel")}>↩ Keep editing</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
