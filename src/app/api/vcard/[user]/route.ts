import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ user: string }> }
) {
    const { user: username } = await context.params;
    
    const user = await prisma.user.findUnique({
        where: { username: decodeURIComponent(username).toLowerCase() },
        include: { links: true }
    });

    if (!user) {
        return new Response("User not found", { status: 404 });
    }

    // Try to find a phone number from a Whatsapp link
    const waLink = user.links.find(l => l.platform === 'whatsapp');
    let phoneStr = '';
    if (waLink) {
        // extract phone from wa.me/123456...
        const waMatch = waLink.url.match(/wa\.me\/(\+?\d+)/);
        if (waMatch) {
            phoneStr = `\nTEL;TYPE=WORK,VOICE:${waMatch[1]}`;
        }
    }

    const vcard = `BEGIN:VCARD
VERSION:3.0
N:;${user.name || user.username};;;
FN:${user.name || user.username}
ORG:Cloudinf Profile
TITLE:${user.bio?.replace(/\r?\n/g, ' ') || ''}
URL:https://${request.headers.get('host')}/${user.username}${phoneStr}
${user.email ? `EMAIL:${user.email}` : ''}
END:VCARD`;

    return new Response(vcard, {
        headers: {
            "Content-Type": "text/vcard; charset=utf-8",
            "Content-Disposition": `attachment; filename="${user.username}.vcf"`,
        },
    });
}
