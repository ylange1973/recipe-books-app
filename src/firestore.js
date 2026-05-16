import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { uid, now } from "./utils.js";

const booksCol   = () => collection(db, "books");
const recipesCol = () => collection(db, "recipes");
const usersCol   = () => collection(db, "users");
const likesCol   = () => collection(db, "likes");

export async function fbGetUser(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fbSaveUser(userData) {
  await setDoc(doc(db, "users", userData.id), userData, { merge: true });
}

export async function fbGetBooks() {
  const snap = await getDocs(booksCol());
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fbSaveBook(book) {
  await setDoc(doc(db, "books", book.id), book, { merge: true });
}

export async function fbDeleteBook(id) {
  await deleteDoc(doc(db, "books", id));
}

export async function fbGetRecipes() {
  const snap = await getDocs(recipesCol());
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fbTrackRecipeOpen(recipeId, timesOpened) {
  await setDoc(doc(db, "recipes", recipeId), {
    meta: { timesOpened, lastOpened: new Date().toISOString() }
  }, { merge: true });
}

export async function fbSaveRecipe(recipe) {
  await setDoc(doc(db, "recipes", recipe.id), recipe, { merge: true });
}

export async function fbDeleteRecipe(id) {
  await deleteDoc(doc(db, "recipes", id));
}

export async function fbGetAllUsers() {
  const snap = await getDocs(usersCol());
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fbGetLikes() {
  try {
    const snap = await getDocs(likesCol());
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("fbGetLikes failed:", e.message);
    return [];
  }
}

// ── Translations ─────────────────────────────────────────────────────────────

export async function fbGetTranslation(recipeId, langCode) {
  try {
    const snap = await getDoc(doc(db, "recipes", recipeId, "translations", langCode));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("fbGetTranslation failed:", e.message);
    return null;
  }
}

export async function fbSaveTranslation(recipeId, langCode, data) {
  await setDoc(doc(db, "recipes", recipeId, "translations", langCode), { ...data, stale: false, savedAt: new Date().toISOString() });
}

export async function fbDeleteTranslation(recipeId, langCode) {
  try {
    await deleteDoc(doc(db, "recipes", recipeId, "translations", langCode));
  } catch (e) {
    console.warn("fbDeleteTranslation failed:", e.message);
  }
}

export async function fbMarkTranslationsStale(recipeId) {
  const LANGS = ["en", "he", "fr", "es", "it"];
  await Promise.all(LANGS.map(async langCode => {
    try {
      const snap = await getDoc(doc(db, "recipes", recipeId, "translations", langCode));
      if (snap.exists()) {
        await setDoc(doc(db, "recipes", recipeId, "translations", langCode), { ...snap.data(), stale: true }, { merge: true });
      }
    } catch {}
  }));
}

export async function fbToggleLike(recipeId, userId) {
  const snap = await getDocs(likesCol());
  const existing = snap.docs.find(d => d.data().recipeId === recipeId && d.data().userId === userId);
  if (existing) {
    await deleteDoc(doc(db, "likes", existing.id));
    return false;
  } else {
    const likeId = uid();
    await setDoc(doc(db, "likes", likeId), { id: likeId, recipeId, userId, createdAt: now() });
    return true;
  }
}
