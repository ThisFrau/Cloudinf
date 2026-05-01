import Link from 'next/link'
import NavbarAuth from '../_components/NavbarAuth'
import CouponWidget from './CouponWidget'
import './tienda.css'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEffectivePlan, PLAN_LABELS } from '@/lib/plans'

const WA_NUMBER = '5491100000000' // Reemplazar con el número de WhatsApp del negocio

function waLink(text: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`
}

const PLAN_FREE_FEATURES = [
  { label: '1 perfil', ok: true },
  { label: 'Hasta 3 links + WhatsApp', ok: true },
  { label: 'URL personalizada', ok: true },
  { label: 'Links ilimitados', ok: false },
  { label: 'Todas las redes sociales', ok: false },
  { label: 'Estadísticas de visitas', ok: false },
  { label: 'Personalización de colores', ok: false },
  { label: 'Sin marca de agua', ok: false },
]

const PLAN_PLUS_FEATURES = [
  { label: 'Todo lo del plan Gratuito', ok: true },
  { label: 'Links ilimitados', ok: true },
  { label: 'Todas las redes sociales', ok: true },
  { label: 'Estadísticas de visitas', ok: true },
  { label: 'Personalización de colores', ok: true },
  { label: 'Sin marca de agua', ok: true },
  { label: '2 meses Pro al activar tarjeta NFC', ok: true },
]

const PLAN_PREMIUM_FEATURES = [
  { label: 'Todo lo incluido en Pro', ok: true },
  { label: '6 perfiles incluidos', ok: true },
  { label: 'Perfiles adicionales $999/mes', ok: true },
  { label: '5% dto. desde 20 perfiles', ok: true },
  { label: '10% dto. desde 30 perfiles', ok: true },
  { label: '20% dto. desde 40 perfiles', ok: true },
  { label: 'Panel de administración', ok: true },
]

const NFC_INCLUDES = [
  { icon: 'fa-wifi', label: 'Chip NFC sin batería, compatible con todos los celulares' },
  { icon: 'fa-link', label: 'Vinculada a tu perfil Cloudinf desde el primer día' },
  { icon: 'fa-truck', label: 'Envío a domicilio a todo el país' },
  { icon: 'fa-palette', label: 'Diseño personalizable con tu logo o nombre' },
  { icon: 'fa-qrcode', label: 'Código QR impreso al dorso como respaldo' },
  { icon: 'fa-infinity', label: 'Sin suscripción — pago único para siempre' },
]

type CVal = boolean | string
const COMPARE_ROWS: { feature: string; free: CVal; plus: CVal; team: CVal }[] = [
  { feature: 'Perfiles',                         free: '1',       plus: '1',           team: '6+'          },
  { feature: 'Links',                            free: 'Hasta 3', plus: 'Ilimitados',  team: 'Ilimitados'  },
  { feature: 'WhatsApp incluido',                free: true,      plus: true,          team: true          },
  { feature: 'Todas las redes sociales',         free: false,     plus: true,          team: true          },
  { feature: 'Estadísticas de visitas',          free: false,     plus: true,          team: true          },
  { feature: 'Personalización de colores',       free: false,     plus: true,          team: true          },
  { feature: 'Sin marca de agua',                free: false,     plus: true,          team: true          },
  { feature: 'Bonus NFC (2 meses Pro gratis)',   free: false,     plus: true,          team: true          },
  { feature: 'Múltiples perfiles',               free: false,     plus: false,         team: true          },
  { feature: 'Perfiles adicionales ($999/mes)',  free: false,     plus: false,         team: true          },
  { feature: 'Descuentos por volumen',           free: false,     plus: false,         team: true          },
  { feature: 'Panel de administración',          free: false,     plus: false,         team: true          },
]

const FAQS = [
  {
    q: '¿Puedo cambiar de plan cuando quiera?',
    a: 'Sí. Podés subir o bajar de plan en cualquier momento. Al subir, el cobro se prorratea automáticamente.',
  },
  {
    q: '¿La tarjeta NFC necesita batería o app?',
    a: 'No. La tarjeta usa tecnología NFC pasiva, sin batería. Cualquier celular moderno (iPhone 7+ o Android NFC) la lee al instante, sin instalar nada.',
  },
  {
    q: '¿En cuánto tiempo llega la tarjeta?',
    a: 'El envío tarda entre 3 y 7 días hábiles dependiendo del destino. Hacemos envíos a todo el país.',
  },
  {
    q: '¿Qué pasa si cancelo el plan Plus o Premium?',
    a: 'Tu perfil sigue activo con las funciones del plan Común. No perdés tu URL ni tus links.',
  },
  {
    q: '¿La tarjeta NFC incluye el plan Plus?',
    a: 'No, la tarjeta es un producto físico de pago único. El plan Plus/Premium es una suscripción mensual que te da funciones adicionales en el perfil.',
  },
  {
    q: '¿Cómo se realiza el pago?',
    a: 'Los planes se contratan por WhatsApp. Te enviamos el link de pago por transferencia o MercadoPago.',
  },
]

export default async function TiendaPage() {
  const session = await auth()
  let userPlan: string | null = null

  if (session?.user?.id) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, planExpiresAt: true, nfcProBonusUntil: true, teamProfileCount: true },
    })
    if (u) {
      const eff = getEffectivePlan({
        plan: u.plan,
        planExpiresAt: u.planExpiresAt,
        nfcProBonusUntil: u.nfcProBonusUntil,
        teamProfileCount: u.teamProfileCount,
      })
      userPlan = PLAN_LABELS[eff]
    }
  }

  return (
    <div className="st-root">

      {/* Orbs */}
      <div aria-hidden className="st-orb-1" />
      <div aria-hidden className="st-orb-2" />

      {/* Navbar */}
      <div className="lp-nav-wrapper">
        <nav className="lp-nav">
          <Link href="/" className="lp-logo">
            <div className="lp-logo-icon">
              <i className="fa-solid fa-cloud" />
            </div>
            <span className="lp-logo-text">
              Cloud<span>inf</span>
            </span>
          </Link>

          <div className="lp-nav-pills">
            {[
              { label: 'Inicio', href: '/' },
              { label: 'Funciones', href: '/#funciones' },
              { label: 'Precios', href: '/#precios' },
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

      {/* ── Hero ────────────────────────────────────── */}
      <section className="st-hero">
        <div className="st-section-badge">
          <i className="fa-solid fa-store" />
          TIENDA CLOUDINF
        </div>
        <h1 className="st-hero-title">
          Elige el plan que<br />
          <span className="st-hero-gradient">impulse tu perfil.</span>
        </h1>
        <p className="st-hero-sub">
          Empezá gratis y crecé cuando quieras. Agregá la tarjeta NFC física
          para compartir tu perfil con un solo toque.
        </p>
        <div className="st-hero-pills">
          {[
            { icon: 'fa-shield-halved', label: 'Sin contratos de permanencia' },
            { icon: 'fa-rotate-left', label: 'Cancelá cuando quieras' },
            { icon: 'fa-truck', label: 'Envío a todo el país' },
          ].map(p => (
            <div key={p.label} className="st-hero-pill">
              <i className={`fa-solid ${p.icon}`} />
              {p.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Plan banner (logged-in users) ───────────── */}
      {userPlan && (
        <div className="st-plan-banner">
          <i className="fa-solid fa-circle-check st-plan-banner-icon" />
          Tu plan actual: <strong>{userPlan}</strong>
          <Link href="/dashboard" className="st-plan-banner-link">Ver en el dashboard</Link>
        </div>
      )}

      {/* ── Plans ───────────────────────────────────── */}
      <section className="st-section">
        <div className="st-section-header">
          <div className="st-section-badge">PLANES MENSUALES</div>
          <h2 className="st-section-title">
            Funciones para cada etapa.
          </h2>
          <p className="st-section-sub">
            Todos los planes incluyen el perfil digital completo. Los planes
            mensuales desbloquean funciones avanzadas.
          </p>
        </div>

        <div className="st-plans">

          {/* ── Gratuito ─── */}
          <div className="st-plan st-plan-free">
            <div>
              <div className="st-plan-top">
                <span className="st-plan-name">Gratuito</span>
                <span className="st-plan-badge st-badge-free">GRATIS</span>
              </div>
              <div className="st-plan-price-row">
                <span className="st-plan-currency">$</span>
                <span className="st-plan-amount">0</span>
              </div>
              <p className="st-plan-period">para siempre · sin tarjeta</p>
              <p className="st-plan-desc">
                Tu perfil digital completo sin costo. Ideal para empezar a compartir tus redes y agenda.
              </p>
            </div>

            <ul className="st-plan-features">
              {PLAN_FREE_FEATURES.map(f => (
                <li key={f.label} className={`st-plan-feature ${!f.ok ? 'st-feature-muted' : ''}`}>
                  {f.ok
                    ? <i className="fa-solid fa-check st-check-free" />
                    : <i className="fa-solid fa-xmark" />
                  }
                  {f.label}
                </li>
              ))}
            </ul>

            <Link href="/register" className="st-plan-btn st-btn-free">
              <i className="fa-solid fa-user-plus" />
              Crear perfil gratis
            </Link>
          </div>

          {/* ── Pro ─── */}
          <div className="st-plan st-plan-featured st-plan-plus">
            <div className="st-plan-glow" />
            <div className="st-plan-popular">MÁS POPULAR</div>

            <div>
              <div className="st-plan-top">
                <span className="st-plan-name">Pro</span>
                <span className="st-plan-badge st-badge-plus">PLUS</span>
              </div>
              <div className="st-plan-price-row">
                <span className="st-plan-currency">$</span>
                <span className="st-plan-amount">3.999</span>
              </div>
              <p className="st-plan-period">por mes · en pesos argentinos</p>
              <p className="st-plan-desc">
                Para profesionales y emprendedores que quieren destacar con funciones de negocio.
              </p>
            </div>

            <ul className="st-plan-features">
              {PLAN_PLUS_FEATURES.map(f => (
                <li key={f.label} className={`st-plan-feature ${!f.ok ? 'st-feature-muted' : ''}`}>
                  {f.ok
                    ? <i className="fa-solid fa-check st-check-plus" />
                    : <i className="fa-solid fa-xmark" />
                  }
                  {f.label}
                </li>
              ))}
            </ul>

            <CouponWidget
              context="subscription"
              basePrice={3999}
              baseWaMsg="Hola! Quiero contratar el Plan Plus de Cloudinf ($3.999/mes). ¿Cómo procedo?"
              buyLabel="Contratar Plus"
              btnClass="st-plan-btn st-btn-plus"
              btnIcon="fa-whatsapp fa-brands"
            />
          </div>

          {/* ── Team ─── */}
          <div className="st-plan st-plan-premium st-plan-premium-card">
            <div className="st-plan-glow st-plan-glow-pink" />

            <div>
              <div className="st-plan-top">
                <span className="st-plan-name">Team</span>
                <span className="st-plan-badge st-badge-premium">PREMIUM</span>
              </div>
              <div className="st-plan-price-row">
                <span className="st-plan-currency">$</span>
                <span className="st-plan-amount">6.999</span>
              </div>
              <p className="st-plan-period">por mes · en pesos argentinos</p>
              <p className="st-plan-desc">
                Para negocios y marcas que quieren el máximo potencial y atención personalizada.
              </p>
            </div>

            <ul className="st-plan-features">
              {PLAN_PREMIUM_FEATURES.map(f => (
                <li key={f.label} className="st-plan-feature">
                  <i className="fa-solid fa-check st-check-premium" />
                  {f.label}
                </li>
              ))}
            </ul>

            <CouponWidget
              context="subscription"
              basePrice={6999}
              baseWaMsg="Hola! Quiero contratar el Plan Premium de Cloudinf ($6.999/mes). ¿Cómo procedo?"
              buyLabel="Contratar Premium"
              btnClass="st-plan-btn st-btn-premium"
              btnIcon="fa-whatsapp fa-brands"
            />
          </div>

        </div>
      </section>

      {/* ── Tabla comparativa ───────────────────────── */}
      <div className="st-compare">
        <div className="st-section-header">
          <h2 className="st-section-title" style={{ fontSize: '1.6rem' }}>
            Compará los planes
          </h2>
        </div>
        <table className="st-compare-table">
          <thead>
            <tr>
              <th>Función</th>
              <th className={userPlan === 'Gratuito' ? 'col-user-plan' : ''}>
                Gratuito
                {userPlan === 'Gratuito' && <span className="col-user-badge">Tu plan</span>}
              </th>
              <th className={`col-featured${userPlan === 'Pro' ? ' col-user-plan' : ''}`}>
                Pro
                {userPlan === 'Pro' && <span className="col-user-badge">Tu plan</span>}
              </th>
              <th className={userPlan === 'Team' ? 'col-user-plan' : ''}>
                Team
                {userPlan === 'Team' && <span className="col-user-badge">Tu plan</span>}
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map(row => (
              <tr key={row.feature}>
                <td>{row.feature}</td>
                <td className={userPlan === 'Gratuito' ? 'col-user-plan' : ''}>
                  {typeof row.free === 'string' ? row.free : row.free ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-xmark st-xmark" />}
                </td>
                <td className={`col-featured${userPlan === 'Pro' ? ' col-user-plan' : ''}`}>
                  {typeof row.plus === 'string' ? row.plus : row.plus ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-xmark st-xmark" />}
                </td>
                <td className={userPlan === 'Team' ? 'col-user-plan' : ''}>
                  {typeof row.team === 'string' ? row.team : row.team ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-xmark st-xmark" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── NFC Card ────────────────────────────────── */}
      <section className="st-nfc-section">
        <div className="st-nfc-card">
          <div className="st-nfc-glow" />

          {/* Copy */}
          <div className="st-nfc-copy">
            <div className="st-nfc-badge">
              <i className="fa-solid fa-wifi" />
              TARJETA NFC FÍSICA
            </div>
            <h2 className="st-nfc-title">
              Un toque. Tu perfil.<br />
              <span className="st-hero-gradient">Sin apps, sin fricción.</span>
            </h2>
            <p className="st-nfc-desc">
              La tarjeta NFC de Cloudinf es tu presentación profesional en formato físico.
              Acercala a cualquier celular y al instante comparte todo tu perfil digital.
              Pago único, sin suscripción, para siempre.
            </p>

            <div className="st-nfc-price-row">
              <span className="st-nfc-price-currency">$</span>
              <span className="st-nfc-price-amount">44.999</span>
            </div>
            <p className="st-nfc-price-label">pago único · en pesos argentinos · envío incluido</p>

            <div className="st-nfc-includes">
              {NFC_INCLUDES.map(item => (
                <div key={item.label} className="st-nfc-include-item">
                  <i className={`fa-solid ${item.icon}`} />
                  {item.label}
                </div>
              ))}
            </div>

            <div className="st-nfc-cta-row">
              <CouponWidget
                context="nfc"
                basePrice={44999}
                baseWaMsg="Hola! Quiero comprar una tarjeta NFC de Cloudinf ($44.999). ¿Cómo la pido?"
                buyLabel="Comprar ahora"
                btnClass="st-btn-nfc-primary"
                btnIcon="fa-credit-card"
              />
              <a
                href={waLink('Hola! Quisiera consultar sobre la tarjeta NFC de Cloudinf.')}
                target="_blank"
                rel="noopener noreferrer"
                className="st-btn-nfc-wa"
              >
                <i className="fa-brands fa-whatsapp" />
                Consultar por WhatsApp
              </a>
            </div>
          </div>

          {/* Card mockup */}
          <div className="st-card-mockup">
            <div className="st-card-float-top">
              <i className="fa-solid fa-bolt" /> NFC activo
            </div>

            <div className="st-card-visual">
              <div className="st-card-gloss" />
              <div className="st-card-circle-1" />
              <div className="st-card-circle-2" />
              <i className="fa-solid fa-wifi st-card-nfc-icon" />
              <div className="st-card-content">
                <div className="st-card-qr-row">
                  <div className="st-card-logo">
                    Cloud<span>inf</span>
                  </div>
                  <div className="st-card-qr-placeholder">
                    <i className="fa-solid fa-qrcode" />
                  </div>
                </div>
              </div>
            </div>

            <div className="st-card-float-badge">
              <i className="fa-solid fa-check" />
              Perfil compartido al instante
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────── */}
      <section className="st-faq-section">
        <div className="st-section-header">
          <div className="st-section-badge">PREGUNTAS FRECUENTES</div>
          <h2 className="st-section-title">¿Dudas? Las respondemos.</h2>
        </div>
        <div className="st-faq-list">
          {FAQS.map(faq => (
            <div key={faq.q} className="st-faq-item">
              <div className="st-faq-q">
                {faq.q}
                <i className="fa-solid fa-chevron-right" />
              </div>
              <p className="st-faq-a">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────── */}
      <section className="st-cta-section">
        <div className="st-cta-box">
          <div className="st-cta-glow" />
          <h2 className="st-cta-title">¿Listo para dar el salto?</h2>
          <p className="st-cta-sub">
            Creá tu perfil gratis ahora. Cuando quieras, sumá la tarjeta NFC o un plan mensual.
          </p>
          <div className="st-cta-buttons">
            <Link href="/register" className="st-cta-btn-primary">
              <i className="fa-solid fa-rocket" />
              Crear Perfil Gratis
            </Link>
            <a
              href={waLink('Hola! Quiero consultar sobre los planes de Cloudinf.')}
              target="_blank"
              rel="noopener noreferrer"
              className="st-cta-btn-secondary"
            >
              <i className="fa-brands fa-whatsapp" />
              Hablar con ventas
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="st-footer">
        <div className="st-footer-inner">
          <div className="st-footer-logo">
            <div className="st-footer-logo-icon">
              <i className="fa-solid fa-cloud" />
            </div>
            Cloud<span>inf</span>
          </div>
          <p className="st-footer-copy">© {new Date().getFullYear()} Cloudinf. Todos los derechos reservados.</p>
          <div className="st-footer-links">
            <Link href="/" className="st-footer-link">Inicio</Link>
            <Link href="/privacy" className="st-footer-link">Privacidad</Link>
            <Link href="/register" className="st-footer-link">Registrarse</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
