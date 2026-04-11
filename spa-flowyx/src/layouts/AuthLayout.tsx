import { Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div
      className="min-h-dvh bg-bg-primary flex items-center justify-center p-4 sm:p-6"
      style={{ paddingTop: 'calc(1rem + var(--sat))', paddingBottom: 'calc(1rem + var(--sab))' }}
    >
      <Outlet />
    </div>
  )
}
