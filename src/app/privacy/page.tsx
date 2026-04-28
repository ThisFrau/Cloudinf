import Link from "next/link"

export const metadata = {
  title: "Política de Privacidad | Cloudinf",
  description: "Política de privacidad y protección de datos de Cloudinf",
}

export default function PrivacyPage() {
  return (
    <main className="container pb-4rem pt-2rem">
      <div className="max-w-800 mx-auto bg-[var(--surface)] p-2rem rounded-2xl shadow-sm border border-[var(--border)]">
        <h1 className="text-3xl font-bold mb-1rem text-[var(--foreground)]">Política de Privacidad</h1>
        <p className="text-[var(--muted)] mb-2rem">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>

        <section className="mb-2rem">
          <h2 className="text-xl font-bold mb-0.5rem text-[var(--foreground)]">1. Información que recopilamos</h2>
          <p className="mb-1rem text-[var(--foreground)]">
            En Cloudinf recopilamos la siguiente información cuando utilizas nuestra plataforma:
          </p>
          <ul className="list-disc pl-1.5rem mb-1rem text-[var(--foreground)] space-y-2 text-sm">
            <li><strong>Información de la cuenta:</strong> Tu nombre, nombre de usuario y correo electrónico proporcionados durante el registro (ya sea directamente o mediante proveedores externos como Google).</li>
            <li><strong>Contenido del perfil:</strong> Enlaces, imágenes, avatares, configuraciones, información de negocios, e información de contacto que añades a tu página pública.</li>
            <li><strong>Datos de uso y métricas:</strong> Información anónima sobre clics, visualizaciones y procedencia de los visitantes a tu perfil para proporcionar las estadísticas de tu cuenta.</li>
          </ul>
        </section>

        <section className="mb-2rem">
          <h2 className="text-xl font-bold mb-0.5rem text-[var(--foreground)]">2. Uso de la información</h2>
          <p className="mb-1rem text-[var(--foreground)] text-sm">
            La información que recopilamos se utiliza exclusivamente para:
          </p>
          <ul className="list-disc pl-1.5rem mb-1rem text-[var(--foreground)] space-y-2 text-sm">
            <li>Mantener y proporcionar nuestros servicios (mostrar tu perfil público).</li>
            <li>Mejorar y personalizar tu experiencia en la plataforma.</li>
            <li>Proporcionarte estadísticas sobre el rendimiento de tus enlaces.</li>
            <li>Comunicarnos contigo por motivos de soporte técnico o de la cuenta.</li>
            <li>Prevenir fraudes y asegurar el correcto funcionamiento de los perfiles y tarjetas NFC integradas.</li>
          </ul>
        </section>

        <section className="mb-2rem">
          <h2 className="text-xl font-bold mb-0.5rem text-[var(--foreground)]">3. Uso de Cookies</h2>
          <p className="mb-1rem text-[var(--foreground)] text-sm">
            Cloudinf utiliza cookies estrictamente necesarias para el funcionamiento de la plataforma:
          </p>
          <ul className="list-disc pl-1.5rem mb-1rem text-[var(--foreground)] space-y-2 text-sm">
            <li><strong>Cookies de Sesión:</strong> Utilizamos NextAuth.js para generar cookies JWT (JSON Web Tokens) encriptadas que mantienen tu sesión iniciada de manera segura. Sin ellas, no podrías acceder a tu panel de control (/dashboard).</li>
            <li>No utilizamos cookies de seguimiento publicitario (como píxeles de Facebook o trackers similares de terceros invasivos de forma predeterminada).</li>
          </ul>
        </section>

        <section className="mb-2rem">
          <h2 className="text-xl font-bold mb-0.5rem text-[var(--foreground)]">4. Archivos Subidos y Multimedia</h2>
          <p className="text-[var(--foreground)] text-sm">
            Todas las imágenes (avatares, banners, fotos de la galería) que subas formarán parte de tu perfil público y serán accesibles por cualquier usuario que visite tu enlace a menos que lo deshabilites. Modifica tu información desde el panel de control.
          </p>
        </section>

        <section className="mb-2rem">
          <h2 className="text-xl font-bold mb-0.5rem text-[var(--foreground)]">5. Tus Derechos y Control de los Datos</h2>
          <p className="text-[var(--foreground)] text-sm">
            Como usuario, tienes derecho a acceder, rectificar o eliminar toda tu información personal. Puedes modificar tu perfil libremente en el panel. Si deseas eliminar tu cuenta permanentemente y todo el contenido asociado, por favor contáctanos o utiliza la opción (si está disponible) en la sección Configuración.
          </p>
        </section>

        <div className="mt-3rem pt-2rem border-t border-[var(--border)] text-center">
          <Link href="/" className="btn-primary inline-flex">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
