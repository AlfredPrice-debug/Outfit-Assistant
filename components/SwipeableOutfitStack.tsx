"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { CheckIcon, XIcon } from "lucide-react";
import type { OutfitWithId } from "@/lib/apiTypes";
import { readableTextColor, FALLBACK_CARD_HEX } from "@/lib/colorContrast";
import { OutfitDetailModal } from "./OutfitDetailModal";

const LAYER_LABELS: Record<"top" | "bottom" | "outerwear" | "shoes", string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  shoes: "Shoes",
};

const SWIPE_THRESHOLD = 120;

// Drag-to-decide card, used by SwipeableOutfitStack for the top (interactive)
// card in the stack. Kept separate from the plain preview below it so only
// the top card pays for framer-motion's drag/gesture wiring.
function DraggableOutfitPreview({
  outfit,
  exitDirection,
  onDecide,
  onOpenDetail,
}: {
  outfit: OutfitWithId;
  exitDirection: "left" | "right" | null;
  onDecide: (direction: "left" | "right") => void;
  onOpenDetail: () => void;
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
      // framer-motion writes its own touch-action (pan-y, for a single-axis
      // x drag) directly onto this element's inline style to allow native
      // vertical scrolling alongside the JS-driven horizontal drag. That's
      // exactly the behavior causing the page to wobble/scroll mid-swipe,
      // and a plain class can't out-rank an inline style, so this needs
      // !important to actually win and hand the whole gesture to the drag
      // handler instead.
      className="absolute inset-0 z-10 !touch-none cursor-grab active:cursor-grabbing"
    >
      <OutfitPreviewCard outfit={outfit} onOpenDetail={onOpenDetail} />
      <motion.span
        style={{ opacity: keepOpacity }}
        className="pointer-events-none absolute right-4 top-4 rounded-pill bg-amber px-3 py-1 font-utility text-utility uppercase text-espresso shadow-card"
      >
        Keep in Chat
      </motion.span>
      <motion.span
        style={{ opacity: discardOpacity }}
        className="pointer-events-none absolute left-4 top-4 rounded-pill bg-espresso px-3 py-1 font-utility text-utility uppercase text-porcelain shadow-card"
      >
        Toss It
      </motion.span>
    </motion.div>
  );
}

function OutfitPreviewCard({
  outfit,
  onOpenDetail,
}: {
  outfit: OutfitWithId;
  // Undefined for the non-interactive background card in the stack, which
  // renders the hint as plain text instead of a button.
  onOpenDetail?: () => void;
}) {
  const layerEntries = (["top", "bottom", "outerwear", "shoes"] as const)
    .map((key) => [key, outfit.itemsByLayer[key]] as const)
    .filter(([, value]) => value !== null && value !== undefined);

  // The card itself takes on the outfit's own lead color, rather than the
  // fixed design-system card color, so the stack visually matches what
  // each look actually looks like. Text switches to whichever of the two
  // brand neutrals stays readable against that color.
  const backgroundHex = outfit.colorStory[0]?.hex ?? FALLBACK_CARD_HEX;
  const textColor = readableTextColor(backgroundHex);

  return (
    <article
      style={{ backgroundColor: backgroundHex, color: textColor }}
      className="flex h-full w-full select-none flex-col overflow-hidden rounded-card shadow-card"
    >
      <div
        className="flex h-8 w-full shrink-0"
        role="img"
        aria-label={`Color story: ${outfit.colorStory.map((c) => c.name).join(", ")}`}
      >
        {outfit.colorStory.map((color, i) => (
          <span key={`${color.hex}-${i}`} className="flex-1" style={{ backgroundColor: color.hex }} />
        ))}
      </div>
      {/* No scrolling here, on purpose: an internally scrollable card fights
          a horizontal swipe gesture the moment a touch drifts even slightly
          vertically, which is exactly the "page moves while swiping" bug.
          Long text just gets clipped to a preview with a "…" instead. */}
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <h3 className="truncate font-display text-title">{outfit.title}</h3>
        <p className="truncate font-utility text-utility uppercase">
          {outfit.occasion} · {outfit.season}
        </p>
        <dl className="flex flex-col gap-1.5">
          {layerEntries.map(([key, value]) => (
            <div key={key} className="flex gap-3">
              <dt className="w-24 shrink-0 font-utility text-utility uppercase">{LAYER_LABELS[key]}</dt>
              <dd className="truncate font-body text-small">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="line-clamp-3 font-body text-small">{outfit.rationale}</p>
      </div>
      {onOpenDetail ? (
        <button
          type="button"
          onClick={onOpenDetail}
          // Stops the parent draggable's own pointer handling from treating
          // this press as the start of a swipe, so a tap here always reaches
          // this button's click instead of ever being read as a card drag.
          onPointerDownCapture={(e) => e.stopPropagation()}
          className="shrink-0 px-4 pb-3 text-right font-utility text-utility uppercase underline underline-offset-2 opacity-70"
        >
          Tap for details
        </button>
      ) : (
        <p className="shrink-0 px-4 pb-3 text-right font-utility text-utility uppercase opacity-70">
          Tap for details
        </p>
      )}
    </article>
  );
}

export function SwipeableOutfitStack({
  outfits,
  keptIds,
  discardedIds,
  onDecide,
}: {
  outfits: OutfitWithId[];
  keptIds: string[];
  discardedIds: string[];
  onDecide: (outfitId: string, direction: "left" | "right") => void;
}) {
  const [exiting, setExiting] = useState<{ id: string; direction: "left" | "right" } | null>(null);
  const [detailOutfit, setDetailOutfit] = useState<OutfitWithId | null>(null);

  const remaining = outfits.filter((o) => !keptIds.includes(o.id) && !discardedIds.includes(o.id));
  const total = outfits.length;
  const decidedCount = total - remaining.length;

  function decide(direction: "left" | "right") {
    const top = remaining[0];
    if (!top || exiting) return;
    setExiting({ id: top.id, direction });
    setTimeout(() => {
      onDecide(top.id, direction);
      setExiting(null);
    }, 250);
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
            // Neither card sets a CSS position offset the browser would use
            // to order them, so without an explicit z-index the *later*
            // sibling (the non-interactive card behind) paints over the
            // interactive top card and swallows its drag/click events.
            const zIndex = 2 - i;
            if (!isTop) {
              return (
                <div
                  key={outfit.id}
                  style={{ zIndex }}
                  className="absolute inset-0 scale-[0.95] translate-y-3"
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
                onOpenDetail={() => setDetailOutfit(outfit)}
              />
            );
          })}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => decide("left")}
          aria-label="Toss this look"
          className="flex items-center gap-1.5 rounded-pill border border-brass px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
        >
          <XIcon className="size-4" aria-hidden="true" />
          Toss It
        </button>
        <button
          type="button"
          onClick={() => decide("right")}
          aria-label="Keep this look in chat"
          className="flex items-center gap-1.5 rounded-pill bg-amber px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
        >
          <CheckIcon className="size-4" aria-hidden="true" />
          Keep in Chat
        </button>
      </div>
      {detailOutfit && (
        <OutfitDetailModal outfit={detailOutfit} matchOutfitColor onClose={() => setDetailOutfit(null)} />
      )}
    </div>
  );
}
