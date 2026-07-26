"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { CheckIcon, XIcon, Undo2Icon } from "lucide-react";
import type { OutfitWithId } from "@/lib/apiTypes";

const LAYER_LABELS: Record<"top" | "bottom" | "outerwear" | "shoes", string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  shoes: "Shoes",
};

const SWIPE_THRESHOLD = 120;

interface SwipeHistoryEntry {
  id: string;
  direction: "left" | "right";
}

// Drag-to-decide card, used by SwipeableOutfitStack for the top (interactive)
// card in the stack. Kept separate from the plain preview below it so only
// the top card pays for framer-motion's drag/gesture wiring.
function DraggableOutfitPreview({
  outfit,
  exitDirection,
  onDecide,
}: {
  outfit: OutfitWithId;
  exitDirection: "left" | "right" | null;
  onDecide: (direction: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const keepOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  const discardOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);

  return (
    <motion.div
      drag={exitDirection ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      style={{ x, rotate }}
      onDragEnd={(_e, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) onDecide("right");
        else if (info.offset.x < -SWIPE_THRESHOLD) onDecide("left");
      }}
      initial={{ scale: 0.95, y: 12, opacity: 0 }}
      animate={
        exitDirection
          ? {
              x: exitDirection === "right" ? 320 : -320,
              rotate: exitDirection === "right" ? 20 : -20,
              opacity: 0,
              transition: { duration: 0.25, ease: "easeIn" },
            }
          : { scale: 1, y: 0, opacity: 1, transition: { duration: 0.2, ease: "easeOut" } }
      }
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <OutfitPreviewCard outfit={outfit} />
      <motion.span
        style={{ opacity: keepOpacity }}
        className="pointer-events-none absolute right-4 top-4 rounded-pill bg-amber px-3 py-1 font-utility text-utility uppercase text-espresso shadow-card"
      >
        Keep
      </motion.span>
      <motion.span
        style={{ opacity: discardOpacity }}
        className="pointer-events-none absolute left-4 top-4 rounded-pill bg-espresso px-3 py-1 font-utility text-utility uppercase text-porcelain shadow-card"
      >
        Discard
      </motion.span>
    </motion.div>
  );
}

function OutfitPreviewCard({ outfit }: { outfit: OutfitWithId }) {
  const layerEntries = (["top", "bottom", "outerwear", "shoes"] as const)
    .map((key) => [key, outfit.itemsByLayer[key]] as const)
    .filter(([, value]) => value !== null && value !== undefined);

  return (
    <article className="flex h-full w-full select-none flex-col overflow-hidden rounded-card bg-butter shadow-card">
      <div
        className="flex h-8 w-full shrink-0"
        role="img"
        aria-label={`Color story: ${outfit.colorStory.map((c) => c.name).join(", ")}`}
      >
        {outfit.colorStory.map((color, i) => (
          <span key={`${color.hex}-${i}`} className="flex-1" style={{ backgroundColor: color.hex }} />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <h3 className="font-display text-title text-espresso">{outfit.title}</h3>
        <p className="font-utility text-utility uppercase text-espresso">
          {outfit.occasion} · {outfit.season}
        </p>
        <dl className="flex flex-col gap-1.5">
          {layerEntries.map(([key, value]) => (
            <div key={key} className="flex gap-3">
              <dt className="w-24 shrink-0 font-utility text-utility uppercase text-espresso">{LAYER_LABELS[key]}</dt>
              <dd className="font-body text-small text-espresso">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="font-body text-small text-espresso">{outfit.rationale}</p>
      </div>
    </article>
  );
}

export function SwipeableOutfitStack({
  outfits,
  keptIds,
  discardedIds,
  onDecide,
  onUndo,
}: {
  outfits: OutfitWithId[];
  keptIds: string[];
  discardedIds: string[];
  onDecide: (outfitId: string, direction: "left" | "right") => void;
  onUndo: (outfitId: string) => void;
}) {
  const [history, setHistory] = useState<SwipeHistoryEntry[]>([]);
  const [exiting, setExiting] = useState<{ id: string; direction: "left" | "right" } | null>(null);

  const remaining = outfits.filter((o) => !keptIds.includes(o.id) && !discardedIds.includes(o.id));
  const total = outfits.length;
  const decidedCount = total - remaining.length;

  function decide(direction: "left" | "right") {
    const top = remaining[0];
    if (!top || exiting) return;
    setExiting({ id: top.id, direction });
    setTimeout(() => {
      setHistory((prev) => [...prev, { id: top.id, direction }]);
      onDecide(top.id, direction);
      setExiting(null);
    }, 250);
  }

  function undo() {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((prev) => prev.slice(0, -1));
    onUndo(last.id);
  }

  if (remaining.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center font-utility text-utility uppercase text-espresso">
        {decidedCount + 1} of {total}
      </p>
      <div className="relative h-[340px] w-full">
        <AnimatePresence>
          {remaining.slice(0, 2).map((outfit, i) => {
            const isTop = i === 0;
            if (!isTop) {
              return (
                <div
                  key={outfit.id}
                  className="absolute inset-0 scale-[0.95] translate-y-3 opacity-70"
                  aria-hidden="true"
                >
                  <OutfitPreviewCard outfit={outfit} />
                </div>
              );
            }
            return (
              <DraggableOutfitPreview
                key={outfit.id}
                outfit={outfit}
                exitDirection={exiting?.id === outfit.id ? exiting.direction : null}
                onDecide={decide}
              />
            );
          })}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={undo}
          disabled={history.length === 0}
          aria-label="Undo last swipe"
          title="Undo last swipe"
          className="flex items-center gap-1.5 rounded-pill border border-brass px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-40"
        >
          <Undo2Icon className="size-4" aria-hidden="true" />
          Undo
        </button>
        <button
          type="button"
          onClick={() => decide("left")}
          aria-label="Discard this look"
          className="flex items-center gap-1.5 rounded-pill border border-brass px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
        >
          <XIcon className="size-4" aria-hidden="true" />
          Discard
        </button>
        <button
          type="button"
          onClick={() => decide("right")}
          aria-label="Keep this look"
          className="flex items-center gap-1.5 rounded-pill bg-amber px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
        >
          <CheckIcon className="size-4" aria-hidden="true" />
          Keep
        </button>
      </div>
    </div>
  );
}
