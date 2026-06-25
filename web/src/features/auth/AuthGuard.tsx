import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'

export function AuthGuard() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div>Carregando sessão...</div>

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
