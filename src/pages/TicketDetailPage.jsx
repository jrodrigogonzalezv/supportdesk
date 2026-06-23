import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import CommentThread from '../components/ticket/CommentThread'
import AttachmentList from '../components/ticket/AttachmentList'
import { PRIORITY_CONFIG, RISK_CONFIG, STATUS_CONFIG, KANBAN_COLUMNS, DEFAULT_CATEGORIES } from '../data/ticketConfig'
import { ArrowLeft, Clock, User } from 'lucide-react'
import { formatDate } from '../utils/date'

export default function TicketDetailPage() {
  const { ticketId: id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isAgent = ['admin', 'agent'].includes(user?.profile?.role)
  const orgId = user?.profile?.orgId

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'tickets', id), snap => {
      if (snap.exists()) setTicket({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
    return unsub
  }, [id])

  useEffect(() => {
    const q = query(collection(db, 'tickets', id, 'comments'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [id])

  async function update(field, value) {
    setSaving(true)
    try { await updateDoc(doc(db, 'tickets', id), { [field]: value, updatedAt: serverTimestamp() }) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Cargando...</div>
  if (!ticket) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Ticket no encontrado.</div>

  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low
  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.new
  const selectCls = 'w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-800 bg-white text-slate-800'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 md:px-6 py-3 md:py-4 flex items-center gap-3">
        <button onClick={() => navigate('/tickets')} className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-sm text-slate-400 flex-shrink-0">#{String(ticket.ticketNumber || 0).padStart(3, '0')}</span>
        <h1 className="text-sm md:text-base font-bold text-slate-900 flex-1 truncate">{ticket.title}</h1>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${status.headerCls}`}>{status.label}</span>
        {saving && <span className="text-xs text-slate-400 hidden sm:block">Guardando...</span>}
      </div>

      {/* Body — stacks on mobile */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* Left: description + comments */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 md:space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Descripción</p>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {ticket.description || <span className="text-slate-400">Sin descripción.</span>}
            </div>
          </div>

          {/* Resolution note (if resolved) */}
          {ticket.resolutionNote && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Nota de resolución</p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap">
                {ticket.resolutionNote}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Adjuntos</p>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <AttachmentList ticketId={id} orgId={orgId || ticket.orgId} attachments={ticket.attachments} canUpload={isAgent} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Comentarios</p>
            <CommentThread ticketId={id} comments={comments} isAgent={isAgent} />
          </div>
        </div>

        {/* Right: properties panel */}
        {isAgent && (
          <div className="md:w-72 border-t md:border-t-0 md:border-l border-slate-200 bg-white overflow-y-auto p-4 md:p-5 flex-shrink-0 space-y-4 md:space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Estado</label>
              <select value={ticket.status} onChange={e => update('status', e.target.value)} className={selectCls}>
                {KANBAN_COLUMNS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Prioridad</label>
              <select value={ticket.priority} onChange={e => update('priority', e.target.value)} className={selectCls}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
                <span className="text-xs text-slate-500">{priority.label}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Riesgo</label>
              <select value={ticket.risk || 'low'} onChange={e => update('risk', e.target.value)} className={selectCls}>
                {Object.entries(RISK_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Categoría</label>
              <select value={ticket.category || ''} onChange={e => update('category', e.target.value)} className={selectCls}>
                <option value="">Sin categoría</option>
                {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Información</p>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-700 truncate">{ticket.clientName || ticket.clientEmail}</span>
              </div>
              {ticket.clientCompany && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full">{ticket.clientCompany}</span>
                </div>
              )}
              {ticket.clientPhone && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">📱 {ticket.clientPhone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-500">{formatDate(ticket.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
