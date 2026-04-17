import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Type adjusted for Next.js 15+ 
) {
    const { id } = await context.params;

    // increment click count
    const link = await prisma.link.update({
        where: { id },
        data: { clicks: { increment: 1 } },
    });

    if (!link) {
        return new Response("Link not found", { status: 404 });
    }

    // Redirect to the actual url
    redirect(link.url);
}
