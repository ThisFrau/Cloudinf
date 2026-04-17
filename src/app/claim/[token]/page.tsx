import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function ClaimCardPage(
  { params }: { params: Promise<{ token: string }> }
) {
  const p = await params;
  const token = p.token?.toUpperCase();

  if (!token) return redirect('/');

  // 1. Validar la tarjeta
  const card = await prisma.nfcCard.findUnique({
    where: { token }
  });

  if (!card) {
    return (
      <main className="container flex-center">
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1 className="name text-error" style={{ fontSize: '2rem' }}>Tarjeta Inválida</h1>
          <p className="bio mt-1rem">Lo sentimos, este chip NFC no parece estar registrado en nuestro sistema oficial.</p>
          <Link href="/" className="btn-secondary mt-1rem flex-auto">Volver al Inicio</Link>
        </div>
      </main>
    );
  }

  if (card.status === 'claimed') {
    return (
      <main className="container flex-center">
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1 className="name text-error" style={{ fontSize: '2rem' }}>Tarjeta Ocupada</h1>
          <p className="bio mt-1rem">Esta tarjeta ya fue reclamada y está vinculada a un perfil.</p>
          <Link href="/" className="btn-secondary mt-1rem flex-auto">Volver al Inicio</Link>
        </div>
      </main>
    );
  }

  // 2. Revisar si hay un usuario logueado en esta computadora/celular
  const session = await auth();

  // 3. ¡Bingo! Está logueado y la tarjeta es válida. La reclamamos.
  if (session?.user?.id) {
    await prisma.nfcCard.update({
      where: { token },
      data: {
        status: 'claimed',
        userId: session.user.id
      }
    });

    return (
      <main className="container flex-center">
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#25D366' }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <h1 className="name" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>¡Tarjeta Vinculada!</h1>
          <p className="bio">Acabas de conectar exitosamente tu tarjeta física NFC a tu perfil de Cloudinf.</p>
          <p className="bio mt-05rem">Haz la prueba: acerca tu tarjeta a tu teléfono y verás la magia al instante.</p>
          
          <div className="mt-1rem">
            <Link href="/dashboard" className="btn-primary flex-auto w-full">Ir a mi Panel de Control</Link>
          </div>
        </div>
      </main>
    );
  }

  // 4. No está logueado. Le mostramos la pantalla de Reclamo.
  const callbackUrl = encodeURIComponent(`/claim/${token}`);

  return (
    <main className="container flex-center">
      <div style={{ textAlign: 'center', maxWidth: '450px', background: 'rgba(0,0,0,0.4)', padding: '2.5rem 1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        <div style={{ background: 'rgba(255,255,255,0.1)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>

        <h1 className="name" style={{ fontSize: '2rem', marginBottom: '1rem', lineHeight: '1.2' }}>¡Enhorabuena!</h1>
        <p className="bio" style={{ marginBottom: '1.5rem', fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
          Tienes en tus manos una <strong>tarjeta inteligente Cloudinf</strong> sin abrir. Para darle vida y asociarla a ti, ingresa a tu cuenta o créate un perfil gratuito.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href={`/register?callbackUrl=${callbackUrl}`} className="btn-primary w-full" style={{ padding: '0.85rem' }}>
            Crear mi Perfil Gratis
          </Link>
          <Link href={`/login?callbackUrl=${callbackUrl}`} className="btn-secondary w-full" style={{ padding: '0.85rem' }}>
            Ya tengo una cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
