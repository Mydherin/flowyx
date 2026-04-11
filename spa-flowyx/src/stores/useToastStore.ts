import { create } from 'zustand'

interface Toast {
  id: string
  message: string
}

interface ToastStore {
  toasts: Toast[]
  show: (message: string, durationMs?: number) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  show: (message, durationMs = 3000) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, durationMs)
  },
}))
