# SupportDesk — CLAUDE.md

Sistema de soporte multi-tenant SaaS. Stack: React + Vite + Tailwind v4 + Firebase.

## Estado actual — 2026-06-25

- **Deploy:** https://system-soporte.web.app
- **Repo:** github.com/jrodrigogonzalezv/supportdesk (branch `master`, commit `0880b04`)
- **Firebase project:** `system-soporte`
- **Email:** Resend, dominio `system.cl`, from `soporte@system.cl`

---

## Sesión 1 — 2026-06-22

Scaffold completo del sistema:

- `src/lib/firebase.js` — auth, db, storage
- `src/hooks/useAuth.jsx` — roles: admin | agent | client
- `src/data/ticketConfig.js` — PRIORITY_CONFIG, RISK_CONFIG, STATUS_CONFIG, KANBAN_COLUMNS
- `src/utils/date.js` — `timeAgo`, `formatDate`
- `src/components/auth/LoginPage.jsx` — Google OAuth + email/password
- `src/components/layout/AppLayout.jsx` — sidebar colapsable
- `src/components/kanban/KanbanCard.jsx` + `KanbanBoard.jsx`
- `src/components/ticket/CommentThread.jsx` + `AttachmentList.jsx`
- `src/pages/KanbanPage.jsx` — Kanban real-time con filtros
- `src/pages/TicketDetailPage.jsx` — detalle completo (agentes)
- `src/pages/Dashboard.jsx` — stats por estado y prioridad
- `src/pages/ClientPortalPage.jsx` — magic link auth + lista tickets
- `src/pages/ClientTicketPage.jsx` — detalle ticket para clientes
- `src/pages/JoinPage.jsx` — aceptar invitación de equipo
- `src/pages/TeamPage.jsx` — gestión de agentes e invitaciones
- `src/pages/SettingsPage.jsx` — categorías por org + portales por empresa
- `src/pages/ClientsPage.jsx` — lista clientes por tickets
- `src/App.jsx` — rutas completas con PrivateRoute
- `firestore.rules` + `storage.rules`
- Firebase project creado, `.env` configurado, primer deploy realizado
- Git init + push a GitHub `jrodrigogonzalezv/supportdesk`

---

## Sesión 2 — 2026-06-23

Notificaciones por email via Cloud Functions + Resend:

- `functions/index.js` — Cloud Function `sendEmail` (onCall v2, secret `RESEND_API_KEY` en Secret Manager)
- `src/lib/notify.js` — creado con:
  - `notifyClientTicketCreated(ticket)` — confirma al cliente que se recibió su ticket
  - `notifyAdminTicketCreated(ticket, adminEmail)` — avisa al admin de nuevo ticket
  - `sendStatusNotification(ticket, newStatus, note)` — avisa al cliente de cambio de estado
- `src/components/ticket/PublicTicketForm.jsx` — llama ambas notificaciones al crear ticket; fallback: si `adminEmail` está vacío en el org doc, lo obtiene desde `users/{ownerId}`
- Portales por empresa con toggle "Login requerido" y Kanban público por portal

---

## Sesión 3 — 2026-06-24/25

Soporte remoto con RustDesk — flujo correcto (el cliente tiene el ID, no el agente):

- `src/lib/notify.js` — agregadas:
  - `sendRemoteSessionInvite(ticket, portalUrl)` — primera vez: email al cliente pidiendo que instale RustDesk, copie su ID y lo comparta como comentario en el ticket
  - `sendRemoteSessionReady(ticket, portalUrl)` — sesiones siguientes: email simple avisando que abra RustDesk y acepte la solicitud entrante
- `src/pages/TicketDetailPage.jsx`:
  - Campo editable "RustDesk ID del cliente" en sidebar del agente (auto-guarda al perder foco o Enter)
  - ID persistido en `organizations/{orgId}/clients/{clientEmail}` — se auto-carga en tickets futuros del mismo cliente
  - Botón inteligente: sin ID → **"Solicitar ID al cliente"** / con ID → **"Iniciar sesión remota"**
  - Comentario interno auto-generado con detalle de la acción
- `src/pages/SettingsPage.jsx` — eliminado campo "RustDesk ID del agente" (no aplica en el flujo correcto)

---

## Arquitectura multi-tenant

- `orgId = uid del admin`
- `ticketNumber` auto-incrementa via Firestore transaction en `organizations/{orgId}.ticketCounter`
- Comentarios `isInternal: true` solo visibles para agentes
- Clientes se autentican via magic link en `/{portalSlug}`
- Link público para tickets: `/new-ticket/{orgId}` o `/{portalSlug}`

## Firestore paths

- `organizations/{orgId}` — name, ownerId, ticketCounter, categories[], adminEmail
- `organizations/{orgId}/clients/{clientEmail}` — rustDeskId, clientName, updatedAt
- `users/{uid}` — email, displayName, orgId, role
- `tickets/{ticketId}` — todos los campos del ticket
- `tickets/{ticketId}/comments/{id}` — content, isInternal, authorName
- `invites/{inviteId}` — email, orgId, role, claimed
- `portals/{slug}` — orgId, companyName, requireLogin

## Storage

- `ticket-attachments/{orgId}/{ticketId}/{fileId}.ext`

## Pendiente

- Tighten Firestore security rules (actualmente `allow read, write: if true`)
- Code splitting para reducir bundle (~958KB, Vite advierte >500KB)
- WhatsApp via Twilio (mencionado, no implementado)

## SEGURIDAD

**Twilio Account SID y Auth Token NUNCA en CLAUDE.md ni archivos git-tracked.**
**RESEND_API_KEY NUNCA en código ni git-tracked. Solo en Firebase Secret Manager.**
GitHub push protection activo.
