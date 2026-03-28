import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { stegoApi } from '@/services/api'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      await stegoApi.forgotPassword(email)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)] leading-none">Forgot Password</h2>
          <p className="text-xs font-medium mt-2 text-[var(--fg-dim)]">Enter your email and we'll send a reset link</p>
        </div>

        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-6" />
            <h3 className="text-sm font-bold tracking-wide mb-3">Email Sent!</h3>
            <p className="text-xs text-[var(--fg-dim)] font-medium leading-relaxed">
              Check your inbox for the password reset link. It will be active for 60 minutes.
            </p>
            <Link to="/login" className="mt-10 inline-flex items-center gap-3 text-sm font-semibold text-primary hover:glow-text transition-all">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-dim)] group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/60"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                {!isSubmitting && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>

            <Link to="/login" className="flex items-center justify-center gap-3 text-xs font-medium text-[var(--fg-dim)] hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  )
}
