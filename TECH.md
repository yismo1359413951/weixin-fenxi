# PersonaLens 技术设计文档 v1.0

## 一、产品定位

社交人格**自我分析**成长工具。用户上传**本人**的微信头像、朋友圈截图、聊天记录等社交碎片信息，AI 分析用户本人的 MBTI 人格类型，输出恋爱/销售/职场/社交四场景的自我成长策略。

> ⚠️ 合规红线：产品全流程严格围绕「自我人格分析」，所有文案、功能设计禁止任何引导分析他人的内容。

---

## 二、技术架构

```
用户浏览器（React + Vite + TailwindCSS v4）
    │
    │  POST /api/analyze（JSON，含 base64 图片）
    │  总请求体 ≤ 4.5MB（Netlify Functions 限制 6MB，留安全余量）
    │
    ▼
Netlify Functions（Node.js 无服务器函数）
    │
    ├── 文字信息 ──→ DeepSeek V3 API（api.deepseek.com）
    │                  模型：deepseek-chat
    │                  兼容 OpenAI 格式
    │                  国内直连 ✅
    │
    └── 图片信息 ──→ 阿里云千问 VL API（dashscope.aliyuncs.com）
                      模型：qwen-vl-plus
                      多模态，支持图片理解
                      国内直连 ✅
```

### 部署方案

| 层级 | 技术 | 平台 | 国内可访问 |
|------|------|------|-----------|
| 前端 | React 18 + Vite + TailwindCSS v4 | Netlify | ✅（延迟 200-500ms，可接受） |
| 后端 | Netlify Functions（无服务器） | Netlify（同一平台） | ✅ |
| 文字 AI | DeepSeek V3 | api.deepseek.com | ✅ |
| 图片 AI | 千问 VL | dashscope.aliyuncs.com | ✅ |
| 数据存储 | localStorage（仅用户本地） | 用户浏览器 | - |

### 为什么不用 Express + Railway

- Railway 国内需要 VPN，不可用
- Netlify Functions 与前端同域，无 CORS 问题
- 无需额外部署/管理后端服务器
- 免费额度足够 MVP 使用（每月 125K 函数调用）

---

## 三、目录结构

```
personalens/
├── netlify/
│   └── functions/
│       └── analyze.js          # 核心分析接口（Netlify Function）
├── src/
│   ├── components/
│   │   ├── ComplianceModal.jsx  # 首屏三重合规弹窗（不可跳过）
│   │   ├── InputPanel.jsx       # 信息输入面板
│   │   ├── ImageUploader.jsx    # 图片上传+前端压缩
│   │   ├── ResultCard.jsx       # 简洁结果卡片
│   │   ├── ResultReport.jsx     # 深度分析报告
│   │   ├── ScenarioTabs.jsx     # 场景切换 Tab
│   │   ├── ArchiveList.jsx      # 本地档案库列表
│   │   ├── LoadingSteps.jsx     # 分步加载动画
│   │   ├── ConfidenceBanner.jsx # 低置信度警告
│   │   └── Footer.jsx           # 永久免责声明+投诉入口
│   ├── pages/
│   │   ├── Home.jsx             # 首页（输入+分析）
│   │   ├── Result.jsx           # 结果页（简洁/深度切换）
│   │   └── Archive.jsx          # 档案库页
│   ├── utils/
│   │   ├── api.js               # 调用 /api/analyze
│   │   ├── imageCompress.js     # 前端图片压缩（canvas）
│   │   ├── storage.js           # localStorage 操作（personalens_ 前缀）
│   │   ├── validator.js         # 分析结果 JSON 校验
│   │   └── jsonRepair.js        # JSON 修复逻辑
│   ├── App.jsx                  # 路由配置
│   ├── index.css                # 全局样式（TailwindCSS v4 + 中文字体）
│   └── main.jsx                 # 入口
├── public/
│   └── _redirects               # SPA 重定向规则
├── netlify.toml                 # Netlify 配置
├── package.json
├── AGENTS.md                    # Cursor 项目指令
├── TECH.md                      # 本文档
└── .gitignore
```

---

## 四、API 接口设计

### `POST /.netlify/functions/analyze`

**请求体（JSON）：**

```json
{
  "name": "我的社交人格",
  "purpose": "romance",
  "texts": [
    "（用户粘贴的聊天记录或个人简介文字）"
  ],
  "images": [
    {
      "type": "avatar",
      "data": "base64字符串（压缩后）"
    },
    {
      "type": "moments",
      "data": "base64字符串（压缩后）"
    }
  ]
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✅ | 分析标题（默认"我的社交人格"） |
| purpose | enum | ✅ | romance / sales / workplace / social |
| texts | string[] | 至少填 texts 或 images 其中一项 | 文字信息数组 |
| images | object[] | 至少填 texts 或 images 其中一项 | 图片数组，每项含 type 和 data |
| images[].type | enum | ✅ | avatar / background / moments |
| images[].data | string | ✅ | base64 编码（压缩后） |

**前端校验规则（提交前必须满足）：**

- texts 和 images 合计至少有 2 项信息（只有 1 项信息不允许提交，提示"信息太少，至少提供两种信息"）
- 单张图片 base64 ≤ 500KB
- 所有图片总大小 ≤ 4MB
- texts 每条不超过 3000 字（避免 token 消耗过大）
- 点击分析后按钮立即禁用，防止重复提交

**响应体（JSON）：**

```json
{
  "success": true,
  "data": {
    "mbti": "ENTJ",
    "confidence": 3,
    "mbti_reason": "基于朋友圈内容和头像风格判断...",
    "summary": ["结论1", "结论2", "结论3"],
    "personality": {
      "strengths": ["至少2条"],
      "weaknesses": ["至少2条"],
      "behavior_patterns": ["至少2条"]
    },
    "career_guess": "可能从事...",
    "communication": {
      "preferred_style": "...",
      "taboos": ["至少2条"],
      "topic_preferences": ["至少2条"]
    },
    "scenarios": {
      "romance": ["至少3条策略"],
      "sales": ["至少3条策略"],
      "workplace": ["至少3条策略"],
      "social": ["至少3条策略"]
    },
    "warnings": ["注意事项1", "至少1条"]
  },
  "error": null
}
```

**错误响应：**

```json
{
  "success": false,
  "data": null,
  "error": "错误描述（友好中文提示）"
}
```

---

## 五、后端核心逻辑（analyze.js）

### 5.1 处理流程

```
1. 解析请求体，校验必填字段
2. 判断是否有图片
   ├── 有图片 → 调千问 VL API，让模型描述图片中的视觉信息
   │           → 获得图片的文字描述
   └── 无图片 → 跳过
3. 将所有文字信息 + 图片描述 + 分析 prompt 模板 → 拼接完整 prompt
4. 调 DeepSeek API，要求输出纯 JSON
5. 解析响应 JSON
   ├── 直接 parse 成功 → 进入校验
   ├── 失败 → 尝试去除 markdown 包裹（```json ... ```）再 parse
   ├── 再失败 → 尝试提取第一个 { 到最后一个 } 之间的内容再 parse
   └── 全部失败 → 返回错误
6. validator 校验 JSON 结构
   ├── 通过 → 返回结果
   └── 不通过 → retry（最多重试 1 次，总共最多 2 次请求）
7. 立即丢弃所有用户输入数据，不存储到任何地方
```

### 5.2 DeepSeek API 调用格式

```javascript
const response = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    max_tokens: 4000,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' }
  })
});
```

### 5.3 千问 VL API 调用格式

```javascript
const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.QWEN_VL_API_KEY}`
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
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          },
          {
            type: 'text',
            text: '请详细描述这张图片中的视觉信息，包括：风格、色调、构图、文字内容、人物特征（如有）、整体氛围。'
          }
        ]
      }
    ]
  })
});
```

### 5.4 Prompt 模板（核心）

```
你是一位专业的人格分析师，擅长从社交媒体信息中分析个人的人格特征。

【分析对象】
用户本人提供的自我社交信息

【分析目的】
用户希望通过分析自己的社交媒体信息，更好地认识自己的性格特点，优化自己在{purpose}场景中的表现。

【用户提供的信息】
{所有文字信息和图片描述拼接}

【分析要求】
1. 基于 MBTI 框架判断人格类型，给出置信度（1-5星）和判断依据
2. 分析五大人格维度（开放性/尽责性/外向性/宜人性/神经质）
3. 推测职业背景和生活状态
4. 分析沟通风格和行为倾向
5. 针对四个场景（恋爱/销售/职场/社交），给出用户自我优化和成长的具体策略

【输出格式】
严格输出纯 JSON，不要输出任何其他内容，不要用 markdown 包裹。
JSON 结构如下：
{JSON Schema}

【注意】
- 所有推断必须基于用户提供的信息，不得凭空捏造
- 置信度要诚实，信息少时必须给 1-2 星
- 策略建议要具体、可操作，用户可以直接参考使用
- 所有内容用中文输出
- 只输出 JSON，不要输出任何其他文字
```

### 5.5 JSON 校验规则（validator）

```javascript
function validateResult(result) {
  const errors = [];
  
  // 1. mbti 必须是 16 种标准类型之一
  const validMBTI = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
                     'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
  if (!validMBTI.includes(result.mbti)) errors.push('mbti 类型无效');
  
  // 2. confidence 必须是 1-5 的整数
  if (!Number.isInteger(result.confidence) || result.confidence < 1 || result.confidence > 5)
    errors.push('confidence 不在 1-5 范围');
  
  // 3. summary 必须恰好 3 条
  if (!Array.isArray(result.summary) || result.summary.length !== 3)
    errors.push('summary 不是 3 条');
  
  // 4. scenarios 四个场景每个 ≥ 3 条
  for (const key of ['romance', 'sales', 'workplace', 'social']) {
    if (!Array.isArray(result.scenarios?.[key]) || result.scenarios[key].length < 3)
      errors.push(`scenarios.${key} 少于 3 条`);
  }
  
  // 5. personality 三个子字段各 ≥ 2 条
  for (const key of ['strengths', 'weaknesses', 'behavior_patterns']) {
    if (!Array.isArray(result.personality?.[key]) || result.personality[key].length < 2)
      errors.push(`personality.${key} 少于 2 条`);
  }
  
  // 6. warnings 非空数组
  if (!Array.isArray(result.warnings) || result.warnings.length < 1)
    errors.push('warnings 为空');
  
  // 7. 所有字符串字段非空
  if (!result.mbti_reason?.trim()) errors.push('mbti_reason 为空');
  if (!result.career_guess?.trim()) errors.push('career_guess 为空');
  if (!result.communication?.preferred_style?.trim()) errors.push('preferred_style 为空');
  
  return { valid: errors.length === 0, errors };
}
```

### 5.6 JSON 修复逻辑（jsonRepair）

```javascript
function repairAndParse(rawText) {
  // 尝试 1：直接 parse
  try { return JSON.parse(rawText); } catch {}
  
  // 尝试 2：去除 markdown 包裹
  const stripped = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(stripped); } catch {}
  
  // 尝试 3：提取第一个 { 到最后一个 } 之间的内容
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(rawText.slice(firstBrace, lastBrace + 1)); } catch {}
  }
  
  // 全部失败
  return null;
}
```

---

## 六、前端核心逻辑

### 6.1 图片压缩（imageCompress.js）

```
输入：用户选择的图片文件（File 对象）
处理：
  1. 用 FileReader 读取为 Image 对象
  2. 处理 EXIF 方向信息（iOS Safari 拍照旋转问题）
  3. 计算缩放尺寸：最长边不超过 1200px，等比缩放
  4. 创建 canvas，drawImage 绘制缩放后的图片
  5. canvas.toDataURL('image/jpeg', 0.7) 导出
  6. 检查大小，如果仍超过 500KB，降低质量到 0.5 再试
输出：base64 字符串（不含 data:image/jpeg;base64, 前缀）
```

### 6.2 路由

```
/                 首页（输入面板 + 分析）
/result/:id       结果页（简洁/深度切换）
/archive          档案库
```

**id 生成规则：** `Date.now().toString(36) + Math.random().toString(36).slice(2, 8)`

### 6.3 数据流

```
1. Home 页面：用户填写信息 → 点击分析
2. 调用 api.js 的 analyzePersona() → POST /api/analyze
3. 等待响应期间显示 LoadingSteps 分步动画
4. 收到结果 → 生成 id → 存入 localStorage（key: personalens_result_{id}）
5. 跳转到 /result/{id}
6. Result 页面从 localStorage 读取结果 → 渲染
7. Archive 页面列出所有 personalens_result_ 开头的 key → 渲染卡片列表
```

### 6.4 localStorage 存储规则

- 所有 key 统一前缀 `personalens_`
- `personalens_compliance_agreed`: 是否已通过合规弹窗（boolean）
- `personalens_result_{id}`: 分析结果（JSON 字符串，不存图片原始数据）
- 存储的结果结构：`{ id, name, purpose, mbti, confidence, timestamp, result }`
- 不存储用户上传的任何原始图片或文字

### 6.5 加载动画分步提示

```
第 0-3 秒:   📋 正在读取你提供的信息...
第 3-8 秒:   🔍 正在分析你的性格特征...
第 8-15 秒:  💡 正在生成成长建议...
第 15-25 秒: ✨ 即将解锁你的人格密码...
超过 30 秒:  ⏳ 分析内容较多，请再等等...
```

---

## 七、合规实现要求

### 7.1 首屏三重合规弹窗（ComplianceModal）

**触发条件：** localStorage 中 `personalens_compliance_agreed` 不为 `true` 时，每次进入页面都弹出。

**弹窗内容（不可跳过，必须全部确认）：**

```
第一重（醒目大字提示）：
⚠️ 重要提示
本工具仅用于个人合法的自我人格分析学习使用。
严禁上传任何第三方的个人信息。
非法收集、处理他人个人信息属于违法行为，
将承担行政、民事甚至刑事责任。

第二重（手动勾选）：
☐ 我承诺仅上传本人的个人信息，已取得所有上传内容的合法授权，
  充分知晓违规使用的法律后果，所有使用行为的责任由本人承担。

第三重（手动点击）：
☐ 我已阅读并同意《用户协议》和《隐私政策》

[进入工具] ← 两个都勾选后才可点击
```

### 7.2 永久底部免责声明（Footer）

```
页面底部固定展示（不可折叠、不可隐藏）：

📌 本工具仅为AI辅助的自我人格分析学习工具，分析结果仅供个人参考，
不代表客观事实，不构成任何决策建议。严禁使用本工具实施非法处理
他人个人信息、侵害他人合法权益的行为。

📮 投诉举报：personalens.complaint@你的邮箱.com
```

### 7.3 数据安全

- 用户上传的图片和文字仅在 Netlify Function 的内存中临时存在，分析完成后不存储
- 不使用任何数据库
- 不提供分析结果的分享、导出、传播功能
- 不提供批量分析功能

---

## 八、环境变量配置

### Netlify 后台设置（Site settings → Environment variables）

| 变量名 | 说明 | 获取方式 |
|--------|------|---------|
| DEEPSEEK_API_KEY | DeepSeek API 密钥 | deepseek.com 注册后获取 |
| QWEN_VL_API_KEY | 阿里云百炼 API 密钥 | 阿里云百炼平台注册后获取 |

> ⚠️ 这些变量不是写在代码里的 .env 文件，而是在 Netlify 网站后台手动添加的。
> 部署后如果分析请求报错，第一件事检查环境变量是否配置正确。

### DeepSeek 消费上限设置

登录 DeepSeek 平台 → API 管理 → 设置每日消费上限（建议设为 10 元/天），防止被滥用。

---

## 九、部署步骤

```
1. 代码推送到 GitHub 仓库
2. Netlify 连接 GitHub 仓库
3. 构建设置：
   - Build command: npm run build
   - Publish directory: dist
   - Functions directory: netlify/functions
4. 在 Netlify 后台添加环境变量（DEEPSEEK_API_KEY, QWEN_VL_API_KEY）
5. 触发部署
6. 访问 https://你的站点.netlify.app 测试
```

---

## 十、已知限制与后续迭代

### MVP 阶段已知限制

1. Netlify Functions 免费版超时 10 秒，复杂分析可能超时 → 后续可升级 Netlify Pro（26秒）或迁移到 Cloudflare Workers（无超时限制）
2. localStorage 容量约 5MB，存储约 50-100 次分析结果 → 后续可加导出备份功能
3. 图片分析需要先调千问 VL 获取描述，再调 DeepSeek 做性格分析，两次 API 调用 → 后续可优化为单次调用
4. 国内访问 Netlify 偶有延迟 → 后续推广可套 Cloudflare CDN 或迁移国内平台

### 迭代路线

- v1.1: 加入档案导出/导入（JSON 备份）
- v1.2: 补充分析 + 历史版本对比
- v1.3: 高级用户自有 API Key 模式（Cloudflare Workers 透传）
- v2.0: 考虑微信小程序版本
