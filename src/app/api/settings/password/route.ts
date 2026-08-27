import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { COOKIE_NAME, passwordMatches, setPassword } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";

export const runtime = "nodejs";

const Body = z.object({
  current: z.string().min(1),
  next: z.string().min(MIN_PASSWORD_LENGTH),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (!passwordMatches(parsed.data.current)) {
    return NextResponse.json({ error: "wrong_current" }, { status: 401 });
  }
  // Writing the new password invalidates the old session token, so re-issue the
  // cookie here or the user is logged out mid-click.
  const token = setPassword(parsed.data.next);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
