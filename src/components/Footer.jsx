export default function Footer() {
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E8E4DF] bg-[#FFFBF5]/95 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm"
      role="contentinfo"
    >
      <div className="mx-auto max-w-4xl px-4 text-xs leading-relaxed text-[#6B6B6B] md:text-sm">
        <p className="mb-2">
          📌
          本工具仅为 AI 辅助的自我人格分析学习工具，分析结果仅供个人参考，不代表客观事实，不构成任何决策建议。严禁使用本工具实施非法处理他人个人信息、侵害他人合法权益的行为。
        </p>
        <p>
          📮 投诉举报：
          <a
            href="mailto:bjwnsman@163.com"
            className="font-medium text-[#4D96FF] underline-offset-2 hover:underline"
          >
            bjwnsman@163.com
          </a>
        </p>
      </div>
    </footer>
  )
}
