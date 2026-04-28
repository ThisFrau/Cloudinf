import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { sendBookingReceivedEmail, sendNewBookingNotification } from "@/lib/email";

export const dynamic = 'force-dynamic';

// GET: return booking config + booked slots for a given date
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ user: string }> }
) {
    const { user: username } = await context.params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const user = await prisma.user.findUnique({
        where: { username: decodeURIComponent(username).toLowerCase() },
        include: {
            bookingConfig: {
                include: {
                    bookings: date ? { where: { date, status: { not: "cancelled" } } } : false,
                },
            },
        },
    });

    if (!user?.bookingConfig) {
        return NextResponse.json({ error: "No booking config" }, { status: 404 });
    }

    return NextResponse.json({
        config: {
            title: user.bookingConfig.title,
            availableDays: JSON.parse(user.bookingConfig.availableDays),
            startTime: user.bookingConfig.startTime,
            endTime: user.bookingConfig.endTime,
            slotDuration: user.bookingConfig.slotDuration,
        },
        bookedSlots: (user.bookingConfig.bookings as { time: string }[] | false || []).map((b: { time: string }) => b.time),
    });
}

// POST: create a booking
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ user: string }> }
) {
    const { user: username } = await context.params;

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    if (!rateLimit(`booking:${ip}`, 5, 10 * 60 * 1000)) {
        return NextResponse.json({ error: "Demasiadas solicitudes. Intentá de nuevo en unos minutos." }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, date, time, note } = body;

    if (!name || !email || !date || !time) {
        return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const timeRegex = /^\d{2}:\d{2}$/
    if (!dateRegex.test(date) || !timeRegex.test(time)) {
        return NextResponse.json({ error: "Formato de fecha u hora inválido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { username: decodeURIComponent(username).toLowerCase() },
        include: {
            bookingConfig: true,
            businessConfig: { select: { businessName: true } },
        },
    });

    if (!user?.bookingConfig || !user.bookingConfig.enabled) {
        return NextResponse.json({ error: "Sin agenda" }, { status: 404 });
    }

    // Check if slot already taken
    const existing = await prisma.booking.findFirst({
        where: {
            configId: user.bookingConfig.id,
            date,
            time,
            status: { not: "cancelled" },
        },
    });

    if (existing) {
        return NextResponse.json({ error: "Ese horario ya fue reservado" }, { status: 409 });
    }

    const booking = await prisma.booking.create({
        data: {
            name,
            email,
            date,
            time,
            note: note || null,
            configId: user.bookingConfig.id,
        },
    });

    const businessName = user.businessConfig?.businessName || user.name || 'Cloudinf'

    sendBookingReceivedEmail({ to: email, name, date, time, businessName }).catch(() => null)

    if (user.email) {
      sendNewBookingNotification({
        ownerEmail: user.email,
        guestName: name,
        guestEmail: email,
        date, time,
        note: note || null,
        businessName,
      }).catch(() => null)
    }

    return NextResponse.json({ success: true, booking });
}
