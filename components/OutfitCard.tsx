"use client";

import { useState } from "react";
import Image from "next/image";
import { SearchIcon } from "lucide-react";
import type { OutfitWithId } from "@/lib/apiTypes";
import { matchClothingIcon, type ClothingCategory } from "@/lib/clothingIcons";

export type { OutfitWithId };

const LAYER_LABELS: Record<"top" | "bottom" | "outerwear" | "shoes", string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  shoes: "Shoes",
};

export function OutfitCard({
  outfit,
  onSaveChange,
}: {
  outfit: OutfitWithId;
  onSaveChange?: (id: string, isSaved: boolean) => void;
}) {
  const [isSaved, setIsSaved] = useState(outfit.isSaved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUnavailable = outfit.id.startsWith("unsaved-");

  async function toggleSave() {
    const next = !isSaved;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/outfits/${outfit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSaved: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't update this outfit.");
      }
      setIsSaved(next);
      onSaveChange?.(outfit.id, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update this outfit.");
    } finally {
      setPending(false);
    }
  }

  const layerEntries = (["top", "bottom", "outerwear", "shoes"] as const)
    .map((key) => [key, outfit.itemsByLayer[key]] as const)
    .filter(([, value]) => value !== null && value !== undefined);

  // Best-effort visual match from a small curated icon set (see
  // lib/clothingIcons.ts): a scannable visual on top of the text
  // description, not a replacement for it. Free-form accessories aren't
  // matched; that list is open-ended text with no fixed icon set to match
  // against.
  const iconEntries: { key: string; label: string; src: string }[] = [];
  for (const [key, value] of layerEntries) {
    const src = matchClothingIcon(key as ClothingCategory, value as string);
    if (src) iconEntries.push({ key, label: LAYER_LABELS[key], src });
  }

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-card bg-butter shadow-card">
      {/* Color story bar: the actual garment colors, so the user can scan
          whether they own something close before reading a word. Hex values
          come from the model, not the app palette (the one place a color
          outside the seven tokens is expected). */}
      <div
        className="flex h-10 w-full shrink-0"
        role="img"
        aria-label={`Color story: ${outfit.colorStory.map((c) => c.name).join(", ")}`}
      >
        {outfit.colorStory.map((color, i) => (
          <span key={`${color.hex}-${i}`} className="flex-1" style={{ backgroundColor: color.hex }} />
        ))}
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-title text-espresso">{outfit.title}</h3>
          <button
            type="button"
            onClick={toggleSave}
            disabled={pending || isUnavailable}
            aria-pressed={isSaved}
            title={isUnavailable ? "Unavailable while the database is down" : undefined}
            className="shrink-0 rounded-pill bg-amber px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
          >
            {isSaved ? "Remove from saved" : "Save this look"}
          </button>
        </div>

        <p className="font-utility text-utility uppercase text-espresso">
          {outfit.occasion} · {outfit.season}
        </p>

        {iconEntries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {iconEntries.map((entry) => (
              <div
                key={entry.key}
                className="flex h-14 w-14 items-center justify-center rounded-small border border-brass bg-porcelain p-1"
              >
                <Image src={entry.src} alt={entry.label} width={40} height={40} className="object-contain" />
              </div>
            ))}
          </div>
        )}

        <dl className="flex flex-col gap-2">
          {layerEntries.map(([key, value]) => (
            <div key={key} className="flex gap-3">
              <dt className="w-24 shrink-0 font-utility text-utility uppercase text-espresso">{LAYER_LABELS[key]}</dt>
              <dd className="font-body text-body text-espresso">{value}</dd>
            </div>
          ))}
          {outfit.itemsByLayer.accessories.length > 0 && (
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 font-utility text-utility uppercase text-espresso">Accessories</dt>
              <dd className="font-body text-body text-espresso">{outfit.itemsByLayer.accessories.join(", ")}</dd>
            </div>
          )}
        </dl>

        <p className="font-body text-body text-espresso">{outfit.rationale}</p>

        <div>
          <h4 className="font-utility text-utility uppercase text-espresso">Inspiration</h4>
          {outfit.inspirationLinks.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-2">
              {outfit.inspirationLinks.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-small border border-brass bg-porcelain px-3 py-2 font-body text-small text-deepPool focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
                  >
                    <SearchIcon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="underline underline-offset-2">{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 font-body text-body text-espresso">No sources were found for this look.</p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-small bg-porcelain px-3 py-2 font-body text-small text-espresso">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
