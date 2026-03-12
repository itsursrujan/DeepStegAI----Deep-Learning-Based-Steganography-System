import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useSpring } from 'framer-motion'
import {
  Layers, Terminal, Download, Upload,
  Settings, Menu, X, Activity, Cpu, ShieldCheck,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { DigitalRain } from '@/components/DigitalRain'

const TRANSITION = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }

const navItems = [
  { path: '/', label: 'Overview', icon: Activity },
  { path: '/embed', label: 'Embed Data', icon: Upload },
  { path: '/extract', label: 'Extract Data', icon: Download },
  { path: '/analyze', label: 'AI Detection', icon: ShieldCheck },
  { path: '/batch', label: 'Batch Operations', icon: Layers },
  { path: '/admin', label: 'Command Shell', icon: Terminal },
]

const TOOL_PATHS = ['/embed', '/extract', '/analyze', '/batch', '/admin']

// ─────────────────────── Global Cursor ───────────────────────
// Ripple is exposed via a global event so Overview's init button can fire it
export function fireInitRipple(x: number, y: number) {
  window.dispatchEvent(new CustomEvent('init-ripple', { detail: { x, y } }))
}

function GlobalCursor() {
  const mouseX = useSpring(0, { stiffness: 150, damping: 25 })
  const mouseY = useSpring(0, { stiffness: 150, damping: 25 })
  const [hovered, setHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  // Listen for init-ripple custom event (only INITIALIZE SYSTEM)
  useEffect(() => {
    const onInitRipple = (e: Event) => {
      const { x, y } = (e as CustomEvent).detail
      setRipples(prev => [...prev.slice(-3), { id: Date.now(), x, y }])
    }
    window.addEventListener('init-ripple', onInitRipple)
    return () => window.removeEventListener('init-ripple', onInitRipple)
  }, [])

  useEffect(() => {
    const move = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY) }
    const onDown = () => setIsClicked(true)
    const onUp   = () => setIsClicked(false)
    const onEnter = (e: Event) => {
      const el = e.currentTarget as Element
      // Only scale cursor for specific marked elements or standard interactive if we want
      // User says "only at start... and nothing else" pointing to restricting effects.
      if (el.classList.contains('hover-reactive'))
        setHovered(true)
    }
    const onLeave = () => setHovered(false)

    window.addEventListener('mousemove', move)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)

    const wire = () => {
      document.querySelectorAll('button, a, input, select, textarea, [role="button"]').forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }
    wire()
    const obs = new MutationObserver(wire)
    obs.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      obs.disconnect()
    }
  }, [mouseX, mouseY])

  return (
    <>
      {/* Ripple — only from init button */}
      <AnimatePresence>
        {ripples.map(r => (
          <motion.div
            key={r.id}
            initial={{ opacity: 1, scale: 0.4, x: r.x, y: r.y, translateX: '-50%', translateY: '-50%' }}
            animate={{ opacity: 0, scale: 5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => setRipples(p => p.filter(i => i.id !== r.id))}
            className="pointer-events-none fixed top-0 left-0 z-[10001] h-12 w-12 rounded-full border border-primary"
          />
        ))}
      </AnimatePresence>

      {/* Ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[10000] rounded-full border-primary mix-blend-screen"
        style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width:  hovered ? 52 : 28,
          height: hovered ? 52 : 28,
          borderWidth: hovered ? 2 : 1,
          boxShadow: hovered ? '0 0 18px rgba(0,242,255,0.6)' : 'none',
          opacity: 1,
        }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      />

      {/* Dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[10000] rounded-full bg-primary shadow-[0_0_8px_rgba(0,242,255,0.9)]"
        style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
        animate={{ width: isClicked ? 3 : 5, height: isClicked ? 3 : 5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      />
    </>
  )
}

// ─────────────────────── Layout ───────────────────────
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const status   = useStore(s => s.status)
  const systemInitialized = useStore(s => s.systemInitialized)
  const [pulseColor, setPulseColor] = useState<string | null>(null)

  const isToolPage = TOOL_PATHS.includes(location.pathname)

  const getStatusStyle = useCallback(() => {
    switch (status) {
      case 'ANALYZING':   return { color: 'text-primary',    hex: '#00f2ff' }
      case 'COMPROMISED': return { color: 'text-red-500',    hex: '#ef4444' }
      case 'SECURE':      return { color: 'text-green-400',  hex: '#4ade80' }
      case 'PROCESSING':  return { color: 'text-amber-400',  hex: '#fbbf24' }
      default:            return { color: 'text-white/40',   hex: 'transparent' }
    }
  }, [status])

  useEffect(() => {
    if (status !== 'READY') {
      const { hex } = getStatusStyle()
      setPulseColor(hex)
      const t = setTimeout(() => setPulseColor(null), 900)
      return () => clearTimeout(t)
    }
  }, [status])

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white relative cursor-none select-none">
      {/* ── Layer 1: Digital Rain (z-1) ── */}
      <DigitalRain />

      {/* ── Layer 2: Noise overlay (z-2) ── */}
      <div className="noise-overlay" style={{ zIndex: 2 }} />

      {/* ── Global Cursor (z-10000) ── */}
      <GlobalCursor />

      {/* ── Viewport Edge Status Pulse ── */}
      <AnimatePresence>
        {pulseColor && (
          <motion.div
            key={pulseColor}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, boxShadow: `inset 0 0 80px ${pulseColor}` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none fixed inset-0 z-[9999]"
          />
        )}
      </AnimatePresence>

      {/* ── Landing mode (before boot) ── */}
      {!systemInitialized ? (
        <main className="relative flex-1 overflow-hidden" style={{ zIndex: 3 }}>
          {children}
        </main>
      ) : (
        <>
          {/* ── Sidebar (z-20) ── */}
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1, width: isSidebarOpen ? 256 : 76 }}
            transition={TRANSITION}
            className="relative flex flex-col shrink-0 border-r border-white/5 bg-black/60 backdrop-blur-3xl"
            style={{ zIndex: 20 }}
          >
            {/* Logo — always navigates to / */}
            <div className="flex h-16 items-center px-5 border-b border-white/5">
              <Link to="/" className="flex items-center gap-4 group cursor-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(0,242,255,0.15)] group-hover:shadow-[0_0_25px_rgba(0,242,255,0.4)] transition-all">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.2 }}
                      className="text-lg font-black tracking-tighter glow-text whitespace-nowrap"
                    >
                      DEEP<span className="text-primary italic">STEG</span>AI
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 p-3 mt-3 overflow-hidden">
              {navItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-200 group cursor-none ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,242,255,0.1)]'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-white'}`} />
                    <AnimatePresence>
                      {isSidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-sm font-black tracking-[0.15em] uppercase italic whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                )
              })}
            </nav>

            {/* Collapse */}
            <div className="p-3 border-t border-white/5">
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="flex w-full items-center justify-center rounded-2xl py-3 border border-white/5 bg-white/5 text-white/30 hover:text-white hover:border-white/20 transition-all cursor-none"
              >
                {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </motion.aside>

          {/* ── Main ── */}
          <main className="relative flex flex-col flex-1 min-w-0 overflow-hidden" style={{ zIndex: 10 }}>
            {/* Tool header */}
            {isToolPage && (
              <header className="flex h-14 shrink-0 items-center justify-between px-8 bg-black/50 backdrop-blur-2xl border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`h-1.5 w-1.5 rounded-full bg-current animate-pulse ${getStatusStyle().color}`} />
                  <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase italic text-white/90">
                    {navItems.find(i => i.path === location.pathname)?.label}
                  </h2>
                </div>
                <div className="flex items-center gap-6">
                  <span className={`text-[10px] font-mono font-black tracking-widest ${getStatusStyle().color}`}>
                    SYS_{status}
                  </span>
                  <div className="h-6 w-px bg-white/10" />
                  <button className="text-white/25 hover:text-white transition-colors cursor-none">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </header>
            )}

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={TRANSITION}
                  className={`h-full ${isToolPage ? 'p-6' : ''}`}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </>
      )}
    </div>
  )
}
