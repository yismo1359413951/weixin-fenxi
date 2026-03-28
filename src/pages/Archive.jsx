import { Link } from 'react-router-dom'

export default function Archive() {
  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold leading-relaxed text-[#2D2D2D] md:text-3xl">
          📂 我的分析档案
        </h1>
        <p className="mt-2 text-base leading-relaxed text-[#6B6B6B]">
          这里将展示你本人的历史自我分析记录
        </p>
        <div className="mt-8 rounded-2xl bg-[#F7F3EE] p-8 text-center shadow-lg">
          <p className="text-base leading-relaxed text-[#6B6B6B]">
            档案库开发中
          </p>
        </div>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-[#FF6B6B] px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          🏠 返回首页
        </Link>
      </div>
    </div>
  )
}
