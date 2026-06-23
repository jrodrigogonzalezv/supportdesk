import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-800 bg-white placeholder-slate-400 transition-colors'

function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password': return 'Email o contraseña incorrectos.'
    case 'auth/email-already-in-use': return 'Ya existe una cuenta con ese email.'
    case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/invalid-email': return 'Email inválido.'
    case 'auth/popup-closed-by-user': return ''
    default: return 'Error al iniciar sesión. Inténtalo de nuevo.'
  }
}

export default function ClientAuthPanel() {
  const { loginAsClient, loginWithEmail, registerAsClient } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [error, setError] = useState('')

  const set = (f, v) => { setForm(p => ({ ...p, [f]: v })); setError('') }

  async function handleGoogle() {
    setLoadingGoogle(true); setError('')
    try { await loginAsClient() }
    catch (e) { if (e.code !== 'auth/popup-closed-by-user') setError(friendlyError(e.code)) }
    finally { setLoadingGoogle(false) }
  }

  async function handleEmail(e) {
    e.preventDefault(); setLoadingEmail(true); setError('')
    try {
      if (isRegister) await registerAsClient(form.email, form.password, form.name)
      else await loginWithEmail(form.email, form.password)
    } catch (e) { setError(friendlyError(e.code)) }
    finally { setLoadingEmail(false) }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      {/* Google */}
      <button onClick={handleGoogle} disabled={loadingGoogle || loadingEmail}
        className="w-full flex items-center justify-center gap-2.5 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50 mb-4">
        {loadingGoogle
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )
        }
        Continuar con Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400">o con tu email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Email + password form */}
      <form onSubmit={handleEmail} className="space-y-3">
        {isRegister && (
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className={inputCls}
            placeholder="Tu nombre"
            required
            autoComplete="name"
          />
        )}
        <input
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          className={inputCls}
          placeholder="tu@email.com"
          required
          autoComplete="email"
        />
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            value={form.password}
            onChange={e => set('password', e.target.value)}
            className={`${inputCls} pr-10`}
            placeholder="Contraseña"
            required
            minLength={6}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          <button type="button" onClick={() => setShowPwd(s => !s)} tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={loadingEmail || loadingGoogle}
          className="w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 active:bg-blue-950 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
          {loadingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
          {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </form>

      {/* Toggle register/login */}
      <p className="text-center text-xs text-slate-500 mt-4">
        {isRegister ? '¿Ya tienes cuenta?' : '¿Primera vez aquí?'}{' '}
        <button onClick={() => { setIsRegister(r => !r); setError('') }}
          className="text-blue-800 font-medium hover:underline">
          {isRegister ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
      </p>
    </div>
  )
}
