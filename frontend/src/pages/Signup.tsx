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
      setError('PASSPHRASE LENGTH INSUFFICIENT (Min 8 characters required)');
      setIsSubmitting(false)
      return
    }

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setError('SECURITY PROTOCOL VIOLATION: Password must contain uppercase, lowercase, digit, and special character.');
      setIsSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setError('PASSPHRASE MISMATCH DETECTED.');
      setIsSubmitting(false)
      return
    }
    
    try {
      await stegoApi.signup({ email, password })
      setSuccess(true)
      addLog(`New protocol profile created for ${email}.`)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      let msg = 'Registration failed. Check your data.';
      const resData = err.response?.data;
      
      if (resData?.error) {
        if (Array.isArray(resData.error)) {
          // Handle Pydantic validation list
          msg = resData.error.map((e: any) => e.msg).join(' | ');
        } else {
          msg = resData.error;
        }
      }
      
      setError(msg.toUpperCase())
      addLog(`Signup failure for ${email}: ${msg}`)
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
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-6 shadow-[0_0_30px_var(--primary-glow)]">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-[var(--fg)] glow-text leading-none">Recruitment Node</h2>
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase mt-3 text-[var(--fg-dim)]/60">Initialize Your Protocol Profile</p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-10 text-center gap-6"
          >
             <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_40px_var(--primary-glow)]">
                <CheckCircle className="h-10 w-10 text-primary" />
             </div>
             <div>
                <h3 className="text-xl font-black uppercase tracking-widest text-primary mb-2">Registration Successful</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--fg-dim)]/40 leading-relaxed shadow-glow">Redirecting to Authorization Hub...</p>
             </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-dim)] group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                placeholder="OPERATOR_EMAIL"
                required
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 text-xs font-bold tracking-[0.2em] focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/40 shadow-inner"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-dim)] group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                placeholder="CREATE_PASSPHRASE"
                required
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 text-xs font-bold tracking-[0.2em] focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/40"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="relative group">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-dim)] group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                placeholder="CONFIRM_PASSPHRASE"
                required
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 text-xs font-bold tracking-[0.2em] focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/40"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="px-4 py-2 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-[var(--fg-dim)]/60 leading-relaxed">
                Security Protocol: <span className="text-primary italic">8+ Chars / A-z / 0-9 / !@#</span>
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-none shadow-glow">{error}</p>
              </motion.div>
            )}

            <button
              disabled={isSubmitting}
              className="w-full bg-primary text-black font-black tracking-[0.4em] text-xs uppercase rounded-2xl py-4 shadow-[0_0_30px_var(--primary-glow)] hover:opacity-90 hover:shadow-[0_0_50px_var(--primary-glow)] transition-all active:scale-[0.98] disabled:opacity-30 group"
            >
              <span className="flex items-center justify-center gap-3">
                {isSubmitting ? 'GENERATING PROTOCOL...' : 'EXECUTE RECRUITMENT'}
                {!isSubmitting && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col items-center gap-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--fg-dim)]/40 italic">Existing Operational Node?</p>
          <Link to="/login" className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-primary hover:glow-text transition-all">
            Authorize Access (LOGIN)
          </Link>
          <Link to="/" className="mt-2 flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[var(--fg-dim)] hover:text-primary transition-all">
            Return to Command Center [ESC]
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
