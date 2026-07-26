"use client";

import { useEffect, useState } from "react";
import { NavHeader } from "@/components/NavHeader";

interface ConversationSummary {
  id: string;
  createdAt: string;
  preview: string;
}

export default function HistoryPage() {
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/conversations");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Couldn't load chat history.");
        setConversations(data.conversations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load chat history.");
      }
    })();
  }, []);

  async function resume(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      // A hard navigation guarantees the chat page re-fetches history from
      // scratch, same reasoning as "Start new chat" in the sidebar.
      window.location.href = "/";
    } catch {
      setError("Couldn't resume that chat, try again.");
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setConversations((prev) => (prev ?? []).filter((conversation) => conversation.id !== id));
      setConfirmingDeleteId(null);
    } catch {
      setError("Couldn't delete that chat, try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-porcelain pt-16">
      <NavHeader current="history" />
      <main className="flex flex-1 flex-col gap-4 px-5 py-6">
        <h2 className="font-display text-title text-espresso">Chat history</h2>
        <p className="font-body text-body text-espresso">
          Old conversations, archived whenever you start a new chat. Resume one to pick back up, or delete it for
          good.
        </p>

        {error && (
          <p role="alert" className="font-body text-small text-espresso">
            {error}
          </p>
        )}

        {conversations === null && !error && <p className="font-body text-small text-espresso">Loading…</p>}
        {conversations?.length === 0 && <p className="font-body text-small text-espresso">No archived chats yet.</p>}

        <ul className="flex flex-col gap-3">
          {conversations?.map((conversation) => (
            <li key={conversation.id} className="flex flex-col gap-2 rounded-card border border-brass p-3">
              <p className="font-body text-small text-espresso">{conversation.preview}</p>
              <p className="font-utility text-utility uppercase text-deepPool">
                {new Date(conversation.createdAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => resume(conversation.id)}
                  disabled={busyId === conversation.id}
                  className="rounded-pill bg-amber px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
                >
                  Resume
                </button>
                {confirmingDeleteId === conversation.id ? (
                  <button
                    type="button"
                    onClick={() => remove(conversation.id)}
                    disabled={busyId === conversation.id}
                    className="rounded-pill border border-brass px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
                  >
                    Confirm delete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(conversation.id)}
                    className="rounded-pill border border-brass px-4 py-2 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
