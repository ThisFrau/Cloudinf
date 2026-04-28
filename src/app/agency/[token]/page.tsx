import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function AgencyView({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const user = await prisma.user.findUnique({
    where: { agencyToken: token },
    include: {
      links: true,
      bookingConfig: { include: { bookings: true } },
      contactMessages: { orderBy: { createdAt: 'desc' }, take: 20 },
      quoteForm: { include: { submissions: { orderBy: { createdAt: 'desc' }, take: 20 } } },
    },
  })

  if (!user) notFound()

  const totalClicks = user.links.reduce((s, l) => s + l.clicks, 0)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const bookingsThisWeek = user.bookingConfig?.bookings.filter(b => new Date(b.createdAt) >= weekAgo).length ?? 0

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 700, fontSize: '1.2rem' }}>
          Cloud<span style={{ color: '#ec4899' }}>inf</span>
        </Link>
        <span style={{ color: '#666' }}>/ Vista de Agencia</span>
        <span style={{ color: '#888', fontSize: '0.85rem' }}>
          Perfil: <strong style={{ color: '#a855f7' }}>@{user.username}</strong> — Solo lectura
        </span>
      </div>

      <h1 style={{ marginBottom: '0.5rem' }}>Panel de {user.name || user.username}</h1>
      <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>Acceso de solo lectura. Generado por el propietario del perfil.</p>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Vistas del perfil', value: user.profileViews, icon: '👁' },
          { label: 'Clicks en links', value: totalClicks, icon: '🔗' },
          { label: 'Reservas esta semana', value: bookingsThisWeek, icon: '📅' },
          { label: 'Mensajes recibidos', value: user.contactMessages.length, icon: '✉️' },
          { label: 'Solicitudes de presupuesto', value: user.quoteForm?.submissions.length ?? 0, icon: '📋' },
        ].map(s => (
          <div key={s.label} style={{ background: '#f9f9f9', borderRadius: 12, padding: '1.2rem', textAlign: 'center', border: '1px solid #eee' }}>
            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a855f7' }}>{s.value}</div>
            <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Links performance */}
      {user.links.filter(l => l.type !== 'header').length > 0 && (
        <>
          <h2 style={{ marginBottom: '1rem' }}>Performance de Links</h2>
          <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', marginBottom: '2rem' }}>
            {[...user.links].filter(l => l.type !== 'header').sort((a, b) => b.clicks - a.clicks).map((l, i) => {
              const max = Math.max(...user.links.map(x => x.clicks), 1)
              return (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: i % 2 ? '#fafafa' : '#fff', borderBottom: '1px solid #eee' }}>
                  <span style={{ flex: 1, fontSize: '0.9rem' }}>{l.title}</span>
                  <div style={{ flex: 2, background: '#eee', borderRadius: 4, height: 8 }}>
                    <div style={{ width: `${(l.clicks / max) * 100}%`, background: '#a855f7', height: 8, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontWeight: 600, color: '#a855f7', minWidth: 30, textAlign: 'right' }}>{l.clicks}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Recent messages */}
      {user.contactMessages.length > 0 && (
        <>
          <h2 style={{ marginBottom: '1rem' }}>Últimos Mensajes</h2>
          <div style={{ marginBottom: '2rem' }}>
            {user.contactMessages.slice(0, 5).map(m => (
              <div key={m.id} style={{ background: '#f9f9f9', borderRadius: 12, padding: '1rem', marginBottom: '0.5rem', border: '1px solid #eee' }}>
                <strong>{m.name || 'Sin nombre'}</strong>
                <span style={{ color: '#888', marginLeft: '0.5rem', fontSize: '0.85rem' }}>{m.email}</span>
                {m.message && <p style={{ color: '#444', marginTop: '0.25rem', fontSize: '0.9rem' }}>&quot;{m.message}&quot;</p>}
                <small style={{ color: '#aaa' }}>{new Date(m.createdAt).toLocaleDateString('es-AR')}</small>
              </div>
            ))}
          </div>
        </>
      )}

      <p style={{ color: '#bbb', fontSize: '0.8rem', textAlign: 'center', marginTop: '3rem' }}>
        Panel de agencia de Cloudinf • Solo lectura • No se pueden realizar cambios desde esta vista
      </p>
    </main>
  )
}
