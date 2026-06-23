import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { UserPlus, Loader2, Copy, Check, Users } from 'lucide-react'

export default function TeamPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(null)

  const orgId = user?.profile?.orgId

  useEffect(() => {
    if (!orgId) return
    const unsub1 = onSnapshot(query(collection(db, 'users'), where('orgId', '==', orgId)), snap => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const unsub2 = onSnapshot(query(collection(db, 'invites'), where('orgId', '==', orgId)), snap => setInvites(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { unsub1(); unsub2() }
  }, [orgId])

  async function handleInvite(e) {
    e.preventDefault()
    if (!email.trim() || !orgId) return
    setSending(true)
    try {
      await addDoc(collection(db, 'invites'), {
        email: email.trim().toLowerCase(),
        orgId,
        role: 'agent',
        createdBy: user.uid,
        claimed: false,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        createdAt: serverTimestamp(),
      })
      setEmail('')
    } finally { setSending(false) }
  }

  function copyLink(inviteId) {
    navigator.clipboard.writeText(`${window.location.origin}/join?invite=${inviteId}`)
    setCopied(inviteId)
    setTimeout(() => setCopied(null), 2000)
  }

  const roleBadge = { admin: 'bg-blue-50 text-blue-700', agent: 'bg-slate-100 text-slate-600', client: 'bg-slate-100 text-slate-400' }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Equipo</h1>

      {/* Invite form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-3">Invitar agente</p>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="email@empresa.com"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-800" />
          <button type="submit" disabled={sending}
            className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Invitar
          </button>
        </form>
      </div>

      {/* Members */}
      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 mb-6">
        <p className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Miembros activos</p>
        {members.filter(m => m.role !== 'client').map(m => (
          <div key={m.id} className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-800">
              {(m.displayName || m.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{m.displayName || m.email}</p>
              <p className="text-xs text-slate-400 truncate">{m.email}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleBadge[m.role] || roleBadge.agent}`}>{m.role}</span>
          </div>
        ))}
      </div>

      {/* Pending invites */}
      {invites.filter(i => !i.claimed).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          <p className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invitaciones pendientes</p>
          {invites.filter(i => !i.claimed).map(inv => (
            <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
              <p className="flex-1 text-sm text-slate-700">{inv.email}</p>
              <button onClick={() => copyLink(inv.id)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-700 border border-slate-200 rounded-lg px-2.5 py-1.5 transition-colors">
                {copied === inv.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied === inv.id ? 'Copiado' : 'Copiar link'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
