import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Link } from 'react-router-dom'
import { ChevronRight, Loader2, Ticket } from 'lucide-react'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../data/ticketConfig'
import { timeAgo } from '../../utils/date'

export default function ClientTicketHistory({ clientEmail, orgId, refreshKey = 0 }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientEmail || !orgId) { setLoading(false); return }
    setLoading(true)
    getDocs(query(
      collection(db, 'tickets'),
      where('clientEmail', '==', clientEmail),
      where('orgId', '==', orgId)
    )).then(snap => {
      const t = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      t.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setTickets(t)
    }).catch(console.error)
     .finally(() => setLoading(false))
  }, [clientEmail, orgId, refreshKey])

  if (loading) return (
    <div className="flex justify-center py-6">
      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
    </div>
  )

  if (tickets.length === 0) return (
    <div className="text-center py-8">
      <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-xs text-slate-400">No hay tickets anteriores.</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {tickets.map(t => {
        const status = STATUS_CONFIG[t.status] || STATUS_CONFIG.new
        const priority = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.low
        return (
          <Link key={t.id} to={`/portal/ticket/${t.id}`}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all group">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.dot}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-[10px] text-slate-400">
                  #{String(t.ticketNumber || 0).padStart(3, '0')}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.headerCls}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(t.createdAt)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0" />
          </Link>
        )
      })}
    </div>
  )
}
