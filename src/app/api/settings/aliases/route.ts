import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { writeAppSettings, parseAliasList, selfAliases } from "@/lib/settings";

export const runtime = "nodejs";

const Body = z.object({ aliases: z.string() });

export async function GET() {
  return NextResponse.json({ aliases: selfAliases() });
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const list = parseAliasList(parsed.data.aliases);
  if (list.length === 0) {
    return NextResponse.json({ error: "no_aliases" }, { status: 400 });
  }
  writeAppSettings({ selfAliases: list });
  // Note: this only affects chats imported from now on. Messages already in the
  // database keep the self/other flag they were given at import time.
  return NextResponse.json({ ok: true, aliases: list });
}
