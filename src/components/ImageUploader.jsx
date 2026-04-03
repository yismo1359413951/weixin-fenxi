import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { compressImageToBase64 } from '../utils/imageCompress'

function newItemId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export default function ImageUploader({ maxCount, label, hint, onImagesChange }) {
  const fileInputRef = useRef(null)
  const itemsRef = useRef([])
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [limitHint, setLimitHint] = useState('')

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const notify = useCallback(
    (next) => {
      setItems(next)
      onImagesChange(next)
    },
    [onImagesChange],
  )

  const showLimit = useCallback(() => {
    setLimitHint(`最多上传 ${maxCount} 张`)
    window.setTimeout(() => setLimitHint(''), 3200)
  }, [maxCount])

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []).filter((f) =>
        f.type.startsWith('image/'),
      )
      if (files.length === 0) return

      const current = itemsRef.current
      const remaining = maxCount - current.length
      if (remaining <= 0) {
        showLimit()
        return
      }

      const toAdd = files.slice(0, remaining)
      if (files.length > remaining) showLimit()

      setBusy(true)
      try {
        let next = [...current]
        for (const file of toAdd) {
          const base64 = await compressImageToBase64(file)
          next = [
            ...next,
            {
              id: newItemId(),
              base64,
              preview: `data:image/jpeg;base64,${base64}`,
            },
          ]
        }
        notify(next)
      } catch (e) {
        console.error(e)
        setLimitHint('图片处理失败，请换一张试试 🖼️')
        window.setTimeout(() => setLimitHint(''), 3200)
      } finally {
        setBusy(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [maxCount, notify, showLimit],
  )

  const onInputChange = (e) => {
    handleFiles(e.target.files)
  }

  const onDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const removeAt = (index) => {
    const next = items.filter((_, i) => i !== index)
    notify(next)
  }

  const atLimit = items.length >= maxCount

  return (
    <div className="w-full">
      {label ? (
        <p className="mb-2 text-base font-medium leading-relaxed text-[#2D2D2D]">
          {label}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {items.map((it, index) => (
          <div
            key={it.id}
            className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-[#6BCB77]/40 bg-white shadow-md"
          >
            <img
              src={it.preview}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-[#2D2D2D]/70 text-white shadow-md transition hover:bg-[#FF6B6B]"
              aria-label="删除图片"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        ))}

        {!atLimit ? (
          // 使用 label + 覆盖型 file input，避免 Android 微信 WebView 对 input.click() 不兼容
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className={`relative flex h-28 min-w-[7rem] flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#6BCB77] bg-[#FFFBF5] px-3 text-center transition hover:bg-[#6BCB77]/10 md:min-w-[10rem] ${busy ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={maxCount > 1}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              onChange={onInputChange}
              disabled={busy}
              aria-label={label || '上传图片'}
            />
            <span className="pointer-events-none text-2xl" aria-hidden="true">
              📷
            </span>
            <span className="pointer-events-none mt-1 text-sm font-medium leading-relaxed text-[#6B6B6B]">
              {busy ? '处理中…' : '点击上传'}
            </span>
          </label>
        ) : null}
      </div>

      {hint ? (
        <p className="mt-2 text-xs leading-relaxed text-[#A0A0A0]">{hint}</p>
      ) : null}

      {limitHint ? (
        <p className="mt-2 text-sm leading-relaxed text-[#FF6B6B]">
          {limitHint}
        </p>
      ) : null}
    </div>
  )
}
