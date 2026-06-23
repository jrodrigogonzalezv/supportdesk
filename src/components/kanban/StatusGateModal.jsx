import { useState } from 'react'
import { Loader2, CheckCircle, X, Lock } from 'lucide-react'

const GATE_CONFIG = {
  resolved: {
    icon: CheckCircle,
    iconCls: 'text-emerald-600',
    title: 'Marcar como Resuelto',
    description: 'Documenta cómo se resolvió el problema. Esta nota le llegará al cliente por email.',
    noteLabel: 'Nota de resolución',
    notePlaceholder: 'Describe la solución o los pasos realizados para resolver el problema...',
    noteRequired: true,
    confirmLabel: 'Marcar como resuelto',
    confirmCls: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  closed: {
    icon: Lock,
    iconCls: 'text-slate-600',
    title: 'Cerrar ticket',
    description: '¿Confirmas que este ticket está completamente resuelto y se puede cerrar?',
    noteLabel: 'Motivo de cierre',
    notePlaceholder: 'Ej: Cliente confirmó que el problema fue resuelto (opcional)...',
    noteRequired: false,
    confirmLabel: 'Cerrar ticket',
    confirmCls: 'bg-slate-800 hover:bg-slate-900 text-white',
  },
}

export default function StatusGateModal({ ticket, newStatus, onConfirm, onCancel }) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const cfg = GATE_CONFIG[newStatus]
  if (!cfg) return null

  const Icon = cfg.icon
  const canSubmit = !cfg.noteRequired || note.trim().length > 0

  async function handleConfirm() {
    if (!canSubmit) return
    setSubmitting(true)
    try { await onConfirm({ note: note.trim() }) }
    finally { setSubmitting(false) }
  }

  function handleKey(e) {
    if (e.key === 'Escape') onCancel()
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
      onKeyDown={handleKey}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${cfg.iconCls}`} />
            <div>
              <h2 className="text-base font-bold text-slate-900">{cfg.title}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                #{String(ticket.ticketNumber || 0).padStart(3, '0')} — {ticket.title}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors -mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <p className="text-sm text-slate-600">{cfg.description}</p>

          {/* Note field */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              {cfg.noteLabel}{cfg.noteRequired && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={cfg.notePlaceholder}
              rows={4}
              autoFocus
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 placeholder-slate-400 resize-none"
            />
            {cfg.noteRequired && !note.trim() && (
              <p className="text-xs text-slate-400 mt-1">Requerido para continuar</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canSubmit || submitting}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${cfg.confirmCls}`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {cfg.confirmLabel}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center">Ctrl+Enter para confirmar · Esc para cancelar</p>
        </div>
      </div>
    </div>
  )
}
