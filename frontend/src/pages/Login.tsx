import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { stegoApi } from '@/services/api'
import { useStore } from '@/store/useStore'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { setLogin, addLog } = useStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const res = await stegoApi.login({ email, password })
      setLogin(res.data.access_token, res.data.user, remember)
      addLog(`User ${res.data.user.email} authenticated successfully (Persistence: ${remember}).`)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authorization failed. Check credentials.')
      addLog(`Login failure for ${email}.`)
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
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-[var(--fg)] glow-text leading-none">Access Control</h2>
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase mt-3 text-[var(--fg-dim)]/60">Stage Authorization Credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-dim)] group-focus-within:text-primary transition-colors" />
            <input
              type="email"
              placeholder="OPERATOR_EMAIL"
              required
              className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 text-xs font-bold tracking-[0.2em] focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/40"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-dim)] group-focus-within:text-primary transition-colors" />
            <input
              type="password"
              placeholder="SECRET_PASSPHRASE"
              required
              className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-4 pl-14 pr-6 text-xs font-bold tracking-[0.2em] focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]/40"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="hidden"
              />
              <div className={`h-5 w-5 rounded-lg border-2 transition-all flex items-center justify-center ${remember ? 'bg-primary border-primary shadow-[0_0_15px_var(--primary-glow)]' : 'bg-[var(--bg-sidebar)] border-[var(--border)]'}`}>
                {remember && <ShieldCheck className="h-3 w-3 text-black" />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--fg-dim)] group-hover:text-primary transition-colors">Remember Me</span>
            </label>
            <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-primary hover:glow-text transition-all">
              Lost Password?
            </Link>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">{error}</p>
            </motion.div>
          )}

          <button
            disabled={isSubmitting}
            className="w-full bg-primary text-black font-black tracking-[0.4em] text-xs uppercase rounded-2xl py-4 shadow-[0_0_30px_var(--primary-glow)] hover:opacity-90 hover:shadow-[0_0_50px_var(--primary-glow)] transition-all active:scale-[0.98] disabled:opacity-30 group"
          >
            <span className="flex items-center justify-center gap-3">
              {isSubmitting ? 'AUTHORIZING...' : 'INITIALIZE LOGIN'}
              {!isSubmitting && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col items-center gap-4">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--fg-dim)]/40 italic">New Operator detected?</p>
          <Link to="/signup" className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-primary hover:glow-text transition-all">
            Initialize Recruitment (SIGNUP)
          </Link>
          <Link to="/" className="mt-2 flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-[var(--fg-dim)] hover:text-primary transition-all">
            Return to Command Center [ESC]
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
