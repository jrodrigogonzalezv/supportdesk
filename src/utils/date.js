export function timeAgo(timestamp) {
  if (!timestamp) return ''
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60)   return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400)return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

export function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
