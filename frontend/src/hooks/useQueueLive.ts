import { useEffect, useState } from 'react'

export function useQueueLive(isToday: boolean, intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!isToday) return
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [isToday, intervalMs])
  return now
}
