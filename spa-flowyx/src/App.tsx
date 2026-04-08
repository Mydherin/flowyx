import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router'
import { router } from './router'
import { useAuthStore } from './features/auth/store'
import { callBackend } from './features/auth/hooks/useAuth'

export default function App() {
  // Zustand v5 hydrates localStorage asynchronously. We must wait for it
  // before rendering the router, otherwise ProtectedRoute sees user=null
  // and redirects to /login before the stored session is available.
  const [hasHydrated, setHasHydrated] = useState(
    () => useAuthStore.persist.hasHydrated(),
  )
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const logout = useAuthStore((state) => state.logout)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (hasHydrated) return
    return useAuthStore.persist.onFinishHydration(() => setHasHydrated(true))
  }, [hasHydrated])

  useEffect(() => {
    if (!hasHydrated || !user) return

    setIsValidating(true)
    callBackend<{ id: string; nickname: string; email: string; pictureUrl: string; role: string }>(
      '/api/v1/auth/signin',
      user.accessToken,
      { picture: user.picture },
    )
      .then((backendUser) => {
        setUser({
          ...user,
          id: backendUser.id,
          name: backendUser.nickname,
          email: backendUser.email,
          picture: backendUser.pictureUrl,
          role: backendUser.role,
        })
      })
      .catch(() => logout())
      .finally(() => setIsValidating(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated])

  if (!hasHydrated || isValidating) {
    return (
      <div className="min-h-dvh bg-bg-primary flex items-center justify-center">
        <span className="text-text-secondary text-sm">Loading…</span>
      </div>
    )
  }

  return <RouterProvider router={router} />
}
