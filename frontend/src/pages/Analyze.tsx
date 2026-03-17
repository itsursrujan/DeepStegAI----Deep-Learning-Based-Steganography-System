import { useState, useCallback, Suspense, useEffect, memo } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { Scanner3D } from '@/three/Scanner3D'
import { Search, Activity, BarChart, X } from 'lucide-react'
import { stegoApi } from '@/services/api'
import { useStore } from '@/store/useStore'

// ───────────────────────── Power Bar ─────────────────────────
function PowerBar({ progress, active }: { progress: number; active: boolean }) {
  const displayPct = Math.round(progress)
  const flickerPct = active
    ? Math.max(0, Math.min(99, displayPct + Math.floor(Math.random() * 4 - 1)))
    : displayPct

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1.5 h-14 items-end">
        {[...Array(12)].map((_, i) => {
          const threshold = (i / 11) * 100
          const isActive = active && progress >= threshold
          return (
            <motion.div
              key={i}
              className={`w-1.5 rounded-sm ${isActive ? 'bg-primary' : 'bg-[var(--border)]'}`}
              animate={{
                height: isActive ? '100%' : '18%',
                boxShadow: isActive ? '0 0 10px var(--primary-glow)' : 'none',
                opacity: isActive ? [0.75, 1, 0.8] : 0.2,
              }}
              transition={isActive ? { repeat: Infinity, duration: 0.3, ease: 'easeInOut' } : { duration: 0.3 }}
            />
          )
        })}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-xl font-black text-primary" style={{ textShadow: '0 0 12px var(--primary-glow)' }}>
          {active ? flickerPct : '—'}
        </span>
        {active && <span className="font-mono text-xs font-bold text-primary/60">%</span>}
        <span className="font-mono text-[9px] font-black text-[var(--fg-dim)] tracking-widest ml-1">
          {active ? 'SCANNING' : 'STANDBY'}
        </span>
      </div>
    </div>
  )
}


export const Analyze = memo(function Analyze() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any | null>(null)
  const setStatus = useStore(state => state.setStatus)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024)

  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth > 1024)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null); setProgress(0)
  }, [])

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: false })

  const handleClear = () => {
    setImage(null)
    setPreview(null)
    setResult(null)
    setIsScanning(false)
    setProgress(0)
    setStatus('READY')
  }

  const handleScan = async () => {
    if (!image) return
    setIsScanning(true); setStatus('ANALYZING'); setProgress(0)
    
    // Weighted progress: 3-5s neural scan simulation
    const timer = setInterval(() => {
        setProgress(p => {
          if (p < 55) return p + (2.0 + Math.random() * 1.5)   // fast start
          if (p < 80) return p + (0.5 + Math.random() * 0.5)   // decel
          if (p < 93) return p + (0.15 + Math.random() * 0.2)  // crawl
          return p
        })
    }, 100)

    const formData = new FormData()
    formData.append('image', image)

    try {
      const res = await stegoApi.analyze(formData)
      clearInterval(timer); setProgress(100)
      setTimeout(() => {
          setResult(res.data)
          setStatus(res.data.detected ? 'COMPROMISED' : 'SECURE')
      }, 500)
    } catch (err) {
      clearInterval(timer); setStatus('READY')
    } finally { setIsScanning(false) }
  }

  return (
    <div className={`h-full flex flex-col gap-2 max-w-7xl mx-auto ${isDesktop ? 'overflow-hidden cursor-none' : 'overflow-y-auto cursor-auto'}  `}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full">
            <div>
              <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase text-[var(--fg)] glow-text leading-none">Forensic Scanner</h2>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase mt-1 text-[var(--fg-dim)]">AI Neural Inspection Node</p>
            </div>
            {preview && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleClear}
                className="mt-4 sm:mt-0 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Search className="h-3 w-3 rotate-45" /> Reset Scanner Node
              </motion.button>
            )}
        </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-5 gap-3 overflow-y-auto md:overflow-hidden pb-4 md:pb-0 pt-2">
        {/* LEFT PANEL (60%) */}
        <div className="md:col-span-3 flex flex-col gap-6 min-h-0 order-2 md:order-1">
          {!preview && (
            <div {...getRootProps()} className="lg:cursor-none">
              <input {...getInputProps()} />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--bg-card)] border border-dashed border-[var(--border)] rounded-3xl p-6 flex flex-col items-center justify-center transition-all hover:bg-[var(--fg)]/[0.04] group min-h-[120px]"
              >
                <Search className="h-10 w-10 mb-4 text-[var(--fg-dim)]" />
                <p className="text-sm font-bold tracking-widest uppercase text-[var(--fg-dim)]">Stage Carrier for Scan</p>
              </motion.div>
            </div>
          )}

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl overflow-hidden min-h-[180px] md:min-h-0 flex-1 relative">
            {preview && (
              <button 
                onClick={handleClear}
                className="absolute top-4 right-4 z-[100] p-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-500 hover:text-white hover:bg-red-500 transition-all lg:cursor-none shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Suspense fallback={null}>
              <Canvas camera={{ position: [0, 0, 15] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00f2ff" />
                <Scanner3D image={preview || undefined} scanning={isScanning} />
              </Canvas>
            </Suspense>

            {isScanning && (
                <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
                    <PowerBar progress={progress} active={true} />
                </div>
            )}
          </div>

          {preview && !result && !isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
                <button onClick={handleScan} className="bg-primary hover:opacity-90 text-black px-12 py-4 rounded-2xl font-bold tracking-[0.2em] text-[10px] uppercase shadow-[0_0_30px_var(--primary-glow)] transition-all active:scale-95 lg:cursor-none w-full sm:w-auto">
                  Execute Deep Scan
                </button>
            </motion.div>
          )}
        </div>

        {/* RIGHT PANEL (40%) */}
        <div className="md:col-span-2 flex flex-col justify-center gap-6 min-h-0 order-1 md:order-2">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                 className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-4 space-y-4"
              >
                <div>
                  <h4 className="text-[9px] font-black tracking-[0.3em] uppercase mb-4 text-[var(--fg-dim)]/50">Forensic Verdict</h4>
                  <div className={`px-6 py-3 rounded-2xl border text-xs font-black tracking-[0.2em] italic uppercase text-center transition-all duration-500 ${
                    !result.detected
                    ? 'bg-[#00FF9C]/10 border-[#00FF9C]/30 text-[#00FF9C] shadow-[0_0_20px_rgba(0,255,156,0.1)]'
                    : 'bg-[#FF3B3B]/10 border-[#FF3B3B]/30 text-[#FF3B3B] shadow-[0_0_20px_rgba(255,59,59,0.2)]'
                  }`}>
                      {result.detected ? 'PAYLOAD DETECTED' : 'CLEAN ASSET'}
                  </div>
                </div>

                <div className="h-px bg-[var(--border)]" />

                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase text-[var(--fg-dim)]/70">Neural Confidence</span>
                    <span className={`text-sm font-mono font-black ${result.detected ? 'text-[#FF3B3B]' : 'text-[#00FF9C]'}`}>
                      {(result.ai_analysis.score * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.ai_analysis.score * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${result.detected ? 'bg-[#FF3B3B]' : 'bg-[#00FF9C]'}`}
                      />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--fg)]/[0.03] border border-[var(--border)]">
                  <p className="text-[8px] font-black text-[var(--fg-dim)]/20 uppercase mb-2 tracking-widest">Heuristic Analysis</p>
                  <p className={`text-[10px] font-bold italic leading-relaxed ${result.detected ? 'text-[#FF3B3B]' : 'text-[var(--fg-dim)]'}`}>
                    {result.detected ? "High-entropy signature detected in high-frequency spectral regions. Evidence of LSB-Adaptive manipulation." : "No significant pixel-variance detected. Statistics align with natural image distribution."}
                  </p>
                </div>
              </motion.div>
            ) : (
                <div className="space-y-4">
                  <div className="glass-panel rounded-3xl p-4 bg-[var(--bg-sidebar)]">
                    <h4 className="text-[10px] font-black tracking-[0.4em] text-[var(--fg-dim)]/30 uppercase mb-6 flex items-center gap-2 italic">
                      <Activity className="h-4 w-4 text-primary" /> System Node
                    </h4>
                    <div className="space-y-4">
                      {[
                        { label: 'AI CORE', val: 'V4.2_ONLINE', color: 'text-primary' },
                        { label: 'CALIBRATION', val: 'OPTIMAL', color: 'text-[#00FF9C]' },
                        { label: 'THREAT DB', val: 'SYNCED', color: 'text-primary' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] pb-3 border-b border-[var(--border)] last:border-0 last:pb-0">
                           <span className="font-bold uppercase tracking-widest text-[var(--fg-dim)]/70">{item.label}</span>
                          <span className={`${item.color} font-mono font-black`}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-4">
                    <h4 className="text-[10px] font-black tracking-[0.4em] text-[var(--fg-dim)]/30 uppercase mb-6 flex items-center gap-2 italic">
                      <BarChart className="h-4 w-4 text-accent" /> Monitoring
                    </h4>
                    <p className="text-[10px] text-[var(--fg-dim)]/20 font-bold italic leading-relaxed uppercase tracking-widest leading-relaxed">
                        Awaiting carrier analysis. Forensic node operating at full spectral capacity.
                    </p>
                  </div>
                </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
})
