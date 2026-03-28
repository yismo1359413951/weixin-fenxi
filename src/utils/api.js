/**
 * 调用 Netlify Function：POST /.netlify/functions/analyze（TECH.md §四）
 * 网络/解析失败提示按 AGENTS.md 错误处理规范
 */
export async function analyzePersona({ name, purpose, texts, images }) {
  let response
  try {
    response = await fetch('/.netlify/functions/analyze', {
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
