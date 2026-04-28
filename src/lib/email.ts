import nodemailer from 'nodemailer'

function getTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) return null
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT || '587'),
    secure: parseInt(EMAIL_PORT || '587') === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  })
}

const FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Cloudinf <no-reply@cloudinf.com>'

export async function sendBookingReceivedEmail({
  to, name, date, time, businessName,
}: {
  to: string; name: string; date: string; time: string; businessName: string
}) {
  const t = getTransporter()
  if (!t) return false
  await t.sendMail({
    from: FROM,
    to,
    subject: `Reserva recibida — ${businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a2e">¡Reserva recibida, ${name}!</h2>
        <p>Tu solicitud de turno fue recibida correctamente.</p>
        <div style="background:#f4f4f8;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:4px 0"><strong>Negocio:</strong> ${businessName}</p>
          <p style="margin:4px 0"><strong>Fecha:</strong> ${date}</p>
          <p style="margin:4px 0"><strong>Hora:</strong> ${time}</p>
          <p style="margin:4px 0"><strong>Estado:</strong> Pendiente de confirmación</p>
        </div>
        <p style="color:#666;font-size:0.9rem">Te avisaremos cuando el negocio confirme tu turno.</p>
      </div>`,
  })
  return true
}

export async function sendBookingConfirmedEmail({
  to, name, date, time, businessName,
}: {
  to: string; name: string; date: string; time: string; businessName: string
}) {
  const t = getTransporter()
  if (!t) return false
  await t.sendMail({
    from: FROM,
    to,
    subject: `Turno confirmado ✅ — ${businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#16a34a">¡Tu turno está confirmado, ${name}!</h2>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:4px 0"><strong>Negocio:</strong> ${businessName}</p>
          <p style="margin:4px 0"><strong>Fecha:</strong> ${date}</p>
          <p style="margin:4px 0"><strong>Hora:</strong> ${time}</p>
        </div>
        <p style="color:#666;font-size:0.9rem">Recordá llegar unos minutos antes. ¡Hasta pronto!</p>
      </div>`,
  })
  return true
}

export async function sendBookingCancelledEmail({
  to, date, time, businessName,
}: {
  to: string; name: string; date: string; time: string; businessName: string
}) {
  const t = getTransporter()
  if (!t) return false
  await t.sendMail({
    from: FROM,
    to,
    subject: `Turno cancelado — ${businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#dc2626">Tu turno fue cancelado</h2>
        <p>Lamentablemente el negocio tuvo que cancelar tu turno.</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:4px 0"><strong>Negocio:</strong> ${businessName}</p>
          <p style="margin:4px 0"><strong>Fecha:</strong> ${date}</p>
          <p style="margin:4px 0"><strong>Hora:</strong> ${time}</p>
        </div>
        <p style="color:#666;font-size:0.9rem">Podés volver a reservar en otro horario disponible.</p>
      </div>`,
  })
  return true
}

export async function sendNewBookingNotification({
  ownerEmail, guestName, guestEmail, date, time, note, businessName,
}: {
  ownerEmail: string; guestName: string; guestEmail: string
  date: string; time: string; note?: string | null; businessName: string
}) {
  const t = getTransporter()
  if (!t) return false
  await t.sendMail({
    from: FROM,
    to: ownerEmail,
    subject: `Nueva reserva de ${guestName} — ${date} ${time}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a2e">Nueva reserva en ${businessName}</h2>
        <div style="background:#f4f4f8;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:4px 0"><strong>Cliente:</strong> ${guestName}</p>
          <p style="margin:4px 0"><strong>Email:</strong> ${guestEmail}</p>
          <p style="margin:4px 0"><strong>Fecha:</strong> ${date}</p>
          <p style="margin:4px 0"><strong>Hora:</strong> ${time}</p>
          ${note ? `<p style="margin:4px 0"><strong>Nota:</strong> ${note}</p>` : ''}
        </div>
        <p style="color:#666;font-size:0.9rem">Entrá a tu dashboard para confirmar o rechazar el turno.</p>
      </div>`,
  })
  return true
}
