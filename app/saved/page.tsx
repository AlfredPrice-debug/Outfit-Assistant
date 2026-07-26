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
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-porcelain">
      <NavHeader current="saved" />
      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        {error && (
          <div role="alert" className="rounded-small border border-brass bg-butter px-3 py-2 font-body text-small text-espresso">
            {error}
          </div>
        )}

        {outfits && outfits.length > 0 && (
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="occasion-filter" className="font-utility text-utility uppercase text-espresso">
                Occasion
              </label>
              <select
                id="occasion-filter"
                value={occasionFilter}
                onChange={(e) => setOccasionFilter(e.target.value)}
                className="rounded-small border border-brass bg-porcelain px-2 py-2 font-body text-small text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
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
              <label htmlFor="season-filter" className="font-utility text-utility uppercase text-espresso">
                Season
              </label>
              <select
                id="season-filter"
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="rounded-small border border-brass bg-porcelain px-2 py-2 font-body text-small text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="max-w-xs font-body text-body text-espresso">
              No saved outfits yet. Describe an occasion in chat and save the ones you like.
            </p>
            <Link
              href="/"
              className="rounded-pill bg-amber px-4 py-3 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
            >
              Describe an outfit
            </Link>
          </div>
        )}

        {outfits && outfits.length > 0 && filtered.length === 0 && (
          <p className="py-8 text-center font-body text-body text-espresso">No saved outfits match these filters.</p>
        )}

        <ul className="flex flex-col gap-6">
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
