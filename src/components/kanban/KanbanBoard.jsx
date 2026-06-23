import { useState } from 'react'
import { KANBAN_COLUMNS, STATUS_CONFIG } from '../../data/ticketConfig'
import KanbanCard from './KanbanCard'

function KanbanColumn({ statusId, tickets, onCardClick, dragOverId, onDragOver, onDragLeave, onDrop }) {
  const cfg = STATUS_CONFIG[statusId]
  const isOver = dragOverId === statusId

  return (
    <div className="flex-shrink-0 w-64 flex flex-col">
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 ${cfg.headerCls}`}>
        <span className="text-xs font-semibold">{cfg.label}</span>
        <span className="text-xs font-bold opacity-70">{tickets.length}</span>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); onDragOver(statusId) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) onDragLeave() }}
        onDrop={e => {
          e.preventDefault()
          const ticketId = e.dataTransfer.getData('ticketId')
          onDragLeave()
          onDrop(statusId, ticketId)
        }}
        className={`flex-1 space-y-2.5 overflow-y-auto rounded-xl min-h-[80px] p-1.5 transition-all duration-150 ${
          isOver ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : 'ring-2 ring-transparent'
        }`}
      >
        {tickets.length === 0 && (
          <div className={`border-2 border-dashed rounded-xl p-4 text-center ${
            isOver ? 'border-blue-300' : 'border-slate-200'
          }`}>
            <p className={`text-xs ${isOver ? 'text-blue-400' : 'text-slate-400'}`}>
              {isOver ? 'Soltar aquí' : 'Sin tickets'}
            </p>
          </div>
        )}
        {tickets.map(ticket => (
          <KanbanCard key={ticket.id} ticket={ticket} onClick={onCardClick} />
        ))}
      </div>
    </div>
  )
}

export default function KanbanBoard({ tickets, onCardClick, onStatusChange }) {
  const [dragOverId, setDragOverId] = useState(null)

  const byStatus = Object.fromEntries(KANBAN_COLUMNS.map(s => [s, []]))
  tickets.forEach(t => {
    const col = byStatus[t.status]
    if (col) col.push(t)
    else byStatus['new'].push(t)
  })

  function handleDrop(targetStatus, ticketId) {
    setDragOverId(null)
    if (!ticketId) return
    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket || ticket.status === targetStatus) return
    onStatusChange(ticket, targetStatus)
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(statusId => (
        <KanbanColumn
          key={statusId}
          statusId={statusId}
          tickets={byStatus[statusId]}
          onCardClick={onCardClick}
          dragOverId={dragOverId}
          onDragOver={setDragOverId}
          onDragLeave={() => setDragOverId(null)}
          onDrop={handleDrop}
        />
      ))}
    </div>
  )
}
