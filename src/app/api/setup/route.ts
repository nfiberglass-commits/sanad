import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { COOKIE_NAME, setPassword } from "@/lib/auth";
import { isSetupComplete, writeAppSettings, parseAliasList } from "@/lib/settings";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { isValidLicenceFormat, normalizeLicenceKey } from "@/lib/licence";

export const runtime = "nodejs";

const Body = z.object({
  licenceKey: z.string().min(1),
  displayName: z.string().trim().max(80).optional(),
  aliases: z.string().min(1),
  password: z.string().min(MIN_PASSWORD_LENGTH),
});

export async function POST(req: NextRequest) {
  // The proxy already blocks this once setup is done; check again so the route
  // is safe on its own.
  if (isSetupComplete()) {
    return NextResponse.json({ error: "already_done" }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { licenceKey, displayName, aliases, password } = parsed.data;

  if (!isValidLicenceFormat(licenceKey)) {
    return NextResponse.json({ error: "bad_licence" }, { status: 400 });
  }
  const aliasList = parseAliasList(aliases);
  if (aliasList.length === 0) {
    return NextResponse.json({ error: "no_aliases" }, { status: 400 });
  }

  // Write everything EXCEPT the password first — the password record is what
  // flips isSetupComplete(), so it goes last and only after the rest landed.
  writeAppSettings({
    licenceKey: normalizeLicenceKey(licenceKey),
    displayName: displayName || aliasList[0],
    selfAliases: aliasList,
    setupCompletedAt: new Date().toISOString(),
  });
  const token = setPassword(password);

  // Log them straight in — the next step of the wizard is uploading a chat.
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
