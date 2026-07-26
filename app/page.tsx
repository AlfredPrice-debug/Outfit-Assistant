"use client";

import { useEffect, useRef, useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { ChatInput } from "@/components/ChatInput";
import { ExampleChips } from "@/components/ExampleChips";
import { OutfitCard, type OutfitWithId } from "@/components/OutfitCard";
import type { ChatStreamEvent } from "@/lib/streamEvents";
import type { ChatHistoryMessage } from "@/lib/apiTypes";

type UIMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; outfits: OutfitWithId[] }
  | { id: string; role: "assistant-error"; content: string };

interface PendingState {
  previewText: string;
  retrying: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pending, setPending] = useState<PendingState | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat");
        if (!res.ok) throw new Error();
        const data: { messages: ChatHistoryMessage[] } = await res.json();
        if (cancelled) return;
        setMessages(
          data.messages.map((m) =>
            m.role === "user"
              ? { id: m.id, role: "user", content: m.content ?? "" }
              : { id: m.id, role: "assistant", outfits: m.outfits ?? [] },
          ),
        );
      } catch {
        if (!cancelled) setBanner("Couldn't load chat history — the database may be unavailable.");
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function sendMessage(text: string) {
    setBanner(null);
    setMessages((prev) => [...prev, { id: `local-${prev.length}-${text.slice(0, 8)}`, role: "user", content: text }]);
    setPending({ previewText: "", retrying: false });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong talking to the assistant.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let settled = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event: ChatStreamEvent = JSON.parse(line);
          if (event.type === "chunk") {
            setPending((prev) => ({ previewText: (prev?.previewText ?? "") + event.text, retrying: false }));
          } else if (event.type === "retry") {
            setPending({ previewText: "", retrying: true });
          } else if (event.type === "warning") {
            setBanner(event.message);
          } else if (event.type === "result") {
            settled = true;
            setPending(null);
            setMessages((prev) => [
              ...prev,
              { id: `assistant-${prev.length}`, role: "assistant", outfits: event.outfits },
            ]);
          } else if (event.type === "error") {
            settled = true;
            setPending(null);
            setMessages((prev) => [
              ...prev,
              { id: `assistant-error-${prev.length}`, role: "assistant-error", content: event.message },
            ]);
          }
        }
      }

      if (!settled) {
        setPending(null);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-error-${prev.length}`,
            role: "assistant-error",
            content: "The connection ended unexpectedly before a response arrived.",
          },
        ]);
      }
    } catch (err) {
      setPending(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${prev.length}`,
          role: "assistant-error",
          content: err instanceof Error ? err.message : "Something went wrong talking to the assistant.",
        },
      ]);
    }
  }

  const isEmpty = !loadingHistory && messages.length === 0 && !pending;

  return (
    <div className="flex min-h-dvh flex-col">
      <NavHeader current="chat" />
      <main className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        {banner && (
          <div role="alert" className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
            {banner}
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
            <p className="max-w-xs text-brand-700">
              Describe an occasion, season, or vibe and get three outfit ideas with real inspiration links.
            </p>
            <ExampleChips onPick={sendMessage} />
          </div>
        )}

        <ul className="flex flex-col gap-4">
          {messages.map((message) => (
            <li key={message.id}>
              {message.role === "user" && (
                <div className="ml-auto max-w-[85%] rounded-2xl bg-brand-600 px-4 py-2.5 text-white">
                  {message.content}
                </div>
              )}
              {message.role === "assistant" && (
                <div className="flex flex-col gap-3">
                  {message.outfits.map((outfit) => (
                    <OutfitCard key={outfit.id} outfit={outfit} />
                  ))}
                </div>
              )}
              {message.role === "assistant-error" && (
                <div role="alert" className="max-w-[85%] rounded-2xl bg-red-100 px-4 py-2.5 text-red-900">
                  {message.content}
                </div>
              )}
            </li>
          ))}

          {pending && (
            <li aria-live="polite">
              <div className="max-w-[85%] rounded-2xl bg-white px-4 py-2.5 text-sm text-brand-700 shadow-sm">
                {pending.retrying
                  ? "That didn't come back quite right — trying again…"
                  : pending.previewText || "Thinking…"}
              </div>
            </li>
          )}
        </ul>
        <div ref={bottomRef} />
      </main>
      <ChatInput onSend={sendMessage} disabled={Boolean(pending)} />
    </div>
  );
}
