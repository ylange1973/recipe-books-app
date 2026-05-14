import { useState, useEffect, useRef } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "./firebase.js";

const THEME = {
  cream:"#F7F0E6", parchment:"#EDE0CC", tan:"#D4B896",
  brown:"#8B6344", darkBrown:"#5C3D1E", espresso:"#2C1A0E",
  sage:"#7A8C6E", rust:"#B85C38", gold:"#C9963A", warm:"#F2E8D9",
};

const LANGUAGES = [
  { code:"en", nativeLabel:"English", rtl:false },
  { code:"he", nativeLabel:"עברית",   rtl:true  },
  { code:"fr", nativeLabel:"Français",rtl:false },
  { code:"es", nativeLabel:"Español", rtl:false },
  { code:"it", nativeLabel:"Italiano",rtl:false },
];

// ── UI string bundles ──────────────────────────────────────────────────────
const T = {
  en:{
    appName:"My Recipe Books", tagline:"Your family's culinary collection",
    signIn:"Sign In", signOut:"Sign out", email:"Email", password:"Password", demoAccounts:"Demo accounts",
    books:"Books", allRecipes:"All Recipes", newBook:"+ New Book", addRecipe:"+ Add Recipe",
    yourBooks:"Your Recipe Books", shelfSub:"A shelf of family culinary collections",
    recipesWord:"recipes", recipeWord:"recipe",
    noBooks:"Start by creating your first recipe book!",
    noRecipes:"No recipes yet. Add the first one!", noMatch:"No recipes match your search.",
    searchPlaceholder:"Search recipes by name…",
    foodTypeLabel:"Food type:", diffLabel:"Difficulty:", bookLabel:"Book:",
    source:"Source", manual:"✍️ Manual", website:"🔗 Website", image:"🖼 Image",
    extractBtn:"Extract ✨", uploadExtract:"📷 Upload image to extract",
    extracting:"Extracting & translating with AI…",
    extractDone:"Draft filled in — review and edit below!",
    extractError:"Could not extract. Please fill in manually.",
    pasteText:"📋 Paste Text", fileImport:"📄 File", pasteTextPh:"Paste the recipe text here — from a website, email, or anywhere…", pasteExtractBtn:"Extract ✨",
    recipeName:"Recipe Name *", recipeNamePh:"e.g. Mum's Lasagne",
    description:"Description", descPh:"A short description…",
    foodType:"Food Type", difficulty:"Difficulty", selectOpt:"— select —",
    customTags:"Custom Tags", tagPh:"Add tag & press Enter…",
    recipeImages:"Recipe Images (first ⭐ = header)",
    ingredients:"Ingredients", qty:"Qty", unit:"Unit", ingName:"Ingredient name",
    addIngredient:"+ Add ingredient", addSection:"÷ Add section",
    steps:"Steps", stepLabel:"Step", stepPh:"Describe this step…",
    stepImage:"Step image (optional)", addStep:"+ Add step", serves:"Serves", servesPlaceholder:"e.g. 4", insertStep:"+ Insert step below",
    notes:"Notes", notesPh:"Tips, variations, family memories…",
    addToBooks:"Add to books", noBooksYet:"No books yet — create one first.",
    editPerms:"Edit permissions (delegate)",
    saveRecipe:"Save Recipe", cancel:"Cancel",
    bookName:"Book Name *", bookNamePh:"e.g. Mum's Recipes",
    bookDesc:"Description", bookDescPh:"What's this collection about?",
    coverImage:"Cover Image", upload:"📁 Upload", camera:"📷 Camera",
    pasteUrl:"…or paste image URL", add:"Add",
    saveBook:"Save Book", editBook:"Edit Book", newRecipeBook:"New Recipe Book",
    editRecipe:"Edit Recipe", addRecipeTitle:"Add Recipe",
    recipesInBook:"Recipes in this book",
    createdBy:"Created by", created:"Created", lastEdited:"Last edited",
    timesOpened:"Times opened", lastOpened:"Last opened",
    edit:"✏️ Edit", del:"🗑 Delete", back:"← Back", backToBooks:"← Books",
    delBookConfirm:"Delete this book? Recipes won't be deleted, just unlinked.",
    delRecipeConfirm:"Delete this recipe permanently?",
    bookUpdated:"Book updated!", bookCreated:"Book created!", bookDeleted:"Book deleted.",
    recipeSaved:"Recipe saved!", recipeAdded:"Recipe added!", recipeDeleted:"Recipe deleted.",
    enterRecipeName:"Please enter a recipe name.", enterBookName:"Please enter a book name.",
    sourceUrl:"Source:", sourcePhoto:"Source: 📷 photo",
    preferredLang:"Language", translating:"Translating…",
    translated:"Translated ✓", transError:"Translation unavailable",
    badgeHint:"Click badge to toggle header / inline", wrongLogin:"Incorrect email or password.",
    FOOD_TYPES:["Breakfast","Lunch","Dinner","Dessert","Snack","Soup","Salad","Bread","Drink","Appetizer","Side dish","Main course"],
    DIFFICULTIES:["Easy","Medium","Hard","Expert"],
  },
  he:{
    appName:"ספרי המתכונים שלי", tagline:"אוסף המטבח המשפחתי",
    signIn:"כניסה", signOut:"יציאה", email:"אימייל", password:"סיסמה", demoAccounts:"חשבונות דמו",
    books:"ספרים", allRecipes:"כל המתכונים", newBook:"+ ספר חדש", addRecipe:"+ הוסף מתכון",
    yourBooks:"ספרי המתכונים שלך", shelfSub:"מדף אוספי הבישול המשפחתיים",
    recipesWord:"מתכונים", recipeWord:"מתכון",
    noBooks:"התחל ביצירת ספר המתכונים הראשון שלך!",
    noRecipes:"אין מתכונים עדיין.", noMatch:"לא נמצאו מתכונים.",
    searchPlaceholder:"חיפוש מתכונים לפי שם…",
    foodTypeLabel:"סוג מנה:", diffLabel:"רמת קושי:", bookLabel:"ספר:",
    source:"מקור", manual:"✍️ ידני", website:"🔗 אתר", image:"🖼 תמונה",
    extractBtn:"חילוץ ✨", uploadExtract:"📷 העלה תמונה לחילוץ",
    extracting:"מחלץ ומתרגם עם AI…",
    extractDone:"הטיוטה מולאה — בדוק וערוך!",
    extractError:"לא ניתן לחלץ. אנא מלא ידנית.",
    pasteText:"📋 הדבק טקסט", fileImport:"📄 קובץ", pasteTextPh:"הדבק כאן את טקסט המתכון…", pasteExtractBtn:"חילוץ ✨",
    recipeName:"שם המתכון *", recipeNamePh:"לדוגמה: לזניה של אמא",
    description:"תיאור", descPh:"תיאור קצר…",
    foodType:"סוג מנה", difficulty:"רמת קושי", selectOpt:"— בחר —",
    customTags:"תגיות", tagPh:"הוסף תגית ולחץ Enter…",
    recipeImages:"תמונות מתכון (ראשונה ⭐ = כותרת)",
    ingredients:"מרכיבים", qty:"כמות", unit:"יחידה", ingName:"שם המרכיב",
    addIngredient:"+ הוסף מרכיב", addSection:"÷ הוסף כותרת",
    steps:"שלבים", stepLabel:"שלב", stepPh:"תאר את השלב…",
    stepImage:"תמונת שלב (אופציונלי)", addStep:"+ הוסף שלב", serves:"מנות", servesPlaceholder:"לדוגמה: 4", insertStep:"+ הוסף שלב אחרי",
    notes:"הערות", notesPh:"טיפים, וריאציות, זיכרונות…",
    addToBooks:"הוסף לספרים", noBooksYet:"אין ספרים — צור אחד תחילה.",
    editPerms:"הרשאות עריכה",
    saveRecipe:"שמור מתכון", cancel:"ביטול",
    bookName:"שם הספר *", bookNamePh:"לדוגמה: המתכונים של אמא",
    bookDesc:"תיאור", bookDescPh:"על מה האוסף הזה?",
    coverImage:"תמונת כריכה", upload:"📁 העלה", camera:"📷 מצלמה",
    pasteUrl:"…או הדבק כתובת תמונה", add:"הוסף",
    saveBook:"שמור ספר", editBook:"ערוך ספר", newRecipeBook:"ספר מתכונים חדש",
    editRecipe:"ערוך מתכון", addRecipeTitle:"הוסף מתכון",
    recipesInBook:"מתכונים בספר זה",
    createdBy:"נוצר על ידי", created:"נוצר", lastEdited:"עריכה אחרונה",
    timesOpened:"פתיחות", lastOpened:"נפתח לאחרונה",
    edit:"✏️ ערוך", del:"🗑 מחק", back:"→ חזרה", backToBooks:"→ ספרים",
    delBookConfirm:"למחוק את הספר?", delRecipeConfirm:"למחוק את המתכון?",
    bookUpdated:"הספר עודכן!", bookCreated:"הספר נוצר!", bookDeleted:"הספר נמחק.",
    recipeSaved:"המתכון נשמר!", recipeAdded:"המתכון נוסף!", recipeDeleted:"המתכון נמחק.",
    enterRecipeName:"אנא הכנס שם מתכון.", enterBookName:"אנא הכנס שם ספר.",
    sourceUrl:"מקור:", sourcePhoto:"מקור: 📷 תמונה",
    preferredLang:"שפה", translating:"מתרגם…",
    translated:"תורגם ✓", transError:"תרגום לא זמין",
    badgeHint:"לחץ על התג למעבר כותרת / אינליין", wrongLogin:"אימייל או סיסמה שגויים.",
    FOOD_TYPES:["ארוחת בוקר","ארוחת צהריים","ארוחת ערב","קינוח","חטיף","מרק","סלט","לחם","שתייה","מנה ראשונה","תוספת","מנה עיקרית"],
    DIFFICULTIES:["קל","בינוני","קשה","מומחה"],
  },
  fr:{
    appName:"Mes Livres de Recettes", tagline:"La collection culinaire de votre famille",
    signIn:"Se connecter", signOut:"Se déconnecter", email:"E-mail", password:"Mot de passe", demoAccounts:"Comptes démo",
    books:"Livres", allRecipes:"Toutes les recettes", newBook:"+ Nouveau livre", addRecipe:"+ Ajouter",
    yourBooks:"Vos livres de recettes", shelfSub:"Une bibliothèque de collections familiales",
    recipesWord:"recettes", recipeWord:"recette",
    noBooks:"Créez votre premier livre de recettes!", noRecipes:"Aucune recette.", noMatch:"Aucun résultat.",
    searchPlaceholder:"Rechercher par nom…",
    foodTypeLabel:"Type:", diffLabel:"Difficulté:", bookLabel:"Livre:",
    source:"Source", manual:"✍️ Manuel", website:"🔗 Site web", image:"🖼 Image",
    extractBtn:"Extraire ✨", uploadExtract:"📷 Télécharger une image",
    extracting:"Extraction & traduction en cours…", extractDone:"Brouillon rempli!", extractError:"Échec de l'extraction.",
    pasteText:"📋 Coller le texte", fileImport:"📄 Fichier", pasteTextPh:"Collez ici le texte de la recette…", pasteExtractBtn:"Extraire ✨",
    recipeName:"Nom *", recipeNamePh:"ex. Lasagnes de Maman",
    description:"Description", descPh:"Une courte description…",
    foodType:"Type", difficulty:"Difficulté", selectOpt:"— sélectionner —",
    customTags:"Tags", tagPh:"Ajouter un tag…",
    recipeImages:"Images (première ⭐ = en-tête)",
    ingredients:"Ingrédients", qty:"Qté", unit:"Unité", ingName:"Ingrédient",
    addIngredient:"+ Ajouter", addSection:"÷ Ajouter section",
    steps:"Étapes", stepLabel:"Étape", stepPh:"Décrivez cette étape…",
    stepImage:"Image (optionnel)", addStep:"+ Ajouter", serves:"Portions", servesPlaceholder:"ex. 4", insertStep:"+ Insérer après",
    notes:"Notes", notesPh:"Conseils, variantes…",
    addToBooks:"Ajouter aux livres", noBooksYet:"Aucun livre — créez-en un d'abord.",
    editPerms:"Permissions de modification",
    saveRecipe:"Sauvegarder", cancel:"Annuler",
    bookName:"Nom *", bookNamePh:"ex. Les recettes de Maman",
    bookDesc:"Description", bookDescPh:"De quoi parle cette collection?",
    coverImage:"Couverture", upload:"📁 Télécharger", camera:"📷 Photo",
    pasteUrl:"…ou coller l'URL", add:"Ajouter",
    saveBook:"Sauvegarder", editBook:"Modifier", newRecipeBook:"Nouveau livre",
    editRecipe:"Modifier", addRecipeTitle:"Ajouter une recette",
    recipesInBook:"Recettes dans ce livre",
    createdBy:"Créé par", created:"Créé", lastEdited:"Modifié",
    timesOpened:"Ouvertures", lastOpened:"Dernière ouverture",
    edit:"✏️ Modifier", del:"🗑 Supprimer", back:"← Retour", backToBooks:"← Livres",
    delBookConfirm:"Supprimer ce livre?", delRecipeConfirm:"Supprimer cette recette?",
    bookUpdated:"Livre mis à jour!", bookCreated:"Livre créé!", bookDeleted:"Livre supprimé.",
    recipeSaved:"Recette sauvegardée!", recipeAdded:"Recette ajoutée!", recipeDeleted:"Recette supprimée.",
    enterRecipeName:"Veuillez saisir un nom.", enterBookName:"Veuillez saisir un nom.",
    sourceUrl:"Source:", sourcePhoto:"Source: 📷 photo",
    preferredLang:"Langue", translating:"Traduction…", translated:"Traduit ✓", transError:"Traduction indisponible",
    badgeHint:"Cliquez pour basculer en-tête / intégré", wrongLogin:"E-mail ou mot de passe incorrect.",
    FOOD_TYPES:["Petit-déjeuner","Déjeuner","Dîner","Dessert","En-cas","Soupe","Salade","Pain","Boisson","Entrée","Accompagnement","Plat principal"],
    DIFFICULTIES:["Facile","Moyen","Difficile","Expert"],
  },
  es:{
    appName:"Mis Libros de Recetas", tagline:"La colección culinaria de tu familia",
    signIn:"Iniciar sesión", signOut:"Cerrar sesión", email:"Correo", password:"Contraseña", demoAccounts:"Cuentas demo",
    books:"Libros", allRecipes:"Todas las recetas", newBook:"+ Nuevo libro", addRecipe:"+ Añadir",
    yourBooks:"Tus libros de recetas", shelfSub:"Una estantería de colecciones culinarias",
    recipesWord:"recetas", recipeWord:"receta",
    noBooks:"¡Crea tu primer libro de recetas!", noRecipes:"Sin recetas aún.", noMatch:"Sin resultados.",
    searchPlaceholder:"Buscar por nombre…",
    foodTypeLabel:"Tipo:", diffLabel:"Dificultad:", bookLabel:"Libro:",
    source:"Fuente", manual:"✍️ Manual", website:"🔗 Sitio web", image:"🖼 Imagen",
    extractBtn:"Extraer ✨", uploadExtract:"📷 Subir imagen",
    extracting:"Extrayendo y traduciendo…", extractDone:"¡Borrador listo!", extractError:"No se pudo extraer.",
    pasteText:"📋 Pegar texto", fileImport:"📄 Archivo", pasteTextPh:"Pega aquí el texto de la receta…", pasteExtractBtn:"Extraer ✨",
    recipeName:"Nombre *", recipeNamePh:"ej. Lasaña de mamá",
    description:"Descripción", descPh:"Una breve descripción…",
    foodType:"Tipo", difficulty:"Dificultad", selectOpt:"— seleccionar —",
    customTags:"Etiquetas", tagPh:"Añadir etiqueta…",
    recipeImages:"Imágenes (primera ⭐ = cabecera)",
    ingredients:"Ingredientes", qty:"Cant.", unit:"Unidad", ingName:"Ingrediente",
    addIngredient:"+ Añadir", addSection:"÷ Añadir sección",
    steps:"Pasos", stepLabel:"Paso", stepPh:"Describe este paso…",
    stepImage:"Imagen (opcional)", addStep:"+ Añadir", serves:"Porciones", servesPlaceholder:"ej. 4", insertStep:"+ Insertar después",
    notes:"Notas", notesPh:"Consejos, variaciones…",
    addToBooks:"Añadir a libros", noBooksYet:"Sin libros — crea uno primero.",
    editPerms:"Permisos de edición",
    saveRecipe:"Guardar", cancel:"Cancelar",
    bookName:"Nombre *", bookNamePh:"ej. Las recetas de mamá",
    bookDesc:"Descripción", bookDescPh:"¿De qué trata esta colección?",
    coverImage:"Portada", upload:"📁 Subir", camera:"📷 Cámara",
    pasteUrl:"…o pega la URL", add:"Añadir",
    saveBook:"Guardar", editBook:"Editar", newRecipeBook:"Nuevo libro",
    editRecipe:"Editar", addRecipeTitle:"Añadir receta",
    recipesInBook:"Recetas en este libro",
    createdBy:"Creado por", created:"Creado", lastEdited:"Editado",
    timesOpened:"Aperturas", lastOpened:"Última apertura",
    edit:"✏️ Editar", del:"🗑 Eliminar", back:"← Volver", backToBooks:"← Libros",
    delBookConfirm:"¿Eliminar este libro?", delRecipeConfirm:"¿Eliminar esta receta?",
    bookUpdated:"¡Libro actualizado!", bookCreated:"¡Libro creado!", bookDeleted:"Libro eliminado.",
    recipeSaved:"¡Receta guardada!", recipeAdded:"¡Receta añadida!", recipeDeleted:"Receta eliminada.",
    enterRecipeName:"Introduce un nombre.", enterBookName:"Introduce un nombre.",
    sourceUrl:"Fuente:", sourcePhoto:"Fuente: 📷 foto",
    preferredLang:"Idioma", translating:"Traduciendo…", translated:"Traducido ✓", transError:"Traducción no disponible",
    badgeHint:"Clic para alternar cabecera / en línea", wrongLogin:"Correo o contraseña incorrectos.",
    FOOD_TYPES:["Desayuno","Almuerzo","Cena","Postre","Aperitivo","Sopa","Ensalada","Pan","Bebida","Entrante","Guarnición","Plato principal"],
    DIFFICULTIES:["Fácil","Medio","Difícil","Experto"],
  },
  it:{
    appName:"I Miei Libri di Ricette", tagline:"La collezione culinaria della tua famiglia",
    signIn:"Accedi", signOut:"Esci", email:"Email", password:"Password", demoAccounts:"Account demo",
    books:"Libri", allRecipes:"Tutte le ricette", newBook:"+ Nuovo libro", addRecipe:"+ Aggiungi",
    yourBooks:"I tuoi libri di ricette", shelfSub:"Una libreria di collezioni culinarie",
    recipesWord:"ricette", recipeWord:"ricetta",
    noBooks:"Crea il tuo primo libro di ricette!", noRecipes:"Nessuna ricetta.", noMatch:"Nessun risultato.",
    searchPlaceholder:"Cerca per nome…",
    foodTypeLabel:"Tipo:", diffLabel:"Difficoltà:", bookLabel:"Libro:",
    source:"Fonte", manual:"✍️ Manuale", website:"🔗 Sito web", image:"🖼 Immagine",
    extractBtn:"Estrai ✨", uploadExtract:"📷 Carica immagine",
    extracting:"Estrazione e traduzione…", extractDone:"Bozza compilata!", extractError:"Estrazione fallita.",
    pasteText:"📋 Incolla testo", fileImport:"📄 File", pasteTextPh:"Incolla qui il testo della ricetta…", pasteExtractBtn:"Estrai ✨",
    recipeName:"Nome *", recipeNamePh:"es. Lasagne della Mamma",
    description:"Descrizione", descPh:"Una breve descrizione…",
    foodType:"Tipo", difficulty:"Difficoltà", selectOpt:"— seleziona —",
    customTags:"Tag", tagPh:"Aggiungi tag…",
    recipeImages:"Immagini (prima ⭐ = intestazione)",
    ingredients:"Ingredienti", qty:"Qtà", unit:"Unità", ingName:"Ingrediente",
    addIngredient:"+ Aggiungi", addSection:"÷ Aggiungi sezione",
    steps:"Passi", stepLabel:"Passo", stepPh:"Descrivi questo passo…",
    stepImage:"Immagine (opzionale)", addStep:"+ Aggiungi", serves:"Porzioni", servesPlaceholder:"es. 4", insertStep:"+ Inserisci dopo",
    notes:"Note", notesPh:"Consigli, variazioni…",
    addToBooks:"Aggiungi ai libri", noBooksYet:"Nessun libro — creane uno prima.",
    editPerms:"Permessi di modifica",
    saveRecipe:"Salva", cancel:"Annulla",
    bookName:"Nome *", bookNamePh:"es. Le ricette della Mamma",
    bookDesc:"Descrizione", bookDescPh:"Di cosa parla?",
    coverImage:"Copertina", upload:"📁 Carica", camera:"📷 Fotocamera",
    pasteUrl:"…o incolla l'URL", add:"Aggiungi",
    saveBook:"Salva", editBook:"Modifica", newRecipeBook:"Nuovo libro",
    editRecipe:"Modifica", addRecipeTitle:"Aggiungi ricetta",
    recipesInBook:"Ricette in questo libro",
    createdBy:"Creato da", created:"Creato", lastEdited:"Modificato",
    timesOpened:"Aperture", lastOpened:"Ultima apertura",
    edit:"✏️ Modifica", del:"🗑 Elimina", back:"← Indietro", backToBooks:"← Libri",
    delBookConfirm:"Eliminare questo libro?", delRecipeConfirm:"Eliminare questa ricetta?",
    bookUpdated:"Libro aggiornato!", bookCreated:"Libro creato!", bookDeleted:"Libro eliminato.",
    recipeSaved:"Ricetta salvata!", recipeAdded:"Ricetta aggiunta!", recipeDeleted:"Ricetta eliminata.",
    enterRecipeName:"Inserisci un nome.", enterBookName:"Inserisci un nome.",
    sourceUrl:"Fonte:", sourcePhoto:"Fonte: 📷 foto",
    preferredLang:"Lingua", translating:"Traduzione…", translated:"Tradotto ✓", transError:"Traduzione non disponibile",
    badgeHint:"Clicca per passare intestazione / inline", wrongLogin:"Email o password errati.",
    FOOD_TYPES:["Colazione","Pranzo","Cena","Dessert","Spuntino","Zuppa","Insalata","Pane","Bevanda","Antipasto","Contorno","Piatto principale"],
    DIFFICULTIES:["Facile","Medio","Difficile","Esperto"],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const uid  = () => Math.random().toString(36).slice(2)+Date.now().toString(36);
const now  = () => new Date().toISOString();

// localStorage used only for translation cache (not user data)
const tcLoad = () => { try { return JSON.parse(localStorage.getItem("rb3_tc")||"{}"); } catch { return {}; } };
const tcSave = v => { try { localStorage.setItem("rb3_tc", JSON.stringify(v)); } catch {} };

// ── Firestore helpers ──────────────────────────────────────────────────────
const booksCol   = () => collection(db, "books");
const recipesCol = () => collection(db, "recipes");
const usersCol   = () => collection(db, "users");

async function fbGetUser(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
async function fbSaveUser(userData) {
  await setDoc(doc(db, "users", userData.id), userData, { merge: true });
}
async function fbGetBooks() {
  const snap = await getDocs(booksCol());
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function fbGetRecipes() {
  const snap = await getDocs(recipesCol());
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function fbSaveBook(book) {
  await setDoc(doc(db, "books", book.id), book, { merge: true });
}
async function fbDeleteBook(id) {
  await deleteDoc(doc(db, "books", id));
}
async function fbSaveRecipe(recipe) {
  await setDoc(doc(db, "recipes", recipe.id), recipe, { merge: true });
}
async function fbDeleteRecipe(id) {
  await deleteDoc(doc(db, "recipes", id));
}
async function fbGetAllUsers() {
  const snap = await getDocs(usersCol());
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Image compression (avoids localStorage quota issues on mobile) ─────────
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function compressImage(dataUrl, maxPx=800, quality=0.72) {
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

// ── AI helpers ─────────────────────────────────────────────────────────────
// ── Gemini proxy call (via Vercel serverless function) ─────────────────────
async function callAI(prompt, imageBase64=null, imageType=null, url=null) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, imageBase64, imageType, url })
  });
  const data = await res.json();
  if (data.error) throw new Error("AI error: " + data.error);
  return data.text || "";
}

function extractJSON(raw) {
  try { return JSON.parse(raw.trim()); } catch {}
  const stripped = raw.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
  try { return JSON.parse(stripped); } catch {}
  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(raw.slice(start, end+1)); } catch {}
  }
  throw new Error("No valid JSON in response: " + raw.slice(0,300));
}

const RECIPE_JSON_SHAPE = `{ "name": string, "description": string, "ingredients": [{"amount": string, "unit": string, "name": string, "type": "ingredient"} or {"type": "section", "title": string}], "steps": [{"text": string}], "foodType": string, "difficulty": string, "notes": string, "serves": number }`;

async function extractFromPastedText(text, langName) {
  const prompt = [
    "You are a recipe extraction assistant.",
    "Extract the recipe from the text below and return ONLY a single valid JSON object, no markdown, no explanation.",
    `Translate ALL text fields into ${langName}.`,
    `JSON shape: ${RECIPE_JSON_SHAPE}`,
    "\n\nRecipe text:\n" + text.slice(0, 8000)
  ].join(" ");
  const raw = await callAI(prompt);
  return extractJSON(raw);
}

async function extractAndTranslate(source, type, targetLang) {
  const langName = LANGUAGES.find(l=>l.code===targetLang)?.nativeLabel||"English";
  const shapeInstr = `Return ONLY a single valid JSON object, no markdown, no explanation. Translate ALL text fields into ${langName}. JSON shape: ${RECIPE_JSON_SHAPE}`;

  if (type === "url") {
    const prompt = `${shapeInstr}\n\nExtract the recipe from the page content below.`;
    const raw = await callAI(prompt, null, null, source);
    return extractJSON(raw);
  }

  // Image: send base64 to Gemini vision
  const b64 = source.split(",")[1];
  const mime = source.split(";")[0].split(":")[1] || "image/jpeg";
  const prompt = `${shapeInstr}\n\nExtract the recipe from this image.`;
  const raw = await callAI(prompt, b64, mime);
  return extractJSON(raw);
}

async function translateRecipe(recipe, targetLang) {
  const langName = LANGUAGES.find(l=>l.code===targetLang)?.nativeLabel||"English";
  // Strip units before sending to AI — we translate them ourselves via UNIT_DISPLAY
  const ingredientsForAI = (recipe.ingredients||[]).map(i=>({...i, unit:""}));
  const payload = { name:recipe.name, description:recipe.description, ingredients:ingredientsForAI, steps:recipe.steps, notes:recipe.notes, foodType:recipe.foodType, difficulty:recipe.difficulty };
  const prompt = `Translate this recipe JSON into ${langName}. Return ONLY valid JSON, same structure, no markdown.\n\n${JSON.stringify(payload)}`;
  console.log("[translateRecipe] calling AI, payload size:", JSON.stringify(payload).length);
  const raw = await callAI(prompt);
  console.log("[translateRecipe] raw response:", raw?.slice(0,200));
  const translated = JSON.parse(raw.replace(/```json|```/g,"").trim());
  // Restore original units (we handle unit display translation separately via UNIT_DISPLAY)
  if(translated.ingredients && recipe.ingredients) {
    translated.ingredients = translated.ingredients.map((ing, i) => ({
      ...ing,
      unit: recipe.ingredients[i]?.unit || ing.unit || ""
    }));
  }
  return translated;
}

// ── CSS ────────────────────────────────────────────────────────────────────
const buildCSS = (rtl) => {
  const d = rtl?"rtl":"ltr";
  const ta = rtl?"right":"left";
  return `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=Source+Sans+3:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:${THEME.cream};color:${THEME.espresso};font-family:'Source Sans 3',sans-serif;direction:${d};}
.app{min-height:100vh;background:${THEME.cream};}
.app::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");pointer-events:none;z-index:0;}
.topbar{background:${THEME.espresso};color:${THEME.parchment};padding:0 1rem;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(44,26,14,.18);overflow:hidden;}
.logo{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:${THEME.gold};display:flex;align-items:center;gap:.4rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex-shrink:1;}
.logo-text{display:none;}
@media(min-width:480px){.logo-text{display:inline;}}
.topbar-right{display:flex;align-items:center;gap:.5rem;flex-shrink:0;}
.topbar-user{font-size:.8rem;color:${THEME.tan};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px;}
.btn{display:inline-flex;align-items:center;gap:.35rem;padding:.45rem 1.1rem;border-radius:4px;border:none;cursor:pointer;font-family:'Source Sans 3',sans-serif;font-size:.88rem;font-weight:500;transition:all .15s;}
.btn-p{background:${THEME.rust};color:#fff;} .btn-p:hover{background:#9e4a2a;}
.btn-s{background:transparent;color:${THEME.brown};border:1.5px solid ${THEME.tan};} .btn-s:hover{background:${THEME.parchment};}
.btn-g{background:transparent;color:${THEME.parchment};border:1px solid rgba(255,255,255,.2);} .btn-g:hover{background:rgba(255,255,255,.08);}
.btn-d{background:#c0392b;color:#fff;} .btn-d:hover{background:#a93226;}
.btn-sm{padding:.3rem .7rem;font-size:.8rem;}
.btn-ic{padding:.4rem;border-radius:50%;aspect-ratio:1;justify-content:center;}
.main{position:relative;z-index:1;}
/* Login */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 30% 40%,${THEME.parchment},${THEME.cream} 60%);}
.login-card{background:#fff;border-radius:12px;padding:3rem 2.5rem;width:360px;box-shadow:0 8px 40px rgba(44,26,14,.12);border:1px solid ${THEME.parchment};}
.login-title{font-family:'Playfair Display',serif;font-size:2rem;color:${THEME.espresso};text-align:center;margin-bottom:.3rem;}
.login-sub{text-align:center;color:${THEME.brown};font-size:.9rem;margin-bottom:2rem;font-family:'Lora',serif;font-style:italic;}
/* Fields */
.field{margin-bottom:1.1rem;}
.field label{display:block;font-size:.82rem;font-weight:500;color:${THEME.darkBrown};margin-bottom:.3rem;text-transform:uppercase;letter-spacing:.05em;}
.fi{width:100%;padding:.6rem .85rem;border:1.5px solid ${THEME.tan};border-radius:6px;font-family:'Source Sans 3',sans-serif;font-size:.95rem;background:${THEME.warm};color:${THEME.espresso};transition:border .15s;outline:none;direction:${d};text-align:${ta};}
.fi:focus{border-color:${THEME.brown};background:#fff;}
textarea.fi{resize:vertical;min-height:80px;}
/* Nav */
.nav-tabs{display:flex;border-bottom:2px solid ${THEME.parchment};background:#fff;padding:0 2rem;}
.nav-tab{padding:.9rem 1.4rem;cursor:pointer;font-size:.9rem;font-weight:500;color:${THEME.brown};border-bottom:2.5px solid transparent;margin-bottom:-2px;transition:all .15s;display:flex;align-items:center;gap:.4rem;}
.nav-tab:hover{color:${THEME.rust};} .nav-tab.act{color:${THEME.rust};border-bottom-color:${THEME.rust};}
/* Page */
.page{padding:2rem;max-width:1200px;margin:0 auto;}
.ph{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;}
.pt{font-family:'Playfair Display',serif;font-size:2rem;color:${THEME.espresso};}
.ps{font-family:'Lora',serif;font-style:italic;color:${THEME.brown};margin-top:.2rem;font-size:.95rem;}
/* Search */
.search-bar{display:flex;align-items:center;gap:.5rem;background:#fff;border:1.5px solid ${THEME.tan};border-radius:8px;padding:.5rem 1rem;margin-bottom:1rem;}
.search-bar input{border:none;background:transparent;outline:none;flex:1;font-size:.95rem;color:${THEME.espresso};font-family:'Source Sans 3',sans-serif;direction:${d};text-align:${ta};}
/* Filters */
.filter-bar{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.5rem;align-items:center;}
.chip{padding:.3rem .8rem;border-radius:20px;border:1.5px solid ${THEME.tan};font-size:.8rem;cursor:pointer;background:#fff;color:${THEME.brown};transition:all .15s;}
.chip:hover{border-color:${THEME.brown};} .chip.act{background:${THEME.brown};color:#fff;border-color:${THEME.brown};}
.fl{font-size:.8rem;color:${THEME.brown};font-weight:500;}
/* Cards */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.4rem;}
.card{background:#fff;border-radius:10px;border:1px solid ${THEME.parchment};overflow:hidden;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 2px 8px rgba(44,26,14,.07);}
.card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(44,26,14,.13);}
.card-cover{height:130px;background:${THEME.parchment};display:flex;align-items:center;justify-content:center;overflow:hidden;}
.card-cover img,.card-rimg img{width:100%;height:100%;object-fit:cover;}
.card-body{padding:1rem 1.1rem;}
.card-name{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:600;color:${THEME.espresso};margin-bottom:.3rem;word-break:break-word;overflow-wrap:break-word;}
.card-desc{font-size:.82rem;color:${THEME.brown};font-family:'Lora',serif;font-style:italic;line-height:1.4;}
.card-meta{display:flex;justify-content:space-between;align-items:center;margin-top:.8rem;padding-top:.7rem;border-top:1px solid ${THEME.parchment};}
.card-count{font-size:.78rem;color:${THEME.tan};}
.card-creator{font-size:.78rem;color:${THEME.sage};}
.card-rimg{height:160px;background:${THEME.parchment};display:flex;align-items:center;justify-content:center;overflow:hidden;}
.card-rtags{display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.5rem;}
.tag{padding:.15rem .55rem;border-radius:12px;font-size:.72rem;font-weight:500;}
.tag-t{background:${THEME.parchment};color:${THEME.darkBrown};}
.tag-d{background:#fef3e2;color:#9a6600;}
.tag-c{background:#e8f0e4;color:#4a6741;}
/* Add card */
.add-card{border:2px dashed ${THEME.tan};border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;cursor:pointer;min-height:180px;color:${THEME.tan};transition:all .15s;background:transparent;}
.add-card:hover{border-color:${THEME.brown};color:${THEME.brown};background:rgba(212,184,150,.07);}
/* Modal */
.backdrop{position:fixed;inset:0;background:rgba(44,26,14,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;}
.modal{background:${THEME.cream};border-radius:12px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(44,26,14,.25);border:1px solid ${THEME.parchment};direction:${d};}
.modal-hd{padding:1.5rem 2rem 1rem;border-bottom:1px solid ${THEME.parchment};display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:${THEME.cream};z-index:1;}
.modal-title{font-family:'Playfair Display',serif;font-size:1.4rem;color:${THEME.espresso};}
.modal-body{padding:1.5rem 2rem;}
.modal-ft{padding:1rem 2rem 1.5rem;display:flex;justify-content:flex-end;gap:.7rem;border-top:1px solid ${THEME.parchment};}
/* Recipe detail */
.rdetail{max-width:780px;margin:0 auto;padding:2rem;}
.rhero{width:100%;max-height:340px;object-fit:cover;border-radius:10px;margin-bottom:1.5rem;}
.rtitle{font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:700;color:${THEME.espresso};line-height:1.2;margin-bottom:.6rem;word-break:break-word;overflow-wrap:break-word;}
.rdesc{font-family:'Lora',serif;font-style:italic;color:${THEME.brown};font-size:1.05rem;line-height:1.6;margin-bottom:1rem;}
.rmeta-row{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem;}
.rsource{font-size:.82rem;color:${THEME.tan};font-style:italic;}
.rsec{margin-bottom:2rem;}
.rsec-title{font-family:'Playfair Display',serif;font-size:1.2rem;color:${THEME.darkBrown};margin-bottom:1rem;padding-bottom:.4rem;border-bottom:1.5px solid ${THEME.parchment};}
.ing-list{list-style:none;}
.ing-item{padding:.45rem 0;border-bottom:1px dotted ${THEME.parchment};font-size:.95rem;display:grid;grid-template-columns:3.5rem 4rem 1fr;gap:.3rem .8rem;align-items:baseline;}
.ing-qty{font-weight:500;color:${THEME.darkBrown};}
.ing-unit{color:${THEME.brown};font-size:.88rem;}
.ing-name{}
.step-list{list-style:none;}
.step-item{padding:1rem 0;border-bottom:1px solid ${THEME.parchment};display:flex;gap:1rem;}
.step-num{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;color:${THEME.tan};min-width:32px;line-height:1;margin-top:2px;}
.step-con{flex:1;}
.step-txt{font-size:.95rem;line-height:1.6;}
.step-img{width:100%;max-height:220px;object-fit:cover;border-radius:8px;margin-top:.7rem;}
.notes-box{background:#fffbf3;border-left:3px solid ${THEME.gold};padding:1rem 1.2rem;border-radius:0 8px 8px 0;font-family:'Lora',serif;font-style:italic;color:${THEME.darkBrown};font-size:.95rem;line-height:1.6;}
.stat-row{display:flex;gap:1.5rem;flex-wrap:wrap;padding:.8rem 1rem;background:${THEME.warm};border-radius:8px;margin-bottom:1.5rem;}
.stat{font-size:.8rem;color:${THEME.brown};}
.stat strong{display:block;font-size:.72rem;color:${THEME.tan};text-transform:uppercase;letter-spacing:.05em;}
/* Permissions */
.perm-row{display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid ${THEME.parchment};font-size:.88rem;}
/* Image input */
.img-row{display:flex;gap:.5rem;margin-bottom:.5rem;flex-wrap:wrap;}
.img-previews{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem;}
.img-prev{position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1.5px solid ${THEME.tan};}
.img-prev img{width:100%;height:100%;object-fit:cover;}
.img-rm{position:absolute;top:2px;right:2px;background:rgba(44,26,14,.7);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.img-role{position:absolute;bottom:0;left:0;right:0;font-size:8px;background:rgba(44,26,14,.6);color:#fff;text-align:center;padding:1px;cursor:pointer;}
/* List editor */
.le{display:flex;flex-direction:column;gap:.5rem;}
.le-row{display:flex;gap:.4rem;align-items:center;}
.le-row input{flex:1;padding:.45rem .7rem;border:1.5px solid ${THEME.tan};border-radius:5px;font-size:.88rem;font-family:'Source Sans 3',sans-serif;background:#fff;outline:none;direction:${d};text-align:${ta};}
.le-row input:focus{border-color:${THEME.brown};}
.le-add{background:transparent;border:1.5px dashed ${THEME.tan};color:${THEME.brown};padding:.4rem .8rem;border-radius:5px;cursor:pointer;font-size:.82rem;font-family:'Source Sans 3',sans-serif;}
.le-add:hover{border-color:${THEME.brown};}
/* Source tabs */
.src-tabs{display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-bottom:1rem;}
.src-tab{padding:.5rem .3rem;text-align:center;cursor:pointer;font-size:.8rem;font-family:'Source Sans 3',sans-serif;background:#fff;color:${THEME.brown};border:1.5px solid ${THEME.tan};border-radius:6px;transition:all .15s;}
.src-tab:hover{background:${THEME.parchment};}
.src-tab.act{background:${THEME.brown};color:#fff;border-color:${THEME.brown};}
/* AI status */
.ai-st{background:${THEME.warm};border:1px solid ${THEME.tan};border-radius:6px;padding:.7rem 1rem;font-size:.85rem;color:${THEME.darkBrown};margin-bottom:1rem;display:flex;align-items:center;gap:.5rem;}
.spinner{width:18px;height:18px;border:2.5px solid ${THEME.tan};border-top-color:${THEME.rust};border-radius:50%;animation:spin .7s linear infinite;display:inline-block;}
@keyframes spin{to{transform:rotate(360deg);}}
/* Book detail */
.bk-hd{background:#fff;border-bottom:1px solid ${THEME.parchment};padding:1.5rem 2rem;display:flex;align-items:flex-start;gap:1.5rem;}
.bk-cover{width:100px;height:100px;border-radius:8px;border:2px solid ${THEME.parchment};flex-shrink:0;background:${THEME.parchment};display:flex;align-items:center;justify-content:center;font-size:2.5rem;overflow:hidden;}
.bk-cover img{width:100%;height:100%;object-fit:cover;}
.bk-name{font-family:'Playfair Display',serif;font-size:1.8rem;color:${THEME.espresso};}
.bk-desc{font-family:'Lora',serif;font-style:italic;color:${THEME.brown};font-size:.95rem;margin-top:.3rem;}
.bk-meta{font-size:.8rem;color:${THEME.tan};margin-top:.5rem;}
/* Misc */
.back-btn{display:inline-flex;align-items:center;gap:.4rem;color:${THEME.brown};background:none;border:none;cursor:pointer;font-size:.88rem;font-family:'Source Sans 3',sans-serif;padding:.3rem 0;margin-bottom:1rem;}
.back-btn:hover{color:${THEME.rust};}
.empty{text-align:center;padding:4rem 2rem;color:${THEME.tan};}
.empty-icon{font-size:3rem;margin-bottom:.8rem;}
.empty-txt{font-family:'Lora',serif;font-style:italic;}
.act-row{display:flex;gap:.5rem;}
.divider{height:1px;background:${THEME.parchment};margin:1.2rem 0;}
.bk-cbs{display:flex;flex-direction:column;gap:.4rem;max-height:150px;overflow-y:auto;padding:.3rem 0;}
.bk-cb{display:flex;align-items:center;gap:.5rem;font-size:.88rem;cursor:pointer;}
.sl{font-size:.78rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:${THEME.tan};margin-bottom:.5rem;}
/* Tag input */
.tag-wrap{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center;border:1.5px solid ${THEME.tan};border-radius:6px;padding:.4rem .6rem;background:#fff;cursor:text;}
.tag-wrap input{border:none;outline:none;font-size:.88rem;font-family:'Source Sans 3',sans-serif;min-width:80px;flex:1;background:transparent;direction:${d};text-align:${ta};}
.tpill{display:inline-flex;align-items:center;gap:.3rem;padding:.15rem .5rem;background:${THEME.parchment};border-radius:12px;font-size:.78rem;color:${THEME.darkBrown};}
.tpill button{background:none;border:none;cursor:pointer;color:${THEME.brown};font-size:.8rem;padding:0;}
/* Step editor */
.step-ed{background:#fff;border:1.5px solid ${THEME.parchment};border-radius:8px;padding:.8rem;margin-bottom:.5rem;}
.step-ed-n{font-family:'Playfair Display',serif;font-size:1.1rem;color:${THEME.tan};font-weight:700;margin-bottom:.4rem;}
/* Toast */
.toast{position:fixed;bottom:2rem;right:2rem;background:${THEME.espresso};color:${THEME.parchment};padding:.7rem 1.2rem;border-radius:8px;font-size:.88rem;z-index:500;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:ti .2s ease;}
@keyframes ti{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
/* Translation banner */
.trans-banner{display:flex;align-items:center;gap:.7rem;background:${THEME.warm};border:1px solid ${THEME.tan};border-radius:8px;padding:.6rem 1rem;margin-bottom:1.2rem;font-size:.85rem;color:${THEME.darkBrown};}
/* Lang select */
.lang-sel{padding:.3rem .6rem;border:1.5px solid rgba(255,255,255,.2);border-radius:6px;font-size:.82rem;font-family:'Source Sans 3',sans-serif;background:rgba(255,255,255,.1);color:${THEME.parchment};outline:none;cursor:pointer;}
.lang-sel option{background:${THEME.espresso};color:${THEME.parchment};}
`;
};

// ── Small components ───────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,2500); return ()=>clearTimeout(t); },[]);
  return <div className="toast">{msg}</div>;
}

function TagInput({ value=[], onChange, placeholder="" }) {
  const [inp,setInp]=useState("");
  const add=()=>{ const v=inp.trim(); if(v&&!value.includes(v)) onChange([...value,v]); setInp(""); };
  return (
    <div className="tag-wrap" onClick={e=>e.currentTarget.querySelector("input").focus()}>
      {value.map(t=>(
        <span key={t} className="tpill">{t}
          <button type="button" onClick={()=>onChange(value.filter(x=>x!==t))}>×</button>
        </span>
      ))}
      <input value={inp} onChange={e=>setInp(e.target.value)}
        onKeyDown={e=>{ if(e.key==="Enter"||e.key===","){ e.preventDefault(); add(); } }}
        onBlur={add} placeholder={value.length===0?placeholder:""}/>
    </div>
  );
}

function ImageInput({ images=[], onChange, maxImages=10, label="" }) {
  const [uploading,setUploading]=useState(false);
  const fileRef=useRef();
  const camRef=useRef();

  const addImg=(src,role="inline")=>{ if(images.length>=maxImages)return; onChange([...images,{id:uid(),src,role}]); };

  const handleFiles=async(e)=>{
    const files=Array.from(e.target.files);
    if(!files.length)return;
    setUploading(true);
    for(const f of files){
      const compressed=await compressImage(await readFileAsDataURL(f));
      addImg(compressed, images.length===0?"header":"inline");
    }
    setUploading(false);
    e.target.value="";
  };

  return (
    <div>
      {label&&<div className="sl">{label}</div>}
      <div style={{display:"flex",gap:".5rem",marginBottom:".5rem",flexWrap:"wrap"}}>
        <button type="button" className="btn btn-s btn-sm" onClick={()=>fileRef.current.click()}>
          📁 Upload
        </button>
        <button type="button" className="btn btn-s btn-sm" onClick={()=>camRef.current.click()}>
          📷 Camera
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles}/>
        <input ref={camRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFiles}/>
      </div>
      {uploading&&<div style={{fontSize:".8rem",color:THEME.brown,marginBottom:".4rem"}}>⏳ Processing image…</div>}

      {images.length>0&&(
        <div className="img-previews">
          {images.map(img=>(
            <div key={img.id} className="img-prev">
              <img src={img.src} alt=""/>
              <button className="img-rm" onClick={()=>onChange(images.filter(i=>i.id!==img.id))}>×</button>
              <div className="img-role" onClick={()=>onChange(images.map(i=>i.id===img.id?{...i,role:i.role==="header"?"inline":"header"}:i))}>
                {img.role==="header"?"⭐ hdr":"inline"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── Recipe Form ────────────────────────────────────────────────────────────
function RecipeForm({ initial, onSave, currentUser, books, allUsers, t, saveRef }) {
  const [name,setName]=useState(initial?.name||"");
  const [desc,setDesc]=useState(initial?.description||"");
  const [foodType,setFoodType]=useState(initial?.foodType||"");
  const [diff,setDiff]=useState(initial?.difficulty||"");
  const [tags,setTags]=useState(initial?.customTags||[]);
  const [ings,setIngs]=useState(initial?.ingredients||[{id:uid(),amount:"",unit:"",name:""}]);
  const [steps,setSteps]=useState(initial?.steps||[{id:uid(),text:"",images:[]}]);
  const [notes,setNotes]=useState(initial?.notes||"");
  const [serves,setServes]=useState(initial?.serves||"");
  const [images,setImages]=useState(initial?.images||[]);
  const [bookIds,setBookIds]=useState(initial?.bookIds||[]);
  const [srcType,setSrcType]=useState(initial?.source?.type||"manual");
  const [srcUrl,setSrcUrl]=useState(initial?.source?.url||"");
  const [pastedText,setPastedText]=useState("");
  const [perms,setPerms]=useState(initial?.editPerms||[]);
  const [aiSt,setAiSt]=useState("");
  const [aiErr,setAiErr]=useState("");
  const [fileInfo,setFileInfo]=useState(null);
  const [extImgSrc,setExtImgSrc]=useState(null);
  const extRef=useRef();

  const applyExtracted=r=>{
    if(r.name)setName(r.name); if(r.description)setDesc(r.description);
    if(r.foodType)setFoodType(r.foodType); if(r.difficulty)setDiff(r.difficulty);
    if(r.notes)setNotes(r.notes);
    if(r.serves)setServes(String(r.serves));
    if(r.ingredients?.length)setIngs(r.ingredients.map(i=>({
      id:uid(),
      ...(i.type==="section" ? {type:"section",title:i.title||i.name||""} : {type:"ingredient",amount:i.amount||"",unit:i.unit||"",name:i.name||""})
    })));
    if(r.steps?.length)setSteps(r.steps.map(s=>({id:uid(),text:typeof s==="string"?s:s.text||"",images:[]})));
  };

  const handleExtractUrl=async()=>{
    if(!srcUrl.trim())return; setAiSt("extracting"); setAiErr("");
    try{ applyExtracted(await extractAndTranslate(srcUrl,"url",currentUser.lang||"en")); setAiSt("done"); }
    catch(e){ console.error("[URL extract error]", e); setAiSt("error"); setAiErr(String(e?.message||e)); }
  };
  const handleExtractPaste=async()=>{
    if(!pastedText.trim())return; setAiSt("extracting"); setAiErr("");
    try{
      const langName = (currentUser.lang||"en") === "en" ? "English" : LANGUAGES.find(l=>l.code===(currentUser.lang||"en"))?.nativeLabel||"English";
      applyExtracted(await extractFromPastedText(pastedText, langName));
      setAiSt("done");
    }
    catch(e){ console.error("[paste extract error]", e); setAiSt("error"); setAiErr(String(e?.message||e)); }
  };
  const fileRef2=useRef();
  const handleFileSelect=e=>{
    const f=e.target.files[0]; if(!f)return;
    if(f.size > 3 * 1024 * 1024){
      setAiErr("File is too large (max 3MB). Try a smaller file or use the Paste Text option.");
      setAiSt("error");
      return;
    }
    setFileInfo({name:f.name, type:f.type, file:f});
    setAiSt(""); setAiErr("");
    e.target.value="";
  };
  const handleExtractFile=async()=>{
    if(!fileInfo)return; setAiSt("extracting"); setAiErr("");
    try{
      const langName = (currentUser.lang||"en") === "en" ? "English" : LANGUAGES.find(l=>l.code===(currentUser.lang||"en"))?.nativeLabel||"English";
      // For images, use existing image extraction
      if(fileInfo.type.startsWith("image/")){
        const compressed=await compressImage(await readFileAsDataURL(fileInfo.file));
        applyExtracted(await extractAndTranslate(compressed,"image",currentUser.lang||"en"));
      } else {
        // For PDF/Word, send to server for text extraction
        const b64=await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=ev=>res(ev.target.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(fileInfo.file); });
        const langShape=RECIPE_JSON_SHAPE;
        const prompt=`Extract the recipe from this file and return JSON translated into ${langName}. ${langShape}`;
        const apiRes=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,fileBase64:b64,fileType:fileInfo.type})});
        const data=await apiRes.json();
        if(data.error) throw new Error(data.error);
        applyExtracted(extractJSON(data.text));
      }
      setAiSt("done");
    }
    catch(e){ console.error("[file extract error]", e); setAiSt("error"); setAiErr(String(e?.message||e)); }
  };
  const handleExtractImg=e=>{
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader(); r.onload=async ev=>{
      const compressed=await compressImage(ev.target.result, 1200, 0.8);
      setExtImgSrc(compressed); setAiSt("extracting");
      try{ applyExtracted(await extractAndTranslate(compressed,"image",currentUser.lang||"en")); setAiSt("done"); }
      catch(err){ console.error(err); setAiSt("error"); }
    }; r.readAsDataURL(f); e.target.value="";
  };

  const addIng=()=>setIngs([...ings,{id:uid(),amount:"",unit:"",name:""}]);
  const upIng=(id,f,v)=>setIngs(ings.map(i=>i.id===id?{...i,[f]:v}:i));
  const rmIng=id=>setIngs(ings.filter(i=>i.id!==id));
  const insertSectionAbove=id=>{
    const idx=ings.findIndex(i=>i.id===id);
    if(idx===-1)return;
    const sec={id:uid(),type:"section",title:""};
    const next=[...ings]; next.splice(idx,0,sec); setIngs(next);
  };
  const addStep=()=>setSteps([...steps,{id:uid(),text:"",images:[]}]);
  const insertStepAfter=id=>{
    const idx=steps.findIndex(s=>s.id===id);
    if(idx===-1)return;
    const newStep={id:uid(),text:"",images:[]};
    const next=[...steps];
    next.splice(idx+1,0,newStep);
    setSteps(next);
  };
  const upStep=(id,f,v)=>setSteps(steps.map(s=>s.id===id?{...s,[f]:v}:s));
  const rmStep=id=>setSteps(steps.filter(s=>s.id!==id));
  const togBook=bid=>setBookIds(bookIds.includes(bid)?bookIds.filter(b=>b!==bid):[...bookIds,bid]);
  const togPerm=uid2=>setPerms(perms.includes(uid2)?perms.filter(u=>u!==uid2):[...perms,uid2]);

  const handleSave=()=>{
    if(!name.trim()){ alert(t.enterRecipeName); return; }
    onSave({
      id:initial?.id||uid(), name, description:desc, foodType, difficulty:diff, customTags:tags,
      ingredients:ings.filter(i=>i.type==="section" ? i.title.trim() : i.name.trim()), steps:steps.filter(s=>s.text.trim()),
      notes, serves, images, bookIds,
      source:{ type:srcType, url:srcType==="url"?srcUrl:"", imageThumb:extImgSrc||"" },
      ownerId:initial?.ownerId||currentUser.id,
      originalLang:currentUser.lang||"en",
      editPerms:perms,
      meta:{ createdAt:initial?.meta?.createdAt||now(), lastEdited:now(), timesOpened:initial?.meta?.timesOpened||0, lastOpened:initial?.meta?.lastOpened||null }
    });
  };
  useEffect(()=>{ if(saveRef) saveRef.current=handleSave; });

  const others=allUsers.filter(u=>u.id!==currentUser.id && u.email!=="guest@myrecipebooks.com");
  return (
    <div>
      <div className="field">
        <label>{t.source}</label>
        <div className="src-tabs">
          {["manual","url","paste","file"].map(tp=>(
            <button key={tp} type="button" className={`src-tab${srcType===tp?" act":""}`} onClick={()=>setSrcType(tp)}>
              {tp==="manual"?t.manual:tp==="url"?t.website:tp==="paste"?t.pasteText:t.fileImport}
            </button>
          ))}
        </div>
        {srcType==="url"&&(
          <div style={{display:"flex",gap:".4rem"}}>
            <input className="fi" style={{fontSize:".88rem"}} type="url" placeholder="https://…" value={srcUrl} onChange={e=>setSrcUrl(e.target.value)}/>
            <button type="button" className="btn btn-s btn-sm" onClick={handleExtractUrl}>{t.extractBtn}</button>
          </div>
        )}
        {srcType==="paste"&&(
          <div>
            <textarea className="fi" style={{minHeight:140,fontSize:".85rem",marginBottom:".5rem"}}
              placeholder={t.pasteTextPh}
              value={pastedText} onChange={e=>setPastedText(e.target.value)}/>
            <button type="button" className="btn btn-p btn-sm" onClick={handleExtractPaste}
              disabled={!pastedText.trim()}>
              {t.pasteExtractBtn}
            </button>
          </div>
        )}

        {srcType==="file"&&(
          <div>
            <div style={{fontSize:".82rem",color:THEME.brown,marginBottom:".5rem"}}>
              Upload a PDF, Word (.docx) or image file containing a recipe.
            </div>
            <div style={{display:"flex",gap:".5rem",alignItems:"center",flexWrap:"wrap",marginBottom:".5rem"}}>
              <div className="btn btn-s btn-sm" style={{position:"relative",overflow:"hidden"}}>
                📄 Choose file
                <input type="file" accept=".pdf,.docx,image/*"
                  style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%",fontSize:0}}
                  onChange={handleFileSelect}/>
              </div>
              {fileInfo&&<span style={{fontSize:".82rem",color:THEME.brown}}>📄 {fileInfo.name}</span>}
            </div>
            {fileInfo&&(
              <button type="button" className="btn btn-p btn-sm" onClick={handleExtractFile}>
                Extract ✨
              </button>
            )}
          </div>
        )}

        {aiSt==="extracting"&&<div className="ai-st"><span className="spinner"/>{t.extracting}</div>}
        {aiSt==="done"&&<div className="ai-st">✅ {t.extractDone}</div>}
        {aiSt==="error"&&<div className="ai-st" style={{flexDirection:"column",alignItems:"flex-start",gap:".2rem"}}>
          <span>⚠️ {t.extractError}</span>
          {aiErr&&<span style={{fontSize:".75rem",color:THEME.brown,fontFamily:"monospace",wordBreak:"break-all"}}>{aiErr}</span>}
        </div>}
      </div>
      <div className="divider"/>
      <div className="field"><label>{t.recipeName}</label><input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder={t.recipeNamePh}/></div>
      <div className="field"><label>{t.description}</label><textarea className="fi" value={desc} onChange={e=>setDesc(e.target.value)} placeholder={t.descPh}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".8rem"}}>
        <div className="field">
          <label>{t.foodType}</label>
          <select className="fi" value={foodType} onChange={e=>setFoodType(e.target.value)}>
            <option value="">{t.selectOpt}</option>
            {t.FOOD_TYPES.map(f=><option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="field">
          <label>{t.difficulty}</label>
          <select className="fi" value={diff} onChange={e=>setDiff(e.target.value)}>
            <option value="">{t.selectOpt}</option>
            {t.DIFFICULTIES.map(d=><option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="field" style={{display:"flex",alignItems:"center",gap:"1rem"}}><label style={{minWidth:"fit-content"}}>{t.serves}</label><input className="fi" type="number" min="1" max="100" value={serves} onChange={e=>setServes(e.target.value)} placeholder={t.servesPlaceholder} style={{maxWidth:100}}/></div>
      <div className="field"><label>{t.customTags}</label><TagInput value={tags} onChange={setTags} placeholder={t.tagPh}/></div>
      <div className="divider"/>
      <div className="field"><ImageInput images={images} onChange={setImages} label={t.recipeImages}/></div>
      <div className="divider"/>
      <div className="field">
        <label>{t.ingredients}</label>
        <div className="le">
          {ings.map(i=>(
            i.type==="section" ? (
              <div key={i.id} className="le-row" style={{alignItems:"center"}}>
                <input placeholder="Section name…" value={i.title} onChange={e=>upIng(i.id,"title",e.target.value)}
                  style={{flex:1,fontWeight:600,fontSize:".88rem",fontStyle:"italic",color:THEME.brown,borderBottom:`2px solid ${THEME.tan}`,border:"none",borderBottom:`1.5px solid ${THEME.tan}`,outline:"none",background:"transparent",padding:".3rem 0"}}/>
                <button type="button" className="btn btn-ic btn-s btn-sm" onClick={()=>rmIng(i.id)}>×</button>
              </div>
            ) : (
              <div key={i.id} className="le-row">
                <button type="button" title={t.addSection}
                  style={{background:"none",border:"none",cursor:"pointer",color:THEME.brown,fontSize:".95rem",padding:"0 .3rem",flexShrink:0,opacity:0.6}}
                  onClick={()=>insertSectionAbove(i.id)}>÷</button>
                <input style={{maxWidth:65}} placeholder={t.qty} value={i.amount} onChange={e=>upIng(i.id,"amount",e.target.value)}/>
                <input style={{maxWidth:55}} placeholder={t.unit} value={i.unit} onChange={e=>upIng(i.id,"unit",e.target.value)}/>
                <input placeholder={t.ingName} value={i.name} onChange={e=>upIng(i.id,"name",e.target.value)}/>
                <button type="button" className="btn btn-ic btn-s btn-sm" onClick={()=>rmIng(i.id)}>×</button>
              </div>
            )
          ))}
          <div style={{display:"flex",gap:".4rem"}}>
            <button type="button" className="le-add" onClick={addIng}>{t.addIngredient}</button>
          </div>
        </div>
      </div>
      <div className="divider"/>
      <div className="field">
        <label>{t.steps}</label>
        {steps.map((step,idx)=>(
          <div key={step.id||idx} className="step-ed">
            <div className="step-ed-n">{t.stepLabel} {idx+1}</div>
            <textarea style={{width:"100%",border:"none",outline:"none",fontSize:".9rem",fontFamily:"'Source Sans 3',sans-serif",resize:"vertical",minHeight:60,background:"transparent"}}
              placeholder={t.stepPh} value={step.text} onChange={e=>upStep(step.id,"text",e.target.value)}/>
            <div style={{marginTop:".4rem"}}><ImageInput images={step.images||[]} onChange={imgs=>upStep(step.id,"images",imgs)} maxImages={3} label={t.stepImage}/></div>
            <div style={{display:"flex",gap:".4rem",marginTop:".4rem"}}>
              <button type="button" className="btn btn-s btn-sm" onClick={()=>insertStepAfter(step.id)}>{t.insertStep}</button>
              {steps.length>1&&<button type="button" className="btn btn-d btn-sm" onClick={()=>rmStep(step.id)}>−</button>}
            </div>
          </div>
        ))}
        <button type="button" className="le-add" onClick={addStep}>{t.addStep}</button>
      </div>
      <div className="divider"/>
      <div className="field"><label>{t.notes}</label><textarea className="fi" value={notes} onChange={e=>setNotes(e.target.value)} placeholder={t.notesPh} style={{minHeight:90}}/></div>
      <div className="divider"/>
      <div className="field">
        <label>{t.addToBooks}</label>
        <div className="bk-cbs">
          {books.length===0&&<div style={{fontSize:".82rem",color:THEME.tan}}>{t.noBooksYet}</div>}
          {books.map(b=>(
            <label key={b.id} className="bk-cb">
              <input type="checkbox" style={{accentColor:THEME.rust}} checked={bookIds.includes(b.id)} onChange={()=>togBook(b.id)}/>{b.name}
            </label>
          ))}
        </div>
      </div>
      {others.length>0&&(
        <div className="field">
          <label>{t.editPerms}</label>
          {others.map(u=>(
            <div key={u.id} className="perm-row">
              <span>{u.name}</span>
              <input type="checkbox" style={{accentColor:THEME.rust,width:16,height:16,cursor:"pointer"}} checked={perms.includes(u.id)} onChange={()=>togPerm(u.id)}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Book Image Picker ─────────────────────────────────────────────────────
function BookImagePicker({ cover, setCover, t }) {
  const [uploading,setUploading]=useState(false);
  const fileRef=useRef();
  const camRef=useRef();

  const handleFile=async(e)=>{
    const f=e.target.files[0]; if(!f)return;
    setUploading(true);
    const compressed=await compressImage(await readFileAsDataURL(f));
    setCover(compressed);
    setUploading(false);
    e.target.value="";
  };

  return (
    <div>
      <div style={{display:"flex",gap:".5rem",marginBottom:".5rem",flexWrap:"wrap"}}>
        <button type="button" className="btn btn-s btn-sm" onClick={()=>fileRef.current.click()}>📁 Upload</button>
        <button type="button" className="btn btn-s btn-sm" onClick={()=>camRef.current.click()}>📷 Camera</button>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
        <input ref={camRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFile}/>
      </div>
      {uploading&&<div style={{fontSize:".8rem",color:THEME.brown,marginBottom:".4rem"}}>⏳ Processing image…</div>}
      {cover&&(
        <div style={{position:"relative",display:"inline-block",marginBottom:".5rem"}}>
          <img src={cover} alt="Cover" style={{width:100,height:100,objectFit:"cover",borderRadius:8,border:`2px solid ${THEME.tan}`,display:"block"}}/>
          <button onClick={()=>setCover(null)} style={{position:"absolute",top:3,right:3,background:"rgba(44,26,14,.7)",color:"#fff",border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
      )}

    </div>
  );
}

// ── Book Form ──────────────────────────────────────────────────────────────
function BookForm({ initial, onSave, onCancel, currentUser, t }) {
  const [name,setName]=useState(initial?.name||"");
  const [desc,setDesc]=useState(initial?.description||"");
  const [cover,setCover]=useState(initial?.coverImage||null);
  const handleFile=e=>{
    console.log("[BookForm] handleFile triggered, files:", e.target.files?.length);
    const f=e.target.files[0];
    if(!f){ console.log("[BookForm] no file selected"); return; }
    console.log("[BookForm] file:", f.name, f.type, f.size);
    const r=new FileReader();
    setUploadStatus("Reading file…");
    r.onload=async ev=>{
      console.log("[BookForm] FileReader loaded, data length:", ev.target.result?.length);
      setUploadStatus("Compressing…");
      try {
        const compressed=await compressImage(ev.target.result);
        console.log("[BookForm] compressed length:", compressed?.length);
        setCover(compressed);
        setUploadStatus("✅ Image loaded!");
        setTimeout(()=>setUploadStatus(""),2000);
      } catch(err) {
        console.error("[BookForm] compressImage error:", err);
        setCover(ev.target.result);
        setUploadStatus("✅ Image loaded (uncompressed)");
        setTimeout(()=>setUploadStatus(""),2000);
      }
    };
    r.onerror=err=>console.error("[BookForm] FileReader error:", err);
    r.readAsDataURL(f);
    e.target.value="";
  };
  const handleSave=()=>{
    if(!name.trim()){ alert(t.enterBookName); return; }
    onSave({ id:initial?.id||uid(), name, description:desc, coverImage:cover, ownerId:initial?.ownerId||currentUser.id,
      originalLang:initial?.originalLang||currentUser.lang||"en",
      meta:{ createdAt:initial?.meta?.createdAt||now(), timesOpened:initial?.meta?.timesOpened||0, lastOpened:initial?.meta?.lastOpened||null } });
  };

  return (
    <div>
      <div className="field"><label>{t.bookName}</label><input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder={t.bookNamePh}/></div>
      <div className="field"><label>{t.bookDesc}</label><textarea className="fi" value={desc} onChange={e=>setDesc(e.target.value)} placeholder={t.bookDescPh}/></div>
      <div className="field">
        <div className="sl">{t.coverImage}</div>
        <BookImagePicker cover={cover} setCover={setCover} t={t}/>
        {cover&&(
          <div style={{marginTop:".6rem",position:"relative",display:"inline-block"}}>
            <img src={cover} alt="" style={{width:100,height:100,objectFit:"cover",borderRadius:8,border:`2px solid ${THEME.tan}`}}/>
            <button onClick={()=>setCover(null)} style={{position:"absolute",top:3,right:3,background:"rgba(44,26,14,.7)",color:"#fff",border:"none",borderRadius:"50%",width:18,height:18,cursor:"pointer",fontSize:10}}>×</button>
          </div>
        )}
      </div>
      <div className="modal-ft" style={{padding:"1rem 0 0",border:"none"}}>
        <button className="btn btn-s" onClick={onCancel}>{t.cancel}</button>
        <button className="btn btn-p" onClick={handleSave}>{t.saveBook}</button>
      </div>
    </div>
  );
}

// ── Login ──────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const t = T.en;
  const [mode,setMode]=useState("login"); // login | register
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  async function handleLogin() {
    setErr(""); setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pw);
      const userData = await fbGetUser(cred.user.uid);
      onLogin(userData || { id: cred.user.uid, name: cred.user.displayName||email, email, lang:"en" });
    } catch(e) { setErr(e.message||t.wrongLogin); }
    setLoading(false);
  }

  async function handleRegister() {
    if (!name.trim()) { setErr("Please enter your name."); return; }
    setErr(""); setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      await updateProfile(cred.user, { displayName: name });
      const userData = { id: cred.user.uid, name, email, lang:"en" };
      await fbSaveUser(userData);
      onLogin(userData);
    } catch(e) { setErr(e.message); }
    setLoading(false);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-title">📚 {t.appName}</div>
        <div className="login-sub">{t.tagline}</div>
        <div style={{display:"flex",marginBottom:"1.5rem",borderRadius:8,overflow:"hidden",border:`1.5px solid ${THEME.tan}`}}>
          {["login","register"].map(m=>(
            <button key={m} type="button" onClick={()=>{setMode(m);setErr("");}}
              style={{flex:1,padding:".5rem",border:"none",cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif",fontSize:".88rem",fontWeight:500,
                background:mode===m?THEME.brown:"white",color:mode===m?"white":THEME.brown}}>
              {m==="login"?"Sign In":"Create Account"}
            </button>
          ))}
        </div>
        {mode==="register"&&<div className="field"><label>Your Name</label><input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Sarah" onKeyDown={e=>e.key==="Enter"&&handleRegister()}/></div>}
        <div className="field"><label>{t.email}</label><input className="fi" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleRegister())}/></div>
        <div className="field"><label>{t.password}</label><input className="fi" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••" onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleRegister())}/></div>
        {err&&<div style={{color:THEME.rust,fontSize:".82rem",marginBottom:".8rem"}}>{err}</div>}
        <button className="btn btn-p" style={{width:"100%",justifyContent:"center",padding:".7rem"}} onClick={mode==="login"?handleLogin:handleRegister} disabled={loading}>
          {loading?"…":mode==="login"?t.signIn:"Create Account"}
        </button>
      </div>
    </div>
  );
}

// ── Unit normalizer ───────────────────────────────────────────────────────
const UNIT_MAP = {
  // English
  "tablespoon":"tbsp","tablespoons":"tbsp","tbsp":"tbsp","tbsps":"tbsp",
  "teaspoon":"tsp","teaspoons":"tsp","tsp":"tsp","tsps":"tsp",
  "cup":"cup","cups":"cup",
  "ounce":"oz","ounces":"oz","oz":"oz",
  "pound":"lb","pounds":"lb","lbs":"lb","lb":"lb",
  "gram":"g","grams":"g","gr":"g","g":"g",
  "kilogram":"kg","kilograms":"kg","kg":"kg",
  "milliliter":"ml","milliliters":"ml","ml":"ml","millilitre":"ml","millilitres":"ml",
  "liter":"l","liters":"l","litre":"l","litres":"l","l":"l",
  "pinch":"pinch","pinches":"pinch",
  "handful":"handful","handfuls":"handful",
  "slice":"slice","slices":"slices",
  "piece":"pc","pieces":"pcs","pc":"pc","pcs":"pcs",
  "clove":"clove","cloves":"cloves",
  "can":"can","cans":"cans",
  "package":"pkg","packages":"pkg","packet":"pkt","packets":"pkt",
  // Hebrew
  "כף":"tbsp","כפות":"tbsp","כפית":"tsp","כפיות":"tsp",
  "כוס":"cup","כוסות":"cup","גרם":"g","ג":"g","קילוגרם":"kg","קג":"kg",
  "מ\"ל":"ml","מיליליטר":"ml","ליטר":"l","צביטה":"pinch","פרוסה":"slice","פרוסות":"slices",
  // French
  "cuillère à soupe":"tbsp","cuillères à soupe":"tbsp","c. à s.":"tbsp","cas":"tbsp",
  "cuillère à café":"tsp","cuillères à café":"tsp","c. à c.":"tsp","cac":"tsp",
  "tasse":"cup","tasses":"cup","gramme":"g","grammes":"g","kilogramme":"kg","kilogrammes":"kg",
  "millilitre":"ml","millilitres":"ml","litre":"l","litres":"l",
  "pincée":"pinch","pincées":"pinch","tranche":"slice","tranches":"slices",
  // Spanish
  "cucharada":"tbsp","cucharadas":"tbsp","cda":"tbsp","cdas":"tbsp",
  "cucharadita":"tsp","cucharaditas":"tsp","cdita":"tsp","cditas":"tsp",
  "taza":"cup","tazas":"cup","gramo":"g","gramos":"g","kilogramo":"kg","kilogramos":"kg",
  "mililitro":"ml","mililitros":"ml","litro":"l","litros":"l",
  "pizca":"pinch","pizcas":"pinch","rebanada":"slice","rebanadas":"slices",
  // Italian
  "cucchiaio":"tbsp","cucchiai":"tbsp","cucchiaino":"tsp","cucchiaini":"tsp",
  "tazza":"cup","tazze":"cup","grammo":"g","grammi":"g","chilogrammo":"kg","chilogrammi":"kg",
  "millilitro":"ml","millilitri":"ml","litro":"l","litri":"l",
  "pizzico":"pinch","fetta":"slice","fette":"slices",
};

function normalizeUnit(unit) {
  if (!unit) return "";
  return UNIT_MAP[unit.toLowerCase().trim().replace(/\.$/,"")] || unit;
}

const UNIT_DISPLAY = {
  en: { tbsp:"tbsp", tsp:"tsp", cup:"cup", oz:"oz", lb:"lb", g:"g", kg:"kg", ml:"ml", l:"l", pinch:"pinch", handful:"handful", slice:"slice", slices:"slices", pc:"pc", pcs:"pcs", clove:"clove", cloves:"cloves", can:"can", cans:"cans", pkg:"pkg", pkt:"pkt" },
  he: { tbsp:"כף", tsp:"כפית", cup:"כוס", oz:"אונקיה", lb:"ליברה", g:"גרם", kg:"ק״ג", ml:"מ״ל", l:"ליטר", pinch:"צביטה", handful:"חופן", slice:"פרוסה", slices:"פרוסות", pc:"יחידה", pcs:"יחידות", clove:"שן", cloves:"שיני", can:"קופסה", cans:"קופסאות", pkg:"חבילה", pkt:"חבילה" },
  fr: { tbsp:"c. à s.", tsp:"c. à c.", cup:"tasse", oz:"oz", lb:"lb", g:"g", kg:"kg", ml:"ml", l:"l", pinch:"pincée", handful:"poignée", slice:"tranche", slices:"tranches", pc:"pièce", pcs:"pièces", clove:"gousse", cloves:"gousses", can:"boîte", cans:"boîtes", pkg:"paquet", pkt:"sachet" },
  es: { tbsp:"cda", tsp:"cdita", cup:"taza", oz:"oz", lb:"lb", g:"g", kg:"kg", ml:"ml", l:"l", pinch:"pizca", handful:"puñado", slice:"rebanada", slices:"rebanadas", pc:"pieza", pcs:"piezas", clove:"diente", cloves:"dientes", can:"lata", cans:"latas", pkg:"paquete", pkt:"sobre" },
  it: { tbsp:"cucchiaio", tsp:"cucchiaino", cup:"tazza", oz:"oz", lb:"lb", g:"g", kg:"kg", ml:"ml", l:"l", pinch:"pizzico", handful:"manciata", slice:"fetta", slices:"fette", pc:"pezzo", pcs:"pezzi", clove:"spicchio", cloves:"spicchi", can:"lattina", cans:"lattine", pkg:"confezione", pkt:"bustina" },
};

function displayUnit(normalizedUnit, lang) {
  if (!normalizedUnit) return "";
  return UNIT_DISPLAY[lang]?.[normalizedUnit] || normalizedUnit;
}

// Handle ingredients where amount+unit may be combined in the amount field
// e.g. {amount:"2 tablespoons", unit:""} → {qty:"2", unit:"tbsp"}
function parseIngredient(ing, lang="en") {
  const rawAmt = (ing.amount||"").trim();
  const rawUnit = (ing.unit||"").trim();

  // If unit is already set, normalize and display in user language
  if (rawUnit) return { qty: rawAmt, unit: displayUnit(normalizeUnit(rawUnit), lang) };

  // Try to split "2 tablespoons", "1½ cups", "3 cloves" etc.
  const match = rawAmt.match(/^([\d\/\.\s½¼¾⅓⅔⅛]+)\s+(.+)$/);
  if (match) {
    const possibleUnit = match[2].trim();
    const normalized = normalizeUnit(possibleUnit);
    // Only treat it as a unit if we recognised it
    if (normalized !== possibleUnit || UNIT_MAP[possibleUnit.toLowerCase()]) {
      return { qty: match[1].trim(), unit: displayUnit(normalized, lang) };
    }
  }
  // No unit found — put everything in qty, unit blank
  return { qty: rawAmt, unit: "" };
}


// ── Recipe Detail ──────────────────────────────────────────────────────────
function RecipeDetail({ recipe, onBack, onEdit, onDelete, onTrackOpen, currentUser, allUsers, books, t, isGuest=false }) {
  const canEdit=!isGuest&&(recipe.ownerId===currentUser.id||recipe.editPerms?.includes(currentUser.id));
  const owner=allUsers.find(u=>u.id===recipe.ownerId);
  const rBooks=books.filter(b=>recipe.bookIds?.includes(b.id));
  const headerImg=recipe.images?.find(i=>i.role==="header") || recipe.images?.[0];
  const inlineImgs=recipe.images?.filter(i=>i.role!=="header" && i!==headerImg) || [];
  const lang=currentUser.lang||"en";
  const needsTrans=lang!==(recipe.originalLang||"en");
  const [display,setDisplay]=useState(recipe);
  const [ts,setTs]=useState("pending");

  useEffect(()=>{
    console.log("[RecipeDetail] lang:", lang, "originalLang:", recipe.originalLang, "needsTrans:", needsTrans, "recipeId:", recipe.id);
    // Track open count in Firestore (fire and forget) — skip for guest
    if(!isGuest){
      const updated={...recipe,meta:{...recipe.meta,timesOpened:(recipe.meta?.timesOpened||0)+1,lastOpened:now()}};
      fbSaveRecipe(updated).catch(()=>{});
      // Update the recipe in parent state so count reflects immediately
      onTrackOpen(updated);
    }
    if(!needsTrans){ setDisplay(recipe); setTs("none"); return; }
    const cache=tcLoad()||{}; const ck=`${recipe.id}__${lang}`;
    console.log("[RecipeDetail] cache key:", ck, "cached:", !!cache[ck], "has ingredients:", !!cache[ck]?.ingredients);
    // Only use cache if it has full content (ingredients = full translation, not just card)
    if(cache[ck]?.ingredients){ setDisplay({...recipe,...cache[ck]}); setTs("done"); return; }
    // Clear partial cache entry
    if(cache[ck]) { delete cache[ck]; tcSave(cache); }
    setTs("loading");
    translateRecipe(recipe,lang)
      .then(tr=>{ const merged={...recipe,...tr}; setDisplay(merged); setTs("done"); const c=tcLoad()||{}; c[ck]=tr; tcSave(c); })
      .catch(e=>{ console.error("[RecipeDetail translate error]", e, e?.message); setDisplay(recipe); setTs("error"); });
  },[recipe.id,lang]);

  return (
    <div className="rdetail">
      <button className="back-btn" onClick={onBack}>{t.back}</button>
      {ts==="loading"&&<div className="trans-banner"><span className="spinner"/>{t.translating}</div>}
      {ts==="done"&&needsTrans&&<div className="trans-banner" style={{background:"#f0f7ed",borderColor:THEME.sage}}>✓ {t.translated} ({LANGUAGES.find(l=>l.code===lang)?.nativeLabel})</div>}
      {ts==="error"&&<div className="trans-banner" style={{background:"#fff3f0",borderColor:THEME.rust}}>⚠️ {t.transError}</div>}
      {headerImg&&<img className="rhero" src={headerImg.src} alt={display.name}/>}
      <div className="rmeta-row">
        {display.foodType&&<span className="tag tag-t">{display.foodType}</span>}
        {display.difficulty&&<span className="tag tag-d">{display.difficulty}</span>}
        {(recipe.customTags||[]).map(tg=><span key={tg} className="tag tag-c">{tg}</span>)}
      </div>
      <h1 className="rtitle">{display.name}</h1>
      {display.description&&<p className="rdesc">{display.description}</p>}
      {recipe.source?.url&&<div className="rsource">{t.sourceUrl} <a href={recipe.source.url} target="_blank" rel="noreferrer" style={{color:THEME.sage}}>{recipe.source.url}</a></div>}
      {recipe.source?.type==="image"&&<div className="rsource">{t.sourcePhoto}</div>}
      {rBooks.length>0&&<div style={{marginTop:".5rem",display:"flex",gap:".3rem",flexWrap:"wrap"}}>{rBooks.map(b=><span key={b.id} style={{fontSize:".78rem",background:THEME.parchment,padding:".1rem .5rem",borderRadius:10,color:THEME.darkBrown}}>📚 {b.name}</span>)}</div>}
      <div className="stat-row" style={{marginTop:"1rem"}}>
        <div className="stat"><strong>{t.createdBy}</strong>{owner?.name||"—"}</div>
        <div className="stat"><strong>{t.created}</strong>{recipe.meta?.createdAt?new Date(recipe.meta.createdAt).toLocaleDateString():"—"}</div>
        <div className="stat"><strong>{t.lastEdited}</strong>{recipe.meta?.lastEdited?new Date(recipe.meta.lastEdited).toLocaleDateString():"—"}</div>
        <div className="stat"><strong>{t.timesOpened}</strong>{recipe.meta?.timesOpened||0}</div>
        <div className="stat"><strong>{t.lastOpened}</strong>{recipe.meta?.lastOpened?new Date(recipe.meta.lastOpened).toLocaleDateString():"—"}</div>
      </div>
      {canEdit&&(
        <div className="act-row" style={{marginBottom:"1.5rem"}}>
          <button className="btn btn-s btn-sm" onClick={onEdit}>{t.edit}</button>
          {recipe.ownerId===currentUser.id&&<button className="btn btn-d btn-sm" onClick={onDelete}>{t.del}</button>}
        </div>
      )}
      {recipe.serves&&(
        <div style={{display:"inline-flex",alignItems:"center",gap:".5rem",marginBottom:"1rem",padding:".4rem .9rem",background:THEME.warm,borderRadius:8}}>
          <span style={{fontSize:"1rem"}}>🍽</span>
          <span style={{fontSize:".95rem",fontWeight:500,color:THEME.darkBrown}}>{t.serves}: {recipe.serves}</span>
        </div>
      )}
      {display.ingredients?.length>0&&(
        <div className="rsec">
          <div className="rsec-title">{t.ingredients}</div>
          <ul className="ing-list">
            {display.ingredients.map((ing,i)=>(
              ing.type==="section" ? (
                <li key={ing.id||i} style={{listStyle:"none",padding:".6rem 0 .2rem",borderBottom:`2px solid ${THEME.tan}`,fontWeight:600,fontSize:".9rem",color:THEME.brown,fontStyle:"italic"}}>
                  {ing.title}
                </li>
              ) : (
              <li key={ing.id||i} className="ing-item">
                {(() => { const {qty,unit} = parseIngredient(ing, currentUser?.lang||"en"); return (<>
                  <span className="ing-qty">{qty}</span>
                  <span className="ing-unit">{unit}</span>
                  <span className="ing-name">{ing.name}</span>
                </>); })()}
              </li>
              )
            ))}
          </ul>
        </div>
      )}
      {display.steps?.length>0&&(
        <div className="rsec">
          <div className="rsec-title">{t.steps}</div>
          <ol className="step-list">
            {display.steps.map((step,idx)=>(
              <li key={step.id||idx} className="step-item">
                <span className="step-num">{idx+1}</span>
                <div className="step-con">
                  <div className="step-txt">{step.text}</div>
                  {(recipe.steps?.find(s=>s.id===step.id)?.images || recipe.steps?.[idx]?.images || []).filter(i=>i.src).map(img=>(
                    <img key={img.id} className="step-img" src={img.src} alt=""/>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
      {display.notes&&(
        <div className="rsec">
          <div className="rsec-title">{t.notes}</div>
          <div className="notes-box">{display.notes}</div>
        </div>
      )}
      {inlineImgs.length>0&&(
        <div className="rsec">
          <div className="rsec-title">📷</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:".7rem"}}>
            {inlineImgs.map((img,i)=>(
              <img key={img.id||i} src={img.src} alt=""
                style={{width:"calc(50% - .35rem)",maxWidth:320,borderRadius:8,objectFit:"cover",aspectRatio:"4/3"}}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cards ──────────────────────────────────────────────────────────────────
function BookCard({ book, count, onClick, users, userLang }) {
  const owner=users.find(u=>u.id===book.ownerId);
  const [display,setDisplay]=useState({name:book.name,description:book.description});

  useEffect(()=>{
    const lang=userLang||"en";
    const origLang=book.originalLang||"en";
    if(lang===origLang){ setDisplay({name:book.name,description:book.description}); return; }
    // Check translation cache
    const cache=tcLoad()||{};
    const ck=`${book.id}__${lang}`;
    if(cache[ck]?.name){ setDisplay({name:cache[ck].name||book.name,description:cache[ck].description||book.description}); return; }
    // Translate card fields only
    const langName=LANGUAGES.find(l=>l.code===lang)?.nativeLabel||"English";
    callAI(`Translate into ${langName}, return ONLY valid JSON {name,description}, no markdown: ${JSON.stringify({name:book.name,description:book.description})}`)
      .then(raw=>{ const j=extractJSON(raw); setDisplay({name:j.name||book.name,description:j.description||book.description});
        const c=tcLoad()||{}; c[ck]={...j}; tcSave(c); })
      .catch(()=>{});
  },[book.id,userLang]);

  return (
    <div className="card" onClick={onClick}>
      <div className="card-cover">
        {book.coverImage?<img src={book.coverImage} alt=""/>:<span style={{fontSize:"3rem"}}>📚</span>}
      </div>
      <div className="card-body">
        <div className="card-name">{display.name}</div>
        {display.description&&<div className="card-desc">{display.description}</div>}
        <div className="card-meta">
          <span className="card-count">{count}</span>
          <span className="card-creator">{owner?.name||""}</span>
        </div>
      </div>
    </div>
  );
}

function RecipeCard({ recipe, onClick, users, userLang }) {
  const owner=users.find(u=>u.id===recipe.ownerId);
  const hdr=recipe.images?.find(i=>i.role==="header")||recipe.images?.[0];
  const [display,setDisplay]=useState({name:recipe.name,foodType:recipe.foodType,difficulty:recipe.difficulty});

  useEffect(()=>{
    const lang=userLang||"en";
    const origLang=recipe.originalLang||"en";
    if(lang===origLang){ setDisplay({name:recipe.name,foodType:recipe.foodType,difficulty:recipe.difficulty}); return; }
    // Check translation cache first
    const cache=tcLoad()||{};
    const ck=`${recipe.id}__${lang}`;
    // Only use cache for card if it has at least name translated
    if(cache[ck]?.name){ setDisplay({name:cache[ck].name||recipe.name,foodType:cache[ck].foodType||recipe.foodType,difficulty:cache[ck].difficulty||recipe.difficulty}); return; }
    // Translate card fields only (lightweight)
    const langName=LANGUAGES.find(l=>l.code===lang)?.nativeLabel||"English";
    callAI(`Translate into ${langName}, return ONLY valid JSON {name,foodType,difficulty}, no markdown: ${JSON.stringify({name:recipe.name,foodType:recipe.foodType,difficulty:recipe.difficulty})}`)
      .then(raw=>{ const j=extractJSON(raw); setDisplay({name:j.name||recipe.name,foodType:j.foodType||recipe.foodType,difficulty:j.difficulty||recipe.difficulty});
        const c=tcLoad()||{}; c[ck]={...(c[ck]||{}), ...j}; tcSave(c); })
      .catch(()=>{});
  },[recipe.id,userLang]);

  return (
    <div className="card" onClick={onClick}>
      <div className="card-rimg">
        {hdr?<img src={hdr.src} alt=""/>:<span style={{fontSize:"3.5rem"}}>🍽</span>}
      </div>
      <div className="card-body">
        <div className="card-name">{display.name}</div>
        <div className="card-rtags">
          {display.foodType&&<span className="tag tag-t">{display.foodType}</span>}
          {display.difficulty&&<span className="tag tag-d">{display.difficulty}</span>}
          {(recipe.customTags||[]).slice(0,2).map(tg=><span key={tg} className="tag tag-c">{tg}</span>)}
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:".78rem",color:THEME.sage}}>{owner?.name||""}</span>
          <span style={{fontSize:".78rem",color:THEME.tan}}>{recipe.source?.type==="url"?"🔗":recipe.source?.type==="image"?"🖼":""}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [dataLoading,setDataLoading]=useState(false);
  const [tab,setTab]=useState("books");
  const [books,setBooks]=useState([]);
  const [recipes,setRecipes]=useState([]);
  const [users,setUsers]=useState([]);
  const [view,setView]=useState("list");
  const [selBook,setSelBook]=useState(null);
  const [selRecipe,setSelRecipe]=useState(null);
  const [showBookForm,setShowBookForm]=useState(false);
  const [editBook,setEditBook]=useState(null);
  const [showRecipeForm,setShowRecipeForm]=useState(false);
  const [editRecipe,setEditRecipe]=useState(null);
  const [search,setSearch]=useState("");
  const [fType,setFType]=useState("");
  const [fDiff,setFDiff]=useState("");
  const [fBook,setFBook]=useState("");
  const [toast,setToast]=useState(null);
  const [showImport,setShowImport]=useState(false);
  const [importJson,setImportJson]=useState("");
  const [importStatus,setImportStatus]=useState("");
  const saveRef=useRef(null);

  // ── Firebase auth listener ───────────────────────────────────────────────
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async fbUser => {
      if (fbUser) {
        const userData = await fbGetUser(fbUser.uid);
        const u = userData || { id: fbUser.uid, name: fbUser.displayName||fbUser.email, email: fbUser.email, lang:"en" };
        setUser(u);
        setDataLoading(true);
        await loadData();
        setDataLoading(false);
      } else {
        setUser(null); setBooks([]); setRecipes([]); setUsers([]);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  async function loadData() {
    const [bks, recs, usrs] = await Promise.all([fbGetBooks(), fbGetRecipes(), fbGetAllUsers()]);
    setBooks(bks); setRecipes(recs); setUsers(usrs);
  }

  const t = user ? T[user.lang||"en"] : T.en;
  const isRTL = user ? LANGUAGES.find(l=>l.code===(user.lang||"en"))?.rtl : false;

  const showToast=msg=>setToast(msg);

  const handleLogin=u=>{ setUser(u); };
  const isGuest = user?.email === "guest@myrecipebooks.com";
  const handleLogout=async()=>{ await signOut(auth); setView("list"); setSelBook(null); setSelRecipe(null); };

  const handleImport=async()=>{
    setImportStatus("running");
    try {
      const parsed = JSON.parse(importJson);
      const books = parsed.books || [];
      const recipes = parsed.recipes || [];
      let ok=0, fail=0;
      for (const book of books) {
        try { await fbSaveBook(book); ok++; } catch { fail++; }
      }
      for (const recipe of recipes) {
        try { await fbSaveRecipe(recipe); ok++; } catch { fail++; }
      }
      await loadData();
      setImportStatus(fail===0 ? `done:${ok}` : `error:${ok} ok, ${fail} failed`);
    } catch(e) {
      setImportStatus("parseerror:" + e.message);
    }
  };

  const updateLang=async lang=>{
    const updated={...user,lang};
    await fbSaveUser(updated);
    setUser(updated);
    setUsers(users.map(u=>u.id===updated.id?updated:u));
  };

  const saveBook=async book=>{
    const isNew=!books.find(b=>b.id===book.id);
    await fbSaveBook(book);
    setBooks(isNew?[...books,book]:books.map(b=>b.id===book.id?book:b));
    setShowBookForm(false); setEditBook(null);
    showToast(isNew?t.bookCreated:t.bookUpdated);
  };
  const deleteBook=async id=>{
    if(!confirm(t.delBookConfirm))return;
    await fbDeleteBook(id);
    setBooks(books.filter(b=>b.id!==id));
    setView("list"); setSelBook(null); showToast(t.bookDeleted);
  };
  const saveRecipe=async recipe=>{
    const isNew=!recipes.find(r=>r.id===recipe.id);
    await fbSaveRecipe(recipe);
    setRecipes(isNew?[...recipes,recipe]:recipes.map(r=>r.id===recipe.id?recipe:r));
    // Update selRecipe immediately so detail view reflects changes without re-entering
    if(selRecipe?.id===recipe.id) setSelRecipe(recipe);
    // Clear translation cache so fresh translations pick up the changes
    const cache=tcLoad()||{};
    Object.keys(cache).forEach(k=>{ if(k.startsWith(recipe.id+"__")) delete cache[k]; });
    tcSave(cache);
    setShowRecipeForm(false); setEditRecipe(null);
    // Return to recipe detail if we were editing an existing recipe
    if(!isNew && selRecipe?.id===recipe.id) setView("recipe-detail");
    showToast(isNew?t.recipeAdded:t.recipeSaved);
  };
  const deleteRecipe=async id=>{
    if(!confirm(t.delRecipeConfirm))return;
    await fbDeleteRecipe(id);
    setRecipes(recipes.filter(r=>r.id!==id));
    // Return to book if we came from one, otherwise go to list
    if(selBook){ setView("book-detail"); } else { setView("list"); }
    setSelRecipe(null); showToast(t.recipeDeleted);
  };
  const openBook=async book=>{
    if(!isGuest){
      const updated={...book,meta:{...book.meta,timesOpened:(book.meta?.timesOpened||0)+1,lastOpened:now()}};
      await fbSaveBook(updated);
      setBooks(books.map(b=>b.id===updated.id?updated:b));
      setSelBook(updated);
    } else {
      setSelBook(book);
    }
    setView("book-detail");
  };
  const openRecipe=r=>{ setSelRecipe(r); setView("recipe-detail"); };

  const filtered=recipes.filter(r=>{
    const ms=!search||r.name.toLowerCase().includes(search.toLowerCase());
    const mt=!fType||r.foodType===fType;
    const md=!fDiff||r.difficulty===fDiff;
    const mb=!fBook||r.bookIds?.includes(fBook);
    return ms&&mt&&md&&mb;
  });

  if(authLoading) return <><style>{buildCSS(false)}</style><div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",color:THEME.brown}}>📚 Loading…</div></>
  if(!user) return <><style>{buildCSS(false)}</style><LoginScreen onLogin={handleLogin}/></>;

  const bookRecipes=selBook?recipes.filter(r=>r.bookIds?.includes(selBook.id)):[];

  return (
    <>
      <style>{buildCSS(isRTL)}</style>
      <div className="app">
        {/* Topbar */}
        <div className="topbar">
          <div className="logo">📚 <span className="logo-text">{t.appName}</span></div>
          <div className="topbar-right">
            <select className="lang-sel" value={user.lang||"en"} onChange={e=>updateLang(e.target.value)} title={t.preferredLang}>
              {LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.nativeLabel}</option>)}
            </select>
            <div className="topbar-user">👤 {user.name}</div>
            <button className="btn btn-g btn-sm" onClick={handleLogout}>{t.signOut}</button>
          </div>
        </div>

        {dataLoading&&<div style={{position:"fixed",inset:0,background:"rgba(247,240,230,0.8)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:THEME.brown}}>📚 Loading your recipes…</div>}
        <div className="main">
          {view==="list"&&(
            <div className="nav-tabs">
              <div className={`nav-tab${tab==="books"?" act":""}`} onClick={()=>setTab("books")}>📚 {t.books}</div>
              <div className={`nav-tab${tab==="recipes"?" act":""}`} onClick={()=>setTab("recipes")}>🍽 {t.allRecipes}</div>
            </div>
          )}

          {/* Recipe detail */}
          {view==="recipe-detail"&&selRecipe&&(
            <RecipeDetail recipe={selRecipe}
              onBack={()=>{ setView(selBook?"book-detail":"list"); setSelRecipe(null); }}
              onEdit={()=>{ setEditRecipe(selRecipe); setShowRecipeForm(true); }}
              onDelete={()=>deleteRecipe(selRecipe.id)}
              onTrackOpen={updated=>{ setSelRecipe(updated); setRecipes(recipes.map(r=>r.id===updated.id?updated:r)); }}
              currentUser={user} allUsers={users} books={books} t={t} isGuest={isGuest}/>
          )}

          {/* Book detail */}
          {view==="book-detail"&&selBook&&(()=>{
            const bkLang=user?.lang||"en";
            const bkCache=tcLoad()||{};
            const bkCk=`${selBook.id}__${bkLang}`;
            const bkNeedsTranslation=bkLang!==(selBook.originalLang||"en");
            const bkCached=bkCache[bkCk];
            const bkDisplayName=bkNeedsTranslation?(bkCached?.name||selBook.name):selBook.name;
            const bkDisplayDesc=bkNeedsTranslation?(bkCached?.description||selBook.description):selBook.description;
            return (
            <div>
              {/* Action bar — full width, always visible */}
              <div style={{background:"#fff",borderBottom:`1px solid ${THEME.parchment}`,padding:".6rem 1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <button className="back-btn" style={{margin:0}} onClick={()=>{ setView("list"); setSelBook(null); }}>{t.backToBooks}</button>
                {!isGuest&&selBook.ownerId===user.id&&(
                  <div className="act-row">
                    <button className="btn btn-s btn-sm" onClick={()=>{ setEditBook(selBook); setShowBookForm(true); }}>{t.edit}</button>
                    <button className="btn btn-d btn-sm" onClick={()=>deleteBook(selBook.id)}>{t.del}</button>
                  </div>
                )}
              </div>
              {/* Cover + info */}
              <div className="bk-hd">
                <div className="bk-cover">{selBook.coverImage?<img src={selBook.coverImage} alt=""/>:"📚"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="bk-name">{bkDisplayName}</div>
                  {bkDisplayDesc&&<div className="bk-desc">{bkDisplayDesc}</div>}
                  <div className="bk-meta">{bookRecipes.length} {bookRecipes.length===1?t.recipeWord:t.recipesWord} · {t.createdBy} {users.find(u=>u.id===selBook.ownerId)?.name||"—"}</div>
                </div>
              </div>
              <div className="page">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"}}>
                  <div className="pt" style={{fontSize:"1.3rem"}}>{t.recipesInBook}</div>
                  {!isGuest&&<button className="btn btn-p btn-sm" onClick={()=>setShowRecipeForm(true)}>{t.addRecipe}</button>}
                </div>
                {bookRecipes.length===0
                  ?<div className="empty"><div className="empty-icon">🍳</div><div className="empty-txt">{t.noRecipes}</div></div>
                  :<div className="grid">{bookRecipes.map(r=><RecipeCard key={r.id} recipe={r} onClick={()=>openRecipe(r)} users={users} userLang={user?.lang||"en"}/>)}</div>}
              </div>
            </div>
            );
          })()}

          {/* List view */}
          {view==="list"&&(
            <div className="page">
              {tab==="books"&&(
                <>
                  <div className="ph">
                    <div><div className="pt">{t.yourBooks}</div><div className="ps">{t.shelfSub}</div></div>
                    {!isGuest&&<button className="btn btn-p" onClick={()=>{ setEditBook(null); setShowBookForm(true); }}>{t.newBook}</button>}
                  </div>
                  {books.length===0
                    ?<div className="empty"><div className="empty-icon">📚</div><div className="empty-txt">{t.noBooks}</div></div>
                    :<div className="grid">
                      {books.map(b=><BookCard key={b.id} book={b} count={recipes.filter(r=>r.bookIds?.includes(b.id)).length} onClick={()=>openBook(b)} users={users} userLang={user?.lang||"en"}/>)}
                      {!isGuest&&<div className="add-card" onClick={()=>setShowBookForm(true)}>
                        <div style={{fontSize:"2rem"}}>+</div>
                        <div style={{fontSize:".88rem",fontWeight:500}}>{t.newBook}</div>
                      </div>}
                    </div>}
                </>
              )}
              {tab==="recipes"&&(
                <>
                  <div className="ph">
                    <div><div className="pt">{t.allRecipes}</div><div className="ps">{recipes.length} {recipes.length===1?t.recipeWord:t.recipesWord}</div></div>
                    {!isGuest&&<button className="btn btn-p" onClick={()=>{ setEditRecipe(null); setShowRecipeForm(true); }}>{t.addRecipe}</button>}
                  </div>
                  <div className="search-bar">
                    <span>🔍</span>
                    <input placeholder={t.searchPlaceholder} value={search} onChange={e=>setSearch(e.target.value)}/>
                    {search&&<button style={{background:"none",border:"none",cursor:"pointer",color:THEME.tan}} onClick={()=>setSearch("")}>×</button>}
                  </div>
                  <div className="filter-bar">
                    <span className="fl">{t.foodTypeLabel}</span>
                    {t.FOOD_TYPES.map(f=><div key={f} className={`chip${fType===f?" act":""}`} onClick={()=>setFType(fType===f?"":f)}>{f}</div>)}
                    <span className="fl" style={{marginLeft:".5rem"}}>{t.diffLabel}</span>
                    {t.DIFFICULTIES.map(d=><div key={d} className={`chip${fDiff===d?" act":""}`} onClick={()=>setFDiff(fDiff===d?"":d)}>{d}</div>)}
                    {books.length>0&&<><span className="fl" style={{marginLeft:".5rem"}}>{t.bookLabel}</span>
                    {books.map(b=><div key={b.id} className={`chip${fBook===b.id?" act":""}`} onClick={()=>setFBook(fBook===b.id?"":b.id)}>{b.name}</div>)}</>}
                  </div>
                  {filtered.length===0
                    ?<div className="empty"><div className="empty-icon">🍽</div><div className="empty-txt">{recipes.length===0?t.noRecipes:t.noMatch}</div></div>
                    :<div className="grid">{filtered.map(r=><RecipeCard key={r.id} recipe={r} onClick={()=>openRecipe(r)} users={users} userLang={user?.lang||"en"}/>)}</div>}
                </>
              )}
            </div>
          )}
        </div>

        {/* Book modal */}
        {showBookForm&&!isGuest&&(
          <div className="backdrop" onClick={e=>e.target===e.currentTarget&&(setShowBookForm(false),setEditBook(null))}>
            <div className="modal">
              <div className="modal-hd">
                <div className="modal-title">{editBook?t.editBook:t.newRecipeBook}</div>
                <button className="btn btn-ic btn-s btn-sm" onClick={()=>{ setShowBookForm(false); setEditBook(null); }}>×</button>
              </div>
              <div className="modal-body">
                <BookForm initial={editBook} onSave={saveBook} onCancel={()=>{ setShowBookForm(false); setEditBook(null); }} currentUser={user} t={t}/>
              </div>
            </div>
          </div>
        )}

        {/* Recipe modal */}
        {showRecipeForm&&!isGuest&&(
          <div className="backdrop" onClick={e=>e.target===e.currentTarget&&(setShowRecipeForm(false),setEditRecipe(null))}>
            <div className="modal" style={{maxWidth:760}}>
              <div className="modal-hd">
                <div className="modal-title">{editRecipe?t.editRecipe:t.addRecipeTitle}</div>
                <button className="btn btn-ic btn-s btn-sm" onClick={()=>{ setShowRecipeForm(false); setEditRecipe(null); }}>×</button>
              </div>
              <div className="modal-body">
                <RecipeForm
                  initial={editRecipe?{...editRecipe}:(selBook?{bookIds:[selBook.id]}:{})}
                  onSave={saveRecipe} currentUser={user} books={books} allUsers={users} t={t} saveRef={saveRef}/>
              </div>
              <div className="modal-ft">
                <button className="btn btn-s" onClick={()=>{ setShowRecipeForm(false); setEditRecipe(null); }}>{t.cancel}</button>
                <button className="btn btn-p" onClick={()=>saveRef.current&&saveRef.current()}>{t.saveRecipe}</button>
              </div>
            </div>
          </div>
        )}

        {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}

        {showImport&&(
          <div className="backdrop" onClick={e=>e.target===e.currentTarget&&(setShowImport(false),setImportStatus(""),setImportJson(""))}>
            <div className="modal" style={{maxWidth:500}}>
              <div className="modal-hd">
                <div className="modal-title">📥 Import Sandbox Data</div>
                <button className="btn btn-ic btn-s btn-sm" onClick={()=>{setShowImport(false);setImportStatus("");setImportJson("");}}>×</button>
              </div>
              <div className="modal-body">
                <div style={{fontSize:".85rem",color:THEME.brown,marginBottom:"1rem"}}>
                  Open the <strong>export-sandbox-data</strong> artifact on your mobile, copy the JSON, then paste it below.
                </div>
                <textarea className="fi" style={{minHeight:180,fontSize:".78rem",fontFamily:"monospace"}}
                  placeholder='Paste JSON here… {"books":[...],"recipes":[]}'
                  value={importJson} onChange={e=>setImportJson(e.target.value)}/>
                {importStatus==="running"&&<div style={{color:THEME.brown,fontSize:".85rem",margin:".5rem 0"}}>⏳ Importing…</div>}
                {importStatus.startsWith("done")&&<div style={{color:"#1e8449",fontSize:".85rem",margin:".5rem 0"}}>🎉 {importStatus.split(":")[1]} items imported successfully!</div>}
                {importStatus.startsWith("error")&&<div style={{color:THEME.rust,fontSize:".85rem",margin:".5rem 0"}}>⚠️ {importStatus.split(":")[1]}</div>}
                {importStatus.startsWith("parseerror")&&<div style={{color:THEME.rust,fontSize:".85rem",margin:".5rem 0"}}>❌ Invalid JSON — {importStatus.split(":")[1]}</div>}
              </div>
              <div className="modal-ft">
                <button className="btn btn-s" onClick={()=>{setShowImport(false);setImportStatus("");setImportJson("");}}>Cancel</button>
                <button className="btn btn-p" onClick={handleImport} disabled={!importJson.trim()||importStatus==="running"}>Import</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
