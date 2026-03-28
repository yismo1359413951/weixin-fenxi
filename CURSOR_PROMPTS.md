# PersonaLens — Cursor 开发指令

## 使用说明

以下是分阶段的 Cursor 开发指令。每完成一个阶段，确认功能正常后，再进入下一个阶段。

---

## 第一阶段指令（搭建骨架 + 合规弹窗 + 底部免责）

将以下内容粘贴到 Cursor Chat 中：

```
请阅读项目根目录的 AGENTS.md 和 TECH.md，严格按照其中的所有规范开发。

第一阶段任务：搭建完整项目骨架 + 合规组件

1. 项目初始化
   - 确认 Vite + React + TailwindCSS v4 已安装配置好
   - 安装 react-router-dom、lucide-react
   - TailwindCSS v4 使用 @tailwindcss/vite 插件，在 vite.config.js 中配置，无需 tailwind.config.js
   - 在 src/index.css 中用 @import "tailwindcss" 引入，并添加中文字体设置：
     body { font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif; }

2. 创建 public/_redirects 文件，内容：/* /index.html 200

3. 创建 netlify.toml（已有，确认即可）

4. src/App.jsx：配置三个路由
   - / → Home
   - /result/:id → Result
   - /archive → Archive
   三个页面先用占位内容

5. src/components/ComplianceModal.jsx：首屏三重合规弹窗
   严格按 AGENTS.md 的合规规范实现：
   - 检查 localStorage 的 personalens_compliance_agreed
   - 不为 true 时弹出全屏遮罩弹窗，不可关闭、不可点击背景关闭
   - 第一部分：大字警告提示（使用 ⚠️ emoji）
   - 第二部分：两个 checkbox，必须手动勾选
     ☐ 承诺仅上传本人信息...
     ☐ 已阅读并同意用户协议和隐私政策
   - 底部：[进入工具] 按钮，两个都勾选后才可点击（否则灰色禁用）
   - 点击后 localStorage 存入 personalens_compliance_agreed = true
   - 风格：白色圆角卡片，珊瑚红 #FF6B6B 强调色，圆角 rounded-2xl

6. src/components/Footer.jsx：底部永久免责声明
   - 固定在页面底部，不可折叠
   - 包含免责声明文字和投诉邮箱
   - 使用 📌 和 📮 emoji
   - 灰色小字，但清晰可读
   - 在 App.jsx 的所有路由外部引入，确保每个页面都展示

7. src/pages/Home.jsx：首页骨架
   - 顶部标题区：大字 "🔮 PersonaLens" + 副标题 "你的社交人格自我解码器"
   - 中间：占位文字"输入面板开发中"
   - 背景色 #FFFBF5

8. 整体样式：
   - 背景色 #FFFBF5（奶白色）
   - 所有卡片 rounded-2xl shadow-lg
   - 大字标题、宽行距、治愈系配色
   - Mobile-first 响应式

完成后告诉我每个文件的状态，并截图展示首页效果。
```

---

## 第二阶段指令（输入面板 + 图片压缩）

```
请继续按 AGENTS.md 和 TECH.md 的规范开发第二阶段。

第二阶段任务：信息输入面板 + 图片上传压缩

1. src/utils/imageCompress.js：前端图片压缩工具
   - 接收 File 对象，返回 Promise<string>（base64，不含前缀）
   - 用 canvas 压缩：最长边不超过 1200px，等比缩放
   - JPEG 质量先 0.7，超过 500KB 则降到 0.5
   - 处理 EXIF 方向信息（读取 EXIF orientation，canvas 绘制时矫正旋转）
   - 导出时去掉 "data:image/jpeg;base64," 前缀

2. src/components/ImageUploader.jsx：图片上传组件
   - 接收 props：maxCount（最大张数）、label、onImagesChange
   - 展示为虚线边框的上传区域，点击可选择图片，支持手机端相册选择
   - 上传后显示缩略图预览，每张图右上角有删除按钮（X）
   - 每张图上传后自动调用 imageCompress 压缩
   - 超过 maxCount 时禁止继续添加，提示"最多上传 {maxCount} 张"
   - 风格：虚线边框 border-dashed，薄荷绿 #6BCB77 边框色，圆角 rounded-xl
   - 上传区域中心显示 📷 emoji + "点击上传"

3. src/components/InputPanel.jsx：完整信息输入面板
   严格按 AGENTS.md 的输入面板规范实现，所有 placeholder 指向「你自己」：
   - 分析标题：文字输入，默认值 "我的社交人格分析"
   - 我的微信头像：ImageUploader maxCount=1
   - 我的背景图：ImageUploader maxCount=1
   - 我的朋友圈截图：ImageUploader maxCount=6
   - 我的聊天记录：textarea，placeholder "粘贴你自己的聊天记录或常用表达"
   - 我的个人简介：textarea，placeholder "粘贴你的视频号/社交平台个人简介"
   - 补充描述：textarea，placeholder "关于你自己的其他补充信息"
   - 分析侧重：四个可选按钮（💕 恋爱成长 / 💼 销售提升 / 🏢 职场优化 / 🤝 社交突破）
   - 底部提交按钮：🔮 开始解码我的人格
   - 每个 textarea 限制 3000 字，右下角显示字数统计
   - 校验：texts 和 images 合计 < 2 项时，提交按钮禁用，下方提示"至少提供两种信息，分析才够准确哦～ 📝"
   - 点击提交后按钮立即禁用 + loading 状态，防重复提交

4. 更新 src/pages/Home.jsx：
   - 替换占位内容为 InputPanel 组件
   - 提交时先 console.log 打印收集到的数据，验证数据结构正确

整体风格严格遵守 AGENTS.md：治愈系、大量 emoji、圆角卡片、奶白背景、大字宽行距。
完成后截图展示输入面板效果（包含手机端和桌面端）。
```

---

## 第三阶段指令（后端 API + AI 接入）

```
请继续按 AGENTS.md 和 TECH.md 的规范开发第三阶段。

第三阶段任务：后端 Netlify Function + AI API 接入

1. netlify/functions/analyze.js：核心分析接口
   格式必须是 Netlify Function 格式（不是 Express）：
   
   exports.handler = async (event) => {
     // 只接受 POST
     if (event.httpMethod !== 'POST') {
       return { statusCode: 405, body: JSON.stringify({ success: false, error: '不支持的请求方式' }) };
     }
     // ... 处理逻辑
     return { statusCode: 200, body: JSON.stringify({ success: true, data: result }) };
   };

   处理流程严格按 TECH.md 第五节实现：
   a. 解析请求体，校验必填字段
   b. 如果有图片，调千问 VL API 获取图片描述（每张图单独调用）
   c. 拼接完整 prompt（使用 TECH.md 中的 prompt 模板）
   d. 调 DeepSeek API 生成分析结果
   e. JSON 修复 → 校验 → 失败则 retry 1 次
   f. 返回结果
   
   API 调用格式严格按 TECH.md 的 5.2 和 5.3 节实现
   API Key 从 process.env.DEEPSEEK_API_KEY 和 process.env.QWEN_VL_API_KEY 读取

2. 在 analyze.js 中内嵌 jsonRepair 和 validator 逻辑
   严格按 TECH.md 的 5.5 和 5.6 节实现

3. src/utils/api.js：前端 API 调用封装
   
   export async function analyzePersona({ name, purpose, texts, images }) {
     const response = await fetch('/.netlify/functions/analyze', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ name, purpose, texts, images })
     });
     const data = await response.json();
     if (!data.success) throw new Error(data.error || '分析失败');
     return data.data;
   }

4. 更新 Home.jsx：
   - 提交时调用 analyzePersona
   - 成功后生成 id，存入 localStorage（key: personalens_result_{id}）
   - 存储结构：{ id, name, purpose, mbti: result.mbti, confidence: result.confidence, timestamp: Date.now(), result }
   - 跳转到 /result/{id}
   - 错误时显示友好提示（按 AGENTS.md 的错误处理规范）

5. 本地开发调试：
   - 安装 netlify-cli：npm install -g netlify-cli
   - 创建 .env 文件（仅本地开发用，已在 .gitignore 中排除）：
     DEEPSEEK_API_KEY=你的key
     QWEN_VL_API_KEY=你的key
   - 启动命令：netlify dev（会同时启动 Vite 和 Functions）

完成后用真实 API Key 测试一次完整流程，确认数据能正确流转。
```

---

## 第四阶段指令（结果页 + 加载动画）

```
请继续按 AGENTS.md 和 TECH.md 的规范开发第四阶段。

第四阶段任务：结果展示页 + 加载动画

1. src/components/LoadingSteps.jsx：分步加载动画
   - 接收 props：isLoading
   - 按时间依次展示以下步骤（每步 3-5 秒切换）：
     📋 正在读取你提供的信息...
     🔍 正在分析你的性格特征...
     💡 正在生成成长建议...
     ✨ 即将解锁你的人格密码...
   - 超过 30 秒显示：⏳ 分析内容较多，请再等等...
   - 全屏遮罩，中心卡片展示当前步骤，emoji 有轻微弹跳动画
   - 背景半透明模糊

2. src/components/ScenarioTabs.jsx：场景切换 Tab
   - 四个 Tab：💕 恋爱 / 💼 销售 / 🏢 职场 / 🤝 社交
   - 当前选中 Tab 高亮（珊瑚红底色）
   - 切换时内容区域淡入过渡

3. src/components/ConfidenceBanner.jsx：低置信度警告
   - 当 confidence ≤ 2 时展示
   - 奶油黄 #FFD93D 背景的警告 banner
   - 内容："⚡ 你提供的信息较少，分析准确度有限。补充更多信息可以让分析更准确哦～"
   - 附「补充信息重新分析」按钮，点击跳回首页

4. src/components/ResultCard.jsx：简洁版结果
   - 大字展示 MBTI 类型（如 "ENTJ"）+ emoji + 一句话说明
   - 置信度星级展示（⭐ 实心/空心星星）
   - 3 条核心结论（编号卡片）
   - 当前场景的建议列表（每条建议一个小卡片）

5. src/components/ResultReport.jsx：深度版报告
   - 分 6 个部分展示，每部分一个卡片：
     一、🧠 人格类型判断
     二、💪 性格特征
     三、💼 职业背景推测
     四、💬 沟通风格
     五、🎯 场景成长策略（用 ScenarioTabs 切换四个场景）
     六、⚠️ 注意事项
   - 每个部分的标题用 emoji + 中文

6. src/pages/Result.jsx：结果页整合
   - 从 URL 参数获取 id
   - 从 localStorage 读取 personalens_result_{id}
   - 找不到则显示"分析记录不存在，可能已被清除"
   - 顶部：Tab 切换 🎯 简洁版 / 📊 深度版
   - 根据 Tab 渲染 ResultCard 或 ResultReport
   - 如果 confidence ≤ 2，展示 ConfidenceBanner
   - 底部：「返回首页重新分析」按钮

7. 更新 Home.jsx：分析期间展示 LoadingSteps

8. 所有结果内容的文案方向：
   ✅ "你的沟通风格偏好是..." "你在职场中可以尝试..." "你的恋爱优势在于..."
   ❌ 绝对不出现"对方" "他/她" "目标人物"等指向他人的表述

完成后截图展示结果页效果（简洁版和深度版各一张，手机端和桌面端各一组）。
```

---

## 第五阶段指令（档案库 + 收尾打磨）

```
请继续按 AGENTS.md 和 TECH.md 的规范开发第五阶段。

第五阶段任务：档案库 + UI 打磨 + 最终检查

1. src/utils/storage.js：localStorage 操作工具
   - getAllResults()：获取所有 personalens_result_ 开头的结果，按时间倒序排列
   - getResult(id)：获取指定 id 的结果
   - saveResult(id, data)：保存结果（不存储原始图片和文字）
   - deleteResult(id)：删除指定结果
   - clearAllResults()：清空所有结果（需要保留 compliance_agreed）
   - getStorageUsage()：计算已用存储空间

2. src/components/ArchiveList.jsx：档案卡片列表
   - 每张卡片展示：标题 + MBTI 类型（大字彩色） + 场景标签 + 时间 + 置信度星级
   - 点击卡片跳转到 /result/:id
   - 卡片有 hover 效果（轻微上浮 + 阴影加深）
   - 空状态：展示 "📂 还没有分析记录，去首页开始你的第一次自我解码吧～" + 跳转按钮
   - 底部：「🗑️ 清空全部档案」按钮，点击弹出确认弹窗

3. src/pages/Archive.jsx：档案库页面
   - 顶部标题："📚 我的人格档案库"
   - 下方展示 ArchiveList
   - 展示存储空间使用量提示（如"已用 xxx KB / 5MB"）

4. 全局导航：
   - 页面顶部添加简单导航栏：🔮 首页 | 📚 档案库
   - 使用 react-router-dom 的 Link 组件
   - 导航栏固定在顶部，滚动时跟随

5. UI 打磨清单（逐项检查）：
   - [ ] 所有页面背景色 #FFFBF5
   - [ ] 所有卡片 rounded-2xl shadow-lg
   - [ ] 所有按钮 rounded-xl，有 hover 效果
   - [ ] 所有 emoji 使用正确，不缺不多
   - [ ] 手机端（375px 宽）所有元素不溢出
   - [ ] 平板端（768px 宽）布局合理
   - [ ] 桌面端（1280px 宽）内容不过度拉伸，最大宽度限制 max-w-2xl 或 max-w-4xl
   - [ ] 加载动画流畅
   - [ ] 错误提示友好
   - [ ] 首屏合规弹窗正常工作
   - [ ] Footer 免责声明在每个页面可见
   - [ ] 中文字体正确加载

6. 最终合规检查（逐项确认）：
   - [ ] 所有 placeholder 只指向"你自己/我的"
   - [ ] 没有任何文案暗示分析他人
   - [ ] 合规弹窗不可跳过，两个 checkbox 都勾选才能进入
   - [ ] 没有分享/导出/传播功能
   - [ ] 没有批量分析功能
   - [ ] Footer 免责声明和投诉邮箱在每个页面展示
   - [ ] 前端代码没有任何 API Key

7. 部署前检查：
   - [ ] npm run build 无报错
   - [ ] netlify.toml 配置正确
   - [ ] _redirects 文件在 public/ 目录下
   - [ ] .gitignore 排除了 node_modules、dist、.env
   - [ ] 代码推送到 GitHub
   - [ ] Netlify 后台已添加 DEEPSEEK_API_KEY 和 QWEN_VL_API_KEY 环境变量

完成后做一次完整的端到端测试：
打开首页 → 通过合规弹窗 → 填写信息 → 点击分析 → 看到加载动画 → 看到结果 → 切换简洁/深度 → 回到首页 → 打开档案库 → 看到历史记录 → 点击查看
```
