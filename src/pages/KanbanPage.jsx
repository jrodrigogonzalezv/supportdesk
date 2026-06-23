import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import KanbanBoard from '../components/kanban/KanbanBoard'
import StatusGateModal from '../components/kanban/StatusGateModal'
import { sendStatusNotification } from '../lib/notify'
import { Search, Copy, Check, Building2, ChevronRight } from 'lucide-react'
import { PRIORITY_CONFIG, STATUS_CONFIG, KANBAN_COLUMNS } from '../data/ticketConfig'
import { timeAgo } from '../utils/date'

const GATED = new Set(['resolved', 'closed'])

// ── Mobile ticket row ──────────────────────────────────────────────────────

function MobileTicketRow({ ticket, onClick }) {
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low
  return (
    <div onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-4 active:bg-slate-50 transition-colors cursor-pointer">
      <div className="flex items-start gap-3">
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${priority.dot}`} />
        <div className="flex-1 min-w-0">
          <span className="font-mono text-[10px] text-slate-400">#{String(ticket.ticketNumber || 0).padStart(3, '0')}</span>
          <p className="font-semibold text-slate-800 text-sm leading-snug mt-0.5">{ticket.title}</p>
          <p className="text-xs text-slate-400 mt-1">
            {ticket.clientName || ticket.clientEmail}
            {ticket.clientCompany && ` · ${ticket.clientCompany}`}
            {' · '}{timeAgo(ticket.createdAt)}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function KanbanPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCompany, setFilterCompany] = useState('')
  const [mobileStatus, setMobileStatus] = useState('new')
  const [copied, setCopied] = useState(false)
  const [pendingTransition, setPendingTransition] = useState(null)

  const orgId = user?.profile?.orgId

  useEffect(() => {
    if (!orgId) { setLoading(false); return }
    setLoading(true)
    const q = query(collection(db, 'tickets'), where('orgId', '==', orgId), orderBy('createdAt', 'desc'))
    return onSnapshot(q,
      snap => { setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) },
      err => { console.error('[Kanban]', err.code, err.message); setLoading(false) }
    )
  }, [orgId])

  const companies = [...new Set(tickets.map(t => t.clientCompany).filter(Boolean))].sort()
  const publicLink = orgId ? `${window.location.origin}/new-ticket/${orgId}` : ''

  function copyLink() {
    navigator.clipboard.writeText(publicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Status change ──────────────────────────────────────────────────────

  function handleStatusChange(ticket, newStatus) {
    if (GATED.has(newStatus)) { setPendingTransition({ ticket, newStatus }); return }
    applyUpdate(ticket, newStatus, '')
  }

  async function handleModalConfirm({ note }) {
    if (!pendingTransition) return
    const { ticket, newStatus } = pendingTransition
    setPendingTransition(null)
    await applyUpdate(ticket, newStatus, note)
  }

  async function applyUpdate(ticket, newStatus, note) {
    const now = serverTimestamp()
    const fields = { status: newStatus, updatedAt: now }
    if (newStatus === 'resolved') { fields.resolutionNote = note; fields.resolvedAt = now }
    if (newStatus === 'closed')   { fields.closingReason = note;  fields.closedAt = now }
    try {
      await updateDoc(doc(db, 'tickets', ticket.id), fields)
      sendStatusNotification(ticket, newStatus, note)
    } catch (err) { console.error('[Kanban] update:', err) }
  }

  // ── Filtering ─────────────────────────────────────────────────────────

  const filtered = tickets.filter(t => {
    if (filterCompany && t.clientCompany !== filterCompany) return false
    if (filterPriority && t.priority !== filterPriority) return false
    if (search) {
      const q = search.toLowerCase()
      if (!t.title?.toLowerCase().includes(q) && !t.clientName?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const mobileTickets = filtered.filter(t => t.status === mobileStatus)

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3 flex-wrap">
        <h1 className="text-base md:text-lg font-bold text-slate-900 mr-auto">Tickets</h1>

        {publicLink && (
          <button onClick={copyLink}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-700 px-2.5 py-1.5 rounded-lg transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Link clientes'}</span>
          </button>
        )}

        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..." className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-800 w-36 md:w-40" />
        </div>

        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="text-xs md:text-sm border border-slate-200 rounded-lg px-2 md:px-3 py-1.5 focus:outline-none focus:border-blue-800 text-slate-700">
          <option value="">Prioridad</option>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden border-b border-slate-200 bg-white px-4 py-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tickets..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-800" />
        </div>
      </div>

      {/* Company tabs */}
      {companies.length > 0 && (
        <div className="border-b border-slate-200 bg-white px-4 md:px-6 flex items-center gap-1 overflow-x-auto">
          <button onClick={() => setFilterCompany('')}
            className={`flex-shrink-0 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${!filterCompany ? 'border-blue-800 text-blue-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Todos
          </button>
          {companies.map(company => (
            <button key={company} onClick={() => setFilterCompany(company === filterCompany ? '' : company)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${filterCompany === company ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Building2 className="w-3 h-3" />{company}
            </button>
          ))}
        </div>
      )}

      {/* ── MOBILE: status tabs + list ── */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        {/* Status tabs */}
        <div className="flex overflow-x-auto bg-white border-b border-slate-200 px-2 flex-shrink-0">
          {KANBAN_COLUMNS.map(s => {
            const cfg = STATUS_CONFIG[s]
            const count = filtered.filter(t => t.status === s).length
            return (
              <button key={s} onClick={() => setMobileStatus(s)}
                className={`flex-shrink-0 px-3 py-2.5 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  mobileStatus === s ? 'border-blue-800 text-blue-800' : 'border-transparent text-slate-500'
                }`}>
                {cfg.label}
                {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
              </button>
            )
          })}
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading
            ? <p className="text-center text-slate-400 text-sm pt-12">Cargando...</p>
            : mobileTickets.length === 0
              ? <div className="text-center pt-16 text-slate-400">
                  <p className="text-sm">Sin tickets en este estado</p>
                </div>
              : mobileTickets.map(ticket => (
                  <MobileTicketRow key={ticket.id} ticket={ticket} onClick={() => navigate(`/tickets/${ticket.id}`)} />
                ))
          }
        </div>
      </div>

      {/* ── DESKTOP: kanban board ── */}
      <div className="hidden md:block flex-1 overflow-auto p-6">
        {loading
          ? <div className="flex items-center justify-center h-full text-slate-400 text-sm">Cargando tickets...</div>
          : <KanbanBoard tickets={filtered} onCardClick={t => navigate(`/tickets/${t.id}`)} onStatusChange={handleStatusChange} />
        }
      </div>

      {pendingTransition && (
        <StatusGateModal
          ticket={pendingTransition.ticket}
          newStatus={pendingTransition.newStatus}
          onConfirm={handleModalConfirm}
          onCancel={() => setPendingTransition(null)}
        />
      )}
    </div>
  )
}
