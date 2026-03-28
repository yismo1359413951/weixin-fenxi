# AGENTS.md — PersonaLens v1.0

## 项目简介

社交人格**自我分析**成长工具。用户上传**本人**的微信头像、朋友圈截图、聊天记录等社交碎片信息，AI 分析用户本人的 MBTI 人格类型，输出恋爱/销售/职场/社交四场景的自我成长策略。

> 🚨 合规铁律：产品定位是「自我人格分析」，全流程文案、功能设计、placeholder、按钮文字全部指向「你本人」「我的」「自我」。绝对禁止任何引导、暗示、鼓励分析他人的表述。违反此规则的代码必须立即修改。

---

## 技术栈

- **前端框架**: React 18 + Vite
- **样式**: TailwindCSS v4（使用 @tailwindcss/vite 插件，无 tailwind.config.js）
- **图标**: lucide-react
- **路由**: react-router-dom v6
- **后端**: Netlify Functions（Node.js）
- **文字分析 AI**: DeepSeek V3 API（api.deepseek.com，兼容 OpenAI 格式）
- **图片分析 AI**: 阿里云千问 VL API（dashscope.aliyuncs.com，兼容 OpenAI 格式）
- **部署**: Netlify（前端 + Functions 同一平台）
- **存储**: 浏览器 localStorage（仅存分析结果，不存原始数据）

---

## UI 风格规范（严格遵守）

### 色彩

```
主色：
  珊瑚红   #FF6B6B   → 按钮、重点提示、CTA
  薄荷绿   #6BCB77   → 成功状态、正面信息
  奶油黄   #FFD93D   → 警告、置信度提示
  天空蓝   #4D96FF   → 链接、次要按钮、信息提示

背景色：
  奶白     #FFFBF5   → 页面背景（不用纯白 #FFFFFF）
  浅灰     #F7F3EE   → 卡片背景

文字色：
  主文字   #2D2D2D   → 标题、正文
  次文字   #6B6B6B   → 辅助说明
  弱文字   #A0A0A0   → placeholder
```

### 字体

```css
font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif;
```

在 index.css 全局设置，确保中文字体在所有设备上显示一致。

### 风格关键词

- 治愈系鲜艳风格
- 大量 emoji 作为功能图标和装饰（不是纯装饰，要有功能含义）
- 圆角：卡片用 `rounded-2xl`，按钮用 `rounded-xl`，小元素用 `rounded-lg`
- 阴影：`shadow-lg` 为主，颜色带透明度（如 `shadow-[0_4px_20px_rgba(255,107,107,0.15)]`）
- 字体大：标题至少 `text-2xl`，正文 `text-base`，行距宽 `leading-relaxed`
- 动效：分析加载时有分步 emoji 动画，结果出现时淡入（`animate-fadeIn`）

### 绝对禁止

- 深色系 / 暗黑模式
- 极简冷淡风
- 小字密排
- 纯白 #FFFFFF 背景
- 无 emoji 的纯文字界面

---

## 合规规范（最高优先级，高于一切功能需求）

### 红线规则

1. **所有文案只指向「你本人」**
   - ✅ "粘贴你自己的朋友圈文案" "上传你的微信头像" "我的沟通风格分析"
   - ❌ "粘贴对方的聊天记录" "看透客户性格" "分析 crush" "读懂任何人"

2. **首屏必须有不可跳过的三重合规弹窗**（ComplianceModal 组件）
   - 弹窗在 localStorage 中 `personalens_compliance_agreed !== 'true'` 时强制展示
   - 必须手动勾选两个 checkbox + 点击确认按钮才能进入
   - 绝对不能默认勾选、不能跳过、不能折叠

3. **页面底部永久展示免责声明和投诉邮箱**（Footer 组件）
   - 不可折叠、不可隐藏、不可被其他元素遮挡
   - 在每个页面都要展示

4. **不提供任何分享/导出/传播功能**
   - 不做"生成结果图片"功能
   - 不做"复制结果链接"功能
   - 不做"分享到朋友圈"功能

5. **不提供批量分析功能**

6. **不存储用户上传的任何原始信息**
   - localStorage 只存分析结果的 JSON
   - 不存 base64 图片、不存原始文字

---

## 核心功能规范

### 输入面板（InputPanel）

| 字段 | 类型 | 必填 | placeholder |
|------|------|------|-------------|
| 分析标题 | 文字输入 | ✅ | "给这次自我分析起个名字" |
| 我的微信头像 | 图片上传（1张） | 可选 | "上传你自己的微信头像" |
| 我的背景图 | 图片上传（1张） | 可选 | "上传你自己的微信背景图" |
| 我的朋友圈截图 | 图片上传（最多6张） | 可选 | "上传你自己的朋友圈截图" |
| 我的聊天记录 | 多行文本 | 可选 | "粘贴你自己的聊天记录或常用表达" |
| 我的个人简介 | 多行文本 | 可选 | "粘贴你的视频号/社交平台个人简介" |
| 补充描述 | 多行文本 | 可选 | "关于你自己的其他补充信息" |
| 分析侧重 | 单选 | ✅ | 恋爱成长 / 销售提升 / 职场优化 / 社交突破 |

**校验规则：**
- texts 和 images 合计至少 2 项才能提交
- 不满足时禁用提交按钮，显示提示"至少提供两种信息，分析才够准确哦～"

### 结果页（Result）

**顶部 Tab 切换：** 🎯 简洁版 | 📊 深度版

**简洁版：**
- MBTI 类型大字展示 + 一句话说明
- 置信度星级（1-5 星）
- 核心 3 条结论
- 当前场景的 5 条成长建议

**深度版：**
- 一、人格类型判断（MBTI + 依据）
- 二、性格特征（优势/弱点/行为模式）
- 三、职业背景推测
- 四、沟通风格（偏好/雷区/话题偏好）
- 五、四场景成长策略（恋爱/销售/职场/社交，每个场景的自我优化建议）
- 六、注意事项

**置信度低（1-2星）时：**
- 顶部显示奶油黄警告 banner
- 提示"你提供的信息较少，分析准确度有限。如果补充更多信息（如朋友圈截图、聊天记录），分析会更准确。"
- 附「补充信息重新分析」按钮，跳回 Home 页

### 档案库（Archive）

- 列出所有历史分析的卡片
- 每张卡片：标题 + MBTI 类型 + 场景标签 + 分析时间 + 置信度星级
- 点击卡片跳转到 /result/:id
- 提供「清空全部档案」按钮（需二次确认）

---

## 技术实现规范

### API 调用

- 前端调用 `/.netlify/functions/analyze`，不直接调 DeepSeek/千问
- API Key 只存在 Netlify 环境变量（DEEPSEEK_API_KEY, QWEN_VL_API_KEY）
- 前端代码绝对不能出现任何 API Key

### 图片处理

- 所有图片在前端完成压缩后再传给后端
- 压缩规则：最长边 ≤ 1200px，JPEG 质量 0.7，单张 ≤ 500KB
- 如果 0.7 质量仍超 500KB，降到 0.5 再试
- 处理 EXIF 方向信息（解决 iOS Safari 拍照旋转问题）
- 总图片大小 ≤ 4MB

### Netlify Function

- 文件位置：`netlify/functions/analyze.js`
- 格式：CommonJS（`exports.handler = async (event) => {}`）
- 不使用 Express，不需要 CORS 配置（同域部署）
- 只接受 POST 方法
- 超时风险：免费版 10 秒限制，通过精简 prompt + 合理 max_tokens 缓解

### JSON 结果处理

- 后端解析 DeepSeek 返回的 JSON 时，必须先走 jsonRepair 修复逻辑
- 修复后走 validator 校验
- 校验失败自动 retry 1 次（最多 2 次请求）
- 2 次都失败返回友好错误提示

### localStorage

- 所有 key 统一前缀 `personalens_`
- 存储结果时不存储原始图片和文字
- 存储结构：`{ id, name, purpose, mbti, confidence, timestamp, result }`

### 响应式设计

- **Mobile-first**：所有组件先设计手机端样式，再用 `md:` `lg:` 适配桌面端
- 图片上传组件在手机端支持从相册选择
- 结果页在手机端卡片竖排，桌面端可双栏

### SPA 路由

- `public/_redirects` 文件内容：`/* /index.html 200`
- 确保直接访问 /result/xxx 或 /archive 不会 404

---

## 错误处理规范

1. **网络错误** → 显示"网络连接出了点问题，请检查网络后重试 🌐"
2. **API 超时** → 显示"分析内容较多，服务器开小差了，请稍后重试 ⏳"
3. **JSON 解析失败（retry 后仍失败）** → 显示"AI 这次发挥不太稳定，请重新分析一次 🔄"
4. **API Key 未配置** → 显示"服务配置异常，请联系管理员"
5. **信息不足** → 禁用提交按钮，显示"至少提供两种信息，分析才够准确哦～ 📝"
6. **图片过大** → 显示"图片太大了，请选择小一点的图片（单张不超过5MB）🖼️"
7. **所有错误状态必须有友好的中文提示和 emoji，绝对不裸露技术报错**

---

## 组件清单

| 组件 | 功能 | 关键注意事项 |
|------|------|-------------|
| ComplianceModal | 三重合规弹窗 | 最高优先级，必须不可跳过 |
| InputPanel | 信息输入面板 | 所有 placeholder 指向"你自己" |
| ImageUploader | 图片上传+压缩预览 | 前端压缩，支持手机相册 |
| LoadingSteps | 分步加载动画 | 4-5 步 emoji 动画 |
| ResultCard | 简洁版结果 | MBTI + 置信度 + 3 条结论 + 场景建议 |
| ResultReport | 深度版报告 | 完整 6 部分报告 |
| ScenarioTabs | 场景切换 | 恋爱/销售/职场/社交 |
| ConfidenceBanner | 低置信度警告 | 1-2 星时展示 |
| ArchiveList | 档案卡片列表 | 从 localStorage 读取 |
| Footer | 底部免责声明 | 每个页面都要展示 |

---

## 开发顺序

```
Phase 1（搭骨架）：
  - 初始化项目（Vite + React + TailwindCSS v4 + lucide-react + react-router-dom）
  - 配置 netlify.toml
  - 创建 _redirects 文件
  - App.jsx 路由配置
  - ComplianceModal 合规弹窗
  - Footer 免责声明

Phase 2（输入页）：
  - InputPanel 输入面板
  - ImageUploader 图片上传+压缩
  - Home.jsx 首页整合

Phase 3（后端 API）：
  - netlify/functions/analyze.js（先用 mock 数据）
  - 接入千问 VL API（图片描述）
  - 接入 DeepSeek API（性格分析）
  - jsonRepair + validator

Phase 4（结果页）：
  - ResultCard 简洁版
  - ResultReport 深度版
  - ScenarioTabs 场景切换
  - ConfidenceBanner 置信度警告
  - LoadingSteps 加载动画
  - Result.jsx 整合

Phase 5（档案+收尾）：
  - storage.js 存储工具
  - ArchiveList 档案列表
  - Archive.jsx 档案页
  - UI 打磨、移动端适配
  - 部署 Netlify
```
