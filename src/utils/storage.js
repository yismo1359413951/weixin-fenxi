/** localStorage key 前缀（TECH.md / AGENTS.md） */
export const RESULT_PREFIX = 'personalens_result_'

/**
 * 获取所有分析结果，按时间倒序（最新在前）
 * @returns {Array<Record<string, unknown>>}
 */
export function getAllResults() {
  const list = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(RESULT_PREFIX)) continue
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const data = JSON.parse(raw)
      if (data && typeof data === 'object' && data.id) {
        list.push(data)
      }
    } catch {
      /* 跳过损坏项 */
    }
  }
  list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  return list
}

/**
 * @param {string} id
 * @returns {Record<string, unknown> | null}
 */
export function getResult(id) {
  if (!id) return null
  try {
    const raw = localStorage.getItem(`${RESULT_PREFIX}${id}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * 保存分析结果（仅结构化结果字段，不包含原始图片与文字）
 * @param {string} id
 * @param {{
 *   id?: string,
 *   name: string,
 *   purpose: string,
 *   mbti: string,
 *   confidence: number,
 *   timestamp?: number,
 *   result: object
 * }} data
 */
export function saveResult(id, data) {
  const record = {
    id: data.id ?? id,
    name: data.name,
    purpose: data.purpose,
    mbti: data.mbti,
    confidence: data.confidence,
    timestamp: data.timestamp ?? Date.now(),
    result: data.result,
  }
  localStorage.setItem(`${RESULT_PREFIX}${id}`, JSON.stringify(record))
}

/**
 * @param {string} id
 */
export function deleteResult(id) {
  localStorage.removeItem(`${RESULT_PREFIX}${id}`)
}

/** 清空所有分析结果，保留合规标记 personalens_compliance_agreed */
export function clearAllResults() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(RESULT_PREFIX)) keys.push(key)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}

/**
 * 计算 personalens_ 前缀相关条目的存储占用（字节，UTF-8 近似）
 * @returns {number}
 */
export function getStorageUsage() {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('personalens_')) continue
    const val = localStorage.getItem(key) ?? ''
    total += new Blob([key]).size + new Blob([val]).size
  }
  return total
}

/** localStorage 常见上限约 5MB（提示用） */
export const STORAGE_HINT_LIMIT_BYTES = 5 * 1024 * 1024

export function formatStorageSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
