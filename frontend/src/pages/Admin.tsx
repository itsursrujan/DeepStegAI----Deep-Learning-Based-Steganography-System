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
            className="glass-panel max-w-sm w-full rounded-3xl p-10 space-y-10 text-center relative overflow-hidden bg-black/60 border border-white/5"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="relative group mx-auto w-24 h-24">
                <div className="h-24 w-24 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center transition-all group-hover:shadow-[0_0_80px_rgba(0,242,255,0.3)]">
                    <LockIcon className="h-10 w-10 text-primary" />
                </div>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} className="absolute inset-0 border border-dashed border-primary/20 rounded-full" />
            </div>
            
            <div className="space-y-3">
                <h3 className="text-3xl font-black italic tracking-tighter uppercase glow-text">Command Access</h3>
                <p className="text-white/80 text-[10px] font-bold tracking-[0.4em] uppercase italic">Authorized Personnel Node</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <input 
                    type="password"
                    placeholder="SESSION PIN"
                    className="w-full bg-black/40 border border-white/40 rounded-2xl py-5 px-6 text-center text-3xl tracking-[0.6em] font-black focus:outline-none focus:border-primary/60 transition-all font-mono text-white placeholder:text-white"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    autoFocus
                />
                <button className="w-full bg-primary py-5 rounded-2xl text-black font-bold tracking-[0.4em] text-xs hover:bg-primary/90 transition-all uppercase shadow-[0_0_30px_rgba(0,242,255,0.3)] active:scale-95">
                    Initialize Session
                </button>
            </form>
            
            <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold italic">
                Secure Link: [Encrypted Channel 0X882]
            </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto cursor-none">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                <Cpu className="h-7 w-7 text-primary" />
            </div>
            <div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white glow-text leading-none glitch-hover">Admin Control Console</h2>
                <div className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase mt-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Secure Operator: Root_Admin
                </div>
            </div>
        </div>
        <button 
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-white/10 bg-white/5 text-white/50 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all text-[10px] font-bold uppercase tracking-[0.3em]"
        >
            <LogOut className="h-4 w-4" />
            Terminate Protocol
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Quick Stats Sidebar */}
          <div className="xl:col-span-1 grid grid-cols-2 xl:grid-cols-1 gap-4 min-h-0">
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
                    className="glass-panel rounded-3xl p-8 border border-white/5 bg-black/40 flex flex-col justify-center relative overflow-hidden group"
                  >
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                      <div className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase mb-2 italic">{s.label}</div>
                      <div className="text-3xl font-black italic text-primary tracking-tighter">{s.val}</div>
                  </motion.div>
              ))}
          </div>

          {/* Main Dashboard Area */}
          <div className="xl:col-span-3">
              {/* Messages Hub */}
              <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/5 bg-black/60 flex flex-col min-h-[600px]">
                  <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <Mail className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black italic tracking-tighter uppercase text-white tracking-[0.2em]">Intercepted Comms Hub</h3>
                            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">Authorized Audit Log</p>
                          </div>
                      </div>
                      <div className="px-5 py-2 bg-black/40 rounded-full border border-white/20 text-[10px] font-black tracking-widest text-white uppercase italic">
                         Real-time Data Stream [Live]
                       </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                      <AnimatePresence>
                          {messages.length > 0 ? messages.map((msg, i) => (
                              <motion.div 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  key={msg.id} 
                                  className="p-8 hover:bg-white/[0.03] cursor-none transition-all group relative border-l-2 border-transparent hover:border-primary"
                              >
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="flex items-center gap-5">
                                          <div className="h-14 w-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-sm font-black uppercase tracking-tighter group-hover:border-primary/40 group-hover:text-primary transition-all">
                                              {(msg.name || '??').substring(0, 2)}
                                          </div>
                                          <div>
                                              <p className="text-lg font-black italic tracking-tight text-white/90 leading-tight group-hover:text-white transition-colors uppercase">{msg.name}</p>
                                              <p className="text-[10px] text-white/10 font-mono tracking-[0.2em] uppercase mt-1">{msg.email}</p>
                                          </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-2 text-[10px] font-black uppercase tracking-[0.3em]">
                                          <div className="flex items-center gap-2 text-primary bg-primary/5 px-4 py-1.5 rounded-full border border-primary/20">
                                              <Calendar className="h-3.5 w-3.5" /> {msg.date}
                                          </div>
                                          <div className="flex items-center gap-2 text-white/20 bg-black/40 px-4 py-1.5 rounded-full border border-white/5">
                                              <Clock className="h-4 w-4" /> {msg.time}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="pl-16 relative pr-12">
                                      <p className="text-sm text-white/40 group-hover:text-white/70 leading-relaxed font-bold italic tracking-tight transition-all uppercase">{msg.message}</p>
                                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all">
                                        <ChevronRight className="h-8 w-8" />
                                      </div>
                                  </div>
                              </motion.div>
                          )) : (
                              <div className="h-full flex flex-col items-center justify-center p-20 text-white/10 italic">
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
