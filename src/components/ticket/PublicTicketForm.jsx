import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp, doc, updateDoc, runTransaction, getDoc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../lib/firebase'
import { DEFAULT_CATEGORIES, PRIORITY_CONFIG } from '../../data/ticketConfig'
import { notifyClientTicketCreated, notifyAdminTicketCreated } from '../../lib/notify'
import { CheckCircle, Loader2, Paperclip, X, Ticket } from 'lucide-react'

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 placeholder-slate-400 bg-white'

export default function PublicTicketForm({ orgId, empresa, portalSlug = null, clientUser = null, compact = false, onTicketCreated }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', title: '', description: '', category: '', priority: 'medium',
  })
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill from clientUser when it resolves
  useEffect(() => {
    if (clientUser) {
      setForm(prev => ({
        ...prev,
        name: prev.name || clientUser.displayName || '',
        email: prev.email || clientUser.email || '',
      }))
    }
  }, [clientUser?.uid])

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }))

  function addFiles(e) {
    const newFiles = Array.from(e.target.files || []).slice(0, 5 - files.length)
    setFiles(prev => [...prev, ...newFiles])
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!orgId) { setError('Link inválido.'); return }
    setSubmitting(true); setError('')
    try {
      const orgRef = doc(db, 'organizations', orgId)
      let ticketNumber = 1
      let adminEmail = ''
      let ownerId = ''
      await runTransaction(db, async tx => {
        const orgSnap = await tx.get(orgRef)
        const orgData = orgSnap.data() || {}
        ticketNumber = (orgData.ticketCounter || 0) + 1
        adminEmail = orgData.adminEmail || ''
        ownerId = orgData.ownerId || ''
        tx.update(orgRef, { ticketCounter: ticketNumber })
      })

      // Fallback: if adminEmail missing, get it from the owner's user doc
      if (!adminEmail && ownerId) {
        const ownerSnap = await getDoc(doc(db, 'users', ownerId))
        adminEmail = ownerSnap.data()?.email || ''
      }

      const ticketData = {
        orgId,
        ticketNumber,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category || null,
        priority: form.priority,
        risk: 'low',
        status: 'new',
        clientName: form.name.trim(),
        clientEmail: form.email.trim().toLowerCase(),
        clientPhone: form.phone.trim() || null,
        clientCompany: empresa || null,
        clientUid: clientUser?.uid || null,
        portalSlug: portalSlug || null,
        assignedTo: null,
        assignedToName: null,
        attachments: [],
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const ticketRef = await addDoc(collection(db, 'tickets'), ticketData)

      if (files.length > 0) {
        const uploaded = []
        for (const file of files) {
          const fileId = crypto.randomUUID()
          const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
          const path = `ticket-attachments/${orgId}/${ticketRef.id}/${fileId}${ext ? '.' + ext : ''}`
          const storageRef = ref(storage, path)
          await new Promise((resolve, reject) => {
            const task = uploadBytesResumable(storageRef, file)
            task.on('state_changed', null, reject, async () => {
              const url = await getDownloadURL(task.snapshot.ref)
              uploaded.push({ id: fileId, name: file.name, size: file.size, url, storagePath: path, uploadedAt: new Date().toISOString() })
              resolve()
            })
          })
        }
        await updateDoc(ticketRef, { attachments: uploaded })
      }

      notifyClientTicketCreated(ticketData)
      notifyAdminTicketCreated(ticketData, adminEmail)

      setDone(true)
      onTicketCreated?.()
    } catch (err) {
      console.error(err)
      setError('Error al enviar el ticket. Intenta de nuevo.')
    } finally { setSubmitting(false) }
  }

  // Success state — compact (inline card)
  if (done && compact) return (
    <div className="py-6 px-4">
      <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Ticket enviado</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-5">
          Recibirás respuesta en <strong>{form.email}</strong> cuando haya novedades.
        </p>
        <button onClick={() => { setDone(false); setFiles([]) }}
          className="text-sm text-blue-800 font-medium hover:underline">
          Crear otro ticket
        </button>
      </div>
    </div>
  )

  // Success state — full screen (default)
  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Ticket enviado</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Recibimos tu solicitud. Te contactaremos a <strong>{form.email}</strong> cuando haya novedades.
        </p>
      </div>
    </div>
  )

  return (
    <div className={compact ? 'py-6 px-4' : 'min-h-screen bg-slate-50 py-8 px-4'}>
      <div className="max-w-lg mx-auto">
        {/* Header — only in non-compact mode */}
        {!compact && (
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900">Soporte</span>
              {empresa && (
                <span className="ml-2 text-xs font-semibold text-white bg-blue-800 rounded-full px-2.5 py-0.5">
                  {empresa}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Crear ticket de soporte</h1>
          <p className="text-slate-500 text-sm mb-6">Cuéntanos tu problema y te ayudamos lo antes posible.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className={inputCls} placeholder="Tu nombre" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className={`${inputCls} ${clientUser ? 'bg-slate-50 text-slate-500' : ''}`}
                  placeholder="tu@email.com" required
                  readOnly={!!clientUser}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                WhatsApp / Teléfono
                <span className="text-slate-400 font-normal ml-1">(opcional)</span>
              </label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                className={inputCls} placeholder="+56 9 1234 5678" />
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Asunto <span className="text-red-400">*</span>
              </label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                className={inputCls} placeholder="Resumen del problema" required />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Descripción <span className="text-red-400">*</span>
              </label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                className={`${inputCls} resize-none`} rows={4}
                placeholder="Describe el problema con el mayor detalle posible..." required />
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Categoría</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                  <option value="">Selecciona...</option>
                  {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Prioridad</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputCls}>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Adjuntos <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-500 border border-dashed border-slate-300 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Paperclip className="w-4 h-4 flex-shrink-0" />
                <span>Adjuntar archivos (máx. 5)</span>
                <input type="file" multiple className="hidden" onChange={addFiles} disabled={files.length >= 5} />
              </label>
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-1.5">
                      <span className="flex-1 truncate">{f.name}</span>
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                        className="text-slate-400 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm">⚠ {error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm text-sm">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : 'Enviar ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
