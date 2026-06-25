import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../data/ticketConfig'
import CommentThread from '../components/ticket/CommentThread'
import { ArrowLeft, Loader2, Ticket, Monitor, Send } from 'lucide-react'
import { formatDate } from '../utils/date'

export default function ClientTicketPage() {
  const { ticketId } = useParams()
  const [clientUser, setClientUser] = useState(undefined)
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [rustDeskId, setRustDeskId] = useState('')
  const [sendingId, setSendingId] = useState(false)
  const [idSent, setIdSent] = useState(false)

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

  async function submitRustDeskId(e) {
    e.preventDefault()
    const id = rustDeskId.trim()
    if (!id) return
    setSendingId(true)
    try {
      await addDoc(collection(db, 'tickets', ticketId, 'comments'), {
        content: `Mi ID de RustDesk es: ${id}`,
        authorId: clientUser?.uid || null,
        authorName: ticket.clientName || ticket.clientEmail || 'Cliente',
        authorRole: 'client',
        isInternal: false,
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'tickets', ticketId), {
        'remoteSession.rustDeskId': id,
        'remoteSession.status': 'ready',
        updatedAt: serverTimestamp(),
      })
      if (ticket.orgId && ticket.clientEmail) {
        await setDoc(
          doc(db, 'organizations', ticket.orgId, 'clients', ticket.clientEmail),
          { rustDeskId: id, clientName: ticket.clientName || '', updatedAt: serverTimestamp() },
          { merge: true }
        )
      }
      setIdSent(true)
      setRustDeskId('')
    } finally {
      setSendingId(false)
    }
  }

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

        {/* RustDesk banner — solo cuando el técnico solicitó el ID */}
        {ticket.remoteSession?.status === 'pending_id' && !idSent && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-blue-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">Tu técnico necesita conectarse a tu equipo</p>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Para resolver tu caso necesitamos acceso remoto a través de <strong>RustDesk</strong> (gratis).
                  Comparte tu ID para que podamos conectarnos.
                </p>
              </div>
            </div>

            <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-2 text-xs text-blue-800">
              <p><strong>1.</strong> Descarga RustDesk en <a href="https://rustdesk.com/es/" target="_blank" rel="noreferrer" className="underline">rustdesk.com/es</a></p>
              <p><strong>2.</strong> Abre RustDesk — verás tu <strong>ID</strong> (número de 9 dígitos) en la pantalla principal</p>
              <p><strong>3.</strong> Pégalo aquí abajo y haz clic en Enviar</p>
            </div>

            <form onSubmit={submitRustDeskId} className="flex gap-2">
              <input
                value={rustDeskId}
                onChange={e => setRustDeskId(e.target.value)}
                placeholder="123 456 789"
                className="flex-1 border border-blue-300 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-blue-800 bg-white"
              />
              <button
                type="submit"
                disabled={!rustDeskId.trim() || sendingId}
                className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingId ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </div>
        )}

        {(ticket.remoteSession?.status === 'ready' || idSent) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <Monitor className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Tu técnico está listo para conectarse</p>
              <p className="text-xs text-emerald-700 mt-0.5">Abre RustDesk y acepta la solicitud de conexión cuando aparezca.</p>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Conversación</p>
          <CommentThread ticketId={ticketId} comments={comments} isAgent={false} />
        </div>
      </div>
    </div>
  )
}
