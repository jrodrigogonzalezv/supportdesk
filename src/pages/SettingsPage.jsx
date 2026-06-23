import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { Save, Loader2, Plus, X, Copy, Check, Link2, Globe, Columns } from 'lucide-react'
import { DEFAULT_CATEGORIES } from '../data/ticketConfig'

function toSlug(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([...DEFAULT_CATEGORIES])
  const [newCat, setNewCat] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [portals, setPortals] = useState([])
  const [newCompany, setNewCompany] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [slugError, setSlugError] = useState('')
  const [addingPortal, setAddingPortal] = useState(false)
  const [copied, setCopied] = useState(null)

  const orgId = user?.profile?.orgId

  useEffect(() => {
    if (!orgId) return
    getDoc(doc(db, 'organizations', orgId)).then(snap => {
      const data = snap.data() || {}
      if (data.categories) setCategories(data.categories)
    })
    getDocs(query(collection(db, 'portals'), where('orgId', '==', orgId))).then(snap => {
      setPortals(snap.docs.map(d => ({ slug: d.id, ...d.data() })))
    })
  }, [orgId])

  function handleCompanyInput(val) {
    setNewCompany(val)
    setNewSlug(toSlug(val))
    setSlugError('')
  }

  async function addPortal() {
    const company = newCompany.trim()
    const slug = newSlug.trim()
    if (!company || !slug) return
    if (portals.some(p => p.slug === slug)) { setSlugError('Ese slug ya existe.'); return }
    setAddingPortal(true)
    try {
      await setDoc(doc(db, 'portals', slug), { orgId, companyName: company, requireLogin: true, createdAt: serverTimestamp() })
      setPortals(prev => [...prev, { slug, companyName: company, requireLogin: true }])
      setNewCompany('')
      setNewSlug('')
      setSlugError('')
    } finally { setAddingPortal(false) }
  }

  async function removePortal(slug) {
    await deleteDoc(doc(db, 'portals', slug))
    setPortals(prev => prev.filter(p => p.slug !== slug))
  }

  async function toggleRequireLogin(slug, current) {
    const newVal = !(current ?? true)
    await updateDoc(doc(db, 'portals', slug), { requireLogin: newVal })
    setPortals(prev => prev.map(p => p.slug === slug ? { ...p, requireLogin: newVal } : p))
  }

  function copyLink(slug) {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}`)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  function addCategory() {
    const cat = newCat.trim()
    if (!cat || categories.includes(cat)) return
    setCategories(prev => [...prev, cat])
    setNewCat('')
  }

  async function handleSave() {
    if (!orgId) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'organizations', orgId), { categories, updatedAt: serverTimestamp() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const inputCls = 'border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-800'

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Configuración</h1>

      {/* Portales */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-slate-600" />
          <p className="text-sm font-semibold text-slate-700">Portales por empresa</p>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Cada empresa tiene su URL memorable. Los clientes acceden desde{' '}
          <span className="font-mono text-slate-600">{window.location.origin}/<em>empresa</em></span>.
        </p>

        <div className="space-y-2 mb-4">
          {portals.length === 0 && (
            <p className="text-xs text-slate-400 py-2">Sin portales creados todavía.</p>
          )}
          {portals.map(p => {
            const requireLogin = p.requireLogin ?? true
            return (
              <div key={p.slug} className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-violet-800">{p.companyName}</p>
                    <p className="text-[11px] text-violet-400 font-mono truncate">
                      {window.location.origin}/{p.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <button onClick={() => copyLink(p.slug)}
                      className="flex items-center gap-1.5 text-xs font-medium text-violet-600 border border-violet-300 hover:border-violet-500 px-2.5 py-1.5 rounded-lg transition-colors">
                      {copied === p.slug ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === p.slug ? 'Copiado' : 'Copiar'}
                    </button>
                    <button onClick={() => removePortal(p.slug)}
                      className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-violet-200 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer" onClick={() => toggleRequireLogin(p.slug, p.requireLogin)}>
                    <button type="button"
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border-2 transition-colors ${requireLogin ? 'bg-blue-800 border-blue-800' : 'bg-slate-200 border-slate-200'}`}>
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${requireLogin ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className="text-[11px] text-violet-700 font-medium">
                      {requireLogin ? 'Login requerido' : 'Sin login requerido'}
                    </span>
                  </label>

                  <a href={`/${p.slug}/kanban`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-violet-500 hover:text-violet-800 transition-colors font-medium">
                    <Columns className="w-3.5 h-3.5" />
                    Ver kanban
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Nombre de la empresa</label>
            <input
              value={newCompany}
              onChange={e => handleCompanyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPortal())}
              className={`w-full ${inputCls}`}
              placeholder="Ej: Banco Chile"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Slug (URL)</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono flex-shrink-0">{window.location.origin}/</span>
              <input
                value={newSlug}
                onChange={e => { setNewSlug(e.target.value.toLowerCase().replace(/[̀-ͯ]/g, '')); setSlugError('') }}
                className={`flex-1 ${inputCls} font-mono text-xs`}
                placeholder="banco-chile"
              />
            </div>
            {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
          </div>
          <button onClick={addPortal} disabled={!newCompany.trim() || !newSlug.trim() || addingPortal}
            className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            {addingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Crear portal
          </button>
        </div>
      </div>

      {/* Categorías */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-sm font-semibold text-slate-700 mb-4">Categorías de tickets</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <span key={cat} className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
              {cat}
              <button onClick={() => setCategories(prev => prev.filter(c => c !== cat))}
                className="text-slate-400 hover:text-red-500 transition-colors">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
            className={`flex-1 ${inputCls}`}
            placeholder="Nueva categoría..."
          />
          <button onClick={addCategory}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            Agregar
          </button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? '¡Guardado!' : 'Guardar categorías'}
      </button>

      {/* Notificaciones */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Link2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-1">Notificaciones por email</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Para que los clientes reciban emails automáticos, instala la extensión{' '}
              <strong>"Trigger Email by Firebase"</strong> desde{' '}
              <span className="font-mono">Firebase Console &rarr; Extensions</span> y configúrala con tu proveedor SMTP.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
