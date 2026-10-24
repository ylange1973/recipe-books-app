// Keep quantities and units intact when translating or editing ingredient names.
// Older saved translations may contain only ingredient names.
export function mergeTranslationIngredients(translated = [], original = []) {
  return (translated || []).map((ingredient, index) => {
    if (ingredient.type === "section") return ingredient;
    const source = original.find(item => item.id === ingredient.id) ||
      (original[index]?.type !== "section" ? original[index] : null);
    return {
      ...ingredient,
      type: "ingredient",
      amount: ingredient.amount ?? source?.amount ?? "",
      unit: ingredient.unit ?? source?.unit ?? "",
    };
  });
}
