import { LANGUAGES } from "./constants.js";

export async function callAI(prompt, imageBase64 = null, imageType = null, url = null) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, imageBase64, imageType, url })
  });
  const data = await res.json();
  if (data.error) throw new Error("AI error: " + data.error);
  console.log("[callAI raw response]", data.text?.slice(0, 500));
  return data.text || "";
}

export function extractJSON(raw) {
  try { return JSON.parse(raw.trim()); } catch {}
  const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(stripped); } catch {}
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(raw.slice(start, end + 1)); } catch {}
  }
  throw new Error("No valid JSON in response: " + raw.slice(0, 300));
}

export const RECIPE_JSON_SHAPE = `{ "name": string, "description": string, "ingredients": [{"amount": string, "unit": string, "name": string, "type": "ingredient"} or {"type": "section", "title": string}], "steps": [{"text": string}], "foodType": string, "difficulty": string, "notes": string, "serves": number }`;

export async function extractFromPastedText(text, langName) {
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

export async function extractAndTranslate(source, type, targetLang) {
  const langName = LANGUAGES.find(l => l.code === targetLang)?.nativeLabel || "English";
  const shapeInstr = `Return ONLY a single valid JSON object, no markdown, no explanation. Translate ALL text fields into ${langName}. JSON shape: ${RECIPE_JSON_SHAPE}`;

  if (type === "url") {
    const prompt = `${shapeInstr}\n\nExtract the recipe from the page content below.`;
    const raw = await callAI(prompt, null, null, source);
    return extractJSON(raw);
  }

  console.log("[extractAndTranslate] source prefix:", source?.slice(0, 50));
  const b64 = source.split(",")[1];
  const mime = source.split(";")[0].split(":")[1] || "image/jpeg";
  const prompt = [
    shapeInstr,
    "\nExtract the recipe from this image. Important rules:",
    "- The 'name' field must be the recipe name only — not the author name, book title, or any other text",
    "- The 'description' field must only contain text explicitly written as a description in the source — if no description exists, return an empty string",
    "- Do NOT invent or infer any information not clearly visible in the image",
    "- If any text is unclear or unreadable, skip it rather than guessing",
  ].join("\n");
  const raw = await callAI(prompt, b64, mime);
  const data = extractJSON(raw);
  data.description = ""; // never trust AI-generated description from images
  return data;
}

export async function translateRecipe(recipe, targetLang) {
  const langName = LANGUAGES.find(l => l.code === targetLang)?.nativeLabel || "English";
  const payload = {
    name: recipe.name, description: recipe.description,
    ingredients: recipe.ingredients, steps: recipe.steps,
    notes: recipe.notes, foodType: recipe.foodType, difficulty: recipe.difficulty
  };
  const prompt = [
    `You are a culinary translator for a recipe app. Translate this recipe JSON into ${langName}.`,
    "Use natural culinary language as it appears in cookbooks and recipes — not literal or formal translations.",
    "Rules:",
    "- Translate ONLY: name, description, foodType, difficulty, notes, ingredient names, section titles, step text",
    "- Do NOT translate or modify: amount, unit, id, type fields — copy them exactly as-is",
    "- Use common culinary terms for ingredients as they appear in local supermarkets and cookbooks",
    "- Return ONLY valid JSON, same structure, no markdown",
    "",
    JSON.stringify(payload)
  ].join("\n");
  console.log("[translateRecipe] calling AI, payload size:", JSON.stringify(payload).length);
  const raw = await callAI(prompt);
  console.log("[translateRecipe] raw response:", raw?.slice(0, 200));
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}
