# YiShun UI/UX Spec 二次实现 — 2026-05-15

## 结论
已读取并按设计规范 `/Users/xiajarvan/.openclaw/workspace-promotion/deliverables/yishun-consumer-uiux-redesign-spec-20260515.md` 完成 P0 二次实现。底部三个按钮从同权重/临时按钮升级为消费级三层级 Action Bar；返回按钮升级为语义化 Back Control；reading/start、result、reports、membership 四个关键页已接入统一组件与状态反馈。本地 lint/build/smoke 通过，未 push，未触发 GitHub Actions。

## 变更文件
### 新增关键组件
- `app/components/YiShunBackControl.tsx`
- `app/components/YiShunBottomActionBar.tsx`

### 兼容/包装组件
- `app/components/AppBackLink.tsx`：改为导出 `YiShunBackControl`。
- `app/components/AppActionBar.tsx`：改为包装 `YiShunBottomActionBar`，支持 primary/secondary/tertiary、loading、disabled reason。

### 关键页接入
- `app/reading/start/page.tsx`：三步底部 Action Bar；主/次/辅助层级；草稿保存；未填生日 disabled reason；查看示例入口；loading 文案。
- `app/reading/result/page.tsx`：底部保存/分享/重新测算；保存 loading/success/error；分享 loading/success；报告边界说明。
- `app/reports/page.tsx`：底部继续查看/分享/管理；无报告时分享 disabled reason；管理保存状态。
- `app/membership/page.tsx`：底部继续开通/恢复购买/权益说明；checkout 引导 loading；恢复购买提示。

### 全站消费页返回替换
- `app/components/Navigation.tsx`
- `app/components/SeoToolLanding.tsx`
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/profile/page.tsx`
- `app/tools/page.tsx`
- `app/tools/sample/page.tsx`
- `app/learn/bazi-basics/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/account/delete/page.tsx`
- `app/samples/page.tsx`
- `app/samples/[sampleId]/page.tsx`

> admin 后台仍保留内部裸箭头；本轮按设计规范 P0 聚焦消费级用户路径。

## 关键组件说明
### YiShunBottomActionBar
- 三按钮结构：tertiary / secondary / primary，主按钮最大权重。
- 移动端 fixed + `env(safe-area-inset-bottom)`；桌面端自动变为页面内操作区。
- 每个按钮最小 48px 高，满足触控面积要求。
- 状态：default / active / disabled / loading / success / error。
- 支持 disabled reason、errorText、statusText，避免点击无反馈。

### YiShunBackControl
- 不再裸箭头：方向符号 + 语义文案 + 上下文。
- 最小 44x44px，focus ring 可见。
- 支持 `href` 和 history back；history 不可用时回落到安全页。
- aria-label 包含目标/上下文。

## 测试输出
- `npm run lint`：通过。
- `npm run build`：通过；Next.js 16.2.6 编译、TypeScript、55 个静态页生成成功；仅有既有 middleware deprecated 警告。
- `BASE_URL=http://localhost:3000 EVIDENCE_DIR=/Users/xiajarvan/.openclaw/workspace/opc-evidence/yishun-uiux-spec-implementation-20260515 npm run smoke:p0-new-user`：通过 4/4（en/zh desktop + en/zh mobile）。
- `git diff --check`：通过。
- 裸箭头检查：消费级用户路径已替换；仅 admin 内部列表页仍有 `←`。

## 截图 / DOM 证据
证据目录：`/Users/xiajarvan/.openclaw/workspace/opc-evidence/yishun-uiux-spec-implementation-20260515`

重点文件：
- `start-actionbar.png` / `start-actionbar.dom.json`
- `result-actionbar.png` / `result-actionbar.dom.json`
- `reports-actionbar.png` / `reports-actionbar.dom.json`
- `membership-actionbar.png` / `membership-actionbar.dom.json`
- `home-bottom-nav.png` / `home-bottom-nav.dom.json`
- P0 smoke 全套：`en/zh desktop/mobile` 的 home/result/reports 截图与 summary。

## 是否符合“消费级产品而不是 AI 玩具”
符合 P0 标准：
- 底部按钮不再是三个同权重临时按钮，而是主/次/辅助层级。
- 返回按钮不再是裸箭头，具备上下文、aria、focus ring。
- reading/start 有 disabled reason、草稿、示例、loading。
- result 有保存/分享状态反馈和错误兜底。
- reports 有继续/分享/管理路径，空分享 disabled reason。
- membership 有继续开通、恢复购买、权益说明和支付信任文案。
- 视觉上克制：深色半透明、细边框、低强度阴影，避免廉价强发光和 AI 玩具文案。

## 仍需设计确认
- 底部几何 icon 是否升级为品牌 SVG icon（P1）。
- admin 后台是否也纳入统一 Back Control（非消费级 P0）。
- membership 底部主按钮目前滚动到推荐方案/登录，真实一键 checkout 可在 Stripe 产品稳定后补。

## Superpowers / Skills 使用证明
- 收到的 Superpowers/skills：using-superpowers, brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, using-git-worktrees, requesting-code-review, receiving-code-review, verification-before-completion, finishing-a-development-branch。
- 实际使用：frontend-design（前一轮已读取 `~/.openclaw/skills/frontend-design/SKILL.md`，本轮按消费级/克制/状态完整方向执行）、design spec implementation（读取设计规范原文）、verification-before-completion（lint/build/smoke/diff-check/DOM 截图）。
- 系统化调试：保留 smoke 依赖的 Continue / Find my best timing 可访问名称，避免 UI 改版破坏既有 E2E。

## 风险 / 回滚
- 风险：品牌 icon 仍是字符级 P0 实现，建议后续替换 SVG。
- 回滚：还原新增 `YiShunBackControl/YiShunBottomActionBar` 及关键页接入即可。
