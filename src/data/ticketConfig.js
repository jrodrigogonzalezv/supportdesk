export const PRIORITY_CONFIG = {
  low:      { label: 'Baja',    dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', ring: 'ring-emerald-200' },
  medium:   { label: 'Media',   dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',     ring: 'ring-amber-200' },
  high:     { label: 'Alta',    dot: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 border-orange-200',  ring: 'ring-orange-200' },
  critical: { label: 'Crítica', dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',          ring: 'ring-red-300' },
}

export const RISK_CONFIG = {
  low:    { label: 'Bajo',  badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  medium: { label: 'Medio', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  high:   { label: 'Alto',  badge: 'bg-red-50 text-red-700 border-red-200' },
}

export const STATUS_CONFIG = {
  new:         { label: 'Nuevo',       headerCls: 'bg-slate-100 text-slate-600',   border: 'border-slate-200' },
  assigned:    { label: 'Asignado',    headerCls: 'bg-blue-50 text-blue-700',      border: 'border-blue-200' },
  in_progress: { label: 'En progreso', headerCls: 'bg-indigo-50 text-indigo-700',  border: 'border-indigo-200' },
  review:      { label: 'En revisión', headerCls: 'bg-purple-50 text-purple-700',  border: 'border-purple-200' },
  resolved:    { label: 'Resuelto',    headerCls: 'bg-emerald-50 text-emerald-700',border: 'border-emerald-200' },
  closed:      { label: 'Cerrado',     headerCls: 'bg-slate-100 text-slate-500',   border: 'border-slate-200' },
}

export const KANBAN_COLUMNS = ['new', 'assigned', 'in_progress', 'review', 'resolved', 'closed']

export const DEFAULT_CATEGORIES = [
  'Soporte técnico',
  'Facturación',
  'Consulta general',
  'Error del sistema',
  'Solicitud de mejora',
  'Otro',
]
