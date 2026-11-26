// Server-side login check for route handlers (proxy.ts also guards them; this is the second lock).

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

export async function isLoggedIn(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** Returns a 401 response if not logged in, otherwise null. */
export async function requireLogin(): Promise<NextResponse | null> {
  return (await isLoggedIn()) ? null : jsonError("Not logged in", 401);
}
