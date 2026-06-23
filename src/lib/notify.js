import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from './firebase'
import { STATUS_CONFIG } from '../data/ticketConfig'

const functions = getFunctions(app)
const sendEmailFn = httpsCallable(functions, 'sendEmail')

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
