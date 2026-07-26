"use client";

import { useState } from "react";
import type { OutfitWithId } from "@/lib/apiTypes";

export type { OutfitWithId };

const LAYER_LABELS: Record<string, string> = {
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

  return (
    <article className="flex w-full flex-col gap-3 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-brand-900">{outfit.title}</h3>
        <button
          type="button"
          onClick={toggleSave}
          disabled={pending || outfit.id.startsWith("unsaved-")}
          aria-pressed={isSaved}
          title={outfit.id.startsWith("unsaved-") ? "Unavailable while the database is down" : undefined}
          className="shrink-0 rounded-full border border-brand-500 px-3 py-1.5 text-sm font-medium text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50"
        >
          {isSaved ? "★ Saved" : "☆ Save"}
        </button>
      </div>

      <p className="text-xs uppercase tracking-wide text-brand-500">
        {outfit.occasion} · {outfit.season}
      </p>

      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm">
        {layerEntries.map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <dt className="w-24 shrink-0 font-medium text-brand-700">{LAYER_LABELS[key]}</dt>
            <dd className="text-brand-900">{value}</dd>
          </div>
        ))}
        {outfit.itemsByLayer.accessories.length > 0 && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 font-medium text-brand-700">Accessories</dt>
            <dd className="text-brand-900">{outfit.itemsByLayer.accessories.join(", ")}</dd>
          </div>
        )}
      </dl>

      <p className="text-sm text-brand-700">{outfit.rationale}</p>

      <div className="border-t border-brand-100 pt-3">
        <h4 className="text-xs font-medium uppercase tracking-wide text-brand-500">Inspiration</h4>
        {outfit.inspirationLinks.length > 0 ? (
          <ul className="mt-1 flex flex-col gap-1">
            {outfit.inspirationLinks.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-brand-500">No sources were found for this look.</p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </article>
  );
}
