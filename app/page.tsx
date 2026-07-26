"use client";

import { useEffect, useRef, useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { ChatInput, type PendingImage } from "@/components/ChatInput";
import { ExampleChips } from "@/components/ExampleChips";
import { OutfitCard, type OutfitWithId } from "@/components/OutfitCard";
import { Avatar } from "@/components/Avatar";
import { AvatarPicker } from "@/components/AvatarPicker";
import { MessageActions } from "@/components/MessageActions";
import { useUserAvatar } from "@/lib/client/useUserAvatar";
import type { ChatStreamEvent } from "@/lib/streamEvents";
import type { ChatHistoryMessage } from "@/lib/apiTypes";

type UIMessage =
  | { id: string; role: "user"; content: string; imagePreviewUrl?: string }
  | { id: string; role: "assistant"; outfits: OutfitWithId[]; sourceMessage: string }
  | { id: string; role: "assistant-error"; content: string; sourceMessage: string };

interface PendingState {
  retrying: boolean;
}

// Real progress from the model is just growing JSON — not something worth
// showing a person. A wardrobe joke is a better use of the wait than a raw
// text dump, and it doesn't need to be literally true to feel like progress.
const THINKING_MESSAGES = [
  "Currently butt naked, one sec…",
  "Digging through a thousand shoes…",
  "Interrogating the closet…",
  "Untangling a pile of hangers…",
  "Arguing with itself about socks…",
  "Asking the mirror for a second opinion…",
  "Trying on look number 47…",
  "Googling \"does this match\"…",
];

function formatOutfitsAsText(outfits: OutfitWithId[]): string {
  return outfits
    .map((outfit, i) => {
      const layers = [
        `Top: ${outfit.itemsByLayer.top}`,
        `Bottom: ${outfit.itemsByLayer.bottom}`,
        outfit.itemsByLayer.outerwear ? `Outerwear: ${outfit.itemsByLayer.outerwear}` : null,
        `Shoes: ${outfit.itemsByLayer.shoes}`,
        outfit.itemsByLayer.accessories.length ? `Accessories: ${outfit.itemsByLayer.accessories.join(", ")}` : null,
      ].filter(Boolean);
      return `${i + 1}. ${outfit.title} (${outfit.occasion}, ${outfit.season})\n${layers.join("\n")}\n${outfit.rationale}`;
    })
    .join("\n\n");
}

export default function ChatPage() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pending, setPending] = useState<PendingState | null>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { pose: userPose, setPose: setUserPose } = useUserAvatar();

  useEffect(() => {
    if (!pending || pending.retrying) return;
    const id = setInterval(() => {
      setThinkingIndex((i) => (i + 1) % THINKING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, [pending, pending?.retrying]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat");
        if (!res.ok) throw new Error();
        const data: { messages: ChatHistoryMessage[] } = await res.json();
        if (cancelled) return;
        let lastUserText = "";
        const loaded: UIMessage[] = data.messages.map((m) => {
          if (m.role === "user") {
            lastUserText = m.content ?? "";
            return { id: m.id, role: "user", content: m.content ?? "" };
          }
          return { id: m.id, role: "assistant", outfits: m.outfits ?? [], sourceMessage: lastUserText };
        });
        setMessages(loaded);
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

  async function sendMessage(text: string, image?: PendingImage) {
    setBanner(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}-${text.slice(0, 8)}`,
        role: "user",
        content: text,
        imagePreviewUrl: image?.previewUrl,
      },
    ]);
    setThinkingIndex(Math.floor(Math.random() * THINKING_MESSAGES.length));
    setPending({ retrying: false });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          ...(image ? { image: { mimeType: image.mimeType, data: image.data } } : {}),
        }),
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
            // Real generation progress, but raw JSON isn't meaningful to show
            // — the thinking message rotation above is the visible signal.
          } else if (event.type === "retry") {
            setPending({ retrying: true });
          } else if (event.type === "warning") {
            setBanner(event.message);
          } else if (event.type === "result") {
            settled = true;
            setPending(null);
            setMessages((prev) => [
              ...prev,
              { id: `assistant-${prev.length}`, role: "assistant", outfits: event.outfits, sourceMessage: text },
            ]);
          } else if (event.type === "error") {
            settled = true;
            setPending(null);
            setMessages((prev) => [
              ...prev,
              { id: `assistant-error-${prev.length}`, role: "assistant-error", content: event.message, sourceMessage: text },
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
            sourceMessage: text,
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
          sourceMessage: text,
        },
      ]);
    }
  }

  const isEmpty = !loadingHistory && messages.length === 0 && !pending;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-porcelain">
      <NavHeader current="chat" extra={<AvatarPicker pose={userPose} onPick={setUserPose} />} />
      <main className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
        {banner && (
          <div role="alert" className="mb-4 rounded-small border border-brass bg-butter px-3 py-2 font-body text-small text-espresso">
            {banner}
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
            <Avatar pose="greeting" size={72} label="Outfit Me" />
            <p className="max-w-xs font-body text-body text-espresso">
              Describe an occasion, season, or vibe — or attach a photo of a piece you want to build around — and get
              three outfit ideas with real inspiration links.
            </p>
            <ExampleChips onPick={sendMessage} />
          </div>
        )}

        <ul className="flex flex-col gap-6">
          {messages.map((message) => (
            <li key={message.id}>
              {message.role === "user" && (
                <div className="ml-auto flex max-w-[85%] items-end justify-end gap-2">
                  <div className="flex flex-col items-end gap-2">
                    {message.imagePreviewUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- transient client-side preview, not an optimizable asset
                      <img
                        src={message.imagePreviewUrl}
                        alt="Photo you attached"
                        className="h-24 w-24 rounded-card border border-brass object-cover"
                      />
                    )}
                    <div className="rounded-card bg-amber px-4 py-3 font-body text-body text-espresso">
                      {message.content}
                    </div>
                  </div>
                  <Avatar pose={userPose} label="You" />
                </div>
              )}
              {message.role === "assistant" && (
                <div className="flex flex-col gap-3">
                  <Avatar pose="greeting" label="Outfit Me" />
                  <div className="flex flex-col gap-6">
                    {message.outfits.map((outfit) => (
                      <OutfitCard key={outfit.id} outfit={outfit} />
                    ))}
                  </div>
                  <MessageActions
                    onRetry={() => sendMessage(message.sourceMessage)}
                    onCopy={() => formatOutfitsAsText(message.outfits)}
                  />
                </div>
              )}
              {message.role === "assistant-error" && (
                <div className="flex flex-col gap-3">
                  <Avatar pose="greeting" label="Outfit Me" />
                  <div
                    role="alert"
                    className="max-w-[85%] rounded-card border border-brass bg-butter px-4 py-3 font-body text-body text-espresso"
                  >
                    {message.content}
                  </div>
                  <button
                    type="button"
                    onClick={() => sendMessage(message.sourceMessage)}
                    className="w-fit font-utility text-utility uppercase text-deepPool underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
                  >
                    Try again
                  </button>
                </div>
              )}
            </li>
          ))}

          {pending && (
            <li aria-live="polite" className="flex flex-col gap-3">
              <Avatar pose="thinking" label="Outfit Me" />
              <div className="max-w-[85%] rounded-card border border-brass bg-butter px-4 py-3 font-body text-body text-espresso">
                {pending.retrying
                  ? "That didn't come back quite right — trying again…"
                  : THINKING_MESSAGES[thinkingIndex]}
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
