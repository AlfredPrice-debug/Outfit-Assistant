"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { Avatar } from "./Avatar";
import { useAssistantAvatar } from "@/lib/client/useAssistantAvatar";
import { getAssistantAvatar } from "@/lib/avatars";

// A page-anchored Outfit MC, separate from the chat conversation, for pages
// that aren't chat itself (My Closet, Outfit Cards) but could still use a
// line from her explaining what the page is for. Purely on-demand: closed
// by default, and never sends anything to Gemini.
export function AskOutfitMC({ message }: { message: string }) {
  const [open, setOpen] = useState(false);
  const { key } = useAssistantAvatar();
  const avatarSrc = getAssistantAvatar(key).src;

  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-2">
      {open && (
        <div
          role="status"
          className="flex max-w-[260px] items-start gap-2 rounded-card border border-brass bg-butter px-4 py-3 shadow-card"
        >
          <Avatar src={avatarSrc} size={32} label="Outfit MC" />
          <p className="font-body text-small text-espresso">{message}</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close Outfit MC's explanation"
            className="shrink-0 rounded-full p-1 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Ask Outfit MC what this page does"
        className="flex items-center gap-2 rounded-pill bg-amber px-4 py-2 font-utility text-utility uppercase text-espresso shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
      >
        <Avatar src={avatarSrc} size={24} label="" />
        Ask Outfit MC
      </button>
    </div>
  );
}
