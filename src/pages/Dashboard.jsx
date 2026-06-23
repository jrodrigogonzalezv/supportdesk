import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../data/ticketConfig'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const orgId = user?.profile?.orgId

  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      return
    }
    setLoading(true)
    getDocs(query(collection(db, 'tickets'), where('orgId', '==', orgId)))
      .then(snap => {
        const tickets = snap.docs.map(d => d.data())
        const byStatus = {}
        const byPriority = {}
        tickets.forEach(t => {
          byStatus[t.status] = (byStatus[t.status] || 0) + 1
          byPriority[t.priority] = (byPriority[t.priority] || 0) + 1
        })
        const open = tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length
        const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length
        const critical = byPriority['critical'] || 0
        setStats({ total: tickets.length, open, resolved, critical, byStatus, byPriority })
      })
      .catch(err => console.error('[Dashboard]', err))
      .finally(() => setLoading(false))
  }, [orgId])

  const statCards = [
    { label: 'Total tickets', value: stats?.total || 0, icon: Ticket, color: 'blue' },
    { label: 'Abiertos', value: stats?.open || 0, icon: Clock, color: 'amber' },
    { label: 'Resueltos', value: stats?.resolved || 0, icon: CheckCircle, color: 'emerald' },
    { label: 'Críticos', value: stats?.critical || 0, icon: AlertCircle, color: 'red' },
  ]

  const colorMap = { blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', emerald: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700' }
  const iconColor = { blue: 'text-blue-600', amber: 'text-amber-600', emerald: 'text-emerald-600', red: 'text-red-600' }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Dashboard</h1>

      {loading ? (
        <p className="text-slate-400 text-sm">Cargando estadísticas...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
                  <Icon className={`w-5 h-5 ${iconColor[color]}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-slate-700 mb-4">Por prioridad</p>
              <div className="space-y-3">
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => {
                  const count = stats?.byPriority?.[k] || 0
                  const pct = stats?.total ? Math.round(count / stats.total * 100) : 0
                  return (
                    <div key={k}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                          <span className="text-xs text-slate-600">{v.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${v.dot}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-slate-700 mb-4">Por estado</p>
              <div className="space-y-2">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => {
                  const count = stats?.byStatus?.[k] || 0
                  return (
                    <div key={k} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.headerCls}`}>{v.label}</span>
                      <span className="text-sm font-bold text-slate-700">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
