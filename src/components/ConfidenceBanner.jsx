import { Link } from 'react-router-dom'

/**
 * @param {{ confidence: number }} props
 */
export default function ConfidenceBanner({ confidence }) {
  if (typeof confidence !== 'number' || confidence > 2) return null

  return (
    <div
      className="mb-6 rounded-2xl border-2 border-[#FFD93D]/80 bg-[#FFD93D]/35 px-4 py-4 shadow-md md:px-6 md:py-5"
      role="status"
    >
      <p className="text-base font-medium leading-relaxed text-[#2D2D2D] md:text-lg">
        ⚡
        你提供的信息较少，分析准确度有限。补充更多信息可以让分析更准确哦～
      </p>
      <div className="mt-4">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl bg-[#FF6B6B] px-5 py-2.5 text-base font-semibold text-white shadow-md transition hover:opacity-95"
        >
          补充信息重新分析
        </Link>
      </div>
    </div>
  )
}
