import { MBTI_EMOJI } from '../utils/mbtiEmoji'
import { PURPOSE_SCENE_TITLE } from '../utils/purposeLabels'

export default function ResultCard({ name, purpose, result }) {
  const sceneTitle =
    purpose && PURPOSE_SCENE_TITLE[purpose]
      ? PURPOSE_SCENE_TITLE[purpose]
      : '当前侧重场景'
  const advice = Array.isArray(result.advice)
    ? result.advice.slice(0, 5)
    : []
  const summary = Array.isArray(result.summary) ? result.summary : []
  const conf =
    typeof result.confidence === 'number' ? result.confidence : 1

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-[#F7F3EE] md:p-8">
        <p className="text-center text-sm font-medium text-[#6B6B6B]">
          {name}
        </p>
        <div className="mt-4 flex flex-col items-center gap-2 text-center">
          <div className="flex flex-wrap items-end justify-center gap-2">
            <span className="text-5xl font-bold tracking-tight text-[#2D2D2D] md:text-6xl">
              {result.mbti}
            </span>
            <span
              className="text-4xl motion-safe:animate-[gentle-bounce_1.6s_ease-in-out_infinite]"
              aria-hidden
            >
              {MBTI_EMOJI[result.mbti] ?? '🧠'}
            </span>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-[#6B6B6B] md:text-lg">
            {result.mbti_reason?.trim() ||
              '基于你提供的自我社交信息，以下为对你人格倾向的参考解读。'}
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-1" aria-label={`置信度 ${conf} 星`}>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={`text-2xl md:text-3xl ${i < conf ? 'text-[#FFD93D]' : 'text-[#E8E4DE]'}`}
            >
              {i < conf ? '⭐' : '☆'}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-[#2D2D2D] md:text-2xl">
          🎯 你的核心结论
        </h2>
        <ol className="space-y-3">
          {summary.slice(0, 3).map((line, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-2xl border-2 border-[#F7F3EE] bg-[#FFFBF5] px-4 py-4 shadow-inner"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FF6B6B] text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="flex-1 text-base leading-relaxed text-[#2D2D2D]">
                {line}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-[#2D2D2D] md:text-2xl">
          🌱 在「{sceneTitle}」下，你可以尝试
        </h2>
        <ul className="space-y-3">
          {advice.map((line, i) => (
            <li
              key={i}
              className="rounded-2xl bg-white px-4 py-4 text-base leading-relaxed text-[#2D2D2D] shadow-md ring-1 ring-[#F7F3EE]"
            >
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
