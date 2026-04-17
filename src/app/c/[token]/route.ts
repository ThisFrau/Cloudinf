import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  if (!token) {
    return new NextResponse('Invalid Token', { status: 400 });
  }

  // Convertimos a mayúsculas para evitar confusiones de case
  const cleanToken = token.toUpperCase();

  const card = await prisma.nfcCard.findUnique({
    where: { token: cleanToken },
    include: { user: true }
  });

  if (!card) {
    return new NextResponse('Tarjeta Inválida o no Encontrada.', { status: 404 });
  }

  // Si la tarjeta ya está reclamada y tiene un usuario asociado:
  if (card.status === "claimed" && card.user) {
    const baseUrl = new URL(request.url).origin;
    // Redirige instantáneamente al perfil público del usuario
    return NextResponse.redirect(`${baseUrl}/${card.user.username}`);
  }

  // Si la tarjeta existe pero no ha sido reclamada:
  const baseUrl = new URL(request.url).origin;
  return NextResponse.redirect(`${baseUrl}/claim/${cleanToken}`);
}
