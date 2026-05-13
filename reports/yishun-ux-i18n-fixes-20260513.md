# YiShun UX i18n 修复交付 - 2026-05-13

## 结论
已本地修复 operator UX 审计中的 P0/P1 文案问题，未推送/未发布，等待 main 统一验收。

## 根因
- BirthDateTimePicker 内部年月日时分标签直接写英文/局部 isZh，未完全复用 i18n key。
- `/reports`、`/tools/sample`、`/membership` 存在页面内硬编码英文或中英文分支散落，部分示例页英文 copy 还误写为 `{copy.demo}` 占位字符串。

## 变更文件
- `app/components/BirthDateTimePicker.tsx`
- `app/reports/page.tsx`
- `app/tools/sample/page.tsx`
- `app/membership/page.tsx`
- `lib/i18n.ts`
- `package.json`
- `scripts/i18n-ux-copy-smoke.mjs`

## 修复内容
- P0 BUG-01：BirthDateTimePicker 年/月/日/时/分改为 `dateTime.*` i18n key；英文仍显示 Year/Month/Day/Hour/Minute。
- P0 BUG-02：`/reports` 标题、回访、连续天数、历史、空态、CTA 全部接入 `reports.*` i18n key。
- P1 BUG-03：`/tools/sample` 资料/四柱/五行/十神/CTA/返回 aria-label 接入 `sample.*`/`common.goBack`，修复英文占位字符串。
- P1 BUG-04：`/membership` 核心副文本、权益、CTA、徽标接入 `membership.*` i18n key；产品名在英文保留，中文显示免费/月度/年度会员与单次咨询。
- 新增 Playwright smoke：覆盖 zh-CN 下指定英文残留不再渲染、en 下核心文案仍可读。

## 测试结果
- `npm run lint` ✅ 通过
- `npm run build` ✅ 通过（仅 Next.js middleware deprecated warning，非本次引入）
- `YISHUN_BASE_URL=http://localhost:3100 npm run smoke:i18n-language` ✅ 通过
- `YISHUN_BASE_URL=http://localhost:3100 npm run smoke:i18n-ux` ✅ 通过，覆盖 `/register`、`/reading/start`、`/reports`、`/tools/sample`、`/membership`

## Superpowers 使用证明
### 收到的 Superpowers/skills
- using-superpowers / dispatching-parallel-agents / subagent-driven-development；注入列表还包含 brainstorming、writing-plans、executing-plans、test-driven-development、systematic-debugging、verification-before-completion 等。

### 实际使用的 Superpowers/skills
- 读取 `nextjs-expert` SKILL.md；按系统调试定位硬编码来源；用回归 smoke 验证 zh-CN/en 双语；完成前执行 lint/build/smoke 验证。

### 证据/行为
- `scripts/i18n-ux-copy-smoke.mjs`、本报告测试命令、ADS 证据文件。

## 风险/回滚
- 风险：其他未在 operator 清单里的页面仍可能有 SEO/学习页英文，这是本任务范围外；`/membership` 价格 `$` 按产品/支付语境保留。
- 回滚：撤销上述 7 个文件改动即可恢复。

## 下一步
main 统一做产品验收；如需要可再扩展 smoke 到全站文案扫描。
