import Link from "next/link";

export function NavHeader({ current }: { current: "chat" | "saved" }) {
  return (
    <header className="flex items-center justify-between border-b border-brand-200 bg-brand-50 px-4 py-3">
      <h1 className="text-base font-semibold text-brand-900">Outfit Assistant</h1>
      <nav aria-label="Primary">
        {current === "chat" ? (
          <Link
            href="/saved"
            className="text-sm font-medium text-brand-700 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Saved outfits
          </Link>
        ) : (
          <Link
            href="/"
            className="text-sm font-medium text-brand-700 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Back to chat
          </Link>
        )}
      </nav>
    </header>
  );
}
