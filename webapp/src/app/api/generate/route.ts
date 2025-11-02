import { NextResponse } from "next/server";
import { generateContent } from "@/lib/ai";

export async function POST(request: Request) {
  const body = await request.json();
  const content = await generateContent(body);
  return NextResponse.json({ content });
}

