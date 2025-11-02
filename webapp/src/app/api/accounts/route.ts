import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const accounts = await prisma.platformAccount.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    accounts: accounts.map((account) => ({
      id: account.id,
      platform: account.platform,
      accountName: account.accountName,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const account = await prisma.platformAccount.create({
    data: {
      platform: body.platform,
      accountName: body.accountName,
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      metadata: body.metadata,
    },
  });

  return NextResponse.json({
    id: account.id,
    platform: account.platform,
    accountName: account.accountName,
  });
}

