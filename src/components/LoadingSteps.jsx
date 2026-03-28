import { useEffect, useState } from 'react'

const STEP_MS = 4000
const LONG_WAIT_MS = 30000

const STEPS = [
  { emoji: '📋', text: '正在读取你提供的信息...' },
  { emoji: '🔍', text: '正在分析你的性格特征...' },
  { emoji: '💡', text: '正在生成成长建议...' },
  { emoji: '✨', text: '即将解锁你的人格密码...' },
]

const LONG_WAIT = {
  emoji: '⏳',
  text: '分析内容较多，请再等等...',
}

export default function LoadingSteps({ isLoading }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isLoading) return
    queueMicrotask(() => setElapsed(0))
    const t0 = Date.now()
    const id = window.setInterval(() => {
      setElapsed(Date.now() - t0)
    }, 250)
    return () => window.clearInterval(id)
  }, [isLoading])

  if (!isLoading) return null

  const showLong = elapsed >= LONG_WAIT_MS
  const slot = showLong
    ? LONG_WAIT
    : STEPS[Math.floor(elapsed / STEP_MS) % STEPS.length]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#FFFBF5] px-8 py-10 text-center shadow-lg ring-1 ring-[#F7F3EE]">
        <div className="flex flex-col items-center gap-4">
          <span
            className="select-none text-5xl leading-none motion-safe:animate-[gentle-bounce_1.25s_ease-in-out_infinite]"
            aria-hidden
          >
            {slot.emoji}
          </span>
          <p className="text-lg font-medium leading-relaxed text-[#2D2D2D] md:text-xl">
            {slot.text}
          </p>
        </div>
      </div>
    </div>
  )
}
