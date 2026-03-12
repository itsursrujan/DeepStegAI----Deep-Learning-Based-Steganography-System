import { useState, useCallback, Suspense } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { Scanner3D } from '@/three/Scanner3D'
import { Search, Activity, BarChart } from 'lucide-react'
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
              className={`w-1.5 rounded-sm ${isActive ? 'bg-primary' : 'bg-white/5'}`}
              animate={{
                height: isActive ? '100%' : '18%',
                boxShadow: isActive ? '0 0 10px #00f2ff' : 'none',
                opacity: isActive ? [0.75, 1, 0.8] : 0.2,
              }}
              transition={isActive ? { repeat: Infinity, duration: 0.3, ease: 'easeInOut' } : { duration: 0.3 }}
            />
          )
        })}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-xl font-black text-primary" style={{ textShadow: '0 0 12px rgba(0,242,255,0.7)' }}>
          {active ? flickerPct : '—'}
        </span>
        {active && <span className="font-mono text-xs font-bold text-primary/60">%</span>}
        <span className="font-mono text-[9px] font-black text-white/20 tracking-widest ml-1">
          {active ? 'SCANNING' : 'STANDBY'}
        </span>
      </div>
    </div>
  )
}


export function Analyze() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any | null>(null)
  const setStatus = useStore(state => state.setStatus)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null); setProgress(0)
  }, [])

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: false })

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
    <div className="h-full flex flex-col gap-4 max-w-7xl mx-auto overflow-hidden cursor-none">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white glow-text leading-none">Forensic Scanner</h2>
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase mt-2 text-white/90">AI Neural Inspection Node</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Main Scanner */}
        <div className="xl:col-span-3 flex flex-col gap-4 min-h-0">
          <div className="glass-panel rounded-3xl overflow-hidden flex-1 relative bg-black/60">
            <Suspense fallback={null}>
              <Canvas camera={{ position: [0, 0, 15] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00f2ff" />
                <Scanner3D image={preview || undefined} scanning={isScanning} />
              </Canvas>
            </Suspense>

            {!preview && (
              <div {...getRootProps()} className="absolute inset-4 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center transition-all hover:bg-white/[0.04] group">
                <input {...getInputProps()} />
                <Search className="h-10 w-10 mb-4 text-white" />
                <p className="text-base font-bold italic tracking-tighter uppercase text-white">Stage Carrier for Scan</p>
              </div>
            )}


            {preview && !result && !isScanning && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                  <button onClick={handleScan} className="bg-primary hover:bg-primary/90 text-black px-12 py-4 rounded-2xl font-bold tracking-[0.2em] text-xs uppercase shadow-[0_0_30px_rgba(0,242,255,0.3)] transition-all active:scale-95">
                    Execute Deep Scan
                  </button>
              </div>
            )}

            {isScanning && (
                <div className="absolute top-8 left-8">
                    <PowerBar progress={progress} active={true} />
                </div>
            )}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-6 bg-black/60 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div>
                        <h4 className="text-[9px] font-black tracking-[0.3em] uppercase mb-2 text-white/80">Verdict</h4>
                        <div className={`px-6 py-2 rounded-full border text-xs font-black tracking-[0.3em] italic uppercase ${result.verdict === 'CLEAN' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}>
                            {result.verdict}
                        </div>
                    </div>
                    <div className="h-12 w-px bg-white/5" />
                    <div className="min-w-[200px]">
                        <div className="flex justify-between items-end mb-2">
                             <span className="text-[9px] font-black tracking-[0.2em] uppercase text-white/70">Neural Confidence</span>
                             <span className="text-sm font-mono font-black text-primary">{(result.ai_analysis.score * 100).toFixed(2)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${result.ai_analysis.score * 100}%` }} transition={{ duration: 1 }} className={`h-full ${result.ai_analysis.score > 0.5 ? 'bg-red-500' : 'bg-primary'}`} />
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/5">
                        <p className="text-[8px] font-black text-white/10 uppercase mb-1 tracking-widest">Heuristic Probe</p>
                        <p className="text-[10px] font-bold text-white/50 italic">{result.description}</p>
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4 flex flex-col min-h-0">
          <div className="glass-panel rounded-3xl p-6 bg-black/60">
            <h4 className="text-[10px] font-black tracking-[0.4em] text-white/30 uppercase mb-6 flex items-center gap-2 italic">
              <Activity className="h-4 w-4 text-primary" /> System Node
            </h4>
            <div className="space-y-4">
              {[
                { label: 'AI CORE', val: 'V4.2_ONLINE', color: 'text-primary' },
                { label: 'GPU MAPPING', val: 'STABLE', color: 'text-primary' },
                { label: 'CALIBRATION', val: 'OPTIMAL', color: 'text-green-500' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] pb-3 border-b border-white/10 last:border-0 last:pb-0">
                   <span className="font-bold uppercase tracking-widest text-white/70">{item.label}</span>
                  <span className={`${item.color} font-mono font-black`}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 bg-black/60 flex-1 flex flex-col min-h-0">
            <h4 className="text-[10px] font-black tracking-[0.4em] text-white/30 uppercase mb-6 flex items-center gap-2 italic">
              <BarChart className="h-4 w-4 text-accent" /> Distribution
            </h4>
            <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
                <p className="text-[11px] text-white/20 font-bold italic leading-relaxed uppercase tracking-widest">
                    Entropy analysis tracking pixel-variance in high-frequency regions. Neural weights adjusted for LSB-Adaptive vectors.
                </p>
                <div className="flex-1 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center justify-center p-6 text-center">
                    <div className="space-y-4 w-full">
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-primary/40 w-[70%]" /></div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-accent/40 w-[40%]" /></div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-white/10 w-[20%]" /></div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
