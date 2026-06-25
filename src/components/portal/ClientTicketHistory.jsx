import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Link } from 'react-router-dom'
import { ChevronRight, Loader2, Ticket, Monitor, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../data/ticketConfig'
import { timeAgo } from '../../utils/date'

const RESOLVED = ['resolved', 'closed']

export default function ClientTicketHistory({ clientEmail, orgId, showStats = false, slug }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientEmail || !orgId) { setLoading(false); return }
    setLoading(true)
    const q = query(
      collection(db, 'tickets'),
      where('clientEmail', '==', clientEmail),
      where('orgId', '==', orgId)
    )
    const unsub = onSnapshot(q, snap => {
      const t = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      t.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setTickets(t)
      setLoading(false)
    }, err => { console.error('[ClientTicketHistory]', err); setLoading(false) })
    return unsub
  }, [clientEmail, orgId])

  const total    = tickets.length
  const active   = tickets.filter(t => !RESOLVED.includes(t.status)).length
  const resolved = tickets.filter(t => RESOLVED.includes(t.status)).length
  const pending  = tickets.filter(t => t.hasRemoteRequest).length

  if (loading) return (
    <div className="flex justify-center py-10">
      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Stats */}
      {showStats && total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total" value={total} icon={<Ticket className="w-4 h-4" />} color="slate" />
          <StatCard label="En curso" value={active} icon={<Clock className="w-4 h-4" />} color="blue" />
          <StatCard label="Resueltos" value={resolved} icon={<CheckCircle2 className="w-4 h-4" />} color="emerald" />
          {pending > 0 && (
            <StatCard label="Acción req." value={pending} icon={<AlertCircle className="w-4 h-4" />} color="amber" />
          )}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Mis tickets</h2>
        {total > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">Haz clic para ver el detalle y respuestas del equipo.</p>
        )}
      </div>

      {/* List */}
      {tickets.length === 0 ? (
        <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl">
          <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Aún no tienes tickets. ¡Crea uno!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => {
            const status = STATUS_CONFIG[t.status] || STATUS_CONFIG.new
            const priority = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.low
            const ticketUrl = slug ? `/portal/ticket/${t.id}` : `/portal/ticket/${t.id}`
            return (
              <Link key={t.id} to={ticketUrl}
                className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 hover:shadow-sm transition-all group ${
                  t.hasRemoteRequest
                    ? 'border-blue-300 ring-1 ring-blue-200'
                    : 'border-slate-200 hover:border-blue-300'
                }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-mono text-[10px] text-slate-400">
                      #{String(t.ticketNumber || 0).padStart(3, '0')}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.headerCls}`}>
                      {status.label}
                    </span>
                    {t.hasRemoteRequest && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        <Monitor className="w-2.5 h-2.5" />
                        Acción requerida
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(t.createdAt)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    slate:   'bg-slate-50 border-slate-200 text-slate-700',
    blue:    'bg-blue-50 border-blue-200 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber:   'bg-amber-50 border-amber-200 text-amber-700',
  }
  return (
    <div className={`border rounded-xl px-4 py-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-70">{icon}<span className="text-[11px] font-medium">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
