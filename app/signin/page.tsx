import Image from "next/image";
import { signIn } from "@/auth";
import { GoogleIcon } from "@/components/GoogleIcon";

function errorMessage(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "AccessDenied") {
    return "This email isn't approved to use this app. Contact the owner if you think this is a mistake.";
  }
  return "Something went wrong signing you in. Try again.";
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next ?? "/";
  const error = errorMessage(searchParams.error);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col items-center justify-center gap-8 bg-porcelain px-5 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex flex-col items-center gap-3">
          <Image src="/logo-icon.png" alt="" width={40} height={56} aria-hidden="true" />
          <Image src="/logo-wordmark.png" alt="OutFit Me" width={180} height={40} priority />
        </div>
        <p className="font-body text-body text-espresso">Sign in to continue.</p>
      </div>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: next });
        }}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        {error && (
          <p
            role="alert"
            className="rounded-small border border-brass bg-butter px-3 py-2 font-body text-small text-espresso"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-pill border border-brass bg-transparent px-4 py-3 font-body text-body text-espresso focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepPool"
        >
          <GoogleIcon className="size-5 shrink-0" />
          Continue with Google
        </button>
      </form>
    </main>
  );
}
