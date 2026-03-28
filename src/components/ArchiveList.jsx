import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearAllResults, getAllResults } from '../utils/storage'

const PURPOSE_TAG = {
  romance: '💕 恋爱成长',
  sales: '💼 销售提升',
  workplace: '🏢 职场优化',
  social: '🤝 社交突破',
}

function formatTime(ts) {
  if (typeof ts !== 'number') return '—'
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return '—'
  }
}

function StarRow({ n }) {
  const c = typeof n === 'number' ? Math.min(5, Math.max(0, n)) : 0
  return (
    <div className="flex gap-0.5" aria-label={`置信度 ${c} 星`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`text-sm ${i < c ? 'text-[#FFD93D]' : 'text-[#E8E4DE]'}`}
        >
          {i < c ? '⭐' : '☆'}
        </span>
      ))}
    </div>
  )
}

export default function ArchiveList() {
  const [records, setRecords] = useState(() => getAllResults())
  const [confirmClear, setConfirmClear] = useState(false)

  const refresh = useCallback(() => {
    setRecords(getAllResults())
  }, [])

  const handleClearAll = useCallback(() => {
    clearAllResults()
    setConfirmClear(false)
    refresh()
  }, [refresh])

  if (records.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-[#F7F3EE] md:p-12">
        <p className="text-base leading-relaxed text-[#6B6B6B] md:text-lg">
          📂 还没有分析记录，去首页开始你的第一次自我解码吧～
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-[#FF6B6B] px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-95"
        >
          🔮 去首页自我解码
        </Link>
      </div>
    )
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:max-w-4xl lg:mx-auto">
        {records.map((rec) => {
          const id = rec.id
          const tag = PURPOSE_TAG[rec.purpose] ?? rec.purpose
          return (
            <li key={id}>
              <Link
                to={`/result/${id}`}
                className="group block h-full rounded-2xl bg-white p-5 shadow-lg ring-1 ring-[#F7F3EE] transition duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-[#2D2D2D] md:text-xl">
                      {rec.name || '未命名分析'}
                    </h2>
                    <p className="mt-1 text-xs text-[#6B6B6B] md:text-sm">
                      {formatTime(rec.timestamp)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <span className="text-3xl font-bold tracking-tight text-[#FF6B6B] md:text-4xl">
                      {rec.mbti || '—'}
                    </span>
                    <span className="rounded-full bg-[#FFFBF5] px-3 py-1 text-xs font-medium text-[#2D2D2D] ring-1 ring-[#FFD93D]/50 md:text-sm">
                      {tag}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <StarRow n={rec.confidence} />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="rounded-xl border-2 border-[#FF6B6B]/40 bg-white px-6 py-3 text-base font-semibold text-[#FF6B6B] shadow-md transition hover:bg-[#FF6B6B]/10"
        >
          🗑️ 清空全部档案
        </button>
      </div>

      {confirmClear ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-archive-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#FFFBF5] p-6 shadow-2xl ring-1 ring-[#F7F3EE] md:p-8">
            <h2
              id="clear-archive-title"
              className="text-lg font-semibold text-[#2D2D2D] md:text-xl"
            >
              确认清空全部档案？
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#6B6B6B]">
              将删除本地保存的全部自我分析记录，此操作无法撤销。合规确认状态不受影响。
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="rounded-xl bg-[#F7F3EE] px-5 py-2.5 text-base font-medium text-[#2D2D2D] transition hover:bg-[#E8E4DF]"
                onClick={() => setConfirmClear(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#FF6B6B] px-5 py-2.5 text-base font-semibold text-white shadow-md transition hover:opacity-95"
                onClick={handleClearAll}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
