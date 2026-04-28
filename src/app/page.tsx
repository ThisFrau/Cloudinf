import Link from 'next/link';
import NavbarAuth from './_components/NavbarAuth';
import ScrollReveal from './_components/ScrollReveal';
import './landing.css';

export default function Home() {
  return (
    <main className="lp-root">

      {/* ── Ambient Glow ──────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="lp-orb-top" />
        <div className="lp-orb-bottom" />
      </div>

      {/* ── Navbar ────────────────────────────────────────────── */}
      <div className="lp-nav-wrapper">
        <nav className="lp-nav">
          <div className="lp-logo">
            <div className="lp-logo-icon">
              <i className="fa-solid fa-cloud" />
            </div>
            <span className="lp-logo-text">
              Cloud<span>inf</span>
            </span>
          </div>

          <div className="lp-nav-pills">
            {[
              { label: 'Cómo funciona', href: '#como-funciona' },
              { label: 'Funciones', href: '#funciones' },
              { label: 'Precios', href: '#precios' },
              { label: 'Tienda', href: '/tienda' },
            ].map(item => (
              <Link key={item.label} href={item.href} className="lp-nav-pill-link">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="lp-nav-auth">
            <NavbarAuth />
          </div>
        </nav>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="lp-hero">

        {/* Left copy */}
        <div className="lp-hero-copy">
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            TECNOLOGÍA NFC · HECHO EN ARGENTINA
          </div>

          <h1 className="lp-h1">
            Tu tarjeta de<br />
            <span className="lp-h1-gradient">presentación digital.</span>
          </h1>

          <p className="lp-hero-sub">
            Deshazte del papel. Reuní todo tu perfil profesional, reservas, links y hasta
            el menú de tu negocio en una tarjeta inteligente con tecnología NFC.
            Un toque y listo.
          </p>

          <div className="lp-cta-row">
            <Link href="/register" className="lp-btn-primary">
              <i className="fa-solid fa-rocket lp-icon-sm" />
              Crear mi perfil gratis
            </Link>
            <Link href="/tienda" className="lp-btn-secondary">
              <i className="fa-solid fa-store lp-btn-secondary-icon" />
              Ver Tienda NFC
            </Link>
          </div>

          {/* Social proof */}
          <div className="lp-social-proof">
            <div className="lp-avatar-stack">
              {['🧑‍💻','👩‍🍳','🧑‍🎨','🧑‍⚕️','👩‍💼'].map((emoji, i) => (
                <div key={i} className="lp-avatar-emoji">{emoji}</div>
              ))}
            </div>
            <p className="lp-proof-text">
              <strong>+500 profesionales</strong><br />
              ya comparten con Cloudinf
            </p>
          </div>
        </div>

        {/* Right — mockups */}
        <div className="lp-mockup-area">
          <div className="lp-mockup-glow" />

          {/* Phone */}
          <div className="lp-phone">
            <div className="lp-phone-island" />
            <div className="lp-phone-screen">
              <div className="lp-screen-banner" />
              <div className="lp-screen-avatar" />
              <div className="lp-screen-name-bar" />
              <div className="lp-screen-bio-bar" />
              <div className="lp-screen-socials">
                <div className="lp-screen-social-icon lp-social-wa">
                  <div className="lp-screen-social-icon-inner lp-social-wa-inner" />
                </div>
                <div className="lp-screen-social-icon lp-social-ig">
                  <div className="lp-screen-social-icon-inner lp-social-ig-inner" />
                </div>
                <div className="lp-screen-social-icon lp-social-tw">
                  <div className="lp-screen-social-icon-inner lp-social-tw-inner" />
                </div>
              </div>
              <div className="lp-screen-link lp-link-purple">
                <div className="lp-screen-link-icon" />
                <div className="lp-screen-link-bar" />
              </div>
              <div className="lp-screen-link lp-link-pink">
                <div className="lp-screen-link-icon" />
                <div className="lp-screen-link-bar" />
              </div>
              <div className="lp-screen-link lp-link-blue">
                <div className="lp-screen-link-icon" />
                <div className="lp-screen-link-bar" />
              </div>
            </div>
          </div>

          {/* NFC Card Mockup */}
          <div className="lp-nfc-card">
            <div className="lp-card-gloss" />
            <div className="lp-card-nfc-badge">
              <i className="fa-solid fa-wifi" />
            </div>
            <div className="lp-card-custom-graphics">
              <div className="lp-card-circle-1" />
              <div className="lp-card-circle-2" />
            </div>
            <div className="lp-card-bottom-row">
              <div className="lp-card-brand">TU DISEÑO <span>AQUÍ</span></div>
              <div className="lp-card-qr-hint">
                <i className="fa-solid fa-qrcode" />
              </div>
            </div>
          </div>

          {/* Notification pills */}
          <div className="lp-pill-green">
            <div className="lp-pill-icon-green">
              <i className="fa-solid fa-check" />
            </div>
            <div>
              <div className="lp-pill-title">Contacto compartido</div>
              <div className="lp-pill-sub">via NFC · hace 2 seg</div>
            </div>
          </div>

          <div className="lp-pill-purple">
            <i className="fa-solid fa-chart-line lp-pill-stats-icon" />
            <span className="lp-pill-stats">+124 visitas hoy</span>
          </div>
        </div>
      </section>

      {/* ── Card Showcase ─────────────────────────────────────── */}
      <section className="lp-card-showcase">
        <div className="lp-card-showcase-inner">

          <ScrollReveal>
            <div className="lp-showcase-copy">
              <div className="lp-section-badge">TU TARJETA DIGITAL</div>
              <h2 className="lp-showcase-title">
                Mostrá lo que<br />
                <span className="lp-h1-gradient">vos quieras.</span>
              </h2>
              <p className="lp-showcase-desc">
                No es una tarjeta de crédito. Es tu presentación digital completa:
                nombre, profesión, redes, agenda, menú de negocio, mapa y más.
                Todo en un solo toque.
              </p>
              <ul className="lp-showcase-bullets">
                {[
                  { icon: 'fa-user-circle', text: 'Foto, nombre y descripción profesional' },
                  { icon: 'fa-link', text: 'Links a cualquier red o sitio web' },
                  { icon: 'fa-palette', text: 'Colores, fondos y diseño a tu gusto' },
                  { icon: 'fa-calendar-check', text: 'Sistema de turnos integrado' },
                  { icon: 'fa-utensils', text: 'Menú digital para tu negocio' },
                  { icon: 'fa-wifi', text: 'WiFi a un toque para tus clientes' },
                ].map((b, i) => (
                  <li key={i} className="lp-showcase-bullet">
                    <div className="lp-bullet-icon"><i className={`fa-solid ${b.icon}`} /></div>
                    <span>{b.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Card examples */}
          <ScrollReveal delay={150}>
            <div className="lp-showcase-cards">
              <div className="lp-ex-card lp-ex-card-1">
                <div className="lp-ex-card-gloss" />
                <div className="lp-ex-nfc"><i className="fa-solid fa-wifi" /></div>
                <div className="lp-ex-profile">
                  <div className="lp-ex-avatar lp-ex-av-1"><span>MG</span></div>
                  <div>
                    <div className="lp-ex-name">Marcos García</div>
                    <div className="lp-ex-role">Diseñador UX · Freelance</div>
                  </div>
                </div>
                <div className="lp-ex-links">
                  <div className="lp-ex-link lp-ex-l-purple"><i className="fa-solid fa-briefcase" /> Portafolio</div>
                  <div className="lp-ex-link lp-ex-l-pink"><i className="fa-brands fa-instagram" /> Instagram</div>
                </div>
              </div>

              <div className="lp-ex-card lp-ex-card-2">
                <div className="lp-ex-card-gloss" />
                <div className="lp-ex-nfc"><i className="fa-solid fa-wifi" /></div>
                <div className="lp-ex-profile">
                  <div className="lp-ex-avatar lp-ex-av-2"><i className="fa-solid fa-utensils" /></div>
                  <div>
                    <div className="lp-ex-name">La Parrilla</div>
                    <div className="lp-ex-role">Restaurante · San Telmo</div>
                  </div>
                </div>
                <div className="lp-ex-links">
                  <div className="lp-ex-link lp-ex-l-orange"><i className="fa-solid fa-book-open" /> Ver Menú</div>
                  <div className="lp-ex-link lp-ex-l-green"><i className="fa-brands fa-whatsapp" /> WhatsApp</div>
                </div>
              </div>

              <div className="lp-ex-card lp-ex-card-3">
                <div className="lp-ex-card-gloss" />
                <div className="lp-ex-nfc"><i className="fa-solid fa-wifi" /></div>
                <div className="lp-ex-profile">
                  <div className="lp-ex-avatar lp-ex-av-3"><i className="fa-solid fa-stethoscope" /></div>
                  <div>
                    <div className="lp-ex-name">Dra. Ana Torres</div>
                    <div className="lp-ex-role">Médica Clínica</div>
                  </div>
                </div>
                <div className="lp-ex-links">
                  <div className="lp-ex-link lp-ex-l-blue"><i className="fa-solid fa-calendar-check" /> Sacar turno</div>
                  <div className="lp-ex-link lp-ex-l-cyan"><i className="fa-solid fa-map-pin" /> Ubicación</div>
                </div>
              </div>

              <div className="lp-showcase-float-badge">
                <i className="fa-solid fa-wand-magic-sparkles" />
                Vos elegís el contenido
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Cómo Funciona ─────────────────────────────────────── */}
      <section id="como-funciona" className="lp-how">
        <div className="lp-how-inner">
          <ScrollReveal>
            <div className="lp-features-header">
              <div className="lp-section-badge">3 PASOS</div>
              <h2 className="lp-section-title">Tan fácil como esto.</h2>
              <p className="lp-section-sub">
                Sin apps, sin configuraciones complejas. Tu perfil activo en minutos.
              </p>
            </div>
          </ScrollReveal>
          <div className="lp-steps">
            {[
              {
                step: '01',
                icon: 'fa-user-plus',
                color: 'purple',
                title: 'Creá tu perfil',
                desc: 'Registrate gratis, cargá tu foto, bio, links y personalizá los colores. Listo en 5 minutos.',
                delay: 0,
              },
              {
                step: '02',
                icon: 'fa-credit-card',
                color: 'pink',
                title: 'Pedí tu tarjeta NFC',
                desc: 'Comprá tu tarjeta física desde la tienda. La vinculamos a tu perfil y te la enviamos a domicilio.',
                delay: 100,
              },
              {
                step: '03',
                icon: 'fa-mobile-screen',
                color: 'green',
                title: '¡Compartí con un toque!',
                desc: 'Acercá tu tarjeta a cualquier celular. Al instante verán tu perfil completo. Sin app requerida.',
                delay: 200,
              },
            ].map((s, i) => (
              <ScrollReveal key={i} delay={s.delay}>
                <div className={`lp-step lp-step-${s.color}`}>
                  <div className="lp-step-number">{s.step}</div>
                  <div className={`lp-step-icon-wrap lp-step-icon-${s.color}`}>
                    <i className={`fa-solid ${s.icon}`} />
                  </div>
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-desc">{s.desc}</p>
                  {i < 2 && <div className="lp-step-arrow"><i className="fa-solid fa-arrow-right" /></div>}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Bento ────────────────────────────────────── */}
      <section id="funciones" className="lp-features">
        <ScrollReveal>
          <div className="lp-features-header">
            <div className="lp-section-badge">TODO LO QUE NECESITAS</div>
            <h2 className="lp-section-title">Funciona para todos.</h2>
            <p className="lp-section-sub">
              Desde freelancers hasta restaurantes. Una sola plataforma que escala con vos.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="lp-bento">
            {/* NFC — wide */}
            <div className="lp-bento-card lp-bento-card-wide">
              <div className="lp-bento-glow-tl" />
              <div className="lp-bento-bg-icon"><i className="fa-solid fa-mobile-screen" /></div>
              <div className="lp-bento-content">
                <div className="lp-feature-badge lp-feature-badge-purple">
                  <i className="fa-solid fa-bolt" />SIN APPS
                </div>
                <h3 className="lp-feature-title">Tócalo. Compartilo.<br />Así de simple.</h3>
                <p className="lp-feature-desc">
                  El chip NFC de tu tarjeta no necesita batería ni conexión.
                  Funciona con cualquier iPhone o Android moderno sin instalar nada.
                </p>
              </div>
            </div>

            {/* Design */}
            <div className="lp-bento-card lp-bento-card-pink">
              <div className="lp-bento-bg-icon lp-bento-bg-icon-pink"><i className="fa-solid fa-palette" /></div>
              <div className="lp-bento-content">
                <div className="lp-feature-badge lp-feature-badge-pink">
                  <i className="fa-solid fa-paintbrush" />DISEÑO PROPIO
                </div>
                <h3 className="lp-feature-title">Tu perfil, tu marca.</h3>
                <p className="lp-feature-desc-sm">
                  Personalizá colores, fondos animados, botones y layout. Diseño premium sin saber programar.
                </p>
              </div>
            </div>

            {/* Bookings */}
            <div className="lp-bento-card lp-bento-card-orange">
              <div className="lp-bento-bg-icon lp-bento-bg-icon-orange"><i className="fa-solid fa-calendar-check" /></div>
              <div className="lp-bento-content">
                <div className="lp-feature-badge lp-feature-badge-orange">
                  <i className="fa-solid fa-calendar" />AGENDA
                </div>
                <h3 className="lp-feature-title-sm">Turnos en tu perfil</h3>
                <p className="lp-feature-desc-sm">
                  Activá el módulo de reservas. Tus clientes eligen día y hora. Vos recibís las confirmaciones al instante.
                </p>
              </div>
            </div>

            {/* Business — wide */}
            <div className="lp-bento-card lp-bento-card-green lp-bento-card-wide">
              <div className="lp-bento-glow-bl" />
              <div className="lp-bento-bg-icon lp-bento-bg-icon-green"><i className="fa-solid fa-utensils" /></div>
              <div className="lp-bento-content">
                <div className="lp-feature-badge lp-feature-badge-green">
                  <i className="fa-solid fa-store" />PARA NEGOCIOS
                </div>
                <h3 className="lp-feature-title">Menú, Wi-Fi y horarios<br />en un toque.</h3>
                <p className="lp-feature-desc">
                  Perfecto para bares y restaurantes. Configurá tu carta digital,
                  compartí la clave del WiFi y mostrá tus horarios de apertura. Todo sin papel.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="precios" className="lp-pricing">
        <div className="lp-pricing-inner">
          <ScrollReveal>
            <div className="lp-features-header">
              <div className="lp-section-badge">PLANES</div>
              <h2 className="lp-section-title">Empezá gratis, escalá cuando quieras.</h2>
              <p className="lp-section-sub">
                Tu perfil digital siempre gratis. La tarjeta física es un pago único, sin suscripción ni cuotas ocultas.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="lp-plans">

              {/* Común — Free */}
              <div className="lp-plan">
                <div className="lp-plan-header">
                  <div className="lp-plan-badge lp-plan-badge-free">COMÚN</div>
                  <div className="lp-plan-price">$0</div>
                  <div className="lp-plan-period">gratis para siempre</div>
                </div>
                <ul className="lp-plan-features">
                  {[
                    'Perfil digital personalizable',
                    'Links y redes ilimitados',
                    'Agenda de turnos integrada',
                    'Formulario de contacto',
                    'URL personalizada',
                    'Estadísticas básicas',
                  ].map(f => (
                    <li key={f} className="lp-plan-feature"><i className="fa-solid fa-check lp-check-free" />{f}</li>
                  ))}
                </ul>
                <Link href="/register" className="lp-plan-btn lp-plan-btn-free">Crear perfil gratis</Link>
              </div>

              {/* Plus — featured */}
              <div className="lp-plan lp-plan-featured">
                <div className="lp-plan-glow" />
                <div className="lp-plan-header">
                  <div className="lp-plan-badge lp-plan-badge-nfc">⚡ MÁS POPULAR</div>
                  <div className="lp-plan-price">$3.000</div>
                  <div className="lp-plan-period">por mes · ARS</div>
                </div>
                <ul className="lp-plan-features">
                  {[
                    'Todo lo del plan Común',
                    'Badge de verificación ✓',
                    'Perfil de negocio completo',
                    'Estadísticas avanzadas por link',
                    'Estado temporal en el perfil',
                    'Formulario de presupuesto',
                    'PDF / catálogo descargable',
                    'Fuera de horario automático',
                    'AFIP y facturación',
                    'Programa de referidos',
                  ].map(f => (
                    <li key={f} className="lp-plan-feature"><i className="fa-solid fa-check lp-check-nfc" />{f}</li>
                  ))}
                </ul>
                <Link href={`/tienda`} className="lp-plan-btn lp-plan-btn-nfc">
                  Contratar Plus
                </Link>
              </div>

              {/* Premium */}
              <div className="lp-plan">
                <div className="lp-plan-header">
                  <div className="lp-plan-badge lp-plan-badge-biz">PREMIUM</div>
                  <div className="lp-plan-price">$5.000</div>
                  <div className="lp-plan-period">por mes · ARS</div>
                </div>
                <ul className="lp-plan-features">
                  {[
                    'Todo lo del plan Plus',
                    '30% descuento en tarjeta NFC',
                    'Asistencia de diseño de perfil',
                    'Sin marca de agua Cloudinf',
                    'Soporte 24/7 por WhatsApp',
                    'Feed de Instagram automático',
                    'QR dinámico sin reimprimir',
                    'Historial de escaneos NFC/QR',
                    'Modo campaña con banner',
                    'Perfiles de equipo',
                    'Dashboard de agencia',
                  ].map(f => (
                    <li key={f} className="lp-plan-feature"><i className="fa-solid fa-check lp-check-biz" />{f}</li>
                  ))}
                </ul>
                <Link href="/tienda" className="lp-plan-btn lp-plan-btn-free">Contratar Premium</Link>
              </div>

            </div>
          </ScrollReveal>

          {/* NFC Card callout */}
          <ScrollReveal delay={120}>
            <div className="lp-nfc-callout">
              <i className="fa-solid fa-credit-card lp-nfc-callout-icon" />
              <div>
                <strong>¿También querés la tarjeta física NFC?</strong>
                <span>Disponible por separado — $44.999 ARS, pago único, envío a domicilio.</span>
              </div>
              <Link href="/tienda" className="lp-nfc-callout-btn">
                Ver tarjeta <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="lp-cta-section">
          <div className="lp-cta-box">
            <div className="lp-cta-glow" />
            <h2 className="lp-cta-title">Empezá hoy. Es gratis.</h2>
            <p className="lp-cta-sub">
              Tu perfil estará activo en minutos. Cuando quieras tu tarjeta física, visitá la tienda.
              Sin contratos, sin permanencia.
            </p>
            <div className="lp-cta-buttons">
              <Link href="/register" className="lp-cta-btn-primary">
                <i className="fa-solid fa-user-plus" />
                Crear Perfil Gratis
              </Link>
              <Link href="/tienda" className="lp-cta-btn-secondary">
                <i className="fa-solid fa-credit-card lp-btn-secondary-icon" />
                Comprar Tarjeta NFC
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <div className="lp-footer-logo-icon">
              <i className="fa-solid fa-cloud" />
            </div>
            Cloud<span>inf</span>
          </div>
          <p className="lp-footer-copy">© 2025 Cloudinf. Todos los derechos reservados.</p>
          <div className="lp-footer-links">
            <Link href="/privacy" className="lp-footer-link">Privacidad</Link>
            <Link href="/tienda" className="lp-footer-link">Tienda</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
