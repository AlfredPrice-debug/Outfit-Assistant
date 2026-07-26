"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NavHeader } from "@/components/NavHeader";
import { OutfitCard, type OutfitWithId } from "@/components/OutfitCard";

export default function SavedPage() {
  const [outfits, setOutfits] = useState<OutfitWithId[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [occasionFilter, setOccasionFilter] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/outfits");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Couldn't load saved outfits.");
        setOutfits(data.outfits);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load saved outfits.");
      }
    })();
  }, []);

  const occasions = useMemo(
    () => [...new Set((outfits ?? []).map((o) => o.occasion))].sort(),
    [outfits],
  );
  const seasons = useMemo(
    () => [...new Set((outfits ?? []).map((o) => o.season))].sort(),
    [outfits],
  );

  const filtered = (outfits ?? []).filter(
    (o) => (!occasionFilter || o.occasion === occasionFilter) && (!seasonFilter || o.season === seasonFilter),
  );

  function handleUnsave(id: string, isSaved: boolean) {
    if (isSaved) return;
    setOutfits((prev) => (prev ? prev.filter((o) => o.id !== id) : prev));
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <NavHeader current="saved" />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        {error && (
          <div role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-900">
            {error}
          </div>
        )}

        {outfits && outfits.length > 0 && (
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="occasion-filter" className="text-xs font-medium text-brand-700">
                Occasion
              </label>
              <select
                id="occasion-filter"
                value={occasionFilter}
                onChange={(e) => setOccasionFilter(e.target.value)}
                className="rounded-lg border border-brand-200 bg-white px-2 py-2 text-sm text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <option value="">All</option>
                {occasions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="season-filter" className="text-xs font-medium text-brand-700">
                Season
              </label>
              <select
                id="season-filter"
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="rounded-lg border border-brand-200 bg-white px-2 py-2 text-sm text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <option value="">All</option>
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {outfits && outfits.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="max-w-xs text-brand-700">
              No saved outfits yet. Describe an occasion in chat and save the ones you like.
            </p>
            <Link
              href="/"
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900"
            >
              Go to chat
            </Link>
          </div>
        )}

        {outfits && outfits.length > 0 && filtered.length === 0 && (
          <p className="py-8 text-center text-brand-700">No saved outfits match these filters.</p>
        )}

        <ul className="flex flex-col gap-3">
          {filtered.map((outfit) => (
            <li key={outfit.id}>
              <OutfitCard outfit={outfit} onSaveChange={handleUnsave} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
