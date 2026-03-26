declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          revoke: (token: string, callback: () => void) => void
        }
      }
    }
  }
}

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
