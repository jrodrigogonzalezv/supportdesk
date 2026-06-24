import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from './firebase'
import { STATUS_CONFIG } from '../data/ticketConfig'

const fn = getFunctions(app)
const sendEmailFn = httpsCallable(fn, 'sendEmail')

// ─── Helpers ────────────────────────────────────────────────────────────────

function ticketNum(ticket) {
  return String(ticket.ticketNumber || 0).padStart(3, '0')
}

const baseStyle = `
  font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;
  padding:32px 24px;color:#1e293b
`

function emailShell(content) {
  return `<div style="${baseStyle}">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
      <div style="width:32px;height:32px;background:#1e40af;border-radius:8px;display:flex;align-items:center;justify-content:center">
        <span style="color:#fff;font-weight:700;font-size:14px">SD</span>
      </div>
      <span style="font-weight:700;font-size:15px">SupportDesk</span>
    </div>
    ${content}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:12px;color:#94a3b8;margin:0">Email generado automáticamente — no respondas directamente.</p>
  </div>`
}

async function sendMail(to, subject, html, text) {
  try {
    await sendEmailFn({ to, subject, html, text })
  } catch (e) {
    console.warn('[notify] sendEmail failed:', e.message)
  }
}

// ─── Client: ticket created ──────────────────────────────────────────────────

export async function notifyClientTicketCreated(ticket) {
  if (!ticket?.clientEmail) return
  const num = ticketNum(ticket)
  const subject = `Ticket #${num} recibido — ${ticket.title}`
  const html = emailShell(`
    <h2 style="font-size:18px;font-weight:700;margin:0 0 16px">Tu ticket fue recibido</h2>
    <p>Hola <strong>${ticket.clientName || ticket.clientEmail}</strong>,</p>
    <p>Recibimos tu solicitud y la estamos revisando. Te avisaremos cuando haya novedades.</p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:20px 0">
      <p style="margin:0 0 4px;font-size:11px;color:#1d4ed8;font-weight:700;text-transform:uppercase">Tu ticket</p>
      <p style="margin:0 0 6px;font-weight:600">#${num} — ${ticket.title}</p>
      <p style="margin:0;font-size:13px;color:#64748b">${ticket.description?.slice(0, 120) || ''}${ticket.description?.length > 120 ? '…' : ''}</p>
    </div>
  `)
  const text = `Hola ${ticket.clientName || ticket.clientEmail},\n\nTu ticket #${num} "${ticket.title}" fue recibido. Te avisaremos pronto.\n`
  await sendMail(ticket.clientEmail, subject, html, text)
}

// ─── Admin: new ticket created ───────────────────────────────────────────────

export async function notifyAdminTicketCreated(ticket, adminEmail) {
  if (!adminEmail) return
  const num = ticketNum(ticket)
  const subject = `Nuevo ticket #${num} — ${ticket.title}`
  const html = emailShell(`
    <h2 style="font-size:18px;font-weight:700;margin:0 0 16px">Nuevo ticket de soporte</h2>
    <p>Se creó un nuevo ticket en tu panel.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0">
      <p style="margin:0 0 4px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">Detalles</p>
      <p style="margin:0 0 8px;font-weight:700;font-size:16px">#${num} — ${ticket.title}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#64748b">👤 ${ticket.clientName} &lt;${ticket.clientEmail}&gt;</p>
      ${ticket.clientCompany ? `<p style="margin:0 0 4px;font-size:13px;color:#64748b">🏢 ${ticket.clientCompany}</p>` : ''}
      <p style="margin:0 0 4px;font-size:13px;color:#64748b">Prioridad: <strong>${ticket.priority}</strong></p>
      ${ticket.description ? `<p style="margin:12px 0 0;font-size:13px;color:#374151;white-space:pre-wrap">${ticket.description.slice(0, 200)}${ticket.description.length > 200 ? '…' : ''}</p>` : ''}
    </div>
  `)
  const text = `Nuevo ticket #${num}: "${ticket.title}"\nDe: ${ticket.clientName} <${ticket.clientEmail}>\nPrioridad: ${ticket.priority}`
  await sendMail(adminEmail, subject, html, text)
}

// ─── Remote session: primera vez (pedir ID al cliente) ───────────────────────

export async function sendRemoteSessionInvite(ticket, portalUrl) {
  if (!ticket?.clientEmail) return
  const num = ticketNum(ticket)
  const subject = `Soporte remoto solicitado — Ticket #${num}`
  const html = emailShell(`
    <h2 style="font-size:18px;font-weight:700;margin:0 0 16px">Tu técnico necesita conectarse a tu equipo</h2>
    <p>Hola <strong>${ticket.clientName || ticket.clientEmail}</strong>,</p>
    <p>Para resolver tu caso <strong>#${num} "${ticket.title}"</strong> necesitamos acceder remotamente a tu equipo. Sigue estos pasos:</p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin:20px 0">
      <p style="margin:0 0 16px;font-size:11px;color:#1d4ed8;font-weight:700;text-transform:uppercase">Pasos para conectarte</p>
      <p style="margin:0 0 12px;font-size:13px;color:#1e293b"><strong>1.</strong> Descarga e instala RustDesk (gratis):<br>
        <a href="https://rustdesk.com/es/" style="color:#1d4ed8">https://rustdesk.com/es/</a>
      </p>
      <p style="margin:0 0 12px;font-size:13px;color:#1e293b"><strong>2.</strong> Abre RustDesk — en la pantalla principal verás tu <strong>ID</strong> (un número de 9 dígitos).</p>
      <p style="margin:0;font-size:13px;color:#1e293b"><strong>3.</strong> Comparte ese ID con tu técnico${portalUrl ? ` respondiendo como comentario en <a href="${portalUrl}" style="color:#1d4ed8">tu ticket</a>` : ' por el canal que te indique'}.</p>
    </div>

    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin:20px 0">
      <p style="margin:0 0 6px;font-size:11px;color:#16a34a;font-weight:700;text-transform:uppercase">Tu técnico hará el resto</p>
      <p style="margin:0;font-size:13px;color:#15803d">Una vez que reciba tu ID, te enviará una solicitud de conexión. Solo haz clic en <strong>Aceptar</strong> en RustDesk.</p>
    </div>

    <p style="font-size:13px;color:#64748b">La sesión es segura y la puedes cerrar en cualquier momento desde RustDesk.</p>
  `)
  const text = `Hola ${ticket.clientName || ticket.clientEmail},\n\nPara resolver el ticket #${num} necesitamos conectarnos remotamente.\n\n1. Descarga RustDesk (gratis): https://rustdesk.com/es/\n2. Abre RustDesk — verás tu ID en la pantalla principal\n3. Comparte ese ID con tu técnico${portalUrl ? ` en: ${portalUrl}` : ''}\n\nUna vez que lo reciba, te enviará una solicitud de conexión — haz clic en Aceptar.\nPuedes cerrar la sesión en cualquier momento.`
  await sendMail(ticket.clientEmail, subject, html, text)
}

// ─── Remote session: sesiones siguientes (ID ya guardado) ────────────────────

export async function sendRemoteSessionReady(ticket, portalUrl) {
  if (!ticket?.clientEmail) return
  const num = ticketNum(ticket)
  const subject = `Tu técnico se está conectando — Ticket #${num}`
  const html = emailShell(`
    <h2 style="font-size:18px;font-weight:700;margin:0 0 16px">Tu técnico está listo para conectarse</h2>
    <p>Hola <strong>${ticket.clientName || ticket.clientEmail}</strong>,</p>
    <p>Tu técnico va a iniciar una sesión remota para resolver el ticket <strong>#${num} "${ticket.title}"</strong>.</p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin:20px 0">
      <p style="margin:0 0 12px;font-size:11px;color:#1d4ed8;font-weight:700;text-transform:uppercase">Solo necesitas hacer esto</p>
      <p style="margin:0 0 10px;font-size:13px;color:#1e293b"><strong>1.</strong> Abre <strong>RustDesk</strong> en tu equipo.</p>
      <p style="margin:0;font-size:13px;color:#1e293b"><strong>2.</strong> Cuando aparezca la solicitud de conexión, haz clic en <strong>Aceptar</strong>.</p>
    </div>

    <p style="font-size:13px;color:#64748b">No tienes RustDesk instalado? <a href="https://rustdesk.com/es/" style="color:#1d4ed8">Descárgalo aquí</a> (es gratis).</p>
    <p style="font-size:13px;color:#64748b">Puedes cerrar la sesión en cualquier momento desde RustDesk.</p>
    ${portalUrl ? `<p style="font-size:13px;margin-top:8px"><a href="${portalUrl}" style="color:#1d4ed8">Ver mi ticket →</a></p>` : ''}
  `)
  const text = `Hola ${ticket.clientName || ticket.clientEmail},\n\nTu técnico va a conectarse para resolver el ticket #${num}.\n\n1. Abre RustDesk en tu equipo\n2. Cuando aparezca la solicitud, haz clic en Aceptar\n\nPuedes cerrar la sesión en cualquier momento.${portalUrl ? `\n\nVer tu ticket: ${portalUrl}` : ''}`
  await sendMail(ticket.clientEmail, subject, html, text)
}

// ─── Client: status changed ──────────────────────────────────────────────────

export async function sendStatusNotification(ticket, newStatus, note = '') {
  if (!ticket?.clientEmail) return
  const num = ticketNum(ticket)
  const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus
  const subject = `Ticket #${num} actualizado — ${statusLabel}`
  const html = emailShell(`
    <h2 style="font-size:18px;font-weight:700;margin:0 0 16px">Actualización de tu ticket</h2>
    <p>Hola <strong>${ticket.clientName || ticket.clientEmail}</strong>,</p>
    <p>Tu ticket <strong>#${num} "${ticket.title}"</strong> cambió al estado: <strong>${statusLabel}</strong>.</p>
    ${note ? `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin:16px 0">
      <p style="margin:0 0 4px;font-size:11px;color:#16a34a;font-weight:700;text-transform:uppercase">Nota del equipo</p>
      <p style="margin:0;font-size:14px;color:#15803d;white-space:pre-wrap">${note}</p>
    </div>` : ''}
  `)
  const text = `Hola ${ticket.clientName || ticket.clientEmail},\n\nTu ticket #${num} "${ticket.title}" cambió a: ${statusLabel}.${note ? `\n\nNota: ${note}` : ''}`
  await sendMail(ticket.clientEmail, subject, html, text)
}
