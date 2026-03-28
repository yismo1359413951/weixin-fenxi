/**
 * 与 netlify/functions/analyze.js 中 validateResult 规则保持一致（简化 JSON 结构）
 * @param {unknown} result
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAnalysisResult(result) {
  const errors = []

  const validMBTI = [
    'INTJ',
    'INTP',
    'ENTJ',
    'ENTP',
    'INFJ',
    'INFP',
    'ENFJ',
    'ENFP',
    'ISTJ',
    'ISFJ',
    'ESTJ',
    'ESFJ',
    'ISTP',
    'ISFP',
    'ESTP',
    'ESFP',
  ]

  if (!result || typeof result !== 'object') {
    return { valid: false, errors: ['结果不是对象'] }
  }

  const r = result

  if (!validMBTI.includes(r.mbti)) errors.push('mbti 类型无效')

  if (
    !Number.isInteger(r.confidence) ||
    r.confidence < 1 ||
    r.confidence > 5
  ) {
    errors.push('confidence 不在 1-5 范围')
  }

  if (!Array.isArray(r.summary) || r.summary.length !== 3) {
    errors.push('summary 不是 3 条')
  }

  if (!Array.isArray(r.strengths) || r.strengths.length < 2) {
    errors.push('strengths 少于 2 条')
  }

  if (!Array.isArray(r.weaknesses) || r.weaknesses.length < 2) {
    errors.push('weaknesses 少于 2 条')
  }

  if (!Array.isArray(r.advice) || r.advice.length !== 5) {
    errors.push('advice 须恰好 5 条')
  }

  if (!Array.isArray(r.warnings) || r.warnings.length < 1) {
    errors.push('warnings 为空')
  }

  if (!Array.isArray(r.taboos) || r.taboos.length < 2) {
    errors.push('taboos 少于 2 条')
  }

  if (!r.mbti_reason?.trim()) errors.push('mbti_reason 为空')
  if (!r.career_guess?.trim()) errors.push('career_guess 为空')
  if (!r.communication_style?.trim()) errors.push('communication_style 为空')

  return { valid: errors.length === 0, errors }
}
