import Link from 'next/link';

export default function Home() {
  return (
    <main className="container flex-center">
        <div className="hero-icon-box">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
            <path d="M12 12h.01"/>
            <path d="M8 12h.01"/>
            <path d="M16 12h.01"/>
          </svg>
        </div>

        <h1 className="name hero-title-nfc">
          Tu Tarjeta Personal<br/>Inteligente
        </h1>
        <p className="bio hero-subtitle-nfc">
            Acércala al celular de tu cliente y comparte tu contacto, portfolio y redes en segundos mediante la tecnología <strong>NFC</strong>. Sin instalar apps.
        </p>
        
        <div className="hero-buttons w-full">
            <Link href="/register" className="btn-primary flex-auto w-full mb-1rem">Obtener mi Perfil</Link>
            <Link href="/login" className="btn-secondary flex-auto w-full">Ya tengo perfil</Link>
        </div>

        <div className="hero-steps-box">
            <p><strong>1.</strong> Pide tu tarjeta física Cloudinf.</p>
            <p><strong>2.</strong> Te la enviamos configurada.</p>
            <p><strong>3.</strong> Conecta al instante.</p>
        </div>
    </main>
  );
}
