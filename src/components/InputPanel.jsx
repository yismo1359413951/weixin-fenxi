import { useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import ImageUploader from './ImageUploader'

const MAX_TEXT = 3000

const PURPOSE_OPTIONS = [
  { value: 'romance', label: '💕 恋爱成长' },
  { value: 'sales', label: '💼 销售提升' },
  { value: 'workplace', label: '🏢 职场优化' },
  { value: 'social', label: '🤝 社交突破' },
]

function TextField({
  label,
  value,
  onChange,
  placeholder,
  emoji,
}) {
  return (
    <div className="w-full">
      <label className="mb-2 block text-base font-medium leading-relaxed text-[#2D2D2D]">
        {emoji ? <span className="mr-1">{emoji}</span> : null}
        {label}
      </label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => {
            const v = e.target.value
            onChange(v.length > MAX_TEXT ? v.slice(0, MAX_TEXT) : v)
          }}
          placeholder={placeholder}
          rows={4}
          maxLength={MAX_TEXT}
          className="w-full resize-y rounded-xl border-2 border-[#F7F3EE] bg-white px-4 py-3 pb-8 text-base leading-relaxed text-[#2D2D2D] shadow-inner placeholder:text-[#A0A0A0] focus:border-[#4D96FF] focus:outline-none focus:ring-2 focus:ring-[#4D96FF]/25"
        />
        <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-[#A0A0A0]">
          {value.length} / {MAX_TEXT}
        </span>
      </div>
    </div>
  )
}

export default function InputPanel({ onSubmit }) {
  const [name, setName] = useState('我的社交人格分析')
  const [purpose, setPurpose] = useState('romance')
  const [chat, setChat] = useState('')
  const [bio, setBio] = useState('')
  const [extra, setExtra] = useState('')
  const [avatar, setAvatar] = useState([])
  const [background, setBackground] = useState([])
  const [moments, setMoments] = useState([])
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)

  const textSegments = useMemo(() => {
    const parts = []
    const a = chat.trim()
    const b = bio.trim()
    const c = extra.trim()
    if (a) parts.push(a)
    if (b) parts.push(b)
    if (c) parts.push(c)
    return parts
  }, [chat, bio, extra])

  const imageCount = avatar.length + background.length + moments.length
  const infoCount = textSegments.length + imageCount
  const canSubmit =
    name.trim().length > 0 &&
    Boolean(purpose) &&
    infoCount >= 2 &&
    !loading

  const showInfoHint = infoCount < 2 && !loading

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current || !canSubmit) return
    submittingRef.current = true
    setLoading(true)
    try {
      const texts = textSegments
      const images = []
      if (avatar[0]?.base64) {
        images.push({ type: 'avatar', data: avatar[0].base64 })
      }
      if (background[0]?.base64) {
        images.push({ type: 'background', data: background[0].base64 })
      }
      moments.forEach((m) => {
        if (m.base64) images.push({ type: 'moments', data: m.base64 })
      })
      const payload = {
        name: name.trim(),
        purpose,
        texts,
        images,
      }
      if (onSubmit) await onSubmit(payload)
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-full rounded-2xl bg-white p-5 shadow-lg ring-1 ring-[#F7F3EE]/80 md:p-8"
    >
      <div className="space-y-8">
        <div>
          <label
            htmlFor="analysis-title"
            className="mb-2 block text-base font-medium leading-relaxed text-[#2D2D2D]"
          >
            ✏️ 分析标题
          </label>
          <input
            id="analysis-title"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="给这次自我分析起个名字"
            className="w-full rounded-xl border-2 border-[#F7F3EE] bg-[#FFFBF5] px-4 py-3 text-base leading-relaxed text-[#2D2D2D] placeholder:text-[#A0A0A0] focus:border-[#4D96FF] focus:outline-none focus:ring-2 focus:ring-[#4D96FF]/25"
          />
        </div>

        <ImageUploader
          maxCount={1}
          label="🖼️ 我的微信头像"
          hint="💡 建议上传清晰的正方形头像"
          onImagesChange={setAvatar}
        />

        <ImageUploader
          maxCount={1}
          label="🌄 我的背景图"
          hint="💡 建议上传微信个人主页背景图"
          onImagesChange={setBackground}
        />

        <ImageUploader
          maxCount={6}
          label="📸 我的朋友圈截图"
          hint="💡 最多上传6张，建议上传普通截图，不要长截图。每次截一屏内容效果最佳（图片越多分析越慢）"
          onImagesChange={setMoments}
        />

        <TextField
          emoji="💬"
          label="我的聊天记录"
          value={chat}
          onChange={setChat}
          placeholder="粘贴你自己的聊天记录或常用表达"
        />

        <TextField
          emoji="📝"
          label="我的个人简介"
          value={bio}
          onChange={setBio}
          placeholder="粘贴你的视频号/社交平台个人简介"
        />

        <TextField
          emoji="✨"
          label="补充描述"
          value={extra}
          onChange={setExtra}
          placeholder="关于你自己的其他补充信息"
        />

        <div>
          <p className="mb-3 text-base font-medium leading-relaxed text-[#2D2D2D]">
            🎯 分析侧重
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PURPOSE_OPTIONS.map((opt) => {
              const active = purpose === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPurpose(opt.value)}
                  className={`rounded-xl border-2 px-4 py-3 text-left text-base font-medium leading-relaxed transition ${
                    active
                      ? 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#2D2D2D] shadow-md'
                      : 'border-[#F7F3EE] bg-[#FFFBF5] text-[#6B6B6B] hover:border-[#6BCB77]/50'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {showInfoHint ? (
        <p className="mt-6 rounded-xl border border-[#FFD93D]/80 bg-[#FFD93D]/25 px-4 py-3 text-center text-base leading-relaxed text-[#2D2D2D]">
          至少提供两种信息，分析才够准确哦～ 📝
        </p>
      ) : null}

      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full max-w-md items-center justify-center gap-2 rounded-xl bg-[#FF6B6B] px-6 py-4 text-lg font-semibold leading-relaxed text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-[#E0E0E0] disabled:text-[#9CA3AF] disabled:shadow-none md:text-xl"
        >
          {loading ? (
            <>
              <Loader2 className="size-6 animate-spin" aria-hidden />
              <span>正在准备…</span>
            </>
          ) : (
            <>🔮 开始解码我的人格</>
          )}
        </button>
      </div>
    </form>
  )
}
