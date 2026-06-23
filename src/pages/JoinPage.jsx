import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Ticket, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function JoinPage() {
  const [params] = useSearchParams()
  const inviteId = params.get('invite')
  const { user, claimInvite } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle') // idle | claiming | done | error
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    if (user && inviteId && status === 'idle') {
      setStatus('claiming')
      claimInvite(inviteId)
        .then(() => { setStatus('done'); setTimeout(() => navigate('/dashboard'), 2000) })
        .catch(e => { setErrMsg(e.message); setStatus('error') })
    }
  }, [user, inviteId])

  if (!inviteId) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-500 text-sm">
      Link de invitación inválido.
    </div>
  )

  if (!user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-6 h-6 text-blue-800" />
        </div>
        <p className="text-slate-700 font-medium mb-4">Debes iniciar sesión para aceptar la invitación.</p>
        <button onClick={() => navigate('/login')} className="bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-900 transition-colors">
          Ir al login
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        {status === 'claiming' && <><Loader2 className="w-8 h-8 animate-spin text-blue-800 mx-auto mb-3" /><p className="text-slate-600 text-sm">Aceptando invitación...</p></>}
        {status === 'done' && <><CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" /><p className="font-semibold text-slate-900">¡Bienvenido al equipo!</p><p className="text-slate-500 text-sm mt-1">Redirigiendo...</p></>}
        {status === 'error' && <><AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" /><p className="font-semibold text-slate-900">Error al aceptar la invitación</p><p className="text-slate-500 text-sm mt-1">{errMsg}</p></>}
      </div>
    </div>
  )
}
