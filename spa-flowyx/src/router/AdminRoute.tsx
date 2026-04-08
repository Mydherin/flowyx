import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'

export function AdminRoute() {
  const { user, isAdmin } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
