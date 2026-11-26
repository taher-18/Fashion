import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
  authConfigured,
  checkPassword,
  createSessionToken,
} from "@/lib/auth";

const Body = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  if (!authConfigured()) {
    return NextResponse.json(
      { error: "Login isn't set up. Add APP_PASSWORD and SESSION_SECRET (16+ chars) to .env.local." },
      { status: 500 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Type your password" }, { status: 400 });
  }

  if (!checkPassword(parsed.data.password)) {
    // Small delay makes guessing slower.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
