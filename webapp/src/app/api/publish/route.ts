import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishToPlatform } from "@/lib/platforms";

export async function POST(request: Request) {
  const { scheduledPostId } = (await request.json()) as { scheduledPostId: string };
  const post = await prisma.scheduledPost.findUniqueOrThrow({
    where: { id: scheduledPostId },
    include: {
      account: true,
      content: true,
    },
  });

  const result = await publishToPlatform({
    platform: post.platform,
    credentials: {
      accessToken: post.account?.accessToken ?? "",
      refreshToken: post.account?.refreshToken ?? undefined,
      accountId: post.account?.id ?? undefined,
      extra: (post.account?.metadata as Record<string, unknown> | null) ?? undefined,
    },
    payload: {
      text: post.content?.content ?? post.payload,
      imageUrl: post.content?.imageUrl ?? undefined,
      hashtags: post.content?.hashtags?.split(" "),
    },
  });

  await prisma.scheduledPost.update({
    where: { id: post.id },
    data: {
      status: result.ok ? "POSTED" : "FAILED",
      resultMessage: result.message,
    },
  });

  return NextResponse.json(result);
}

