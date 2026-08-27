import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { writeAppSettings, currentModel, MODELS } from "@/lib/settings";

export const runtime = "nodejs";

const Body = z.object({
  model: z.enum(MODELS.map((m) => m.id) as [string, ...string[]]),
});

export async function GET() {
  return NextResponse.json({ model: currentModel(), models: MODELS });
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }
  writeAppSettings({ model: parsed.data.model });
  return NextResponse.json({ ok: true, model: parsed.data.model });
}
