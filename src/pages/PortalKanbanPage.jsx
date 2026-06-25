import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { KANBAN_COLUMNS, STATUS_CONFIG, PRIORITY_CONFIG } from '../data/ticketConfig'
import { timeAgo } from '../utils/date'
import { Plus, Columns } from 'lucide-react'

export default function PortalKanbanPage() {
  const { slug } = useParams()
  const [portalState, setPortalState] = useState('loading')
  const [portal, setPortal] = useState(null)
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    if (!slug) { setPortalState('not_found'); return }
    getDoc(doc(db, 'portals', slug)).then(snap => {
      if (snap.exists()) { setPortal(snap.data()); setPortalState('found') }
      else setPortalState('not_found')
    }).catch(() => setPortalState('not_found'))
  }, [slug])

  useEffect(() => {
    if (!portal) return
    if (!portal.orgId) return
    const q = query(collection(db, 'tickets'), where('orgId', '==', portal.orgId))
    return onSnapshot(q,
      snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setTickets(all.filter(t => t.portalSlug === slug || t.clientCompany === portal.companyName))
      },
      err => console.error('[PortalKanban]', err.code, err.message)
    )
  }, [portal, slug])

  if (portalState === 'loading') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-800 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (portalState === 'not_found') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Ticket className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Portal no encontrado</h1>
        <p className="text-slate-500 text-sm">El link que usaste no está disponible.</p>
      </div>
    </div>
  )

  const columns = KANBAN_COLUMNS.map(status => ({
    status,
    ...STATUS_CONFIG[status],
    tickets: tickets
      .filter(t => t.status === status)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)),
  }))

  const total = tickets.length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 flex-shrink-0">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto max-w-[160px] object-contain flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{portal.companyName}</span>
                <span className="text-xs text-slate-400 font-mono">· {total} ticket{total !== 1 ? 's' : ''}</span>
              </div>
              <p className="text-[11px] text-slate-400">Solo lectura · actualización en tiempo real</p>
            </div>
          </div>
          <Link to={`/${slug}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 px-3 py-1.5 rounded-xl transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Nuevo ticket
          </Link>
        </div>
      </div>

      {/* Kanban board — horizontally scrollable */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3" style={{ minWidth: `${KANBAN_COLUMNS.length * 268}px` }}>
          {columns.map(col => (
            <div key={col.status} className="w-64 flex-shrink-0 flex flex-col">
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 border ${col.border} ${col.headerCls}`}>
                <span className="text-xs font-semibold">{col.label}</span>
                <span className="text-xs font-bold opacity-60">{col.tickets.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2 flex-1">
                {col.tickets.map(t => {
                  const priority = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.low
                  return (
                    <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.dot}`} />
                        <span className="font-mono text-[10px] text-slate-400">
                          #{String(t.ticketNumber || 0).padStart(3, '0')}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto">{timeAgo(t.createdAt)}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                        {t.title}
                      </p>
                      {t.category && (
                        <span className="inline-block mt-1.5 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {t.category}
                        </span>
                      )}
                    </div>
                  )
                })}

                {col.tickets.length === 0 && (
                  <div className="flex items-center justify-center h-16 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-300">Sin tickets</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
