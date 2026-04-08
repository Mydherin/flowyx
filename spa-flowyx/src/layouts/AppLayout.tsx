import { Outlet } from 'react-router'
import { LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../features/auth/hooks/useAuth'
import { Button } from '../components/ui/Button'

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col">
      <header className="h-14 border-b border-border-subtle flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={18} className="text-white" />
          <span className="font-semibold text-text-primary text-sm tracking-tight">
            Flowyx
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <>
              <img
                src={user.picture}
                alt={user.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-white/10"
              />
              <span className="hidden sm:block text-sm text-text-secondary font-medium">
                {user.name}
              </span>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>
      <main className="p-4 sm:p-6 pb-0 sm:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
