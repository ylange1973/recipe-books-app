import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js";

export async function fbGetShareToken(token) {
  try {
    const snap = await getDoc(doc(db, "shareTokens", token));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    console.warn("fbGetShareToken failed:", e.message);
    return null;
  }
}

export async function fbGetRecipeById(recipeId) {
  try {
    const snap = await getDoc(doc(db, "recipes", recipeId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    console.warn("fbGetRecipeById failed:", e.message);
    return null;
  }
}

export async function fbGetTranslationForShare(recipeId, langCode) {
  try {
    const snap = await getDoc(doc(db, "recipes", recipeId, "translations", langCode));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("fbGetTranslationForShare failed:", e.message);
    return null;
  }
}
