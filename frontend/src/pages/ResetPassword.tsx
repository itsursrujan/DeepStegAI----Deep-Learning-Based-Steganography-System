import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, ArrowRight, ArrowLeft, Loader2, CheckCircle, Lock } from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { stegoApi } from '@/services/api'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      await stegoApi.resetPassword({ token, password })
      setSubmitted(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-6">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold tracking-tight text-red-500">Invalid Link</h2>
          <p className="text-sm font-medium text-[var(--fg-dim)]">
            No reset token found. Please request a new password reset link.
          </p>
          <Link to="/login" className="inline-flex items-center gap-3 text-sm font-semibold text-primary hover:glow-text">
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-6 shadow-[0_0_20px_var(--primary-glow)]">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)] leading-none">Reset Password</h2>
          <p className="text-xs font-medium mt-2 text-[var(--fg-dim)]">Enter and confirm your new password</p>
        </div>

        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-6" />
            <h3 className="text-sm font-bold tracking-wide mb-3">Password Updated!</h3>
            <p className="text-xs text-[var(--fg-dim)] font-medium">
              Redirecting to Sign In...
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <input
                type="password"
                placeholder="New password"
                required
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/60"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm password"
                required
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/60"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-red-400 text-center leading-relaxed">{error}</p>
            )}

            <button
              disabled={isSubmitting}
              className="w-full bg-primary text-[var(--btn-text)] font-bold tracking-wide text-sm rounded-2xl py-4 shadow-[0_0_20px_var(--primary-glow)] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-30 group"
            >
              <span className="flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set New Password'}
                {!isSubmitting && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
