"use client";

import { RefreshCcwIcon } from "lucide-react";

export function MessageActions({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onRetry}
        aria-label="Regenerate these outfits"
        title="Regenerate these outfits"
        className="rounded-pill border border-brass p-2 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
      >
        <RefreshCcwIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
