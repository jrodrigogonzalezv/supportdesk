import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './components/auth/LoginPage'
import Dashboard from './pages/Dashboard'
import KanbanPage from './pages/KanbanPage'
import TicketDetailPage from './pages/TicketDetailPage'
import ClientsPage from './pages/ClientsPage'
import TeamPage from './pages/TeamPage'
import SettingsPage from './pages/SettingsPage'
import NewTicketPage from './pages/NewTicketPage'
import SlugTicketPage from './pages/SlugTicketPage'
import PortalKanbanPage from './pages/PortalKanbanPage'
import ClientPortalPage from './pages/ClientPortalPage'
import ClientTicketPage from './pages/ClientTicketPage'
import JoinPage from './pages/JoinPage'

function Spinner() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-800 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.profile?.role !== 'admin') return <Navigate to="/tickets" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/tickets" replace /> : <LoginPage />} />
      <Route path="/new-ticket/:orgId" element={<NewTicketPage />} />
      <Route path="/portal" element={<ClientPortalPage />} />
      <Route path="/portal/ticket/:ticketId" element={<ClientTicketPage />} />
      <Route path="/join" element={<JoinPage />} />

      {/* Private — layout wrapper */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/tickets" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<KanbanPage />} />
        <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/team" element={<PrivateRoute adminOnly><TeamPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute adminOnly><SettingsPage /></PrivateRoute>} />
      </Route>

      {/* Slug portals — must be last, matched after all static routes */}
      <Route path="/:slug/kanban" element={<PortalKanbanPage />} />
      <Route path="/:slug" element={<SlugTicketPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
