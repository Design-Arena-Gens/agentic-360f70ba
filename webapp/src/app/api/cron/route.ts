import { NextResponse } from "next/server";
import { processDuePosts } from "@/lib/scheduler";

export async function GET() {
  await processDuePosts();
  return NextResponse.json({ ok: true });
}

