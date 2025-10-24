import { useMemo, useState } from 'react'
import type { MinuteStat } from '../types'
import styles from './Histogram.module.scss'

type Props = { data: MinuteStat[] }

export default function Histogram({ data }: Props) {
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null)

  const counts = data.map((d) => d.count)
  const max = Math.max(...counts, 1)

  const bars = useMemo(() => {
    return data.map((d) => ({
      label: d.label,
      count: d.count
    }))
  }, [data])

  const width = 800
  const height = 280
  const padding = { left: 40, right: 16, top: 16, bottom: 40 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const barW = Math.max(4, innerW / Math.max(1, bars.length) - 4)

  return (
    <div className={styles.wrapper}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg}>
        {/* y grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padding.top + innerH - innerH * t
          const val = Math.round(max * t)
          return (
            <g key={i}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke='rgba(255,255,255,0.03)' />
              <text x={8} y={y + 4} fontSize={10} fill='var(--muted)'>
                {val}
              </text>
            </g>
          )
        })}

        {/* bars */}
        {bars.map((b, i) => {
          const x = padding.left + (i * innerW) / bars.length + 2
          const h = (b.count / max) * innerH
          const y = padding.top + innerH - h
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={4}
                fill='var(--accent)'
                opacity={b.count === 0 ? 0.12 : 1}
                onMouseEnter={(ev) =>
                  setHover({
                    x: ev.clientX,
                    y: ev.clientY,
                    text: `${b.label} — ${b.count} msg${b.count === 1 ? '' : 's'}`
                  })
                }
                onMouseLeave={() => setHover(null)}
              />
              {/* x label */}
              {i % Math.ceil(Math.max(1, bars.length / 12)) === 0 && (
                <text x={x + barW / 2} y={height - 6} fontSize={10} fill='var(--muted)' textAnchor='middle'>
                  {b.label.slice(11)} {/* show only hh:mm */}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {hover && (
        <div className={styles.tooltip} style={{ left: hover.x + 12, top: hover.y + 12 }}>
          {hover.text}
        </div>
      )}
    </div>
  )
}
