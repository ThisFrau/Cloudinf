import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ClaimWizard from './ClaimWizard';

export default async function ClaimCardPage(
  { params }: { params: Promise<{ token: string }> }
) {
  const p = await params;
  const token = p.token?.toUpperCase();

  if (!token) return redirect('/');

  const card = await prisma.nfcCard.findUnique({ where: { token } });

  if (!card) {
    return (
      <main className="container flex-center">
        <div className="text-center max-w-400 mx-auto">
          <h1 className="name text-error text-2rem">Tarjeta Inválida</h1>
          <p className="bio mt-1rem">Este chip NFC no está registrado en nuestro sistema.</p>
          <Link href="/" className="btn-secondary mt-1rem flex-auto">Volver al Inicio</Link>
        </div>
      </main>
    );
  }

  const session = await auth();

  if (card.status === 'claimed') {
    if (session?.user?.id && card.userId === session.user.id) {
      redirect('/dashboard');
    }
    return (
      <main className="container flex-center">
        <div className="text-center max-w-400 mx-auto">
          <h1 className="name text-error text-2rem">Tarjeta Ocupada</h1>
          <p className="bio mt-1rem">Esta tarjeta ya fue vinculada a otro perfil.</p>
          <Link href="/" className="btn-secondary mt-1rem flex-auto">Volver al Inicio</Link>
        </div>
      </main>
    );
  }

  // Usuario logueado → mostrar wizard
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, name: true },
    });
    return (
      <ClaimWizard
        token={token}
        username={user?.username || ''}
        defaultName={user?.name || ''}
      />
    );
  }

  // No logueado → pantalla de registro/login
  const callbackUrl = encodeURIComponent(`/claim/${token}`);

  return (
    <main className="container flex-center">
      <div className="claim-card-container">
        <div className="claim-card-icon">
          <i className="fa-solid fa-nfc-signal" />
        </div>
        <h1 className="name claim-card-title">¡Enhorabuena!</h1>
        <p className="bio claim-card-subtitle">
          Tenés en tus manos una <strong>tarjeta inteligente Cloudinf</strong>. Para activarla ingresá a tu cuenta o creá un perfil gratuito.
        </p>
        <div className="claim-buttons-wrapper">
          <Link href={`/register?callbackUrl=${callbackUrl}`} className="btn-primary w-full p-085rem">
            Crear mi Perfil Gratis
          </Link>
          <Link href={`/login?callbackUrl=${callbackUrl}`} className="btn-secondary w-full p-085rem">
            Ya tengo una cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
