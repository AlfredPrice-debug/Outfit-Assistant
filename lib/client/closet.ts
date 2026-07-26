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

// Returns the created rows' ids so the caller can track them and later
// undo the add (toggling an outfit back out of the closet deletes exactly
// these rows, rather than guessing which closet rows came from where).
export async function addOutfitToCloset(outfit: OutfitWithId): Promise<string[]> {
  const items = closetItemsForOutfit(outfit);
  const ids: string[] = [];
  for (const item of items) {
    const res = await fetch("/api/closet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      throw new Error("Couldn't add this outfit to your closet.");
    }
    const data = await res.json();
    ids.push(data.item.id);
  }
  return ids;
}

export async function removeClosetItems(ids: string[]): Promise<void> {
  const results = await Promise.all(ids.map((id) => fetch(`/api/closet/${id}`, { method: "DELETE" })));
  if (results.some((res) => !res.ok)) {
    throw new Error("Couldn't remove this outfit from your closet.");
  }
}
