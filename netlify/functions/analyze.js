'use strict'

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

const MAX_TOKENS = 1500
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

  if (!Array.isArray(result.strengths) || result.strengths.length < 2) {
    errors.push('strengths 少于 2 条')
  }

  if (!Array.isArray(result.weaknesses) || result.weaknesses.length < 2) {
    errors.push('weaknesses 少于 2 条')
  }

  if (!Array.isArray(result.advice) || result.advice.length !== 5) {
    errors.push('advice 须恰好 5 条')
  }

  if (!Array.isArray(result.warnings) || result.warnings.length < 1) {
    errors.push('warnings 为空')
  }

  if (!Array.isArray(result.taboos) || result.taboos.length < 2) {
    errors.push('taboos 少于 2 条')
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
  "mbti_reason": "一句话说明",
  "summary": ["结论1", "结论2", "结论3"],
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["弱点1", "弱点2"],
  "career_guess": "一句话",
  "communication_style": "一句话",
  "taboos": ["雷区1", "雷区2"],
  "advice": ["建议1", "建议2", "建议3", "建议4", "建议5"],
  "warnings": ["注意1"]
}`
}

const SYSTEM_PROMPT =
  '你是人格分析助手。只输出一个合法 JSON 对象，不要 markdown、不要多余说明。'

function compactTaskBlock(purposeLine) {
  return `【侧重】用户本次只关心「${purposeLine}」场景。advice 必须恰好 5 条，且仅针对该场景的自我成长建议。
【简洁】请简洁回答，每条建议不超过30字；其它字段也尽量简短。

【输出】严格按下列 JSON 结构（字段名不可改）：
${jsonSchemaBlock()}

硬性：summary 3 条；strengths、weaknesses、taboos 各≥2 条；advice 恰好 5 条；warnings≥1 条。只输出 JSON。`
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

function parseRequestBody(event) {
  let raw = event.body || '{}'
  if (event.isBase64Encoded && typeof raw === 'string') {
    raw = Buffer.from(raw, 'base64').toString('utf-8')
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
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

function errBody(message) {
  return JSON.stringify({
    success: false,
    data: null,
    error: message,
  })
}

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: errBody('不支持的请求方式'),
    }
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY
  const qwenKey = process.env.QWEN_VL_API_KEY

  const maxBytes = 4.5 * 1024 * 1024
  const rawLen = event.body
    ? Buffer.byteLength(
        event.isBase64Encoded
          ? Buffer.from(event.body, 'base64')
          : String(event.body),
        'utf8',
      )
    : 0
  if (rawLen > maxBytes) {
    return {
      statusCode: 413,
      headers,
      body: errBody('提交内容过大，请减少图片数量或精简文字后重试'),
    }
  }

  const parsed = parseRequestBody(event)
  if (!parsed) {
    return {
      statusCode: 400,
      headers,
      body: errBody('请求 JSON 无法解析'),
    }
  }

  const reqCheck = validateRequest(parsed)
  if (!reqCheck.ok) {
    return {
      statusCode: 400,
      headers,
      body: errBody(reqCheck.error),
    }
  }

  const { name, purpose, texts, images } = parsed
  const hasImages = images.length > 0

  if (hasImages && !qwenKey?.trim()) {
    return {
      statusCode: 500,
      headers,
      body: errBody('服务配置异常，请联系管理员'),
    }
  }
  if (!hasImages && !deepseekKey?.trim()) {
    return {
      statusCode: 500,
      headers,
      body: errBody('服务配置异常，请联系管理员'),
    }
  }

  try {
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
          { role: 'user', content: buildTextOnlyUserPrompt(name, purpose, texts) },
        ]

    const rawText = hasImages
      ? await callQwenVLMax(messages, qwenKey)
      : await callDeepSeek(messages, deepseekKey)

    const parsedJson = repairAndParse(rawText)
    if (!parsedJson) {
      return {
        statusCode: 200,
        headers,
        body: errBody('分析结果解析失败，请重新分析一次 🔄'),
      }
    }

    const result = normalizeResult(parsedJson)
    const validation = result
      ? validateResult(result)
      : { valid: false, errors: ['结构无效'] }

    if (!validation.valid || !result) {
      return {
        statusCode: 200,
        headers,
        body: errBody('分析结果未通过校验，请重新分析一次 🔄'),
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result,
        error: null,
      }),
    }
  } catch (e) {
    console.error('analyze error:', e)
    const msg = e instanceof Error ? e.message : String(e)
    let friendly = '分析内容较多，服务器开小差了，请稍后重试 ⏳'
    if (/timeout|ETIMEDOUT|aborted/i.test(msg)) {
      friendly = '分析内容较多，服务器开小差了，请稍后重试 ⏳'
    } else if (/fetch|network|ECONNREFUSED|Failed to fetch/i.test(msg)) {
      friendly = '网络连接出了点问题，请检查网络后重试 🌐'
    }
    return {
      statusCode: 200,
      headers,
      body: errBody(friendly),
    }
  }
}
