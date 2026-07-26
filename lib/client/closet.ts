import type { OutfitWithId } from "@/lib/apiTypes";
import type { ClosetItemInput } from "@/lib/schemas";

// ClosetItem has no per-item color field, so every layer/accessory pulled
// from one outfit shares its first colorStory entry as a best-effort color.
export function closetItemsForOutfit(outfit: OutfitWithId): ClosetItemInput[] {
  const colorName = outfit.colorStory[0]?.name ?? "Unspecified";
  const layers: Array<[ClosetItemInput["category"], string | null]> = [
    ["top", outfit.itemsByLayer.top],
    ["bottom", outfit.itemsByLayer.bottom],
    ["outerwear", outfit.itemsByLayer.outerwear],
    ["shoes", outfit.itemsByLayer.shoes],
  ];

  const items: ClosetItemInput[] = layers
    .filter((entry): entry is [ClosetItemInput["category"], string] => entry[1] !== null)
    .map(([category, description]) => ({ category, colorName, description }));

  for (const accessory of outfit.itemsByLayer.accessories) {
    items.push({ category: "accessory", colorName, description: accessory });
  }

  return items;
}

export async function addOutfitToCloset(outfit: OutfitWithId): Promise<void> {
  const items = closetItemsForOutfit(outfit);
  for (const item of items) {
    const res = await fetch("/api/closet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      throw new Error("Couldn't add this outfit to your closet.");
    }
  }
}
