import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ user: string }> }
) {
  const { user: username } = await context.params;
  const decoded = decodeURIComponent(username).toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username: decoded },
    select: { qrDynamicUrl: true },
  });

  const ua = request.headers.get('user-agent') || ''
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua)

  await prisma.scanLog.create({
    data: {
      userId: (await prisma.user.findUnique({ where: { username: decoded }, select: { id: true } }))?.id || '',
      source: 'qr',
      device: isMobile ? 'mobile' : 'desktop',
    },
  }).catch(() => null)

  const destination = user?.qrDynamicUrl || `/${decoded}`
  return NextResponse.redirect(new URL(destination, request.url))
}
