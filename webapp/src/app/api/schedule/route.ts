import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueuePost } from "@/lib/scheduler";

export async function GET() {
  const posts = await prisma.scheduledPost.findMany({
    orderBy: { scheduledFor: "desc" },
    include: {
      account: true,
      content: true,
    },
    take: 100,
  });

  return NextResponse.json({
    posts: posts.map((post) => ({
      id: post.id,
      platform: post.platform,
      scheduledFor: post.scheduledFor.toISOString(),
      status: post.status,
      payload: post.payload,
      imageUrl: post.imageUrl,
      resultMessage: post.resultMessage,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      accountName: post.account?.accountName ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const scheduled = await enqueuePost({
    platform: body.platform,
    accountId: body.accountId,
    contentId: body.contentId,
    scheduledFor: new Date(body.scheduledFor),
  });

  return NextResponse.json({
    id: scheduled.id,
    platform: scheduled.platform,
    scheduledFor: scheduled.scheduledFor,
    status: scheduled.status,
  });
}

