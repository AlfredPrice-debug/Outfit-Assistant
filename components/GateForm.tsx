"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function GateForm({ next, configError }: { next: string; configError: boolean }) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(
    configError ? "The app isn't fully configured yet (APP_PASSCODE is missing on the server)." : null,
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      router.replace(next || "/");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="passcode" className="font-utility text-utility uppercase text-espresso">
          Passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          autoComplete="current-password"
          required
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full rounded-card border border-brass bg-porcelain px-4 py-3 font-body text-body text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "passcode-error" : undefined}
        />
      </div>
      {error && (
        <p
          id="passcode-error"
          role="alert"
          className="rounded-small border border-brass bg-butter px-3 py-2 font-body text-small text-espresso"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || !passcode}
        className="w-full rounded-pill bg-amber px-4 py-3 font-utility text-utility uppercase text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool disabled:opacity-50"
      >
        {submitting ? "Checking…" : "Unlock the app"}
      </button>
    </form>
  );
}
