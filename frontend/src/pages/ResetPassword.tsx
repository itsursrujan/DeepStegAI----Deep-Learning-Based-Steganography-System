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
      setError('Neural mismatch: Passwords do not correlate.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      await stegoApi.resetPassword({ token, password })
      setSubmitted(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Validation failed. Token may be expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-6">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-black uppercase tracking-widest text-red-500">Access Denied</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--fg-dim)] opacity-70">
            No Authorization Token found in Request metadata.
          </p>
          <Link to="/login" className="inline-flex items-center gap-3 text-[10px] font-black tracking-[0.3em] uppercase text-primary hover:glow-text">
            <ArrowLeft className="h-4 w-4" /> Return to Safety
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
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-6 shadow-[0_0_30px_var(--primary-glow)]">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-[var(--fg)] glow-text leading-none">Neural Re-Hash</h2>
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase mt-3 text-[var(--fg-dim)]/60">Configure New Access Credentials</p>
        </div>

        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-6" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-3">Protocol Updated</h3>
            <p className="text-[10px] text-[var(--fg-dim)]/70 font-bold uppercase tracking-widest">
              Success. Re-directing to Secure Login Terminal...
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <input
                type="password"
                placeholder="NEW_PASSPHRASE"
                required
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 px-6 text-xs font-bold tracking-[0.2em] focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/40"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="CONFIRM_PASSPHRASE"
                required
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 px-6 text-xs font-bold tracking-[0.2em] focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/40"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 text-center">{error}</p>
            )}

            <button
              disabled={isSubmitting}
              className="w-full bg-primary text-black font-black tracking-[0.4em] text-xs uppercase rounded-2xl py-4 shadow-[0_0_30px_var(--primary-glow)] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-30 group"
            >
              <span className="flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ESTABLISH LINK'}
                {!isSubmitting && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
