"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ChevronDownIcon, Trash2Icon } from "lucide-react";
import { Avatar } from "./Avatar";
import { useAssistantAvatar } from "@/lib/client/useAssistantAvatar";
import { getAssistantAvatar } from "@/lib/avatars";
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
  const [expandedCategories, setExpandedCategories] = useState<Set<ClosetCategory>>(new Set());
  const { key: assistantKey } = useAssistantAvatar();
  const assistantAvatarSrc = getAssistantAvatar(assistantKey).src;

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

  function toggleCategory(cat: ClosetCategory) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-title text-espresso">My closet</h2>
      <div className="flex items-start gap-2 rounded-card border border-brass bg-butter px-4 py-3 shadow-card">
        <Avatar src={assistantAvatarSrc} label="Outfit MC" />
        <p className="font-body text-body text-espresso">
          Log the tops, bottoms, outerwear, shoes, and accessories (even a watch) you already own. When you ask me
          for outfit ideas in chat, I&apos;ll mix pieces from here in with new suggestions, so you get looks built
          from what you have and what&apos;s worth adding.
        </p>
      </div>

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
        <div className="flex flex-col gap-2">
          {(Object.keys(CATEGORY_LABELS) as ClosetCategory[])
            .map((cat) => ({ cat, categoryItems: items.filter((item) => item.category === cat) }))
            .filter(({ categoryItems }) => categoryItems.length > 0)
            .map(({ cat, categoryItems }) => {
              const expanded = expandedCategories.has(cat);
              return (
                <div key={cat} className="rounded-card border border-brass">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between gap-2 rounded-card px-3 py-2.5 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
                  >
                    <span>
                      {CATEGORY_LABELS[cat]} ({categoryItems.length})
                    </span>
                    <ChevronDownIcon
                      className={`size-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {expanded && (
                    <ul className="flex flex-col gap-2 border-t border-brass p-2">
                      {categoryItems.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-small border border-brass px-3 py-2"
                        >
                          <span className="font-body text-small text-espresso">
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
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
