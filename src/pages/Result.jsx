import { useParams, Link } from 'react-router-dom'

export default function Result() {
  const { id } = useParams()

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold leading-relaxed text-[#2D2D2D] md:text-3xl">
          📊 分析结果
        </h1>
        <p className="mt-2 text-base leading-relaxed text-[#6B6B6B]">
          结果 ID：{id}
        </p>
        <div className="mt-8 rounded-2xl bg-[#F7F3EE] p-8 text-center shadow-lg">
          <p className="text-base leading-relaxed text-[#6B6B6B]">
            结果页开发中
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/"
            className="rounded-xl bg-[#FF6B6B] px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            🏠 返回首页
          </Link>
          <Link
            to="/archive"
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#4D96FF] shadow-md ring-1 ring-[#4D96FF]/20"
          >
            📂 档案库
          </Link>
        </div>
      </div>
    </div>
  )
}
