/**
 * 分析 API：默认 Netlify Function；生产可设 VITE_API_URL 指向 Cloudflare Workers
 */
const API_URL =
  import.meta.env.VITE_API_URL || '/.netlify/functions/analyze'

/**
 * 调用后端人格分析（网络/解析失败提示按 AGENTS.md 错误处理规范）
 */
export async function analyzePersona({ name, purpose, texts, images }) {
  let response
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, purpose, texts, images }),
    })
  } catch {
    throw new Error('网络连接出了点问题，请检查网络后重试 🌐')
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('分析内容较多，服务器开小差了，请稍后重试 ⏳')
  }

  if (!data.success) throw new Error(data.error || '分析失败')
  return data.data
}
