'use strict'

/** TECH.md §四 — purpose 枚举 */
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

/** TECH.md §5.5 JSON 校验规则（validator）— 与文档一致 */
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

  for (const key of ['romance', 'sales', 'workplace', 'social']) {
    if (
      !Array.isArray(result.scenarios?.[key]) ||
      result.scenarios[key].length < 3
    ) {
      errors.push(`scenarios.${key} 少于 3 条`)
    }
  }

  for (const key of ['strengths', 'weaknesses', 'behavior_patterns']) {
    if (
      !Array.isArray(result.personality?.[key]) ||
      result.personality[key].length < 2
    ) {
      errors.push(`personality.${key} 少于 2 条`)
    }
  }

  if (!Array.isArray(result.warnings) || result.warnings.length < 1) {
    errors.push('warnings 为空')
  }

  if (!result.mbti_reason?.trim()) errors.push('mbti_reason 为空')
  if (!result.career_guess?.trim()) errors.push('career_guess 为空')
  if (!result.communication?.preferred_style?.trim()) {
    errors.push('preferred_style 为空')
  }

  return { valid: errors.length === 0, errors }
}

/** TECH.md §5.6 JSON 修复逻辑（jsonRepair）— 与文档一致 */
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
  "mbti": "16种MBTI四字母大写之一",
  "confidence": 1,
  "mbti_reason": "字符串，说明判断依据",
  "summary": ["结论1", "结论2", "结论3"],
  "personality": {
    "strengths": ["至少2条"],
    "weaknesses": ["至少2条"],
    "behavior_patterns": ["至少2条"]
  },
  "career_guess": "字符串",
  "communication": {
    "preferred_style": "字符串",
    "taboos": ["至少2条"],
    "topic_preferences": ["至少2条"]
  },
  "scenarios": {
    "romance": ["至少3条自我成长策略"],
    "sales": ["至少3条"],
    "workplace": ["至少3条"],
    "social": ["至少3条"]
  },
  "warnings": ["至少1条注意事项"]
}`
}

/** 与 TECH.md §5.2 messages 搭配：系统侧只约束输出形态 */
const SYSTEM_PROMPT = `你是一位专业的人格分析师。请严格依据用户消息中的材料与格式要求，只输出一个合法 JSON 对象，不要输出任何其他文字，不要使用 markdown 代码块包裹。`

/**
 * 按 TECH.md §5.4 拼接用户 prompt（含 JSON 结构说明）
 * {purpose} 使用 PURPOSE_CN 中文场景描述
 */
function buildUserPrompt(name, purpose, texts, imageDescriptions) {
  const purposeLine = PURPOSE_CN[purpose] || purpose
  const textBlock =
    texts.filter((t) => typeof t === 'string' && t.trim()).join('\n---\n') ||
    '（未提供文字）'
  const imgBlock =
    imageDescriptions.length > 0
      ? imageDescriptions
          .map(
            (d, i) =>
              `【${IMAGE_TYPE_CN[d.type] || d.type} · 图${i + 1}】\n${d.text}`,
          )
          .join('\n\n')
      : '（未提供图片）'

  const infoBundle = `【分析标题】${name.trim()}

【文字信息】
${textBlock}

【图片信息（已由千问 VL 转写为文字描述）】
${imgBlock}`

  return `你是一位专业的人格分析师，擅长从社交媒体信息中分析个人的人格特征。

【分析对象】
用户本人提供的自我社交信息

【分析目的】
用户希望通过分析自己的社交媒体信息，更好地认识自己的性格特点，优化自己在「${purposeLine}」场景中的表现。

【用户提供的信息】
${infoBundle}

【分析要求】
1. 基于 MBTI 框架判断人格类型，给出置信度（1-5星）和判断依据
2. 分析五大人格维度（开放性/尽责性/外向性/宜人性/神经质）
3. 推测职业背景和生活状态
4. 分析沟通风格和行为倾向
5. 针对四个场景（恋爱/销售/职场/社交），给出用户自我优化和成长的具体策略

【输出格式】
严格输出纯 JSON，不要输出任何其他内容，不要用 markdown 包裹。
JSON 结构如下：
${jsonSchemaBlock()}

【注意】
- 所有推断必须基于用户提供的信息，不得凭空捏造
- 置信度要诚实，信息少时必须给 1-2 星
- 策略建议要具体、可操作，用户可以直接参考使用
- 所有内容用中文输出
- 只输出 JSON，不要输出任何其他文字`
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

/** TECH.md §5.3 千问 VL API 调用格式 */
async function describeImage(imageBase64, apiKey) {
  const response = await fetch(
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: '请详细描述这张图片中的视觉信息，包括：风格、色调、构图、文字内容、人物特征（如有）、整体氛围。',
              },
            ],
          },
        ],
      }),
    },
  )

  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    const msg = json.error?.message || json.message || '图片描述服务异常'
    throw new Error(msg)
  }
  const content = json.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw new Error('图片描述返回为空')
  }
  return content.trim()
}

/** TECH.md §5.2 DeepSeek API 调用格式 */
async function callDeepSeek(messages, apiKey) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 4000,
      temperature: 0.7,
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

  if (!deepseekKey?.trim() || !qwenKey?.trim()) {
    return {
      statusCode: 500,
      headers,
      body: errBody('服务配置异常，请联系管理员'),
    }
  }

  /** TECH.md §二：总请求体 ≤ 4.5MB */
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

  try {
    /** §5.1：有图片则每张图单独调千问 VL（顺序执行） */
    const imageDescriptions = []
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const payload = stripBase64Payload(img.data)
      const desc = await describeImage(payload, qwenKey)
      imageDescriptions.push({ type: img.type, text: desc })
    }

    const userPrompt = buildUserPrompt(name, purpose, texts, imageDescriptions)

    const messagesFirst = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]

    let rawText = await callDeepSeek(messagesFirst, deepseekKey)
    let result = normalizeResult(repairAndParse(rawText))
    let validation = result
      ? validateResult(result)
      : { valid: false, errors: ['JSON 解析失败'] }

    /** §5.1：validator 不通过则 retry 最多 1 次（共 2 次 DeepSeek） */
    if (!validation.valid) {
      const messagesRetry = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
        {
          role: 'user',
          content: `你上一次输出的 JSON 未通过服务端校验。错误：${validation.errors.join('；')}。请重新输出一份完全符合字段与数组长度要求的纯 JSON，不要包含其他文字。`,
        },
      ]
      rawText = await callDeepSeek(messagesRetry, deepseekKey)
      result = normalizeResult(repairAndParse(rawText))
      validation = result
        ? validateResult(result)
        : { valid: false, errors: ['JSON 解析失败'] }
    }

    if (!validation.valid || !result) {
      return {
        statusCode: 200,
        headers,
        body: errBody('AI 这次发挥不太稳定，请重新分析一次 🔄'),
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
