"use client";

import { useState, type FormEvent } from "react";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={onSubmit} className="sticky bottom-0 flex items-end gap-2 bg-porcelain px-5 py-4">
      <label htmlFor="chat-input" className="sr-only">
        Describe an occasion, season, or vibe
      </label>
      <textarea
        id="chat-input"
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e);
          }
        }}
        placeholder="e.g. summer outfit ideas for a coffee date"
        disabled={disabled}
        className="min-h-[2.75rem] flex-1 resize-none rounded-card border border-brass bg-porcelain px-4 py-3 font-body text-body text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-pill bg-amber px-5 py-3 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
