import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, ShieldCheck, UserPlus, AlertTriangle, Key, CheckCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { stegoApi } from '@/services/api'
import { useStore } from '@/store/useStore'

export function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [requiresOTP, setRequiresOTP] = useState(false)
  const [otp, setOtp] = useState('')
  
  const navigate = useNavigate()
  const addLog = useStore(s => s.addLog)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    // Security Strength Check
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setIsSubmitting(false)
      return
    }

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setError('Password must contain uppercase, lowercase, a number, and a special character.');
      setIsSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false)
      return
    }
    
    try {
      const res = await stegoApi.signup({ email, password })
      if (!res.data.success) {
        throw new Error(res.data.error || 'Registration failed')
      }
      
      if (res.data.data?.requires_verification) {
        setRequiresOTP(true)
        addLog(`Verification required for ${email}. OTP sent.`)
      } else {
        setSuccess(true)
        addLog(`New protocol profile created for ${email}.`)
        setTimeout(() => navigate('/login'), 2000)
      }
    } catch (err: any) {
      let msg = 'Registration failed. Please check your details.';
      const resData = err.response?.data;
      
      if (resData?.error) {
        if (Array.isArray(resData.error)) {
          // Handle Pydantic validation list
          msg = resData.error.map((e: any) => e.msg).join(' | ');
        } else {
          msg = resData.error;
        }
      }
      
      setError(msg)
      addLog(`Signup failure for ${email}: ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await stegoApi.verifyEmail({ email, otp })
      if (!res.data.success) {
        throw new Error(res.data.error || 'Verification failed')
      }
      
      const loginData = res.data.data;
      if (loginData.access_token) {
          useStore.getState().setLogin(loginData.access_token, loginData.user, false);
          addLog(`User ${email} verified and authenticated.`);
          navigate('/');
      } else {
          setSuccess(true);
          setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.')
      addLog(`Verification failure for ${email}.`)
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
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)] leading-none">Create Account</h2>
          <p className="text-xs font-medium mt-2 text-[var(--fg-dim)]">Fill in your details below</p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-10 text-center gap-6"
          >
             <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_30px_var(--primary-glow)]">
                <CheckCircle className="h-10 w-10 text-primary" />
             </div>
             <div>
                <h3 className="text-xl font-bold tracking-tight text-primary mb-2">Account Created!</h3>
                <p className="text-xs font-medium text-[var(--fg-dim)]/60 leading-relaxed">Redirecting to sign in...</p>
             </div>
          </motion.div>
        ) : requiresOTP ? (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-sm font-semibold text-primary mb-2">Check your email</p>
              <p className="text-xs text-[var(--fg-dim)]">We sent a 6-digit code to {email}.</p>
            </div>
            <div className="relative group">
              <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-dim)] group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="6-digit code"
                required
                maxLength={6}
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 text-center text-xl tracking-[1em] font-bold focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/40 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                value={otp}
                onChange={e => setOtp(e.target.value)}
              />
            </div>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-xs font-medium text-left leading-relaxed">{error}</p>
              </motion.div>
            )}

            <button
              disabled={isSubmitting}
              className="w-full bg-primary text-[var(--btn-text)] font-bold tracking-wide text-sm rounded-2xl py-4 shadow-[0_0_20px_var(--primary-glow)] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-30 group"
            >
              <span className="flex items-center justify-center gap-3">
                {isSubmitting ? 'Verifying...' : 'Verify Code'}
                {!isSubmitting && <CheckCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRequiresOTP(false)}
              className="w-full text-center mt-4 text-xs font-medium text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
            >
              ← Back to Sign Up
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
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

            <div className="relative group">
              <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-dim)] group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/60"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="relative group">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-dim)] group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                placeholder="Confirm password"
                required
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/60"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="px-4 py-2.5 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-[10px] font-medium text-[var(--fg-dim)]/70 leading-relaxed">
                Password: <span className="text-primary">min 8 chars, A–Z, a–z, 0–9, and a symbol</span>
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-xs font-medium leading-relaxed">{error}</p>
              </motion.div>
            )}

            <button
              disabled={isSubmitting}
              className="w-full bg-primary text-[var(--btn-text)] font-bold tracking-wide text-sm rounded-2xl py-4 shadow-[0_0_20px_var(--primary-glow)] hover:opacity-90 hover:shadow-[0_0_35px_var(--primary-glow)] transition-all active:scale-[0.98] disabled:opacity-30 group"
            >
              <span className="flex items-center justify-center gap-3">
                {isSubmitting ? 'Creating account...' : 'Create Account'}
                {!isSubmitting && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col items-center gap-4">
          <p className="text-xs font-medium text-[var(--fg-dim)]/60">Already have an account?</p>
          <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-primary hover:glow-text transition-all">
            Sign in
          </Link>
          <Link to="/" className="mt-1 flex items-center gap-2 text-xs font-medium text-[var(--fg-dim)] hover:text-primary transition-colors">
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
