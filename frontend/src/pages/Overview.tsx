import { Suspense, useState, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { NeuralSphere } from '@/three/NeuralSphere'
import { Shield, Zap, Lock, Globe, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { fireInitRipple } from '@/components/DashboardLayout'

const TRANSITION = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }

// ──────────────────────── Hyper Button ────────────────────────
function HyperButton({ onClick }: { onClick: () => void }) {
  const [progress, setProgress] = useState(0)
  const [filling, setFilling] = useState(false)
  const [complete, setComplete] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const startFill = () => {
    if (complete) return
    setFilling(true)
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(intervalRef.current!)
          setComplete(true)
          // Fire the ripple from init button centre
          if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect()
            fireInitRipple(r.left + r.width / 2, r.top + r.height / 2)
          }
          setTimeout(onClick, 500)
          return 100
        }
        return p + 5.0   // Fast fill (~0.4s) for high-performance feel
      })
    }, 20)
  }

  const stopFill = () => {
    if (complete) return
    setFilling(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setProgress(0)
  }

  return (
    <motion.button
      ref={btnRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...TRANSITION, delay: 0.8 }}
      onMouseEnter={startFill}
      onMouseLeave={stopFill}
      className="group relative overflow-hidden rounded-2xl border border-primary/30 px-14 py-5 text-sm font-bold tracking-[0.4em] uppercase text-white hover-reactive"
      style={{
        boxShadow: complete
          ? '0 0 60px rgba(0,242,255,0.5)'
          : filling ? '0 0 24px rgba(0,242,255,0.25)' : '0 0 8px rgba(0,242,255,0.1)',
      }}
    >
      {/* Fill bar */}
      <motion.div
        className="absolute inset-0 bg-primary/20"
        style={{ scaleX: progress / 100, originX: 0 }}
      />
      {complete && <div className="absolute inset-0 bg-primary/30 animate-pulse" />}

      <span className="relative z-10 flex items-center gap-4">
        INITIALIZE SYSTEM
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
      </span>
    </motion.button>
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

  return (
    /* z-3 so it sits above Digital Rain (z-1) and noise (z-2) */
    <div className="relative min-h-screen w-full overflow-y-auto bg-transparent will-change-scroll" style={{ zIndex: 3 }}>
      {/* ── 3D Sphere — z-4, renders above rain/noise ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4, transform: 'translateZ(0)' }}>
        <Suspense fallback={null}>
          <Canvas camera={{ position: [0, 0, 14], fov: 60 }}>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.6} color="#00f2ff" />
            <NeuralSphere />
          </Canvas>
        </Suspense>
      </div>

      {/* ── UI cards / content — z-5 ── */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center" style={{ zIndex: 5 }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION, delay: 0.15 }}
          className="mb-10 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-6 py-2.5 backdrop-blur-xl"
        >
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase" style={{ color: '#00f2ff' }}>
            Kernel Link Staged // v3.1 Obsidian
          </span>
        </motion.div>

        {/* Title */}
        <div className="relative px-2">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...TRANSITION, delay: 0.25, duration: 0.8 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              textShadow: '0 0 35px rgba(0,242,255,0.5)',
              color: '#ffffff'
            }}
            className="text-5xl sm:text-7xl md:text-9xl select-none"
          >
            DEEP<span style={{ color: '#00f2ff', fontStyle: 'italic' }}>STEG</span>AI
          </motion.h1>
          {/* depth ghost */}
          <h1
            aria-hidden
            className="absolute inset-0 -z-10 text-5xl sm:text-7xl md:text-9xl text-primary/5 translate-x-[2px] translate-y-[2px] select-none pointer-events-none"
            style={{ fontFamily: '"Geist", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            DEEPSTEGAI
          </h1>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION, delay: 0.45 }}
          className="mt-8 max-w-xl text-base font-bold leading-relaxed uppercase tracking-widest text-white text-shadow-lg"
        >
          Advanced steganography intelligence suite powered by AI forensic analysis.
        </motion.p>

        {/* CTA */}
        <div className="mt-14">
          {!systemInitialized ? (
            <HyperButton onClick={() => setSystemInitialized(true)} />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={TRANSITION}
              className="flex flex-wrap justify-center gap-4 sm:gap-6 px-4"
            >
              <Link to="/embed" className="w-full sm:w-auto lg:cursor-none">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto rounded-2xl bg-primary px-8 sm:px-10 py-4 sm:py-5 text-[10px] sm:text-xs font-black tracking-[0.2em] sm:tracking-[0.4em] text-black shadow-[0_0_20px_rgba(0,242,255,0.3)] uppercase"
                >
                  Enter Embed Node
                </motion.button>
              </Link>
              <Link to="/analyze" className="w-full sm:w-auto lg:cursor-none">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto rounded-2xl border border-white/20 bg-white/5 px-8 sm:px-10 py-4 sm:py-5 text-[10px] sm:text-xs font-black tracking-[0.2em] sm:tracking-[0.4em] text-white uppercase"
                >
                  Scanner Access
                </motion.button>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Post-init content */}
        <AnimatePresence>
          {systemInitialized && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...TRANSITION, delay: 0.3 }}
              className="mt-20 space-y-12"
            >
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 px-4">
                {[
                  { label: 'THREATS NEUTRALIZED', val: '14,204' },
                  { label: 'BANDWIDTH FLOW', val: '89.4 PB' },
                  { label: 'NEURAL ACCURACY', val: '99.8%' },
                  { label: 'STATION STATUS', val: 'ACTIVE' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...TRANSITION, delay: 0.4 + i * 0.07 }}
                    className="glass-panel rounded-2xl px-4 sm:px-8 py-4 sm:py-6 text-center"
                  >
                    <div className="text-xl sm:text-2xl font-black italic tracking-tighter text-primary glow-text">{s.val}</div>
                    <div className="text-[8px] sm:text-[9px] font-bold tracking-[0.2em] sm:tracking-[0.3em] text-white/30 uppercase mt-2">{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl">
                {highlights.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...TRANSITION, delay: 0.55 + i * 0.07 }}
                    whileHover={{
                      y: -5,
                      transition: { duration: 0, ease: "easeOut" }
                    }}
                    className="group flex gap-6 rounded-3xl border border-white/5 bg-black/40 p-8 text-left backdrop-blur-xl hover:bg-white/5 transition-all duration-[400ms]"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-[400ms]">
                      <h.icon className="h-7 w-7 text-white/30 group-hover:text-primary transition-colors duration-[400ms]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black italic tracking-tight text-white">{h.title}</h3>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] leading-relaxed text-white/90">{h.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})
