export interface AuthUser {
  accessToken: string
  email: string
  name: string
  picture: string
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
}

export interface AuthActions {
  setUser: (user: AuthUser) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}
