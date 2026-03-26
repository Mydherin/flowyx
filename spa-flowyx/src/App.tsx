import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router'
import { router } from './router'
import { useAuthStore } from './features/auth/store'
import { callBackend } from './features/auth/hooks/useAuth'

export default function App() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const logout = useAuthStore((state) => state.logout)
  const [isValidating, setIsValidating] = useState(!!user)

  useEffect(() => {
    if (!user) {
      setIsValidating(false)
      return
    }

    // Silently revalidate the stored access token on every app load.
    // If the token is expired or invalid the backend returns 401 →
    // callBackend calls logout() automatically → router redirects to /login.
    callBackend<{ nickname: string; email: string; pictureUrl: string }>(
      '/auth/signin',
      user.accessToken,
      { picture: user.picture },
    )
      .then((backendUser) => {
        setUser({
          ...user,
          name: backendUser.nickname,
          email: backendUser.email,
          picture: backendUser.pictureUrl,
        })
      })
      .catch(() => logout())
      .finally(() => setIsValidating(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isValidating) {
    return (
      <div className="min-h-dvh bg-bg-primary flex items-center justify-center">
        <span className="text-text-secondary text-sm">Loading…</span>
      </div>
    )
  }

  return <RouterProvider router={router} />
}
