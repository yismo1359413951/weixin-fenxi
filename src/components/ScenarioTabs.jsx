import { useState } from 'react'

const TABS = [
  { key: 'romance', label: '💕 恋爱' },
  { key: 'sales', label: '💼 销售' },
  { key: 'workplace', label: '🏢 职场' },
  { key: 'social', label: '🤝 社交' },
]

const VALID = new Set(TABS.map((t) => t.key))

/**
 * @param {{ scenarios: Record<string, string[]> }} props
 * @param {string} [props.initialTab] romance | sales | workplace | social
 */
export default function ScenarioTabs({ scenarios, initialTab = 'romance' }) {
  const safeInitial = VALID.has(initialTab) ? initialTab : 'romance'
  const [active, setActive] = useState(safeInitial)

  const items = scenarios?.[active] ?? []

  return (
    <div className="w-full">
      <div
        className="flex flex-wrap gap-2 rounded-xl bg-[#F7F3EE]/80 p-1.5"
        role="tablist"
        aria-label="场景成长策略"
      >
        {TABS.map((tab) => {
          const isOn = active === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isOn}
              onClick={() => setActive(tab.key)}
              className={`min-h-[44px] flex-1 rounded-lg px-3 py-2 text-sm font-semibold leading-relaxed transition md:text-base ${
                isOn
                  ? 'bg-[#FF6B6B] text-white shadow-md'
                  : 'bg-transparent text-[#6B6B6B] hover:bg-white/70'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        key={active}
        className="animate-fade-in mt-4 space-y-3"
        role="tabpanel"
      >
        {items.length === 0 ? (
          <p className="text-base leading-relaxed text-[#6B6B6B]">
            暂无该场景的建议条目。
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((line, i) => (
              <li
                key={`${active}-${i}`}
                className="rounded-xl border border-[#F7F3EE] bg-white px-4 py-3 text-base leading-relaxed text-[#2D2D2D] shadow-sm"
              >
                <span className="mr-2 font-semibold text-[#FF6B6B]">
                  {i + 1}.
                </span>
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
