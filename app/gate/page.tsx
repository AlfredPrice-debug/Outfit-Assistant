import { GateForm } from "@/components/GateForm";

export default function GatePage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col items-center justify-center gap-8 bg-porcelain px-5 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-display text-espresso">OutFit Me</h1>
        <p className="font-body text-body text-espresso">Enter the passcode to continue.</p>
      </div>
      <GateForm next={searchParams.next ?? "/"} configError={searchParams.error === "config"} />
    </main>
  );
}
