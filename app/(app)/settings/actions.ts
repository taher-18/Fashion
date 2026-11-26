"use server";

import { cookies } from "next/headers";
import { AI_COOKIE } from "@/lib/ai/client";
import { deleteOccasion, saveOccasion } from "@/lib/db/occasions";
import { isLoggedIn } from "@/lib/session";
import { OCCASION_ID_RE, OccasionInput, firstIssue } from "@/lib/validation";

type Result = { error: string | null };

async function guard(): Promise<Result | null> {
  return (await isLoggedIn()) ? null : { error: "Not logged in" };
}

export async function setAiEnabled(on: boolean): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  (await cookies()).set(AI_COOKIE, on ? "on" : "off", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { error: null };
}

export async function saveOccasionAction(input: unknown): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = OccasionInput.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  try {
    await saveOccasion(parsed.data);
    return { error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteOccasionAction(id: string): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  if (!OCCASION_ID_RE.test(id)) return { error: "Unknown occasion" };
  try {
    await deleteOccasion(id);
    return { error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
