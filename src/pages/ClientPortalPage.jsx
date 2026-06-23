import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db, isSignInWithEmailLink, signInWithEmailLink } from '../lib/firebase'
import { Ticket, Loader2, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../data/ticketConfig'
import { timeAgo } from '../utils/date'

export default function ClientPortalPage() {
  const [clientUser, setClientUser] = useState(undefined)
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState('')
  const [completing, setCompleting] = useState(isSignInWithEmailLink(auth, window.location.href))

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return
    let email = localStorage.getItem('sd_client_email')
    if (!email) email = window.prompt('Ingresa tu email para confirmar el acceso:')
    if (!email) { setCompleting(false); return }
    signInWithEmailLink(auth, email, window.location.href)
      .then(() => { localStorage.removeItem('sd_client_email'); window.history.replaceState(null, '', '/portal') })
      .catch(() => { setError('Link inválido o expirado.'); setCompleting(false) })
  }, [])

  useEffect(() => {
    return onAuthStateChanged(auth, async user => {
      setClientUser(user)
      if (user) {
        try {
          const q = query(collection(db, 'tickets'), where('clientEmail', '==', user.email))
          const snap = await getDocs(q)
          const t = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          t.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          setTickets(t)
        } catch { setError('Error al cargar tus tickets.') }
      }
      setCompleting(false)
    })
  }, [])

  if (clientUser === undefined || completing) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
    </div>
  )

  if (!clientUser) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Ticket className="w-7 h-7 text-blue-800" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Portal de soporte</h1>
        <p className="text-slate-500 text-sm mb-4">Usa el link que recibiste por email para acceder a tus tickets.</p>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-800 rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">Mis tickets</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block truncate max-w-[160px]">{clientUser.email}</span>
            <button onClick={() => auth.signOut()} className="text-xs text-slate-400 hover:text-slate-700">Salir</button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Mis tickets</h1>
        <p className="text-slate-500 text-sm mb-8">Aquí puedes ver el estado de todas tus solicitudes.</p>

        {tickets.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No tienes tickets aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => {
              const status = STATUS_CONFIG[t.status] || STATUS_CONFIG.new
              const priority = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.low
              return (
                <Link key={t.id} to={`/portal/ticket/${t.id}`}
                  className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
                  <div className="flex items-start gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${priority.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] text-slate-400">#{String(t.ticketNumber || 0).padStart(3, '0')}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.headerCls}`}>{status.label}</span>
                      </div>
                      <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{timeAgo(t.createdAt)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
