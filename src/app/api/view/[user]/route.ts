import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ user: string }> }
) {
    const { user: username } = await context.params;

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    if (!rateLimit(`view:${username}:${ip}`, 1, 30 * 60 * 1000)) {
        return NextResponse.json({ ok: false });
    }

    const ua = request.headers.get('user-agent') || ''
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua)
    const source = request.headers.get('referer')?.includes('qr') ? 'qr' : 'direct'

    const user = await prisma.user.findUnique({
        where: { username: decodeURIComponent(username).toLowerCase() },
        select: { id: true },
    })

    if (user) {
        await Promise.all([
            prisma.user.update({
                where: { id: user.id },
                data: { profileViews: { increment: 1 } },
            }),
            prisma.scanLog.create({
                data: { userId: user.id, source, device: isMobile ? 'mobile' : 'desktop' },
            }),
        ]).catch(() => null)
    }

    return NextResponse.json({ ok: true });
}
