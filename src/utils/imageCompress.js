import exifr from 'exifr'

const MAX_LONG_EDGE = 1200
const MAX_BYTES = 500 * 1024
const Q_PRIMARY = 0.7
const Q_FALLBACK = 0.5

function base64DecodedBytes(b64) {
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return (b64.length * 3) / 4 - pad
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }
    img.decoding = 'async'
    img.src = url
  })
}

/**
 * 将已按 EXIF 方向绘制的 canvas 等比缩放，最长边不超过 maxLongEdge。
 */
function scaleCanvas(source, maxLongEdge) {
  const w = source.width
  const h = source.height
  const longEdge = Math.max(w, h)
  if (longEdge <= maxLongEdge) return source

  const scale = maxLongEdge / longEdge
  const tw = Math.round(w * scale)
  const th = Math.round(h * scale)

  const out = document.createElement('canvas')
  out.width = tw
  out.height = th
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, tw, th)
  return out
}

/**
 * 根据 EXIF Orientation 将图片绘制到 canvas，修正旋转/镜像。
 * orientation: 1–8，非标准值按 1 处理。
 */
function drawImageWithOrientation(img, orientation) {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  const o = orientation >= 1 && orientation <= 8 ? orientation : 1

  if (o > 4 && o < 9) {
    canvas.width = h
    canvas.height = w
  } else {
    canvas.width = w
    canvas.height = h
  }

  switch (o) {
    case 2:
      ctx.transform(-1, 0, 0, 1, w, 0)
      break
    case 3:
      ctx.transform(-1, 0, 0, -1, w, h)
      break
    case 4:
      ctx.transform(1, 0, 0, -1, 0, h)
      break
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0)
      break
    case 6:
      ctx.transform(0, 1, -1, 0, h, 0)
      break
    case 7:
      ctx.transform(0, -1, -1, 0, h, w)
      break
    case 8:
      ctx.transform(0, -1, 1, 0, 0, w)
      break
    default:
      break
  }

  ctx.drawImage(img, 0, 0)
  return canvas
}

function stripDataUrlPrefix(dataUrl) {
  const prefix = 'data:image/jpeg;base64,'
  if (!dataUrl.startsWith(prefix)) {
    const idx = dataUrl.indexOf('base64,')
    if (idx === -1) return dataUrl
    return dataUrl.slice(idx + 7)
  }
  return dataUrl.slice(prefix.length)
}

/**
 * 将图片文件压缩为 JPEG base64（不含 data URL 前缀）。
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function compressImageToBase64(file) {
  let orientation = 1
  try {
    const o = await exifr.orientation(file)
    if (typeof o === 'number' && o >= 1 && o <= 8) orientation = o
  } catch {
    orientation = 1
  }

  const img = await loadImageFromFile(file)
  const oriented = drawImageWithOrientation(img, orientation)
  const scaled = scaleCanvas(oriented, MAX_LONG_EDGE)

  let quality = Q_PRIMARY
  let dataUrl = scaled.toDataURL('image/jpeg', quality)
  let base64 = stripDataUrlPrefix(dataUrl)

  if (base64DecodedBytes(base64) > MAX_BYTES) {
    quality = Q_FALLBACK
    dataUrl = scaled.toDataURL('image/jpeg', quality)
    base64 = stripDataUrlPrefix(dataUrl)
  }

  return base64
}
