"use client";

import { useState, type CSSProperties } from "react";
import { SearchIcon } from "lucide-react";
import type { OutfitWithId } from "@/lib/apiTypes";
import { addOutfitToCloset } from "@/lib/client/closet";
import { readableTextColor, FALLBACK_CARD_HEX } from "@/lib/colorContrast";

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
  showAddToCloset = false,
  matchOutfitColor = false,
}: {
  outfit: OutfitWithId;
  onSaveChange?: (id: string, isSaved: boolean) => void;
  showAddToCloset?: boolean;
  // When true, the card keeps the same lead-color background it had as a
  // swipe card instead of switching to the standard gradient, so a kept
  // outfit doesn't visibly change color the moment it lands in the chat.
  matchOutfitColor?: boolean;
}) {
  const [isSaved, setIsSaved] = useState(outfit.isSaved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUnavailable = outfit.id.startsWith("unsaved-");

  const [addedToCloset, setAddedToCloset] = useState(false);
  const [addingToCloset, setAddingToCloset] = useState(false);
  const [closetError, setClosetError] = useState<string | null>(null);

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

  async function handleAddToCloset() {
    setAddingToCloset(true);
    setClosetError(null);
    try {
      await addOutfitToCloset(outfit);
      setAddedToCloset(true);
    } catch (err) {
      setClosetError(err instanceof Error ? err.message : "Couldn't add this outfit to your closet.");
    } finally {
      setAddingToCloset(false);
    }
  }

  const layerEntries = (["top", "bottom", "outerwear", "shoes"] as const)
    .map((key) => [key, outfit.itemsByLayer[key]] as const)
    .filter(([, value]) => value !== null && value !== undefined);

  const backgroundHex = outfit.colorStory[0]?.hex ?? FALLBACK_CARD_HEX;
  const textStyle: CSSProperties | undefined = matchOutfitColor
    ? { color: readableTextColor(backgroundHex) }
    : undefined;

  return (
    // Gradient (not a flat fill) is what reads as a raised, lit card rather
    // than a flat rectangle; both stops are locked-palette tokens. When
    // matching an outfit's own color, that solid color wins instead (an
    // inline style always beats a class), keeping continuity with how the
    // card looked while it was still in the swipe stack.
    <article
      style={matchOutfitColor ? { backgroundColor: backgroundHex } : undefined}
      className="flex w-full flex-col overflow-hidden rounded-card bg-gradient-to-br from-butter to-brass shadow-card"
    >
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
          <h3 style={textStyle} className="font-display text-title text-espresso">
            {outfit.title}
          </h3>
          <button
            type="button"
            onClick={toggleSave}
            disabled={pending || isUnavailable}
            aria-pressed={isSaved}
            title={isUnavailable ? "Unavailable while the database is down" : undefined}
            className="shrink-0 rounded-pill bg-amber px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
          >
            {isSaved ? "Remove OutFit Card" : "Save OutFit Card"}
          </button>
        </div>

        <p style={textStyle} className="font-utility text-utility uppercase text-espresso">
          {outfit.occasion} · {outfit.season}
        </p>

        <dl className="flex flex-col gap-2">
          {layerEntries.map(([key, value]) => (
            <div key={key} className="flex gap-3">
              <dt style={textStyle} className="w-24 shrink-0 font-utility text-utility uppercase text-espresso">
                {LAYER_LABELS[key]}
              </dt>
              <dd style={textStyle} className="font-body text-body text-espresso">
                {value}
              </dd>
            </div>
          ))}
          {outfit.itemsByLayer.accessories.length > 0 && (
            <div className="flex gap-3">
              <dt style={textStyle} className="w-24 shrink-0 font-utility text-utility uppercase text-espresso">
                Accessories
              </dt>
              <dd style={textStyle} className="font-body text-body text-espresso">
                {outfit.itemsByLayer.accessories.join(", ")}
              </dd>
            </div>
          )}
        </dl>

        <p style={textStyle} className="font-body text-body text-espresso">
          {outfit.rationale}
        </p>

        <div>
          <h4 style={textStyle} className="font-utility text-utility uppercase text-espresso">
            Inspiration
          </h4>
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
            <p style={textStyle} className="mt-2 font-body text-body text-espresso">
              No sources were found for this look.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-small bg-porcelain px-3 py-2 font-body text-small text-espresso">
            {error}
          </p>
        )}

        {showAddToCloset && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleAddToCloset}
              disabled={addingToCloset || addedToCloset}
              className="rounded-pill border border-brass px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
            >
              {addedToCloset ? "Added to closet" : "Add to closet"}
            </button>
            {closetError && (
              <p role="alert" className="rounded-small bg-porcelain px-3 py-2 font-body text-small text-espresso">
                {closetError}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
