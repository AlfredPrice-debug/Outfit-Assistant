"use client";

import { useState } from "react";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";

export function MessageActions({
  onRetry,
  onCopy,
}: {
  onRetry: () => void;
  onCopy: () => string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = onCopy();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser; the button simply
      // does nothing rather than throwing an error at the user over it.
    }
  }

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
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy these outfits as text"
        title="Copy these outfits as text"
        className="rounded-pill border border-brass p-2 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
      >
        <CopyIcon className="size-4" aria-hidden="true" />
      </button>
      {copied && <span className="font-utility text-utility uppercase text-espresso">Copied</span>}
    </div>
  );
}
