import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { Users, Search } from 'lucide-react'

export default function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')

  const orgId = user?.profile?.orgId

  useEffect(() => {
    if (!orgId) return
    // Derive clients from unique emails in tickets
    return onSnapshot(query(collection(db, 'tickets'), where('orgId', '==', orgId)), snap => {
      const map = {}
      snap.docs.forEach(d => {
        const t = d.data()
        if (!map[t.clientEmail]) map[t.clientEmail] = { email: t.clientEmail, name: t.clientName, count: 0 }
        map[t.clientEmail].count++
      })
      setClients(Object.values(map).sort((a, b) => b.count - a.count))
    })
  }, [orgId])

  const filtered = clients.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-slate-900 mr-auto">Clientes</h1>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..." className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-800 w-48" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No hay clientes aún.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {filtered.map(c => (
            <div key={c.email} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                {(c.name || c.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{c.name || c.email}</p>
                <p className="text-xs text-slate-400">{c.email}</p>
              </div>
              <span className="text-xs text-slate-500 font-medium">{c.count} ticket{c.count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
