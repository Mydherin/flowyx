import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, AuthActions } from '../../types/auth'

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, error: null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      logout: () => set({ user: null, error: null, isLoading: false }),
    }),
    {
      name: 'flowyx-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
