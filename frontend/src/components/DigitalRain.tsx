import { useEffect, useRef } from 'react'

const HEX_CHARS = '0123456789ABCDEF01'
const FONT_SIZE = 13
const COLUMN_WIDTH = 18

export function DigitalRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let columns: { y: number; speed: number; chars: string[] }[] = []
    let animId: number

    const init = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      canvas.width = W
      canvas.height = H

      const colCount = Math.floor(W / COLUMN_WIDTH)
      // Rebuild columns but preserve existing ones at the same index if possible
      const prev = columns
      columns = Array.from({ length: colCount }, (_, i) => {
        if (prev[i]) return prev[i]
        return {
          y: Math.random() * -H,
          speed: 0.6 + Math.random() * 1.2,
          chars: Array.from({ length: 30 }, () => HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]),
        }
      })
    }

    const draw = () => {
      const W = canvas.width
      const H = canvas.height

      // Trail fade — draw a semi-transparent black rectangle each frame
      ctx.fillStyle = 'rgba(5, 5, 5, 0.08)'
      ctx.fillRect(0, 0, W, H)

      ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`

      columns.forEach((col, i) => {
        const x = i * COLUMN_WIDTH

        col.chars.forEach((ch, j) => {
          const charY = col.y - j * FONT_SIZE
          if (charY < 0 || charY > H) return

          const isHead = j === 0
          // Head char is bright white, trail fades cyan → dark
          const alpha = isHead ? 0.85 : Math.max(0, 0.1 - j * 0.006)
          if (alpha <= 0) return

          ctx.fillStyle = isHead
            ? `rgba(255, 255, 255, ${alpha})`
            : `rgba(0, 242, 255, ${alpha})`

          // Randomly mutate chars for flickering effect
          if (Math.random() > 0.97) {
            col.chars[j] = HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]
          }

          ctx.fillText(ch, x, charY)
        })

        // Advance column
        col.y += col.speed * FONT_SIZE * 0.25

        // Reset when fully off screen
        if (col.y - col.chars.length * FONT_SIZE > H) {
          col.y = -Math.random() * H * 0.5
          col.speed = 0.6 + Math.random() * 1.2
        }
      })

      animId = requestAnimationFrame(draw)
    }

    init()
    draw()

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
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ filter: 'blur(1.5px)', opacity: 0.07 }}
    />
  )
}
