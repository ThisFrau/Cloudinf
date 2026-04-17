import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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
    const body = await request.json();
    const { name, email, date, time, note } = body;

    if (!name || !email || !date || !time) {
        return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { username: decodeURIComponent(username).toLowerCase() },
        include: { bookingConfig: true },
    });

    if (!user?.bookingConfig) {
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

    return NextResponse.json({ success: true, booking });
}
