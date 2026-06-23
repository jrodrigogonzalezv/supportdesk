import { useState, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { storage, db } from '../../lib/firebase'
import { Paperclip, Upload, X, FileText, Loader2, ExternalLink } from 'lucide-react'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function AttachmentList({ ticketId, orgId, attachments = [], canUpload = true }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError(''); setProgress(0)
    try {
      const fileId = crypto.randomUUID()
      const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
      const path = `ticket-attachments/${orgId}/${ticketId}/${fileId}${ext ? '.' + ext : ''}`
      const storageRef = ref(storage, path)
      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file)
        task.on('state_changed',
          snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
          reject,
          async () => {
            const url = await getDownloadURL(task.snapshot.ref)
            await updateDoc(doc(db, 'tickets', ticketId), {
              attachments: arrayUnion({ id: fileId, name: file.name, size: file.size, url, storagePath: path, uploadedAt: new Date().toISOString() }),
              updatedAt: serverTimestamp(),
            })
            resolve()
          }
        )
      })
    } catch { setError('Error al subir el archivo.') }
    finally { setUploading(false); setProgress(0); e.target.value = '' }
  }

  return (
    <div>
      {attachments.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {attachments.map(a => (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-700 truncate flex-1">{a.name}</span>
              <span className="text-[10px] text-slate-400">{formatSize(a.size)}</span>
              <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
            </a>
          ))}
        </div>
      )}

      {canUpload && (
        <>
          <input ref={inputRef} type="file" className="hidden" onChange={handleFile} disabled={uploading} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-800 transition-colors disabled:opacity-50">
            {uploading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo {progress}%...</>
              : <><Paperclip className="w-3.5 h-3.5" /> Adjuntar archivo</>
            }
          </button>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </>
      )}
    </div>
  )
}
