import { NextResponse } from "next/server";
import { approveTrend } from "@/lib/trends";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { approved } = (await request.json()) as { approved: boolean };
  const result = await approveTrend(params.id, approved);
  return NextResponse.json(result);
}

