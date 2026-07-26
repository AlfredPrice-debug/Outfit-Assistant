"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MenuIcon,
  XIcon,
  PlusIcon,
  MessageCircleIcon,
  UserIcon,
  HistoryIcon,
  ShirtIcon,
  BookmarkIcon,
} from "lucide-react";

export function Sidebar({ current }: { current: "chat" | "saved" | "profile" | "history" | "closet" }) {
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
      // scratch. Its history load only runs once, on mount, so pushing to
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
          <div className="relative mb-4 flex h-8 items-center justify-end">
            <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
              <Image src="/logo-icon.png" alt="" width={18} height={24} aria-hidden="true" />
              <h2 className="font-display text-title text-espresso">Menu</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-full p-1.5 text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
            >
              <XIcon className="size-5" aria-hidden="true" />
            </button>
          </div>

          <Link href="/" onClick={() => setOpen(false)} className={linkClasses(current === "chat")}>
            <MessageCircleIcon className="size-5" aria-hidden="true" />
            Chat
          </Link>

          <button
            type="button"
            onClick={handleNewChat}
            disabled={startingNewChat}
            className={`${linkClasses(false)} disabled:opacity-50`}
          >
            <PlusIcon className="size-5" aria-hidden="true" />
            Start new chat
          </button>

          <Link href="/profile" onClick={() => setOpen(false)} className={linkClasses(current === "profile")}>
            <UserIcon className="size-5" aria-hidden="true" />
            Profile
          </Link>

          <Link href="/closet" onClick={() => setOpen(false)} className={linkClasses(current === "closet")}>
            <ShirtIcon className="size-5" aria-hidden="true" />
            My Closet
          </Link>

          <Link href="/saved" onClick={() => setOpen(false)} className={linkClasses(current === "saved")}>
            <BookmarkIcon className="size-5" aria-hidden="true" />
            Outfit Cards
          </Link>

          <Link href="/history" onClick={() => setOpen(false)} className={linkClasses(current === "history")}>
            <HistoryIcon className="size-5" aria-hidden="true" />
            Chat history
          </Link>
        </nav>
      </div>
    </>
  );
}
