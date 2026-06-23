import { useState } from 'react'
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../hooks/useAuth'
import { Send, Loader2, Lock } from 'lucide-react'
import { formatDate } from '../../utils/date'

export default function CommentThread({ ticketId, comments, isAgent }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)

  const visible = comments.filter(c => isAgent || !c.isInternal)

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      await addDoc(collection(db, 'tickets', ticketId, 'comments'), {
        content: text.trim(),
        authorId: user?.uid || null,
        authorName: user?.displayName || user?.email || 'Cliente',
        authorRole: user?.profile?.role || 'client',
        isInternal: isAgent && isInternal,
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'tickets', ticketId), { commentCount: increment(1), updatedAt: serverTimestamp() })
      setText('')
    } finally { setSending(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Comments list */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">Sin comentarios aún.</p>
        )}
        {visible.map(c => (
          <div key={c.id} className={`flex gap-3 ${c.isInternal ? 'opacity-80' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              c.authorRole === 'client' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-800'
            }`}>
              {(c.authorName || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-800">{c.authorName}</span>
                {c.isInternal && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" /> Interno
                  </span>
                )}
                <span className="text-[10px] text-slate-400 ml-auto">{formatDate(c.createdAt)}</span>
              </div>
              <div className={`text-sm text-slate-700 leading-relaxed rounded-xl px-3 py-2.5 ${
                c.isInternal ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-slate-200'
              }`}>
                {c.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={isAgent ? 'Escribe una respuesta...' : 'Escribe tu mensaje...'}
          rows={3}
          className="w-full px-4 py-3 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none"
        />
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50">
          {isAgent && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)}
                className="rounded" />
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Solo equipo interno
              </span>
            </label>
          )}
          {!isAgent && <span />}
          <button type="submit" disabled={!text.trim() || sending}
            className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Enviar
          </button>
        </div>
      </form>
    </div>
  )
}
