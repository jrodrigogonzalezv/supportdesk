# SupportDesk — CLAUDE.md

Sistema de soporte multi-tenant SaaS. Stack: React + Vite + Tailwind v4 + Firebase.

## Sesión 1 — 2026-06-22

### Completado
- Scaffold Vite + Firebase + Tailwind v4
- `src/lib/firebase.js` — auth, db, storage, sendSignInLinkToEmail
- `src/hooks/useAuth.jsx` — roles: admin | agent | client, `ensureUserDoc`, `claimInvite`
- `src/data/ticketConfig.js` — PRIORITY_CONFIG, RISK_CONFIG, STATUS_CONFIG, KANBAN_COLUMNS
- `src/utils/date.js` — `timeAgo`, `formatDate`
- `src/components/auth/LoginPage.jsx` — Google OAuth + email/password
- `src/components/layout/AppLayout.jsx` — sidebar colapsable
- `src/components/kanban/KanbanCard.jsx` + `KanbanBoard.jsx`
- `src/components/ticket/CommentThread.jsx` + `AttachmentList.jsx`
- `src/pages/KanbanPage.jsx` — Kanban real-time con filtros
- `src/pages/TicketDetailPage.jsx` — detalle completo (agentes)
- `src/pages/Dashboard.jsx` — stats por estado y prioridad
- `src/pages/NewTicketPage.jsx` — formulario público `/new-ticket/:orgId`
- `src/pages/ClientPortalPage.jsx` — magic link auth + lista tickets
- `src/pages/ClientTicketPage.jsx` — detalle ticket para clientes
- `src/pages/JoinPage.jsx` — aceptar invitación de equipo
- `src/pages/TeamPage.jsx` — gestión de agentes e invitaciones
- `src/pages/SettingsPage.jsx` — categorías por org
- `src/pages/ClientsPage.jsx` — lista clientes por tickets
- `src/App.jsx` — rutas completas con PrivateRoute
- `firestore.rules` + `storage.rules`

### Pendiente
- Crear Firebase project + llenar `.env`
- `firebase init` + primer deploy
- Git init + push a GitHub repo `jrodrigogonzalezv/supportdesk`
- Activar en Firebase Console: Email link (passwordless sign-in)
- Cloud Functions: `sendTicketConfirmation`, `notifyClientUpdate`, `sendTeamInvite`

## Arquitectura multi-tenant

- `orgId = uid del admin` (igual que FlowSync)
- `ticketNumber` auto-incrementa via Firestore transaction en `organizations/{orgId}.ticketCounter`
- Comentarios `isInternal: true` solo visibles para agentes
- Clientes se autentican via magic link en `/portal`
- Link público para tickets: `/new-ticket/{orgId}`

## Firestore paths

- `organizations/{orgId}` — name, ownerId, ticketCounter, categories[]
- `users/{uid}` — email, displayName, orgId, role
- `tickets/{ticketId}` — todos los campos del ticket
- `tickets/{ticketId}/comments/{id}` — content, isInternal, authorName
- `invites/{inviteId}` — email, orgId, role, claimed

## Storage

- `ticket-attachments/{orgId}/{ticketId}/{fileId}.ext`
- Regla: allow read, write (sin auth para que clientes suban desde `/new-ticket`)

## SEGURIDAD

**Twilio Account SID y Auth Token NUNCA en CLAUDE.md ni archivos git-tracked.**
Se almacenan exclusivamente en Firebase Secret Manager.
GitHub push protection activo.
