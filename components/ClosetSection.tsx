"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Trash2Icon } from "lucide-react";
import type { ClosetCategory } from "@/lib/schemas";

interface ClosetItem {
  id: string;
  category: ClosetCategory;
  colorName: string;
  description: string;
}

const CATEGORY_LABELS: Record<ClosetCategory, string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessory",
};

export function ClosetSection() {
  const [items, setItems] = useState<ClosetItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ClosetCategory>("top");
  const [colorName, setColorName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/closet");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Couldn't load your closet.");
        setItems(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load your closet.");
      }
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!colorName.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, colorName: colorName.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't add that item.");
      setItems((prev) => [data.item, ...(prev ?? [])]);
      setColorName("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that item.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    const prev = items;
    setItems((current) => (current ?? []).filter((item) => item.id !== id));
    try {
      const res = await fetch(`/api/closet/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev ?? null);
      setError("Couldn't remove that item. Try again.");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-title text-espresso">My closet</h2>
      <p className="font-body text-body text-espresso">
        Log what you already own. Outfit suggestions don&apos;t draw on this yet, but it&apos;s here for when they
        do.
      </p>

      {error && (
        <p role="alert" className="font-body text-small text-espresso">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-card border border-brass p-3">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="closet-category">
            Category
          </label>
          <select
            id="closet-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ClosetCategory)}
            className="rounded-small border border-brass bg-porcelain px-2 py-2 font-body text-small text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="closet-color">
            Color
          </label>
          <input
            id="closet-color"
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
            placeholder="Color, e.g. navy"
            className="w-28 rounded-small border border-brass bg-porcelain px-2 py-2 font-body text-small text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
          />
        </div>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="closet-description">
            Description
          </label>
          <input
            id="closet-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. chinos"
            className="flex-1 rounded-small border border-brass bg-porcelain px-2 py-2 font-body text-small text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
          />
          <button
            type="submit"
            disabled={submitting || !colorName.trim() || !description.trim()}
            className="shrink-0 rounded-pill bg-amber px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      {items === null && !error && <p className="font-body text-small text-espresso">Loading…</p>}
      {items?.length === 0 && <p className="font-body text-small text-espresso">Nothing logged yet.</p>}
      {items && items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-small border border-brass px-3 py-2"
            >
              <span className="font-body text-small text-espresso">
                <span className="font-utility text-utility uppercase text-deepPool">
                  {CATEGORY_LABELS[item.category]}
                </span>{" "}
                {item.colorName} {item.description}
              </span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.description}`}
                className="shrink-0 rounded-full p-1.5 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
              >
                <Trash2Icon className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
