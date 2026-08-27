import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidSession } from "@/lib/auth";
import { isSetupComplete } from "@/lib/settings";

// Two gates, in order:
//   1. First run — until the wizard has stored a password, EVERYTHING routes to
//      /setup. Nothing else is reachable, so a fresh install can't be poked at.
//   2. Normal life — the single-user password gate (spec §4).
// Proxy runs on the Node.js runtime in Next 16, so reading data/settings.json
// here is fine.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isSetupRoute = pathname === "/setup" || pathname.startsWith("/api/setup");

  if (!isSetupComplete()) {
    if (isSetupRoute) return NextResponse.next();
    if (isApi) {
      return NextResponse.json({ error: "Setup not completed" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  // Setup is done — the wizard is closed for good.
  if (isSetupRoute) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (isApi) {
      return NextResponse.json({ error: "Setup already completed" }, { status: 403 });
    }
    return NextResponse.redirect(
      new URL(isValidSession(token) ? "/dashboard" : "/login", req.url)
    );
  }

  if (pathname === "/login" || pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (isValidSession(token)) {
    return NextResponse.next();
  }

  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.svg$).*)"],
};
