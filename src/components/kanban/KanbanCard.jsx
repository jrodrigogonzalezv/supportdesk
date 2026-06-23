import { MessageSquare, Paperclip, User, GripVertical } from 'lucide-react'
import { PRIORITY_CONFIG, RISK_CONFIG } from '../../data/ticketConfig'
import { timeAgo } from '../../utils/date'

export default function KanbanCard({ ticket, onClick }) {
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low
  const risk = RISK_CONFIG[ticket.risk]
  const commentCount = ticket.commentCount || 0
  const attachCount = ticket.attachments?.length || 0

  function handleDragStart(e) {
    e.dataTransfer.setData('ticketId', ticket.id)
    e.dataTransfer.effectAllowed = 'move'
    // Dim card after browser captures the drag ghost
    requestAnimationFrame(() => {
      e.currentTarget.style.opacity = '0.35'
    })
  }

  function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick(ticket)}
      className="bg-white border border-slate-200 rounded-xl p-3.5 cursor-pointer group hover:border-blue-300 hover:shadow-sm transition-all select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-slate-400">#{String(ticket.ticketNumber || 0).padStart(3, '0')}</span>
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition-colors cursor-grab" />
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priority.dot}`} title={`Prioridad: ${priority.label}`} />
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2 mb-2.5 group-hover:text-blue-800 transition-colors">
        {ticket.title}
      </p>

      {/* Badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        {risk && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${risk.badge}`}>
            {risk.label}
          </span>
        )}
        {ticket.category && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-slate-50 text-slate-500 border-slate-200 truncate max-w-[80px]">
            {ticket.category}
          </span>
        )}
        {ticket.clientCompany && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-violet-50 text-violet-600 border-violet-200 truncate max-w-[90px]" title={ticket.clientCompany}>
            {ticket.clientCompany}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {ticket.assignedToName ? (
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-800 flex-shrink-0">
              {ticket.assignedToName[0].toUpperCase()}
            </div>
          ) : (
            <User className="w-4 h-4 text-slate-300" />
          )}
          <span className="text-[10px] text-slate-400 truncate max-w-[64px]">
            {ticket.assignedToName || 'Sin asignar'}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-slate-400">{timeAgo(ticket.createdAt)}</span>
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <MessageSquare className="w-3 h-3" />{commentCount}
            </span>
          )}
          {attachCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <Paperclip className="w-3 h-3" />{attachCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
