import { GateForm } from "@/components/GateForm";

export default function GatePage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-brand-50 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-brand-900">Outfit Assistant</h1>
        <p className="text-sm text-brand-700">Enter the passcode to continue.</p>
      </div>
      <GateForm next={searchParams.next ?? "/"} configError={searchParams.error === "config"} />
    </main>
  );
}
