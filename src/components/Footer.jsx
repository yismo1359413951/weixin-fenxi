import { useCallback, useState } from 'react'

const COMPLAINT_EMAIL = 'bjwnsman@163.com'

export default function Footer() {
  const [copied, setCopied] = useState(false)

  const copyEmail = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(COMPLAINT_EMAIL)
      } else {
        const ta = document.createElement('textarea')
        ta.value = COMPLAINT_EMAIL
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }, [])

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E8E4DF] bg-[#FFFBF5]/95 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      role="contentinfo"
    >
      <div className="mx-auto max-w-4xl px-4 text-xs leading-relaxed text-[#6B6B6B] md:text-sm">
        <p className="mb-2">
          📌
          本工具仅为 AI 辅助的自我人格分析学习工具，分析结果仅供个人参考，不代表客观事实，不构成任何决策建议。严禁使用本工具实施非法处理他人个人信息、侵害他人合法权益的行为。
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>📮 投诉举报：</span>
          <span className="font-medium text-[#2D2D2D]">{COMPLAINT_EMAIL}</span>
          <button
            type="button"
            onClick={copyEmail}
            className="rounded-lg bg-[#4D96FF]/15 px-2 py-0.5 text-[11px] font-medium text-[#4D96FF] ring-1 ring-[#4D96FF]/30 md:text-xs"
          >
            {copied ? '已复制 ✓' : '复制邮箱'}
          </button>
          <span className="w-full text-[11px] text-[#A0A0A0] md:inline md:w-auto">
            （微信内请勿点系统邮箱链接，易无法打开；请用复制）
          </span>
        </p>
      </div>
    </footer>
  )
}
