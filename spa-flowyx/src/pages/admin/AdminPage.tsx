import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Loader2, ChevronRight } from 'lucide-react'
import { adminService, type AdminUser } from '../../services/adminService'
import { UserRoleBadge } from '../../components/admin/UserRoleBadge'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function AdminPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminService
      .listUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    const updated = await adminService.updateUserRole(userId, newRole)
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm text-center py-8">{error}</div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary font-semibold text-lg">Users</h1>
        <span className="text-text-muted text-xs">{users.length} total</span>
      </div>

      {/* Mobile: stacked cards / Desktop: table-like list */}
      <div className="flex flex-col gap-1">
        {users.map((user) => {
          const isSelf = user.email === currentUser?.email
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => void navigate(`/admin/users/${user.id}`)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left w-full group"
            >
              {/* Avatar */}
              {user.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt={user.nickname}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-text-secondary">
                    {user.nickname[0]?.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {user.nickname}
                  </span>
                  {isSelf && (
                    <span className="text-xs text-text-muted">(you)</span>
                  )}
                </div>
                <span className="text-xs text-text-muted truncate block">{user.email}</span>
              </div>

              {/* Role badge — click handled separately to prevent row navigation */}
              <div onClick={(e) => e.stopPropagation()}>
                <UserRoleBadge
                  role={user.role}
                  onChange={(newRole) => handleRoleChange(user.id, newRole)}
                  disabled={isSelf}
                />
              </div>

              <ChevronRight
                size={14}
                className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
