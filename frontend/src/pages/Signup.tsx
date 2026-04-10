import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, ShieldCheck, UserPlus, AlertTriangle, Key, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { stegoApi } from '@/services/api'
import { useStore } from '@/store/useStore'

export function Signup() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const navigate = useNavigate()
  const { setLogin, addLog } = useStore()

  const signupWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true)
      setError(null)
      try {
        const res = await stegoApi.googleAuth({ google_token: tokenResponse.access_token })
        const loginData = res.data.data
        setLogin(loginData.access_token, loginData.user, false)
        addLog(`User ${loginData.user.email} securely registered and authenticated via Google.`)
        navigate('/')
      } catch (err: any) {
        setError(err.response?.data?.error || 'Google Sign-Up failed.')
        addLog('Google registration failure.')
      } finally {
        setIsSubmitting(false)
      }
    },
    onError: () => {
      setError('Google Sign-up was cancelled or failed.')
    }
  })



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
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)] leading-none">Register Account</h2>
          <p className="text-xs font-medium mt-2 text-[var(--fg-dim)]">Setup your verified steganography profile</p>
        </div>

        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex items-start gap-4">
             <div className="bg-primary/20 p-2 rounded-xl">
               <ShieldCheck className="h-5 w-5 text-primary" />
             </div>
             <p className="text-[10px] text-[var(--fg-dim)] leading-relaxed">
               The DeepStegAI Protocol enforces <span className="text-primary font-bold uppercase tracking-wider">Identity Integrity</span>. Registration is exclusively restricted to verified Google accounts to maintain the highest standard of cybersecurity and audit transparency.
             </p>
          </div>

          <button
            type="button"
            onClick={() => signupWithGoogle()}
            disabled={isSubmitting}
            className="w-full bg-primary text-[var(--btn-text)] group font-bold tracking-wide text-sm rounded-2xl py-4 shadow-[0_0_20px_var(--primary-glow)] hover:opacity-90 hover:shadow-[0_0_35px_var(--primary-glow)] transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3"
          >
            <div className="bg-white p-1 rounded-lg">
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            {isSubmitting ? 'Verifying Identity...' : 'Sign Up with Google'}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>

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
        </div>       )}

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
