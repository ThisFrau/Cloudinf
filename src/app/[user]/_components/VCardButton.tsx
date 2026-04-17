'use client';

export default function VCardButton({ username }: { username: string }) {
  return (
    <a
      href={`/api/vcard/${username}`}
      download
      className="vcard-save-btn"
      aria-label="Guardar contacto en tu agenda"
    >
      <span className="vcard-save-btn__icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      </span>
      <span className="vcard-save-btn__text">Guardar Contacto</span>
    </a>
  );
}
