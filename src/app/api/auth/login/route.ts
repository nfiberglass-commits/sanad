import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  COOKIE_NAME,
  passwordIsConfigured,
  passwordMatches,
  sessionToken,
} from "@/lib/auth";

const Body = z.object({ password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }
  if (!passwordIsConfigured()) {
    return NextResponse.json(
      { error: "No password set — run the first-time setup" },
      { status: 500 }
    );
  }
  if (!passwordMatches(parsed.data.password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
