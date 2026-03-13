import { useEffect, useRef } from 'react'

const HEX_CHARS = '0123456789ABCDEF01'
const FONT_SIZE = 13
const COLUMN_WIDTH = 18
const FPS = 30 // Cap at 30 FPS to save CPU/GPU

export function DigitalRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })! // Optimize for opaque background if possible

    let columns: { y: number; speed: number; chars: string[] }[] = []
    let animId: number
    let lastTime = 0

    const init = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      canvas.width = W
      canvas.height = H

      const colCount = Math.floor(W / COLUMN_WIDTH)
      const prev = columns
      columns = Array.from({ length: colCount }, (_, i) => {
        if (prev[i]) return prev[i]
        return {
          y: Math.random() * -H,
          speed: 0.6 + Math.random() * 1.2,
          chars: Array.from({ length: 25 }, () => HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]), // Reduced length
        }
      })
    }

    const draw = (time: number) => {
      animId = requestAnimationFrame(draw)

      // Throttle to 30 FPS
      const delta = time - lastTime
      if (delta < 1000 / FPS) return
      lastTime = time

      const W = canvas.width
      const H = canvas.height

      ctx.fillStyle = '#050505' // Match body bg
      ctx.globalAlpha = 0.1
      ctx.fillRect(0, 0, W, H)
      ctx.globalAlpha = 1.0

      ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`

      columns.forEach((col, i) => {
        const x = i * COLUMN_WIDTH

        col.chars.forEach((ch, j) => {
          const charY = col.y - j * FONT_SIZE
          if (charY < -FONT_SIZE || charY > H + FONT_SIZE) return

          const isHead = j === 0
          const alpha = isHead ? 0.8 : Math.max(0, 0.15 - j * 0.01)
          if (alpha <= 0) return

          ctx.fillStyle = isHead ? '#ffffff' : '#00f2ff'
          ctx.globalAlpha = alpha

          if (Math.random() > 0.98) {
            col.chars[j] = HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]
          }

          ctx.fillText(ch, x, charY)
        })

        col.y += col.speed * FONT_SIZE * 0.3
        if (col.y - col.chars.length * FONT_SIZE > H) {
          col.y = -20
          col.speed = 0.6 + Math.random() * 1.2
        }
      })
      ctx.globalAlpha = 1.0
    }

    init()
    animId = requestAnimationFrame(draw)

    const onResize = () => init()
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1] will-change-transform"
      style={{ opacity: 0.08 }}
    />
  )
}
