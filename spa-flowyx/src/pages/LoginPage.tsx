import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import { GoogleSignInButton } from '../features/auth/components/GoogleSignInButton'

export function LoginPage() {
  const { signIn, isAuthenticated, isLoading, error } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      void navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  return (
    <div
      className={[
        'w-full sm:max-w-sm',
        'bg-bg-secondary',
        'border-0 sm:border sm:border-border-default',
        'rounded-none sm:rounded-2xl',
        'p-6 sm:p-8',
        'sm:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_rgba(0,0,0,0.7)]',
      ].join(' ')}
    >
      {/* Branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-4">
          <span className="text-white font-bold text-lg">F</span>
        </div>
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Welcome to Flowyx
        </h1>
        <p className="text-text-muted text-sm mt-1">Sign in or create an account</p>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-950/60 border border-red-900/40 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Auth actions */}
      <div className="flex flex-col gap-3">
        <GoogleSignInButton onClick={signIn} disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Continue with Google'}
        </GoogleSignInButton>
      </div>

      <p className="text-center text-text-muted text-xs mt-6">
        By continuing, you agree to our{' '}
        <a
          href="#"
          className="text-white/50 hover:text-white underline-offset-2 hover:underline transition-colors"
        >
          Terms
        </a>{' '}
        and{' '}
        <a
          href="#"
          className="text-white/50 hover:text-white underline-offset-2 hover:underline transition-colors"
        >
          Privacy Policy
        </a>
      </p>
    </div>
  )
}
