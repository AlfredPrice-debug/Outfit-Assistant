// A curated subset (~30) of a much larger icon sheet the user provided,
// covering the four structured item-by-layer categories well. Free-form
// "accessories" strings are intentionally not matched here, they're
// open-ended text (see prisma schema), so a fixed icon set would miss most
// of them anyway; those stay text-only in the UI, same as before.
export type ClothingCategory = "top" | "bottom" | "outerwear" | "shoes";

export interface ClothingIcon {
  key: string;
  category: ClothingCategory;
  keywords: string[];
  src: string;
}

export const CLOTHING_ICONS: ClothingIcon[] = [
  { key: "tee_striped", category: "top", keywords: ["t-shirt", "tee", "striped", "casual"], src: "/clothing/tee_striped.png" },
  { key: "polo", category: "top", keywords: ["polo", "collared shirt", "short sleeve"], src: "/clothing/polo.png" },
  { key: "tee_white", category: "top", keywords: ["t-shirt", "tee", "white", "plain", "crewneck"], src: "/clothing/tee_white.png" },
  { key: "tee_black", category: "top", keywords: ["t-shirt", "tee", "black", "plain"], src: "/clothing/tee_black.png" },
  { key: "flannel_plaid", category: "top", keywords: ["flannel", "plaid shirt", "checkered shirt"], src: "/clothing/flannel_plaid.png" },
  { key: "shirt_plaid_dark", category: "top", keywords: ["plaid shirt", "flannel", "dark plaid"], src: "/clothing/shirt_plaid_dark.png" },
  { key: "buttondown_blue", category: "top", keywords: ["button-down", "oxford shirt", "dress shirt", "collared shirt", "blue shirt"], src: "/clothing/buttondown_blue.png" },
  { key: "cardigan", category: "top", keywords: ["cardigan", "knit sweater", "button sweater"], src: "/clothing/cardigan.png" },
  { key: "sweater_navy", category: "top", keywords: ["sweater", "crewneck", "knit pullover", "navy sweater"], src: "/clothing/sweater_navy.png" },
  { key: "sweater_turtleneck_cream", category: "top", keywords: ["turtleneck", "sweater", "cream sweater", "knit", "cable-knit", "cable knit"], src: "/clothing/sweater_turtleneck_cream.png" },
  { key: "sweater_turtleneck_green", category: "top", keywords: ["turtleneck", "sweater", "green sweater", "knit"], src: "/clothing/sweater_turtleneck_green.png" },
  { key: "jacket_denim", category: "outerwear", keywords: ["denim jacket", "jean jacket"], src: "/clothing/jacket_denim.png" },
  { key: "jacket_leather", category: "outerwear", keywords: ["leather jacket", "moto jacket"], src: "/clothing/jacket_leather.png" },
  { key: "blazer", category: "outerwear", keywords: ["blazer", "suit jacket", "formal jacket"], src: "/clothing/blazer.png" },
  { key: "jacket_puffer_olive", category: "outerwear", keywords: ["puffer jacket", "quilted jacket", "down jacket", "olive"], src: "/clothing/jacket_puffer_olive.png" },
  { key: "coat_trench", category: "outerwear", keywords: ["trench coat", "long coat", "beige coat"], src: "/clothing/coat_trench.png" },
  { key: "coat_pea", category: "outerwear", keywords: ["pea coat", "wool coat", "navy coat"], src: "/clothing/coat_pea.png" },
  { key: "jeans", category: "bottom", keywords: ["jeans", "denim pants", "blue jeans"], src: "/clothing/jeans.png" },
  { key: "jumpsuit_navy", category: "bottom", keywords: ["jumpsuit", "romper", "navy jumpsuit", "one piece"], src: "/clothing/jumpsuit_navy.png" },
  { key: "joggers_gray", category: "bottom", keywords: ["joggers", "sweatpants", "athletic pants", "cargo pants", "cargo"], src: "/clothing/joggers_gray.png" },
  { key: "shorts_denim", category: "bottom", keywords: ["denim shorts", "jean shorts"], src: "/clothing/shorts_denim.png" },
  { key: "skirt_mini", category: "bottom", keywords: ["mini skirt", "short skirt", "black skirt"], src: "/clothing/skirt_mini.png" },
  { key: "skirt_maxi_pleated", category: "bottom", keywords: ["maxi skirt", "long pleated skirt", "midi skirt"], src: "/clothing/skirt_maxi_pleated.png" },
  { key: "sneakers", category: "shoes", keywords: ["sneakers", "trainers", "casual shoes"], src: "/clothing/sneakers.png" },
  { key: "sandals", category: "shoes", keywords: ["sandals", "flat sandals"], src: "/clothing/sandals.png" },
  { key: "boots_ankle", category: "shoes", keywords: ["ankle boots", "booties", "black boots"], src: "/clothing/boots_ankle.png" },
  { key: "loafers", category: "shoes", keywords: ["loafers", "slip-on shoes", "tan loafers"], src: "/clothing/loafers.png" },
  { key: "heels", category: "shoes", keywords: ["heels", "pumps", "dress shoes", "black heels"], src: "/clothing/heels.png" },
  { key: "oxfords_brown", category: "shoes", keywords: ["oxfords", "dress shoes", "brogues", "brown"], src: "/clothing/oxfords_brown.png" },
  { key: "dress_shoes_brown", category: "shoes", keywords: ["dress shoes", "derby shoes", "brown dress shoes"], src: "/clothing/dress_shoes_brown.png" },
];

function keywordScore(description: string, keywords: string[]): number {
  const text = description.toLowerCase();
  let total = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      // Multi-word keywords ("button-down", "denim jacket") are more specific
      // than single words, so a hit on one counts for more. Split on hyphens
      // too, or a hyphenated compound like "button-down" only ever counts as
      // one word and loses every tie to single-word keywords like "white".
      total += keyword.split(/[\s-]+/).length;
    }
  }
  return total;
}

// Best-effort visual match for a generic garment description. Returns null
// rather than a wrong guess when nothing scores above zero. The existing
// text description remains the authoritative detail either way.
export function matchClothingIcon(category: ClothingCategory, description: string): string | null {
  let best: ClothingIcon | null = null;
  let bestScore = 0;
  for (const icon of CLOTHING_ICONS) {
    if (icon.category !== category) continue;
    const score = keywordScore(description, icon.keywords);
    if (score > bestScore) {
      bestScore = score;
      best = icon;
    }
  }
  return best?.src ?? null;
}
