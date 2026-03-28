const PURPOSE_CN = {
  romance: '恋爱与亲密关系',
  sales: '销售与沟通表达',
  workplace: '职场协作与职业发展',
  social: '社交拓展与人际互动',
}

const IMAGE_TYPE_CN = {
  avatar: '微信头像',
  background: '个人背景图',
  moments: '朋友圈截图',
}

const VALID_PURPOSE = new Set(['romance', 'sales', 'workplace', 'social'])
const VALID_IMAGE_TYPES = new Set(['avatar', 'background', 'moments'])

const MAX_TOKENS = 2500
const TEMPERATURE = 0.3

function validateResult(result) {
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
  if (!validMBTI.includes(result.mbti)) errors.push('mbti 类型无效')

  if (
    !Number.isInteger(result.confidence) ||
    result.confidence < 1 ||
    result.confidence > 5
  ) {
    errors.push('confidence 不在 1-5 范围')
  }

  if (!Array.isArray(result.summary) || result.summary.length !== 3) {
    errors.push('summary 不是 3 条')
  }

  if (!Array.isArray(result.strengths) || result.strengths.length !== 3) {
    errors.push('strengths 须 3 条')
  }

  if (!Array.isArray(result.weaknesses) || result.weaknesses.length !== 3) {
    errors.push('weaknesses 须 3 条')
  }

  if (
    !Array.isArray(result.behavior_patterns) ||
    result.behavior_patterns.length !== 3
  ) {
    errors.push('behavior_patterns 须 3 条')
  }

  if (!Array.isArray(result.taboos) || result.taboos.length !== 3) {
    errors.push('taboos 须 3 条')
  }

  if (
    !Array.isArray(result.topic_preferences) ||
    result.topic_preferences.length !== 3
  ) {
    errors.push('topic_preferences 须 3 条')
  }

  if (!Array.isArray(result.advice) || result.advice.length !== 7) {
    errors.push('advice 须恰好 7 条')
  }

  if (!Array.isArray(result.warnings) || result.warnings.length < 2) {
    errors.push('warnings 至少 2 条')
  }

  if (!result.mbti_reason?.trim()) errors.push('mbti_reason 为空')
  if (!result.career_guess?.trim()) errors.push('career_guess 为空')
  if (!result.communication_style?.trim()) {
    errors.push('communication_style 为空')
  }

  return { valid: errors.length === 0, errors }
}

function repairAndParse(rawText) {
  try {
    return JSON.parse(rawText)
  } catch {
    /* continue */
  }

  const stripped = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
  try {
    return JSON.parse(stripped)
  } catch {
    /* continue */
  }

  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(rawText.slice(firstBrace, lastBrace + 1))
    } catch {
      return null
    }
  }

  return null
}

function jsonSchemaBlock() {
  return `{
  "mbti": "ENTJ",
  "confidence": 3,
  "mbti_reason": "2-3句话详细说明判断依据",
  "summary": ["结论1（15-25字）", "结论2", "结论3"],
  "strengths": ["优势1（带简短解释）", "优势2", "优势3"],
  "weaknesses": ["成长点1（带简短解释）", "成长点2", "成长点3"],
  "behavior_patterns": ["行为模式1", "行为模式2", "行为模式3"],
  "career_guess": "2-3句话详细推测",
  "communication_style": "2-3句话描述沟通风格特点",
  "taboos": ["雷区1（带解释）", "雷区2", "雷区3"],
  "topic_preferences": ["适合聊的话题1", "话题2", "话题3"],
  "advice": ["建议1（每条15-30字，具体可执行）", "建议2", "建议3", "建议4", "建议5", "建议6", "建议7"],
  "warnings": ["注意事项1（带解释）", "注意事项2"]
}`
}

const SYSTEM_PROMPT =
  '你是资深人格分析顾问。只输出一个合法 JSON 对象，不要 markdown、不要多余说明。'

function compactTaskBlock(purposeLine) {
  return `【侧重】用户本次只关心「${purposeLine}」场景。advice 必须恰好 7 条，且仅针对该场景的自我成长建议；每条建议 15-30 字，要具体可执行。
请充分分析，给出有深度的洞察，不要过于笼统。

【输出】严格按下列 JSON 结构（字段名不可改）：
${jsonSchemaBlock()}

硬性：summary 3 条；strengths、weaknesses、behavior_patterns、taboos、topic_preferences 各 3 条；advice 恰好 7 条；warnings 至少 2 条。只输出 JSON。`
}

function buildTextOnlyUserPrompt(name, purpose, texts) {
  const purposeLine = PURPOSE_CN[purpose] || purpose
  const textBlock =
    texts.filter((t) => typeof t === 'string' && t.trim()).join('\n---\n') ||
    '（无）'

  return `分析对象：用户本人。材料如下。

【标题】${name.trim()}
【文字】
${textBlock}
【图片】无

${compactTaskBlock(purposeLine)}`
}

function buildQwenMultimodalUserContent(name, purpose, texts, images) {
  const purposeLine = PURPOSE_CN[purpose] || purpose
  const textBlock =
    texts.filter((t) => typeof t === 'string' && t.trim()).join('\n---\n') ||
    '（无文字）'

  const typeList = images
    .map((im, i) => `${IMAGE_TYPE_CN[im.type] || im.type}（图${i + 1}）`)
    .join('、')

  const head = `分析对象：用户本人。材料如下。

【标题】${name.trim()}
【文字】
${textBlock}
【图片】共 ${images.length} 张：${typeList}。请阅读图片并结合文字分析。

`

  const tail = compactTaskBlock(purposeLine)

  const content = [{ type: 'text', text: head }]
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    const b64 = stripBase64Payload(img.data)
    content.push({
      type: 'text',
      text: `【${IMAGE_TYPE_CN[img.type] || img.type} · 图${i + 1}】`,
    })
    content.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${b64}` },
    })
  }
  content.push({ type: 'text', text: tail })
  return content
}

function normalizeResult(raw) {
  if (!raw || typeof raw !== 'object') return null
  const out = { ...raw }
  if (typeof out.mbti === 'string') out.mbti = out.mbti.trim().toUpperCase()
  if (typeof out.confidence === 'string') {
    const n = parseInt(out.confidence, 10)
    if (!Number.isNaN(n)) out.confidence = n
  }
  if (typeof out.confidence === 'number' && !Number.isInteger(out.confidence)) {
    out.confidence = Math.min(5, Math.max(1, Math.round(out.confidence)))
  }
  return out
}

function stripBase64Payload(data) {
  if (typeof data !== 'string') return ''
  const s = data.trim()
  const m = /^data:image\/[a-z+]+;base64,(.+)$/i.exec(s)
  return m ? m[1] : s
}

async function callDeepSeek(messages, apiKey) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      messages,
      response_format: { type: 'json_object' },
    }),
  })

  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    const msg = json.error?.message || json.message || '性格分析服务异常'
    throw new Error(msg)
  }
  const content = json.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new Error('分析结果为空')
  }
  return content
}

async function callQwenVLMax(messages, apiKey) {
  const response = await fetch(
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-max',
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        messages,
      }),
    },
  )

  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    const msg = json.error?.message || json.message || '多模态分析服务异常'
    throw new Error(msg)
  }
  const content = json.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new Error('分析结果为空')
  }
  return content
}

function validateRequest(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: '请求格式不正确' }
  }
  const { name, purpose, texts, images } = body
  if (typeof name !== 'string' || !name.trim()) {
    return { ok: false, error: '请填写分析标题' }
  }
  if (!VALID_PURPOSE.has(purpose)) {
    return { ok: false, error: '分析侧重无效' }
  }
  if (!Array.isArray(texts)) {
    return { ok: false, error: '文字信息格式不正确' }
  }
  if (!Array.isArray(images)) {
    return { ok: false, error: '图片信息格式不正确' }
  }
  const textItems = texts.filter(
    (t) => typeof t === 'string' && t.trim().length > 0,
  )
  for (const t of texts) {
    if (typeof t === 'string' && t.length > 3000) {
      return { ok: false, error: '单条文字过长，请控制在 3000 字以内' }
    }
  }
  for (const im of images) {
    if (
      !im ||
      typeof im !== 'object' ||
      !VALID_IMAGE_TYPES.has(im.type) ||
      typeof im.data !== 'string' ||
      !im.data.trim()
    ) {
      return { ok: false, error: '图片数据格式不正确' }
    }
  }
  if (textItems.length + images.length < 2) {
    return {
      ok: false,
      error: '至少提供两种信息，分析才够准确哦～ 📝',
    }
  }
  return { ok: true }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    if (request.method !== 'POST') {
      return jsonResponse(
        { success: false, data: null, error: '不支持的请求方式' },
        405,
      )
    }

    const maxBytes = 4.5 * 1024 * 1024

    try {
      const rawTextBody = await request.text()
      const rawLen = new TextEncoder().encode(rawTextBody).length
      if (rawLen > maxBytes) {
        return jsonResponse(
          {
            success: false,
            data: null,
            error: '提交内容过大，请减少图片数量或精简文字后重试',
          },
          413,
        )
      }

      let parsed
      try {
        parsed = JSON.parse(rawTextBody || '{}')
      } catch {
        return jsonResponse(
          { success: false, data: null, error: '请求 JSON 无法解析' },
          400,
        )
      }

      const reqCheck = validateRequest(parsed)
      if (!reqCheck.ok) {
        return jsonResponse(
          { success: false, data: null, error: reqCheck.error },
          400,
        )
      }

      const { name, purpose, texts, images } = parsed
      const hasImages = images.length > 0

      const deepseekKey = env.DEEPSEEK_API_KEY
      const qwenKey = env.QWEN_VL_API_KEY

      if (hasImages && !qwenKey?.trim()) {
        return jsonResponse(
          { success: false, data: null, error: '服务配置异常，请联系管理员' },
          500,
        )
      }
      if (!hasImages && !deepseekKey?.trim()) {
        return jsonResponse(
          { success: false, data: null, error: '服务配置异常，请联系管理员' },
          500,
        )
      }

      const messages = hasImages
        ? [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: buildQwenMultimodalUserContent(
                name,
                purpose,
                texts,
                images,
              ),
            },
          ]
        : [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: buildTextOnlyUserPrompt(name, purpose, texts),
            },
          ]

      const rawAi = hasImages
        ? await callQwenVLMax(messages, qwenKey)
        : await callDeepSeek(messages, deepseekKey)

      const parsedJson = repairAndParse(rawAi)
      if (!parsedJson) {
        return jsonResponse({
          success: false,
          data: null,
          error: '分析结果解析失败，请重新分析一次 🔄',
        })
      }

      const result = normalizeResult(parsedJson)
      const validation = result
        ? validateResult(result)
        : { valid: false, errors: ['结构无效'] }

      if (!validation.valid || !result) {
        return jsonResponse({
          success: false,
          data: null,
          error: '分析结果未通过校验，请重新分析一次 🔄',
        })
      }

      return jsonResponse({
        success: true,
        data: result,
        error: null,
      })
    } catch (err) {
      console.error('personalens-api:', err)
      const msg = err instanceof Error ? err.message : String(err)
      let friendly = '分析内容较多，服务器开小差了，请稍后重试 ⏳'
      if (/timeout|ETIMEDOUT|aborted/i.test(msg)) {
        friendly = '分析内容较多，服务器开小差了，请稍后重试 ⏳'
      } else if (/fetch|network|ECONNREFUSED|Failed to fetch/i.test(msg)) {
        friendly = '网络连接出了点问题，请检查网络后重试 🌐'
      }
      return jsonResponse({
        success: false,
        data: null,
        error: friendly,
      })
    }
  },
}
