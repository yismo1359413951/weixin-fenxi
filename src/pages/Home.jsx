import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InputPanel from '../components/InputPanel'
import { analyzePersona } from '../utils/api'

function newResultId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState(null)

  const handleAnalyze = async (payload) => {
    setSubmitError(null)
    try {
      const result = await analyzePersona(payload)
      const id = newResultId()
      const record = {
        id,
        name: payload.name,
        purpose: payload.purpose,
        mbti: result.mbti,
        confidence: result.confidence,
        timestamp: Date.now(),
        result,
      }
      localStorage.setItem(
        `personalens_result_${id}`,
        JSON.stringify(record),
      )
      navigate(`/result/${id}`)
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'AI 这次发挥不太稳定，请重新分析一次 🔄'
      setSubmitError(msg)
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:py-12">
      <header className="mx-auto w-full max-w-2xl text-center">
        <h1 className="text-3xl font-semibold leading-relaxed text-[#2D2D2D] md:text-4xl">
          🔮 PersonaLens
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-[#6B6B6B] md:text-xl">
          你的社交人格自我解码器
        </p>
      </header>

      <section className="mx-auto mt-10 w-full max-w-2xl flex-1">
        {submitError ? (
          <div
            className="mb-6 rounded-2xl border-2 border-[#FF6B6B]/50 bg-[#FF6B6B]/10 px-4 py-3 text-center text-base leading-relaxed text-[#2D2D2D]"
            role="alert"
          >
            {submitError}
          </div>
        ) : null}
        <InputPanel onSubmit={handleAnalyze} />
      </section>

      <nav className="mx-auto mt-10 flex flex-wrap justify-center gap-4 text-sm md:text-base">
        <Link
          to="/archive"
          className="rounded-xl bg-white px-4 py-2 font-medium text-[#4D96FF] shadow-md ring-1 ring-[#4D96FF]/20"
        >
          📂 档案库
        </Link>
      </nav>
    </div>
  )
}
