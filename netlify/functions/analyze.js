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

const MAX_TOKENS_DS = 2500
const MAX_TOKENS_QWEN = 2500

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

/** 与 TECH.md §5.4 后半一致：分析要求 + 输出格式 + 注意 */
function analysisRequirementsBlock() {
  return `【分析要求】
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

const SYSTEM_PROMPT = `你是一位专业的人格分析师。请严格依据用户消息中的材料与格式要求，只输出一个合法 JSON 对象，不要输出任何其他文字，不要使用 markdown 代码块包裹。`

/**
 * 情况1：仅文字 — TECH.md §5.4 完整模板（无图片）
 */
function buildTextOnlyUserPrompt(name, purpose, texts) {
  const purposeLine = PURPOSE_CN[purpose] || purpose
  const textBlock =
    texts.filter((t) => typeof t === 'string' && t.trim()).join('\n---\n') ||
    '（未提供文字）'

  const infoBundle = `【分析标题】${name.trim()}

【文字信息】
${textBlock}

【图片信息】
（未提供图片）`

  return `你是一位专业的人格分析师，擅长从社交媒体信息中分析个人的人格特征。

【分析对象】
用户本人提供的自我社交信息

【分析目的】
用户希望通过分析自己的社交媒体信息，更好地认识自己的性格特点，优化自己在「${purposeLine}」场景中的表现。

【用户提供的信息】
${infoBundle}

${analysisRequirementsBlock()}`
}

/**
 * 情况2：含图片 — 千问 VL 多模态 content（完整分析指令 + 图片附件）
 */
function buildQwenMultimodalUserContent(name, purpose, texts, images) {
  const purposeLine = PURPOSE_CN[purpose] || purpose
  const textBlock =
    texts.filter((t) => typeof t === 'string' && t.trim()).join('\n---\n') ||
    '（未提供文字）'

  const typeList = images
    .map((im, i) => `${IMAGE_TYPE_CN[im.type] || im.type}（图${i + 1}）`)
    .join('、')

  const head = `你是一位专业的人格分析师，擅长从社交媒体信息中分析个人的人格特征。

【分析对象】
用户本人提供的自我社交信息

【分析目的】
用户希望通过分析自己的社交媒体信息，更好地认识自己的性格特点，优化自己在「${purposeLine}」场景中的表现。

【用户提供的信息】

【分析标题】${name.trim()}

【文字信息】
${textBlock}

【图片信息】
以下在同一条消息中按顺序附有 ${images.length} 张图片：${typeList}。请直接阅读图片中的视觉内容（风格、色调、构图、文字、氛围、人物特征等），并与上方文字信息一并用于人格分析。

`

  const tail = `\n${analysisRequirementsBlock()}`

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

/** 情况1：仅 DeepSeek，TECH.md §5.2（max_tokens 降低以提速） */
async function callDeepSeek(messages, apiKey) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: MAX_TOKENS_DS,
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

/**
 * 情况2：仅千问 VL 一次，多模态 + 完整分析（qwen-vl-max）
 * 不在此使用 response_format（多模态兼容性与百炼版本有关），由 prompt 约束只输出 JSON。
 */
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
        max_tokens: MAX_TOKENS_QWEN,
        temperature: 0.7,
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
    const messagesFirst = hasImages
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

    const runModel = hasImages
      ? () => callQwenVLMax(messagesFirst, qwenKey)
      : () => callDeepSeek(messagesFirst, deepseekKey)

    let rawText = await runModel()
    let result = normalizeResult(repairAndParse(rawText))
    let validation = result
      ? validateResult(result)
      : { valid: false, errors: ['JSON 解析失败'] }

    if (!validation.valid) {
      const retryUser =
        hasImages
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
              {
                role: 'user',
                content: `你上一次输出的 JSON 未通过服务端校验。错误：${validation.errors.join('；')}。请重新输出一份完全符合字段与数组长度要求的纯 JSON，不要包含其他文字。`,
              },
            ]
          : [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: buildTextOnlyUserPrompt(name, purpose, texts),
              },
              {
                role: 'user',
                content: `你上一次输出的 JSON 未通过服务端校验。错误：${validation.errors.join('；')}。请重新输出一份完全符合字段与数组长度要求的纯 JSON，不要包含其他文字。`,
              },
            ]

      rawText = hasImages
        ? await callQwenVLMax(retryUser, qwenKey)
        : await callDeepSeek(retryUser, deepseekKey)
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
