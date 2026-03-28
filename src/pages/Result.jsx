import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfidenceBanner from '../components/ConfidenceBanner'
import ResultCard from '../components/ResultCard'
import ResultReport from '../components/ResultReport'
import { getResult } from '../utils/storage'

function ResultContent() {
  const { id } = useParams()
  const record = getResult(id)
  const [view, setView] = useState('simple')

  if (!record) {
    return (
      <div className="flex flex-1 flex-col px-4 py-8 md:py-12">
        <div className="mx-auto w-full max-w-2xl text-center">
          <h1 className="text-2xl font-semibold text-[#2D2D2D] md:text-3xl">
            📭 未找到分析记录
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#6B6B6B]">
            分析记录不存在，可能已被清除。
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-xl bg-[#FF6B6B] px-6 py-3 text-base font-semibold text-white shadow-lg"
          >
            🏠 返回首页
          </Link>
        </div>
      </div>
    )
  }

  const { name, purpose, confidence, result } = record
  const lowConfidence =
    typeof confidence === 'number' ? confidence <= 2 : false

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold leading-relaxed text-[#2D2D2D] md:text-3xl">
              📊 分析结果
            </h1>
            <p className="mt-1 text-sm text-[#6B6B6B] md:text-base">
              {name}
            </p>
          </div>
          <div
            className="flex shrink-0 gap-2 rounded-xl bg-[#F7F3EE] p-1"
            role="tablist"
            aria-label="结果展示方式"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === 'simple'}
              onClick={() => setView('simple')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition md:text-base ${
                view === 'simple'
                  ? 'bg-white text-[#FF6B6B] shadow-md'
                  : 'text-[#6B6B6B]'
              }`}
            >
              🎯 简洁版
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'deep'}
              onClick={() => setView('deep')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition md:text-base ${
                view === 'deep'
                  ? 'bg-white text-[#FF6B6B] shadow-md'
                  : 'text-[#6B6B6B]'
              }`}
            >
              📊 深度版
            </button>
          </div>
        </div>

        <div
          key={view}
          className="animate-fade-in mt-8"
        >
          {lowConfidence ? (
            <ConfidenceBanner confidence={confidence} />
          ) : null}

          {view === 'simple' ? (
            <ResultCard
              name={name}
              purpose={purpose}
              result={result}
            />
          ) : (
            <ResultReport
              purpose={purpose}
              result={result}
            />
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/"
            className="inline-flex rounded-xl bg-[#FF6B6B] px-5 py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-95"
          >
            返回首页重新分析
          </Link>
          <Link
            to="/archive"
            className="inline-flex rounded-xl bg-white px-5 py-3 text-base font-semibold text-[#4D96FF] shadow-md ring-1 ring-[#4D96FF]/25"
          >
            📂 档案库
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Result() {
  const { id } = useParams()
  return <ResultContent key={id} />
}
