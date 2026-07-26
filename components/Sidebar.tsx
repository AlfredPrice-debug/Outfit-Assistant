"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MenuIcon, XIcon, PlusIcon, UserIcon, BookmarkIcon } from "lucide-react";

export function Sidebar({ current }: { current: "chat" | "saved" | "profile" }) {
  const [open, setOpen] = useState(false);
  const [startingNewChat, setStartingNewChat] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleNewChat() {
    setStartingNewChat(true);
    try {
      await fetch("/api/conversations", { method: "POST" });
    } finally {
      // A hard navigation guarantees the chat page re-fetches history from
      // scratch — its history load only runs once, on mount, so pushing to
      // the same route wouldn't pick up the freshly archived/created thread.
      window.location.href = "/";
    }
  }

  function linkClasses(active: boolean) {
    return `flex items-center gap-3 rounded-card px-3 py-2.5 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool ${
      active ? "bg-butter" : ""
    }`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="shrink-0 rounded-full p-2 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
      >
        <MenuIcon className="size-6" aria-hidden="true" />
      </button>

      <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-espresso/40 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <nav
          aria-label="Main menu"
          className={`absolute inset-y-0 left-0 flex w-64 max-w-[80%] flex-col gap-1 border-r border-brass bg-porcelain p-5 transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-title text-espresso">Menu</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-full p-1.5 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
            >
              <XIcon className="size-5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            disabled={startingNewChat}
            className={`${linkClasses(false)} border border-brass disabled:opacity-50`}
          >
            <PlusIcon className="size-5" aria-hidden="true" />
            Start new chat
          </button>

          <Link href="/profile" onClick={() => setOpen(false)} className={linkClasses(current === "profile")}>
            <UserIcon className="size-5" aria-hidden="true" />
            Profile
          </Link>

          <Link href="/saved" onClick={() => setOpen(false)} className={linkClasses(current === "saved")}>
            <BookmarkIcon className="size-5" aria-hidden="true" />
            Saved outfits
          </Link>
        </nav>
      </div>
    </>
  );
}
