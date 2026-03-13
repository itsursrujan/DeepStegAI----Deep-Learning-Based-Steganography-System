import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Shield, FileDown, AlertTriangle, CheckCircle, Lock, X } from 'lucide-react'
import { stegoApi } from '@/services/api'
import { useStore } from '@/store/useStore'

function PowerBar({ progress, active }: { progress: number; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-1.5 h-16 items-end">
        {[...Array(12)].map((_, i) => {
          const threshold = (i / 11) * 100
          const isActive = active && progress >= threshold
          return (
            <motion.div
              key={i}
              className={`w-1.5 rounded-sm transition-all duration-300 ${isActive ? 'bg-primary shadow-[0_0_12px_#00f2ff]' : 'bg-white/5'}`}
              animate={{ height: isActive ? '100%' : '20%', opacity: isActive ? [0.7, 1, 0.8] : 0.3 }}
              transition={isActive ? { repeat: Infinity, duration: 0.2 } : {}}
            />
          )
        })}
      </div>
      <div className="font-mono text-2xl font-black text-primary tracking-tighter tabular-nums">
        {active ? `${progress.toFixed(0)}%` : 'READY'}
      </div>
    </div>
  )
}

export function Extract() {
  const [stego, setStego] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const setStatus = useStore(s => s.setStatus)

  const onDrop = useCallback((f: File[]) => { setStego(f[0]); setError(null); setIsSuccess(false); setProgress(0) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: false })

  const handleExtract = async () => {
    if (!stego) return
    setIsProcessing(true); setStatus('PROCESSING'); setError(null); setIsSuccess(false); setProgress(0)
    
    const timer = setInterval(() => {
        setProgress(p => (p < 95 ? p + Math.random() * 8 : p))
    }, 150)

    const fd = new FormData()
    fd.append('stego', stego); fd.append('password', password); fd.append('recovery_token', token)
    
    try {
      const res = await stegoApi.extract(fd)
      clearInterval(timer); setProgress(100)
      
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      const cd = res.headers['content-disposition']
      let filename = 'extracted_payload.bin'
      if (cd) { const m = cd.match(/filename=["']?([^"';\r\n]+)["']?/); if (m) filename = m[1] }
      link.setAttribute('download', filename)
      document.body.appendChild(link); link.click(); link.remove()
      window.URL.revokeObjectURL(url)
      
      setTimeout(() => {
          setIsSuccess(true); setStatus('SECURE')
      }, 500)
    } catch (e: any) {
      clearInterval(timer)
      setError(e?.response?.data?.error || e?.message || 'Extraction aborted.')
      setStatus('READY')
    } finally { setIsProcessing(false) }
  }

  return (
    <div className={`h-full flex flex-col gap-6 max-w-3xl mx-auto ${window.innerWidth > 768 ? 'cursor-none' : 'cursor-auto'}`}>
      <div className="text-center px-2">
        <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-white glow-text leading-none">Payload Decryption</h2>
        <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase mt-2 text-white/90">Steganographic Forensic Node</p>
      </div>

      <div className="flex-1 glass-panel rounded-3xl p-8 space-y-6 flex flex-col min-h-0 overflow-y-auto">
        {/* Drop zone */}
        <div {...getRootProps()} className={`relative h-36 sm:h-44 border border-dashed rounded-3xl flex flex-col items-center justify-center transition-all lg:cursor-none ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/10 bg-black/40 hover:border-primary/40'}`}>
          <input {...getInputProps()} />
          <AnimatePresence mode="wait">
            {stego ? (
                <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center px-4 relative w-full h-full flex flex-col items-center justify-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setStego(null); }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-500 hover:text-white hover:bg-red-500 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)] z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <p className="text-xs sm:text-sm font-black italic text-white uppercase tracking-tighter truncate max-w-[250px]">{stego.name}</p>
                    <p className="text-[8px] sm:text-[9px] text-primary font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2">Container Validated ✓</p>
                </motion.div>
            ) : (
                <motion.div key="empty" className="text-center px-4">
                    <Upload className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-4 text-white/40" />
                    <p className="text-sm sm:text-base font-bold italic uppercase tracking-tighter text-white/60">Load Stego Image</p>
                    <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.2em] mt-2 font-bold text-white/30 text-center">Industrial Carrier Recognition Active</p>
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-primary transition-colors" />
                <input type="password" placeholder="MASTER_KEY"
                    className="w-full bg-black/60 border border-white/20 rounded-2xl py-4 pl-14 pr-6 text-xs font-bold tracking-[0.3em] focus:outline-none focus:border-primary/40 transition-all font-mono text-white placeholder:text-white/40"
                    value={password} onChange={e => setPassword(e.target.value)}
                />
            </div>
            <div className="relative group">
                <Shield className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-primary transition-colors" />
                <input type="text" placeholder="RECOVERY_TOKEN"
                    className="w-full bg-black/60 border border-white/20 rounded-2xl py-4 pl-14 pr-6 text-xs font-bold tracking-[0.3em] focus:outline-none focus:border-primary/40 transition-all font-mono text-white placeholder:text-white/40"
                    value={token} onChange={e => setToken(e.target.value)}
                />
            </div>
        </div>

        {/* Progress / Status */}
        <div className="flex-1 flex flex-col items-center justify-center py-4">
            <AnimatePresence mode="wait">
                {isProcessing ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <PowerBar progress={progress} active={true} />
                    </motion.div>
                ) : isSuccess ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 bg-primary/10 border border-primary/30 rounded-2xl p-6">
                        <CheckCircle className="h-10 w-10 text-primary" />
                        <div>
                            <p className="text-sm font-black italic uppercase text-primary">Decryption Complete</p>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Payload Extracted From Carrier</p>
                        </div>
                    </motion.div>
                ) : error ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-5 w-full">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">Extraction Error</p>
                            <p className="text-xs font-bold text-red-500/80 leading-relaxed uppercase">{error}</p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="text-center opacity-10">
                         <FileDown className="h-10 w-10 mx-auto mb-2" />
                         <span className="text-[9px] font-black tracking-[0.4em] uppercase">Engine Initialized</span>
                    </div>
                )}
            </AnimatePresence>
        </div>

        <button disabled={!stego || isProcessing} onClick={handleExtract}
          className="w-full bg-primary text-black font-bold tracking-[0.2em] sm:tracking-[0.4em] text-[10px] uppercase rounded-2xl py-4 sm:py-5 shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-30 lg:cursor-none"
        >
          {isProcessing ? 'DECRYPTING...' : 'INITIALIZE RECOVERY'}
        </button>
      </div>
    </div>
  )
}
