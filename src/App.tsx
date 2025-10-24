import React, { useRef, useState } from 'react'
import styles from './App.module.scss'
import type { MinuteStat } from './types'
import Histogram from './components/Histogram'

function parseLine(line: string) {
  // пример строки:
  // [2025-10-20 02:57:56 UTC] vevv02: damn using our brain lulula10Lulucri
  const m = line.match(/^\s*\[(.+?)\]\s+([^:]+):\s*(.*)$/)
  if (!m) return null
  const tsRaw = m[1] // "2025-10-20 02:57:56 UTC"
  const nick = m[2].trim()
  const text = m[3].trim()
  const date = new Date(tsRaw) // "UTC" в строке делает парсинг в UTC
  if (isNaN(date.getTime())) return null
  return { date, nick, text }
}

function groupByMinute(lines: string[]) {
  const map = new Map<number, number>() // minuteEpoch -> count
  for (const line of lines) {
    const parsed = parseLine(line)
    if (!parsed) continue
    const minuteEpoch = Math.floor(parsed.date.getTime() / 60000) * 60000
    map.set(minuteEpoch, (map.get(minuteEpoch) ?? 0) + 1)
  }

  if (map.size === 0) return [] as MinuteStat[]

  // build continuous array from min to max minute
  const keys = Array.from(map.keys()).sort((a, b) => a - b)
  const minKey = keys[0]
  const maxKey = keys[keys.length - 1]
  const result: MinuteStat[] = []
  for (let t = minKey; t <= maxKey; t += 60000) {
    const cnt = map.get(t) ?? 0
    const d = new Date(t)
    const label = d.toISOString().slice(0, 16).replace('T', ' ') // "YYYY-MM-DD hh:mm"
    result.push({ minuteStartTs: t, label, count: cnt })
  }
  return result
}

export default function App() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [stats, setStats] = useState<MinuteStat[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onChoose = () => inputRef.current?.click()

  const onFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    const grouped = groupByMinute(lines)
    if (grouped.length === 0) {
      setError('Не найдено корректных строк в файле.')
      setStats(null)
    } else {
      setError(null)
      setStats(grouped)
    }
    // сброс input
    if (inputRef.current) inputRef.current.value = ''
  }

  // stats summary
  const summary = stats
    ? {
        total: stats.reduce((s, it) => s + it.count, 0),
        max: Math.max(...stats.map((s) => s.count)),
        avg: stats.reduce((s, it) => s + it.count, 0) / Math.max(1, stats.length)
      }
    : null

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.logo}>ChatStats</div>
        <div className={styles.controls}>
          <button className={styles.btnPrimary} onClick={onChoose}>
            Загрузить .txt
          </button>
          <input ref={inputRef} type='file' accept='.txt,text/plain' style={{ display: 'none' }} onChange={onFile} />
        </div>
      </header>

      <main className={styles.container}>
        {!stats && !error && <div className={styles.empty}>Загрузите .txt с лентой сообщений</div>}

        {error && <div className={styles.error}>{error}</div>}

        {stats && (
          <>
            <div style={{ width: '100%' }}>
              <Histogram data={stats} />
            </div>

            <div className={styles.summary}>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Всего сообщений</div>
                <div className={styles.statValue}>{summary!.total}</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Макс в минуту</div>
                <div className={styles.statValue}>{summary!.max}</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Среднее</div>
                <div className={styles.statValue}>{summary!.avg.toFixed(2)}</div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
