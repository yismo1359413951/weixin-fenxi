import { MBTI_EMOJI } from '../utils/mbtiEmoji'
import { PURPOSE_SCENE_TITLE } from '../utils/purposeLabels'

function SectionCard({ title, children }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-[#F7F3EE] md:p-7">
      <h2 className="mb-4 text-lg font-semibold leading-relaxed text-[#2D2D2D] md:text-xl">
        {title}
      </h2>
      <div className="text-base leading-relaxed text-[#2D2D2D]">{children}</div>
    </section>
  )
}

function BulletList({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null
  return (
    <ul className="mt-2 space-y-2">
      {items.map((t, i) => (
        <li
          key={i}
          className="flex gap-2 rounded-xl bg-[#FFFBF5] px-3 py-2 ring-1 ring-[#F7F3EE]"
        >
          <span className="text-[#FF6B6B]">•</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ResultReport({ purpose, result }) {
  const strengths = Array.isArray(result.strengths) ? result.strengths : []
  const weaknesses = Array.isArray(result.weaknesses) ? result.weaknesses : []
  const behaviorPatterns = Array.isArray(result.behavior_patterns)
    ? result.behavior_patterns
    : []
  const taboos = Array.isArray(result.taboos) ? result.taboos : []
  const topicPreferences = Array.isArray(result.topic_preferences)
    ? result.topic_preferences
    : []
  const advice = Array.isArray(result.advice) ? result.advice : []
  const warnings = Array.isArray(result.warnings) ? result.warnings : []
  const sceneTitle =
    purpose && PURPOSE_SCENE_TITLE[purpose]
      ? PURPOSE_SCENE_TITLE[purpose]
      : '当前侧重场景'

  const mbti = result.mbti
  const emoji = MBTI_EMOJI[mbti] ?? '🧠'
  const conf =
    typeof result.confidence === 'number' ? result.confidence : 1

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionCard title="一、🧠 人格类型判断">
        <p>
          你的 MBTI 倾向为{' '}
          <strong className="text-[#FF6B6B]">
            {mbti} {emoji}
          </strong>
          ，置信度为 {conf} / 5 星。
        </p>
        <p className="mt-3">
          <strong>判断依据（供你自我对照）：</strong>
        </p>
        <p className="mt-2 rounded-xl bg-[#FFFBF5] px-3 py-2 leading-relaxed ring-1 ring-[#F7F3EE]">
          {result.mbti_reason?.trim() || '—'}
        </p>
      </SectionCard>

      <SectionCard title="二、💪 性格特征">
        <p className="font-medium text-[#6BCB77]">你的优势</p>
        <BulletList items={strengths} />
        <p className="mt-4 font-medium text-[#FF6B6B]">你可以留意的成长点</p>
        <BulletList items={weaknesses} />
        <p className="mt-4 font-medium text-[#4D96FF]">你的行为模式</p>
        <BulletList items={behaviorPatterns} />
      </SectionCard>

      <SectionCard title="三、💼 职业背景推测">
        <p>{result.career_guess?.trim() || '—'}</p>
      </SectionCard>

      <SectionCard title="四、💬 沟通风格">
        <p>
          <strong>你的沟通风格：</strong>
          {result.communication_style?.trim() || '—'}
        </p>
        <p className="mt-3 font-medium">你在表达时可以避开的雷区</p>
        <BulletList items={taboos} />
        <p className="mt-4 font-medium">你更容易聊得投入的话题方向</p>
        <BulletList items={topicPreferences} />
      </SectionCard>

      <SectionCard title="五、🎯 场景成长建议">
        <p className="mb-4 text-[#6B6B6B]">
          以下为针对你选择的「{sceneTitle}」场景的 7
          条自我优化方向，全部围绕你自己的表达与行动。
        </p>
        <BulletList items={advice} />
      </SectionCard>

      <SectionCard title="六、⚠️ 注意事项">
        {warnings.length > 0 ? (
          <BulletList items={warnings} />
        ) : (
          <p className="text-[#6B6B6B]">暂无额外提示。</p>
        )}
      </SectionCard>
    </div>
  )
}
