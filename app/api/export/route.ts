import { NextResponse } from "next/server";
import { exportAll } from "@/lib/db/backup";
import { jsonError, requireLogin } from "@/lib/session";

// Downloads the whole closet as JSON (occasions, items, wear history).
export async function GET() {
  const denied = await requireLogin();
  if (denied) return denied;
  try {
    const data = await exportAll();
    const day = data.exported_at.slice(0, 10);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="closet-${day}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return jsonError((e as Error).message, 500);
  }
}
