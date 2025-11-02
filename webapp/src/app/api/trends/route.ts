import { NextResponse } from "next/server";
import { discoverTrends, listTrends } from "@/lib/trends";

export async function GET() {
  const trends = await listTrends();
  return NextResponse.json({ trends });
}

export async function POST(request: Request) {
  const { language = "en", region = "US", category = "general" } =
    (await request.json().catch(() => ({}))) as Partial<{
      language: string;
      region: string;
      category: string;
    }>;

  const trends = await discoverTrends({
    language,
    region,
    category,
  });

  return NextResponse.json({ trends });
}

