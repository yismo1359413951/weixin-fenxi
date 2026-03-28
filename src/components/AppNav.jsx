import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) =>
  `rounded-xl px-4 py-2 text-base font-semibold leading-relaxed transition md:text-lg ${
    isActive
      ? 'bg-[#FF6B6B] text-white shadow-md'
      : 'text-[#2D2D2D] hover:bg-[#F7F3EE]'
  }`

export default function AppNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#E8E4DF]/90 bg-[#FFFBF5]/95 shadow-sm backdrop-blur-md">
      <nav
        className="mx-auto flex max-w-4xl items-center justify-center gap-2 px-4 py-3 sm:gap-6"
        aria-label="主导航"
      >
        <NavLink to="/" end className={linkClass}>
          🔮 首页
        </NavLink>
        <NavLink to="/archive" className={linkClass}>
          📚 档案库
        </NavLink>
      </nav>
    </header>
  )
}
