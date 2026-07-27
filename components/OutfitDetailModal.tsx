"use client";

import { useEffect } from "react";
import { XIcon } from "lucide-react";
import { OutfitCard, type OutfitWithId } from "./OutfitCard";

// Full, un-truncated view of an outfit, opened from a tap on a card that's
// otherwise showing a clipped preview (the swipe stack, which can't scroll
// internally without fighting the drag gesture). Reuses OutfitCard as-is, so
// save/add-to-closet still work live from inside the modal.
export function OutfitDetailModal({
  outfit,
  matchOutfitColor = false,
  onClose,
}: {
  outfit: OutfitWithId;
  matchOutfitColor?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-espresso/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${outfit.title} details`}
        className="relative flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-card shadow-card"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Minimize"
          title="Minimize"
          className="absolute right-3 top-3 z-10 rounded-full bg-porcelain p-1.5 text-espresso shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
        >
          <XIcon className="size-5" aria-hidden="true" />
        </button>
        <div className="overflow-y-auto bg-porcelain">
          <OutfitCard outfit={outfit} matchOutfitColor={matchOutfitColor} />
        </div>
      </div>
    </div>
  );
}
