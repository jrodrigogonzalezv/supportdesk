import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Ticket, LayoutDashboard, Users, UserCog, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets',   icon: Ticket,          label: 'Tickets' },
  { to: '/clients',   icon: Users,           label: 'Clientes' },
  { to: '/team',      icon: UserCog,         label: 'Equipo',   adminOnly: true },
  { to: '/settings',  icon: Settings,        label: 'Config.',  adminOnly: true },
]

function SidebarContent({ collapsed, onNavClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.profile?.role === 'admin'

  async function handleLogout() { await logout(); navigate('/login') }

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-800 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-slate-100 flex items-center min-h-[57px]">
        <img src="/logo.png" alt="Logo"
          className={collapsed ? 'h-9 w-9 object-contain' : 'h-9 w-auto max-w-[180px] object-contain'} />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.filter(n => !n.adminOnly || isAdmin).map(({ to, icon: Icon, label }) =>
          collapsed ? (
            <NavLink key={to} to={to} title={label} onClick={onNavClick}
              className={({ isActive }) =>
                `flex items-center justify-center p-2.5 rounded-xl transition-colors ${isActive ? 'bg-blue-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`
              }>
              <Icon className="w-5 h-5" />
            </NavLink>
          ) : (
            <NavLink key={to} to={to} className={linkCls} onClick={onNavClick}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          )
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-800 flex-shrink-0">
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">{user.displayName || user.email}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user.profile?.role || 'agente'}</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </>
  )
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Desktop sidebar ── */}
      <div className={`hidden md:flex flex-col ${collapsed ? 'w-14' : 'w-56'} bg-white border-r border-slate-200 transition-all duration-200 flex-shrink-0 relative`}>
        <SidebarContent collapsed={collapsed} onNavClick={() => {}} />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute -right-3 top-16 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10">
          {collapsed ? <ChevronRight className="w-3 h-3 text-slate-500" /> : <ChevronLeft className="w-3 h-3 text-slate-500" />}
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          {/* Drawer */}
          <div className="relative w-64 bg-white flex flex-col shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent collapsed={false} onNavClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden bg-white border-b border-slate-200 h-14 flex items-center px-4 gap-3 flex-shrink-0 z-10">
          <button onClick={() => setMobileOpen(true)} className="text-slate-600 hover:text-slate-900 transition-colors p-1">
            <Menu className="w-5 h-5" />
          </button>
          <img src="/logo.png" alt="Logo" className="h-9 w-auto max-w-[180px] object-contain" />
        </div>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
