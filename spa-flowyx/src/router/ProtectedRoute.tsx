import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../features/auth/store'

export function ProtectedRoute() {
  const user = useAuthStore((state) => state.user)

  if (user === null) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
