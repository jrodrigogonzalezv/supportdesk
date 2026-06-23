import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth, isSignInWithEmailLink, signInWithEmailLink } from '../lib/firebase'
import PublicTicketForm from '../components/ticket/PublicTicketForm'
import ClientAuthPanel from '../components/portal/ClientAuthPanel'
import ClientTicketHistory from '../components/portal/ClientTicketHistory'
import { Ticket, LogOut, User, ChevronDown, Columns } from 'lucide-react'

export default function SlugTicketPage() {
  const { slug } = useParams()

  const [portalState, setPortalState] = useState('loading')
  const [portal, setPortal] = useState(null)

  const [clientUser, setClientUser] = useState(undefined)
  const [userRole, setUserRole] = useState(null)
  const [completingLink, setCompletingLink] = useState(false)

  const [showAuthPanel, setShowAuthPanel] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  // Resolve portal slug
  useEffect(() => {
    if (!slug) { setPortalState('not_found'); return }
    getDoc(doc(db, 'portals', slug)).then(snap => {
      if (snap.exists()) { setPortal(snap.data()); setPortalState('found') }
      else setPortalState('not_found')
    }).catch(() => setPortalState('not_found'))
  }, [slug])

  // Complete magic link sign-in
  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return
    setCompletingLink(true)
    let email = localStorage.getItem('sd_client_email')
    if (!email) email = window.prompt('Ingresa tu email para confirmar el acceso:')
    if (!email) { setCompletingLink(false); return }
    localStorage.setItem('sd_client_signin', 'true')
    signInWithEmailLink(auth, email, window.location.href)
      .then(() => {
        localStorage.removeItem('sd_client_email')
        window.history.replaceState(null, '', window.location.pathname)
      })
      .catch(err => { console.error(err); setCompletingLink(false) })
  }, [])

  // Track auth state + fetch role
  useEffect(() => {
    return onAuthStateChanged(auth, async user => {
      setCompletingLink(false)
      if (user) {
        setClientUser(user)
        setShowAuthPanel(false)
        try {
          const snap = await getDoc(doc(db, 'users', user.uid))
          setUserRole(snap.data()?.role || null)
        } catch { setUserRole(null) }
      } else {
        setClientUser(null)
        setUserRole(null)
      }
    })
  }, [])

  const isLoading = portalState === 'loading' || clientUser === undefined || completingLink

  if (isLoading) return (
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

  const requireLogin = portal.requireLogin ?? true
  const isClient = clientUser !== null && userRole === 'client'

  // ── CASE 1: Login required + not authenticated ──
  if (clientUser === null && requireLogin) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {portal.companyName ? `Soporte · ${portal.companyName}` : 'Portal de soporte'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Inicia sesión para crear o ver tus tickets.
          </p>
        </div>
        <ClientAuthPanel />
        <div className="mt-4 text-center">
          <Link to={`/${slug}/kanban`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            <Columns className="w-3.5 h-3.5" />
            Ver tablero de tickets
          </Link>
        </div>
      </div>
    </div>
  )

  // ── CASES 2 & 3: Form visible (optional or confirmed login) ──
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Soporte</span>
              {portal.companyName && (
                <span className="text-xs font-semibold text-white bg-blue-800 rounded-full px-2.5 py-0.5">
                  {portal.companyName}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Kanban link */}
            <Link to={`/${slug}/kanban`}
              className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors">
              <Columns className="w-3.5 h-3.5" />
              Tablero
            </Link>

            {clientUser ? (
              /* User menu */
              <div className="relative">
                <button onClick={() => setShowUserMenu(m => !m)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-1.5 transition-colors">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="max-w-[120px] truncate hidden sm:block">
                    {clientUser.displayName || clientUser.email}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px] z-20">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-[11px] text-slate-400">Conectado como</p>
                        <p className="text-xs font-medium text-slate-700 truncate">{clientUser.email}</p>
                      </div>
                      <button onClick={() => { auth.signOut(); setShowUserMenu(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-3.5 h-3.5" />
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Optional login button (requireLogin: false) */
              <button onClick={() => setShowAuthPanel(s => !s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors border ${showAuthPanel ? 'bg-blue-800 text-white border-blue-800' : 'text-blue-800 border-blue-200 hover:bg-blue-50'}`}>
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Optional auth panel */}
      {showAuthPanel && !clientUser && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <ClientAuthPanel onClose={() => setShowAuthPanel(false)} />
        </div>
      )}

      {/* Ticket form */}
      <PublicTicketForm
        orgId={portal.orgId}
        empresa={portal.companyName}
        portalSlug={slug}
        clientUser={isClient ? clientUser : null}
        compact
        onTicketCreated={() => setHistoryKey(k => k + 1)}
      />

      {/* Ticket history — only for authenticated clients */}
      {isClient && (
        <div className="max-w-lg mx-auto px-4 pb-10">
          <div className="border-t border-slate-200 pt-6 mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Mis tickets anteriores</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Haz click en un ticket para ver el detalle y las respuestas del equipo.
            </p>
          </div>
          <ClientTicketHistory
            key={historyKey}
            clientEmail={clientUser.email}
            orgId={portal.orgId}
          />
        </div>
      )}
    </div>
  )
}
