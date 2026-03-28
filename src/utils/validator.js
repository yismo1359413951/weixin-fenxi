/**
 * 与 netlify/functions/analyze.js 中 validateResult 规则保持一致
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

  if (!Array.isArray(r.strengths) || r.strengths.length !== 3) {
    errors.push('strengths 须 3 条')
  }

  if (!Array.isArray(r.weaknesses) || r.weaknesses.length !== 3) {
    errors.push('weaknesses 须 3 条')
  }

  if (
    !Array.isArray(r.behavior_patterns) ||
    r.behavior_patterns.length !== 3
  ) {
    errors.push('behavior_patterns 须 3 条')
  }

  if (!Array.isArray(r.taboos) || r.taboos.length !== 3) {
    errors.push('taboos 须 3 条')
  }

  if (
    !Array.isArray(r.topic_preferences) ||
    r.topic_preferences.length !== 3
  ) {
    errors.push('topic_preferences 须 3 条')
  }

  if (!Array.isArray(r.advice) || r.advice.length !== 7) {
    errors.push('advice 须恰好 7 条')
  }

  if (!Array.isArray(r.warnings) || r.warnings.length < 2) {
    errors.push('warnings 至少 2 条')
  }

  if (!r.mbti_reason?.trim()) errors.push('mbti_reason 为空')
  if (!r.career_guess?.trim()) errors.push('career_guess 为空')
  if (!r.communication_style?.trim()) errors.push('communication_style 为空')

  return { valid: errors.length === 0, errors }
}
