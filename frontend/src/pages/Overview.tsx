import { Suspense, useState, useRef, memo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { NeuralSphere } from '@/three/NeuralSphere'
import { Shield, Zap, Lock, Globe, ArrowRight, Clock, ChevronRight, Activity, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { fireInitRipple } from '@/components/DashboardLayout'
import { ThemeToggle } from '@/components/ThemeToggle'
import { stegoApi } from '@/services/api'

const TRANSITION = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }

// ──────────────────────── Hyper Button ────────────────────────
function HyperButton({ onClick }: { onClick: () => void }) {
  const [progress, setProgress] = useState(0)
  const [filling, setFilling] = useState(false)
  const [complete, setComplete] = useState(false)
  const [clickRipples, setClickRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Sonar Ripple components for the button
  const SonarRipples = () => (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-2xl border border-primary/40 bg-primary/5"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0, 0.4, 0], scale: [1, 1.4, 1.8] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  )

  const startFill = () => {
    if (complete) return
    setFilling(true)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setComplete(true)
          if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect()
            fireInitRipple(r.left + r.width / 2, r.top + r.height / 2)
          }
          setTimeout(onClick, 500)
          return 100
        }
        return p + 2.5 // Slightly smoother
      })
    }, 16)
  }

  const stopFill = () => {
    if (complete) return
    setFilling(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setProgress(0)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (complete) return
    
    // Immediate activation on click if not already complete
    if (intervalRef.current) clearInterval(intervalRef.current)
    setComplete(true)
    setProgress(100)
    
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
    const id = Date.now()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setClickRipples(prev => [...prev, { id, x, y }])
    
    fireInitRipple(rect.left + rect.width / 2, rect.top + rect.height / 2)
    setTimeout(onClick, 400)
  }

  return (
    <motion.div
      className="relative inline-block"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...TRANSITION, delay: 0.8 }}
      whileHover={!complete ? {
        x: [0, -1.5, 1.5, -0.5, 0.5, 0],
        transition: { duration: 0.6, ease: 'easeInOut' }
      } : {}}
    >
      <button
        ref={btnRef}
        onMouseEnter={startFill}
        onMouseLeave={stopFill}
        onClick={handleClick}
        className="group relative overflow-hidden rounded-2xl border border-primary/40 bg-primary/10 px-14 py-5 text-sm font-black tracking-[0.4em] uppercase text-[var(--fg)] transition-all duration-300"
        style={{
          boxShadow: complete
            ? '0 0 60px var(--primary-glow)'
            : filling ? '0 0 30px var(--primary-glow)' : '0 0 15px rgba(0,242,255,0.05)',
        }}
      >
        {/* Click ripples */}
        {clickRipples.map(r => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.6, scale: 0 }}
            animate={{ opacity: 0, scale: 4 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="absolute rounded-full bg-primary/30 pointer-events-none"
            style={{ left: r.x, top: r.y, width: 40, height: 40, translateX: '-50%', translateY: '-50%' }}
          />
        ))}

        {/* Fill Background */}
        <motion.div
          className="absolute inset-0 bg-primary/40 pointer-events-none"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          style={{ originX: 0 }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
        
        {/* Progress Bar (Visible Edge) */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 w-full bg-primary shadow-[0_0_15px_var(--primary-glow)] pointer-events-none"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          style={{ originX: 0 }}
          transition={{ duration: 0.1, ease: "linear" }}
        />

        {complete && <div className="absolute inset-0 bg-primary/30 animate-pulse" />}

        <SonarRipples />

        <span className="relative z-10 flex items-center gap-4">
          INITIALIZE SYSTEM
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
        </span>
      </button>
    </motion.div>
  )
}

// ─────────────────────── Feature Cards ───────────────────────
const highlights = [
  { icon: Shield, title: 'AI Forensic Engine', desc: 'Secure neural steganography auditing.' },
  { icon: Lock, title: 'Adaptive Edge', desc: 'Noise-integrated data preservation.' },
  { icon: Zap, title: 'Kinetic Synthesis', desc: 'Instant heavy-duty encryption cycles.' },
  { icon: Globe, title: 'Global Node', desc: 'Unified industrial command shell.' },
]

// ─────────────────────── Page ───────────────────────
export const Overview = memo(function Overview() {
  const systemInitialized = useStore(s => s.systemInitialized)
  const setSystemInitialized = useStore(s => s.setSystemInitialized)
  const isAuthenticated = useStore(s => s.isAuthenticated)
  const theme = useStore(s => s.theme)
  const isLight = theme === 'light'
  
  const [data, setData] = useState<{ analysis: any[]; files: any[] }>({ analysis: [], files: [] })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && systemInitialized) {
        const fetchDashboardData = async () => {
            setIsLoading(true)
            try {
                const [filesRes, analysisRes] = await Promise.all([
                    stegoApi.getFiles(),
                    stegoApi.getAnalysisList()
                ])
                setData({
                    files: filesRes.data.success ? filesRes.data.data : [],
                    analysis: analysisRes.data.success ? analysisRes.data.data : []
                })
            } catch (err) {
                console.error("Dashboard fetch failed:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchDashboardData()
    }
  }, [isAuthenticated, systemInitialized])

  // Compute stats
  const totalScans = data.analysis.length
  const threatsDetected = data.analysis.filter(a => a.verdict === 'DETECTED' || a.verdict === 'SUSPICIOUS').length
  const recentActivity = data.analysis.slice(0, 5)

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-transparent will-change-scroll" style={{ zIndex: 3 }}>
      {/* 3D Sphere */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${isLight ? 'drop-shadow-[0_0_40px_rgba(0,184,196,0.3)]' : ''}`} style={{ zIndex: 4, transform: 'translateZ(0)' }}>
        <Suspense fallback={null}>
          <Canvas camera={{ position: [0, 0, 14], fov: 60 }}>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.6} color="#00f2ff" />
            <NeuralSphere />
          </Canvas>
        </Suspense>
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center" style={{ zIndex: 5 }}>
        
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-6 py-2.5 backdrop-blur-xl"
        >
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary">
            Kernel Link Staged // v3.1 Obsidian
          </span>
        </motion.div>

        <div className="relative px-2">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...TRANSITION, delay: 0.25, duration: 0.8 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              textShadow: '4px 4px 8px rgba(0,0,0,0.2)',
              color: 'var(--fg-title)'
            }}
            className="text-5xl sm:text-7xl md:text-9xl select-none"
          >
            DEEP<span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>STEG</span>AI
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION, delay: 0.45 }}
          className="mt-8 max-w-xl text-sm sm:text-base font-bold leading-relaxed uppercase tracking-widest text-[var(--fg)] text-shadow-lg"
        >
          Advanced steganography intelligence suite powered by AI forensic analysis.
        </motion.p>

        <div className="mt-14 w-full max-w-6xl">
          {!systemInitialized ? (
            <HyperButton onClick={() => setSystemInitialized(true)} />
          ) : (
            <div className="space-y-12">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={TRANSITION}
                    className="flex flex-wrap justify-center gap-4 sm:gap-6 px-4"
                >
                {!isAuthenticated ? (
                    <>
                    <Link to="/login" className="w-full sm:w-auto lg:cursor-none">
                        <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full sm:w-auto rounded-2xl bg-primary px-12 py-5 text-[10px] sm:text-xs font-black tracking-[0.4em] text-black shadow-[0_0_20px_rgba(0,242,255,0.3)] uppercase italic"
                        >
                        Authorize Access (LOGIN)
                        </motion.button>
                    </Link>
                    <Link to="/signup" className="w-full sm:w-auto lg:cursor-none">
                        <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full sm:w-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-12 py-5 text-[10px] sm:text-xs font-black tracking-[0.4em] text-[var(--fg)] uppercase italic"
                        >
                        Create Protocol Profile (SIGNUP)
                        </motion.button>
                    </Link>
                    </>
                ) : (
                    <>
                    <Link to="/embed" className="w-full sm:w-auto lg:cursor-none">
                        <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full sm:w-auto rounded-2xl bg-primary px-10 py-5 text-[10px] sm:text-xs font-black tracking-[0.4em] text-black shadow-[0_0_20px_rgba(0,242,255,0.3)] uppercase"
                        >
                        Enter Embed Node
                        </motion.button>
                    </Link>
                    <Link to="/analyze" className="w-full sm:w-auto lg:cursor-none">
                        <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full sm:w-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-10 py-5 text-[10px] sm:text-xs font-black tracking-[0.4em] text-[var(--fg)] uppercase"
                        >
                        Scanner Access
                        </motion.button>
                    </Link>
                    </>
                )}
                </motion.div>

                {/* Real-time Stats Section */}
                {isAuthenticated && (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...TRANSITION, delay: 0.3 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4"
                >
                    {[
                        { 
                            label: 'TOTAL_SCANS_LOGGED', 
                            val: isLoading ? '...' : totalScans.toString(),
                            icon: Activity,
                            color: 'text-primary'
                        },
                        { 
                            label: 'THREATS_ISOLATED', 
                            val: isLoading ? '...' : threatsDetected.toString(),
                            icon: Shield,
                            color: threatsDetected > 0 ? 'text-red-500' : 'text-primary'
                        },
                        { 
                            label: 'NEURAL_ACCURACY', 
                            val: '99.98%', 
                            icon: Zap,
                            color: 'text-primary'
                        },
                        { 
                            label: 'KERNEL_STATUS', 
                            val: 'SYNCED', 
                            icon: Globe,
                            color: 'text-green-500'
                        },
                    ].map((s, i) => (
                    <motion.div
                        key={i}
                        className={`rounded-2xl px-6 py-6 border transition-all duration-300 ${isLight ? 'bg-[#dff6ff] border-primary/20 shadow-lg' : 'bg-[var(--bg-card)] border-[var(--border)] shadow-[0_0_20px_rgba(0,0,0,0.2)]'}`}
                    >
                        <div className="flex items-center justify-between mb-3 text-[var(--fg-dim)]/30">
                            <s.icon className="h-4 w-4" />
                            <span className="text-[8px] font-black tracking-widest uppercase">{s.label}</span>
                        </div>
                        <div className={`text-4xl font-black italic tracking-tighter ${s.color} ${!isLight && s.color === 'text-primary' ? 'glow-text' : ''}`}>{s.val}</div>
                    </motion.div>
                    ))}
                </motion.div>
                )}

                {/* Latest Activity Feed */}
                {isAuthenticated && (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...TRANSITION, delay: 0.5 }}
                    className="px-4 text-left"
                >
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-primary" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--fg)] italic">Recent Forensic pulses</h3>
                        </div>
                        <Link to="/analyze" className="text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-2">
                            View All <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className={`rounded-3xl border ${isLight ? 'bg-white border-primary/10 shadow-xl' : 'bg-[var(--bg-card)] border-[var(--border)] shadow-2xl'} overflow-hidden min-h-[120px] relative`}>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                                    <Activity className="h-10 w-10 text-primary" />
                                </motion.div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] mt-6">Searching for active signals...</p>
                            </div>
                        ) : recentActivity.length > 0 ? (
                            <div className="divide-y divide-[var(--border)]">
                                {recentActivity.map((r, i) => (
                                    <button 
                                        key={r.id} 
                                        onClick={() => navigate(`/analysis/${r.file_id}`)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-primary/[0.03] transition-all group lg:cursor-none"
                                    >
                                        <div className="flex items-center gap-6 max-w-[70%]">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all ${isLight ? 'bg-primary/5 border-primary/20' : 'bg-[var(--bg)] border-[var(--border)]'} group-hover:border-primary/40`}>
                                                <Search className="h-4 w-4 text-[var(--fg-dim)] group-hover:text-primary" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-black italic tracking-tight text-[var(--fg)] uppercase truncate">{r.details?.filename || 'UNNAMED_ASSET'}</p>
                                                <p className="text-[8px] text-[var(--fg-dim)]/40 font-bold uppercase tracking-widest mt-1">UUID: {r.id.substring(0, 8)}... // STAMPed: {new Date(r.created_at).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                                                r.verdict === 'CLEAN' 
                                                    ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                                                    : r.verdict === 'SUSPICIOUS'
                                                        ? 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                                                        : 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                            }`}>
                                                {r.verdict}
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-[var(--fg-dim)]/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-10">
                                <Activity className="h-12 w-12 mx-auto mb-6" />
                                <h3 className="text-sm font-black italic tracking-tight uppercase">No active telemetry data.</h3>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-2">Initialize forensic scan to begin monitoring.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
                )}

                {/* Highlights (only shown if not authenticated or scrolled down) */}
                {!isAuthenticated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto pb-20">
                    {highlights.map((h, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="group flex gap-6 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-left backdrop-blur-xl hover:bg-[var(--fg)]/5 transition-all shadow-xl"
                    >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg)] group-hover:border-primary/50 group-hover:bg-primary/10 transition-all shadow-sm">
                        <h.icon className="h-7 w-7 text-[var(--fg-dim)] group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                        <h3 className="text-sm font-black italic tracking-tight text-[var(--fg)] uppercase tracking-wider">{h.title}</h3>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] leading-relaxed text-[var(--fg-dim)]/60">{h.desc}</p>
                        </div>
                    </motion.div>
                    ))}
                </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
