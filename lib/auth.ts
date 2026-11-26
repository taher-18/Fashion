// Single-user login: APP_PASSWORD checks the password, SESSION_SECRET signs the cookie.
// Token format: "<expiresAtMs>.<hmac-sha256 base64url>". Used by proxy.ts and route handlers (Node runtime).

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "closet_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

function secret(): string | null {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 16 ? s : null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** True when both APP_PASSWORD and SESSION_SECRET are set. */
export function authConfigured(): boolean {
  return Boolean(process.env.APP_PASSWORD) && secret() !== null;
}

export function checkPassword(input: string): boolean {
  const pw = process.env.APP_PASSWORD;
  const key = secret();
  if (!pw || !key) return false;
  // Compare HMACs so the comparison is constant-time regardless of length.
  return safeEqual(sign(input, key), sign(pw, key));
}

export function createSessionToken(now = Date.now()): string {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET is missing or shorter than 16 characters");
  const exp = String(now + SESSION_MAX_AGE_S * 1000);
  return `${exp}.${sign(exp, key)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  const key = secret();
  if (!token || !key) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < now) return false;
  return safeEqual(sig, sign(exp, key));
}
