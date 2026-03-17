import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, Shield, Key, CheckCircle, Copy, AlertTriangle, Lock, X, Mail } from 'lucide-react'

import { stegoApi } from '@/services/api'
import { useStore } from '@/store/useStore'

// ───────────────────── Power Bar Component ─────────────────────
function PowerBar({ progress, active }: { progress: number; active: boolean }) {
  // Weighted easing: fast start, slows near 90%
  const displayPct = Math.round(progress)
  const flickerPct = active
    ? Math.max(0, Math.min(99, displayPct + Math.floor(Math.random() * 4 - 1)))
    : displayPct

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-2 h-20 items-end">
        {[...Array(14)].map((_, i) => {
          const threshold = (i / 13) * 100
          const isActive = active && progress >= threshold
          return (
            <motion.div
              key={i}
              className={`w-2 rounded-sm ${isActive ? 'bg-primary' : 'bg-[var(--border)]'}`}
              animate={{
                height: isActive ? '100%' : '15%',
                boxShadow: isActive ? '0 0 14px var(--primary-glow)' : 'none',
                opacity: isActive ? [0.75, 1, 0.85] : 0.2,
              }}
              transition={isActive ? { repeat: Infinity, duration: 0.35, ease: 'easeInOut' } : { duration: 0.3 }}
            />
          )
        })}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-3xl font-black text-primary tracking-tighter tabular-nums" style={{ textShadow: '0 0 16px var(--primary-glow)' }}>
          {active ? flickerPct : '—'}
        </span>
        {active && <span className="font-mono text-sm font-bold text-primary/60">%</span>}
        <span className="font-mono text-[10px] font-black text-[var(--fg-dim)] tracking-widest ml-2">
          {active ? 'PROCESSING' : 'READY'}
        </span>
      </div>
    </div>
  )
}

export function Embed() {
  const [cover, setCover] = useState<File | null>(null)
  const [secret, setSecret] = useState<File | null>(null)
  const [method, setMethod] = useState<'LSB' | 'Adaptive'>('LSB')
  const [password, setPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ image: string; token?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSharePanel, setShowSharePanel] = useState(false)

  const setStatus = useStore(s => s.setStatus)

  const onDropCover = useCallback((f: File[]) => { setCover(f[0]); setResult(null); setError(null) }, [])
  const onDropSecret = useCallback((f: File[]) => { setSecret(f[0]); setResult(null); setError(null) }, [])

  const { getRootProps: getCoverProps, getInputProps: getCoverInputProps, isDragActive: isCoverActive } = useDropzone({ onDrop: onDropCover, accept: { 'image/*': [] }, multiple: false })
  const { getRootProps: getSecretProps, getInputProps: getSecretInputProps, isDragActive: isSecretActive } = useDropzone({ onDrop: onDropSecret, multiple: false })

  const handleEmbed = async () => {
    if (!cover || !secret) return
    setIsProcessing(true); setStatus('PROCESSING'); setError(null); setProgress(0)
    
    // Weighted progress: fast 0→60, then slow crawl 60→92 (approx 4s)
    let tick = 0
    const timer = setInterval(() => {
      tick += 1
      setProgress(p => {
        if (p < 60) return p + (2.5 + Math.random() * 1.5)    // fast phase
        if (p < 85) return p + (0.6 + Math.random() * 0.5)    // mid phase
        if (p < 92) return p + (0.2 + Math.random() * 0.2)    // crawl phase
        return p
      })
    }, 80)

    const fd = new FormData()
    fd.append('cover', cover); fd.append('secret', secret)
    fd.append('method', method); fd.append('password', password)

    try {
      const res = await stegoApi.embed(fd)
      clearInterval(timer); setProgress(100)
      if (res.data?.image_data) {
        setTimeout(() => {
            setResult({ image: `data:image/png;base64,${res.data.image_data}`, token: res.data.recovery_token })
            setStatus('SECURE')
        }, 400)
      } else { setError('Protocol Mismatch.'); setStatus('READY') }
    } catch (e: any) {
      clearInterval(timer)
      setError(e?.response?.data?.error || e?.message || 'Synthesis aborted.')
      setStatus('READY')
    } finally { setIsProcessing(false) }
  }

  const handleGmailShare = () => {
    if (!result) return
    // Trigger file download first so the user can attach it
    const link = document.createElement('a')
    link.href = result.image
    link.download = 'deep_container.png'
    link.click()
    // Build the email body including the encryption key (if set)
    const keyLine = password
      ? `Encryption Key (AES-256 Key): ${password}`
      : 'Encryption Key (AES-256 Key): (No password was set for this container)'
    const subject = encodeURIComponent('DeepStegAI — Stego Container')
    const body = encodeURIComponent(
      `Hello,

I am sharing a steganography container generated using DeepStegAI.

⚠️ Important Notice:
This PNG file contains embedded hidden data. To preserve the hidden payload, please download and save the file exactly as received. Avoid sharing it in applications that may automatically recompress or modify the image.

Before sending this email, please attach the downloaded file (deep_container.png) to ensure the container is delivered correctly.

${keyLine}

Best regards,
DeepStegAI`
    )
    window.open(`https://mail.google.com/mail/?view=cm&su=${subject}&body=${body}`, '_blank')
  }

  return (
    <div className={`h-full flex flex-col gap-2 max-w-6xl mx-auto ${window.innerWidth > 768 ? 'cursor-none' : 'cursor-auto'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-2 sm:px-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase text-[var(--fg)] glow-text leading-none">Synthesis Hub</h2>
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase mt-1 text-[var(--fg-dim)]">Steganographic Injection Node</p>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-[var(--fg-dim)]">Security Clearance:</span>
            <span className="px-3 py-1 bg-primary/20 border border-primary/40 text-primary text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_10px_var(--primary-glow)]">Level-04</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0 overflow-y-auto lg:overflow-hidden pb-4 lg:pb-0">
        {/* Input Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-4 space-y-3 flex flex-col min-h-0 overflow-y-auto">
          {/* Cover dropzone */}
          <div {...getCoverProps()} className={`relative h-24 sm:h-28 border border-dashed rounded-2xl flex items-center justify-center transition-all lg:cursor-none ${isCoverActive ? 'border-primary bg-primary/10' : 'border-[var(--border)] bg-[var(--bg-sidebar)] hover:border-primary/40'}`}>
            <input {...getCoverInputProps()} />
            {cover ? (
                <div className="text-center group w-full h-full flex flex-col items-center justify-center relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCover(null); }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-500 hover:text-white hover:bg-red-500 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)] z-10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-primary mb-2" />
                    <p className="text-[9px] sm:text-[10px] font-black text-[var(--fg)] italic truncate max-w-[150px] sm:max-w-[200px] px-4 uppercase">{cover.name}</p>
                </div>
            ) : (
                <div className="text-center">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-[var(--fg-dim)]" />
                    <p className="text-[10px] sm:text-xs font-bold tracking-widest uppercase italic text-[var(--fg-dim)]">Drop Cover Image</p>
                </div>
            )}
          </div>

          {/* Secret dropzone */}
          <div {...getSecretProps()} className={`relative h-12 border border-dashed rounded-xl flex items-center justify-center transition-all lg:cursor-none ${isSecretActive ? 'border-[var(--fg-dim)] bg-[var(--glass-bg)]' : 'border-[var(--border)] bg-[var(--bg-sidebar)] hover:border-[var(--fg-dim)]'}`}>
            <input {...getSecretInputProps()} />
            {secret ? (
                <div className="flex items-center gap-3 px-6 w-full h-full relative">
                    <File className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                    <span className="text-[9px] sm:text-[10px] font-black text-[var(--fg)] truncate max-w-[150px] sm:max-w-[180px] uppercase italic">{secret.name}</span>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSecret(null); }}
                      className="ml-auto p-1 rounded-full text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 sm:gap-3"><Key className="h-4 w-4 text-[var(--fg-dim)]" /><p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest italic text-[var(--fg-dim)]">Stage Payload</p></div>
            )}
          </div>

          {/* Config */}
          <div className="grid grid-cols-2 gap-3">
            {(['LSB', 'Adaptive'] as const).map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className={`py-2.5 rounded-xl text-[10px] font-black tracking-[0.3em] uppercase transition-all border ${method === m ? 'bg-primary/20 border-primary/50 text-primary glow-text' : 'bg-[var(--bg-sidebar)] border-[var(--border)] text-[var(--fg-dim)] hover:text-[var(--fg)]'}`}
              >
                {m} PROTOCOL
              </button>
            ))}
          </div>

          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-dim)] group-focus-within:text-primary transition-colors" />
            <input type="password" placeholder="AES_256_KEY"
              className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl py-3 pl-14 pr-6 text-xs font-bold tracking-[0.3em] focus:outline-none focus:border-primary/40 transition-all font-mono text-[var(--fg)] placeholder:text-[var(--fg-dim)]"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button disabled={!cover || !secret || isProcessing} onClick={handleEmbed}
            className="w-full bg-primary text-black font-bold tracking-[0.2em] sm:tracking-[0.4em] text-[10px] uppercase rounded-2xl py-3 shadow-[0_0_30px_var(--primary-glow)] hover:opacity-90 hover:shadow-[0_0_50px_var(--primary-glow)] transition-all active:scale-[0.98] disabled:opacity-30 lg:cursor-none"
          >
            {isProcessing ? 'SYNTHESIZING...' : 'EXECUTE INJECTION'}
          </button>
        </div>

        {/* Output Area */}
        <div className="flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 glass-panel rounded-3xl flex flex-col items-center justify-center p-6 text-center border-dashed border-white/10">
                <PowerBar progress={progress} active={isProcessing} />
                {!isProcessing && (
                    <div className="mt-10">
                        <Shield className="h-12 w-12 mx-auto text-[var(--fg-dim)]/20 mb-6" />
                        <h3 className="text-base font-black italic tracking-tighter text-[var(--fg-dim)]/30 uppercase mb-2">Node Standby</h3>
                        <p className="text-[9px] text-[var(--fg-dim)]/20 font-black uppercase tracking-[0.3em] max-w-[200px] leading-loose">Waiting for asset synchronization and synthesis command.</p>
                    </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="relative glass-panel rounded-3xl p-4 flex-1 flex flex-col min-h-0 border-primary/20 bg-primary/[0.02]">
                    <div className="absolute top-4 right-4 z-10 px-4 py-1.5 bg-primary rounded-full text-[9px] font-black uppercase text-black">SYNTHESIS_SUCCESS</div>
                    <div className="flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-[var(--bg-sidebar)] mt-10">
                        <img src={result.image} alt="Stego" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>

                {result.token && (
                  <div className="glass-panel rounded-2xl p-5 border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between mb-3 text-[9px] font-black uppercase tracking-[0.4em] text-primary">
                      <span>Recovery Signature</span>
                      <button onClick={() => navigator.clipboard.writeText(result.token!)} className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="bg-[var(--bg-sidebar)] rounded-xl p-3 font-mono text-[10px] break-all text-primary/80">{result.token}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {/* Primary row: Download + Share toggle */}
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={result.image}
                      download="deep_container.png"
                      className="bg-[var(--fg)] text-[var(--bg)] font-black tracking-[0.2em] text-[10px] uppercase rounded-2xl py-4 text-center transition-all hover:opacity-90 active:scale-[0.98] shadow-2xl glitch-hover"
                    >
                      Download
                    </a>

                    <button
                      onClick={() => setShowSharePanel(p => !p)}
                      className={`flex items-center justify-center gap-2 font-black tracking-[0.2em] text-[10px] uppercase rounded-2xl py-4 transition-all active:scale-[0.98] border ${
                        showSharePanel
                          ? 'bg-primary/30 border-primary/60 text-primary'
                          : 'bg-primary/20 border-primary/40 text-primary hover:bg-primary/30'
                      }`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Share via Gmail
                    </button>
                  </div>

                  {/* Expandable share panel */}
                  <AnimatePresence>
                    {showSharePanel && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-3 pt-1">
                          {/* Compression Warning — only visible when panel is open */}
                          <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3">
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold text-yellow-400/90 tracking-wider leading-relaxed">
                              <span className="font-black text-yellow-300">WhatsApp</span> compresses images and destroys hidden data.
                              Always share as a <span className="text-yellow-300 font-black">Document</span>, or use{' '}
                              <span className="text-yellow-300 font-black">Email</span> for full integrity.
                            </p>
                          </div>

                          {/* Gmail — only option */}
                          <button
                            onClick={handleGmailShare}
                            className="w-full flex items-center justify-center gap-2 font-black tracking-[0.15em] text-[10px] uppercase rounded-2xl py-3.5 transition-all active:scale-[0.98] border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Open Gmail &amp; Download File
                          </button>

                          <p className="text-[8px] text-[var(--fg-dim)] font-bold uppercase tracking-widest text-center">
                            File auto-downloads — attach it in the Gmail compose window
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
