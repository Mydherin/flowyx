import { useCallback } from 'react'
import { useGoogleLogin, googleLogout } from '@react-oauth/google'
import { useAuthStore } from '../store'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

interface GoogleUserInfo {
  email: string
  name: string
  picture: string
}

interface BackendUser {
  id: string
  nickname: string
  email: string
  pictureUrl: string
  role: string
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Failed to fetch user info from Google')
  return response.json() as Promise<GoogleUserInfo>
}

export async function callBackend<T>(path: string, accessToken: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401) {
    useAuthStore.getState().logout()
    throw new Error('SESSION_EXPIRED')
  }

  if (response.status === 404) {
    throw new Error('USER_NOT_FOUND')
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    throw new Error((err as { error: string }).error ?? `HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)
  const setError = useAuthStore((state) => state.setError)
  const logoutStore = useAuthStore((state) => state.logout)

  const handleError = useCallback(() => {
    setError('Google authentication failed. Please try again.')
  }, [setError])

  // Single flow: try sign-in first; if user not found (404) → auto sign-up
  const signIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      try {
        const info = await fetchGoogleUserInfo(tokenResponse.access_token)

        let backendUser: BackendUser
        try {
          backendUser = await callBackend<BackendUser>(
            '/api/v1/auth/signin',
            tokenResponse.access_token,
            { picture: info.picture },
          )
        } catch (signInErr) {
          if (!(signInErr instanceof Error) || signInErr.message !== 'USER_NOT_FOUND') throw signInErr
          // User doesn't exist yet — create account automatically
          backendUser = await callBackend<BackendUser>(
            '/api/v1/auth/signup',
            tokenResponse.access_token,
            {
              uuid: crypto.randomUUID(),
              nickname: info.name,
              email: info.email,
              picture: info.picture,
            },
          )
        }

        setUser({
          accessToken: tokenResponse.access_token,
          email: backendUser.email,
          name: backendUser.nickname,
          picture: backendUser.pictureUrl,
          role: backendUser.role,
        })
      } catch (err) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') return
        setError('Authentication failed. Please try again.')
      }
    },
    onError: handleError,
    flow: 'implicit',
    prompt: 'select_account',
  })

  const logout = useCallback(() => {
    googleLogout()
    logoutStore()
  }, [logoutStore])

  return {
    user,
    isLoading,
    error,
    isAuthenticated: user !== null,
    isAdmin: user?.role === 'ADMIN',
    signIn,
    logout,
  }
}
