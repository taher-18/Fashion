import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/login", "/api/login"]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const loggedIn = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (PUBLIC_PATHS.has(pathname)) {
    // Already logged in? Skip the login page.
    if (loggedIn && pathname === "/login") return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (loggedIn) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  // Everything except Next internals and public static files (icons, manifest).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|robots.txt).*)"],
};
