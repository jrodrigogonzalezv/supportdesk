import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../data/ticketConfig'
import CommentThread from '../components/ticket/CommentThread'
import { ArrowLeft, Loader2, Ticket } from 'lucide-react'
import { formatDate } from '../utils/date'

export default function ClientTicketPage() {
  const { ticketId } = useParams()
  const [clientUser, setClientUser] = useState(undefined)
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, u => setClientUser(u ?? null)), [])

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'tickets', ticketId), snap => {
      if (snap.exists()) setTicket({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
    return unsub
  }, [ticketId])

  useEffect(() => {
    const q = query(collection(db, 'tickets', ticketId, 'comments'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => !c.isInternal)))
  }, [ticketId])

  if (clientUser === undefined || loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
    </div>
  )

  if (!ticket) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-500 text-sm">
      Ticket no encontrado.
    </div>
  )

  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.new
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-800 rounded-lg flex items-center justify-center">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900 text-sm">SupportDesk</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Link to="/portal" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a mis tickets
        </Link>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-slate-400">#{String(ticket.ticketNumber || 0).padStart(3, '0')}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.headerCls}`}>{status.label}</span>
            <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${priority.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{ticket.title}</h1>
          <p className="text-xs text-slate-500 mt-1">{formatDate(ticket.createdAt)}</p>
        </div>

        {/* Description */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Descripción</p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Comments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Conversación</p>
          <CommentThread ticketId={ticketId} comments={comments} isAgent={false} />
        </div>
      </div>
    </div>
  )
}
