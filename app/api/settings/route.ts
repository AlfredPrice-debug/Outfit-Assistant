import { NextRequest, NextResponse } from "next/server";
import { userSettingsInputSchema } from "@/lib/schemas";
import { getUserSettings, upsertUserSettings } from "@/lib/userSettings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getUserSettings();
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable right now, so your settings couldn't be loaded." },
      { status: 503 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = userSettingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
  }

  try {
    const settings = await upsertUserSettings(parsed.data);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable, so this couldn't be saved." },
      { status: 503 },
    );
  }
}
