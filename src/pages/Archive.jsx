import ArchiveList from '../components/ArchiveList'
import { formatStorageSize, getStorageUsage } from '../utils/storage'

export default function Archive() {
  const used = getStorageUsage()

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <header className="text-center md:text-left">
          <h1 className="text-2xl font-semibold leading-relaxed text-[#2D2D2D] md:text-3xl">
            📚 我的人格档案库
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B] md:text-base">
            已用 {formatStorageSize(used)} / 5MB
            <span className="hidden sm:inline">
              （本地浏览器存储上限约 5MB，数值供参考）
            </span>
          </p>
        </header>

        <div className="mt-8 md:mt-10">
          <ArchiveList />
        </div>
      </div>
    </div>
  )
}
