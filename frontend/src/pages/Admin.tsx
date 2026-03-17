import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock as LockIcon, Mail, Clock, LogOut, ChevronRight, Cpu, Calendar } from 'lucide-react'
import { stegoApi } from '@/services/api'

const TRANSITION = { duration: 0.6, ease: [0.22, 1, 0.36, 1] }

export function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pin, setPin] = useState('')
  const [messages, setMessages] = useState<any[]>([])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === '1234') { 
        setIsLoggedIn(true)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
        const fetchData = async () => {
            try {
                const res = await stegoApi.getMessages()
                setMessages(res.data.reverse())
            } catch (err) {
                console.error("Data fetch failed:", err)
            }
        }
        fetchData()
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <div className="h-full flex items-center justify-center px-4 cursor-none">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={TRANSITION}
            className="bg-[var(--bg-card)] max-w-sm w-full rounded-3xl p-6 space-y-6 text-center relative overflow-hidden border border-[var(--border)] shadow-2xl"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="relative group mx-auto w-16 h-16">
                <div className="h-16 w-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center transition-all group-hover:shadow-[0_0_60px_var(--primary-glow)]">
                    <LockIcon className="h-7 w-7 text-primary" />
                </div>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} className="absolute inset-0 border border-dashed border-primary/20 rounded-full" />
            </div>
            
            <div className="space-y-3">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase glow-text text-[var(--fg)]">Command Access</h3>
                <p className="text-[var(--fg-dim)]/80 text-[9px] font-bold tracking-[0.3em] uppercase italic">Authorized Personnel Node</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <input 
                    type="password"
                    placeholder="SESSION PIN"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl py-4 px-6 text-center text-2xl tracking-[0.6em] font-black focus:outline-none focus:border-primary/60 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    autoFocus
                />
                <button className="w-full bg-primary py-3 rounded-2xl text-black font-black tracking-[0.4em] text-xs hover:opacity-90 transition-all uppercase shadow-[0_0_30px_var(--primary-glow)] active:scale-95">
                    Initialize Session
                </button>
            </form>
            
            <p className="text-[10px] text-[var(--fg-dim)]/40 uppercase tracking-[0.3em] font-bold italic">
                Secure Link: [Encrypted Channel 0X882]
            </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-3 max-w-7xl mx-auto cursor-none">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_var(--primary-glow)]">
                <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
                <h2 className="text-xl font-black italic tracking-tighter uppercase text-[var(--fg)] glow-text leading-none glitch-hover">Admin Control Console</h2>
                <div className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase mt-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Secure Operator: Root_Admin
                </div>
            </div>
        </div>
        <button 
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--fg-dim)] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all text-[10px] font-bold uppercase tracking-[0.3em]"
        >
            <LogOut className="h-4 w-4" />
            Terminate Protocol
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-4 gap-3">
          {/* Quick Stats Sidebar */}
          <div className="xl:col-span-1 grid grid-cols-2 xl:grid-cols-1 gap-3 min-h-0">
              {[
                  { label: 'Active Tasks', val: '42' },
                  { label: 'Neural Load', val: '12%' },
                  { label: 'Encrypted Nodes', val: '891' },
                  { label: 'Signal Strength', val: '-14dB' },
              ].map((s, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    className="bg-[var(--bg-card)] rounded-3xl p-4 border border-[var(--border)] flex flex-col justify-center relative overflow-hidden group shadow-lg"
                  >
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                      <div className="text-[10px] font-black tracking-[0.3em] text-[var(--fg-dim)]/20 uppercase mb-2 italic">{s.label}</div>
                      <div className="text-2xl font-black italic text-primary tracking-tighter">{s.val}</div>
                  </motion.div>
              ))}
          </div>

          {/* Main Dashboard Area */}
          <div className="xl:col-span-3">
              {/* Messages Hub */}
              <div className="bg-[var(--bg-card)] rounded-[2rem] overflow-hidden border border-[var(--border)] flex flex-col flex-1 min-h-0 shadow-xl">
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--fg)]/[0.02]">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <Mail className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black italic tracking-tighter uppercase text-[var(--fg)] tracking-[0.2em]">Intercepted Comms Hub</h3>
                            <p className="text-[10px] text-[var(--fg-dim)]/40 font-bold uppercase tracking-widest mt-1">Authorized Audit Log</p>
                          </div>
                      </div>
                      <div className="px-5 py-2 bg-[var(--bg)] rounded-full border border-[var(--border)] text-[10px] font-black tracking-widest text-[var(--fg)] uppercase italic">
                         Real-time Data Stream [Live]
                       </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
                      <AnimatePresence>
                          {messages.length > 0 ? messages.map((msg, i) => (
                              <motion.div 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  key={msg.id} 
                                  className="p-4 hover:bg-[var(--fg)]/[0.03] cursor-none transition-all group relative border-l-2 border-transparent hover:border-primary"
                              >
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-5">
                                          <div className="h-10 w-10 rounded-2xl bg-[var(--bg-sidebar)] border border-[var(--border)] flex items-center justify-center text-xs font-black uppercase tracking-tighter group-hover:border-primary/40 group-hover:text-primary transition-all text-[var(--fg)]">
                                              {(msg.name || '??').substring(0, 2)}
                                          </div>
                                          <div>
                                              <p className="text-sm font-black italic tracking-tight text-[var(--fg)]/90 leading-tight group-hover:text-[var(--fg)] transition-colors uppercase">{msg.name}</p>
                                              <p className="text-[9px] text-[var(--fg-dim)]/30 font-mono tracking-[0.2em] uppercase">{msg.email}</p>
                                          </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-2 text-[10px] font-black uppercase tracking-[0.3em]">
                                          <div className="flex items-center gap-2 text-primary bg-primary/5 px-4 py-1.5 rounded-full border border-primary/20">
                                              <Calendar className="h-3.5 w-3.5" /> {msg.date}
                                          </div>
                                          <div className="flex items-center gap-2 text-[var(--fg-dim)] bg-[var(--bg)] px-4 py-1.5 rounded-full border border-[var(--border)]">
                                              <Clock className="h-4 w-4" /> {msg.time}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="pl-12 relative pr-8">
                                      <p className="text-sm text-[var(--fg-dim)] group-hover:text-[var(--fg)] leading-relaxed font-bold italic tracking-tight transition-all uppercase">{msg.message}</p>
                                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all">
                                        <ChevronRight className="h-8 w-8" />
                                      </div>
                                  </div>
                              </motion.div>
                          )) : (
                              <div className="h-full flex flex-col items-center justify-center p-20 text-[var(--fg-dim)]/10 italic">
                                  <Mail className="h-16 w-16 mb-6 opacity-30" />
                                  <p className="text-sm font-black tracking-widest uppercase">Encryption active. Awaiting fresh data pulses...</p>
                              </div>
                          )}
                      </AnimatePresence>
                  </div>
              </div>
          </div>
      </div>
    </div>
  )
}
