import { Link, Outlet } from 'react-router'
import { LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { useAuth } from '../features/auth/hooks/useAuth'
import { Button } from '../components/ui/Button'

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth()

  return (
    <div className="min-h-dvh pb-safe bg-bg-primary flex flex-col">
      <header className="flex flex-col border-b border-border-subtle">
        {/* Spacer that exactly matches the iOS status bar height */}
        <div className="pt-safe" />
        {/* Actual nav row, always a fixed 56px tall */}
        <div className="h-14 flex items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <LayoutDashboard size={18} className="text-white" />
            <span className="font-semibold text-text-primary text-sm tracking-tight">
              Flowyx
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <Link to="/admin" title="Admin panel" className="flex items-center">
                <ShieldCheck size={18} className="text-amber-400 hover:text-amber-300 transition-colors" />
              </Link>
            )}
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
        </div>
      </header>
      <main className="p-4 sm:p-6 pb-0 sm:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
