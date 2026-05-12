# YiShun P1-1 Share Landing UX 必修项修复报告

## 30 秒结论

- 已修复 analyst UX Fail 的 2 个必修项：过期 `/s/[shareId]` 不再展示原 public payload；landing 离开/隐藏/卸载时记录 `share_landing_exit`。
- P0 分享入口不改动，本次只修改 `/s/[shareId]` landing 读取与客户端埋点。
- 验证通过：`git diff --check`、`npm run lint`、`npm run build`。
- 证据目录：`/Users/xiajarvan/.openclaw/workspace/opc/evidence/yishun-p1-share-landing-ux-fix`。

## 变更文件

- `app/s/[shareId]/page.tsx`
  - 增加 `share.expiresAt < new Date()` 判断。
  - 过期时传 `status="expired"`，保持 `payload=null`，不展示原卡片 payload。
  - 只对未过期分享累计 `clickCount`。
- `app/s/[shareId]/ShareLandingClient.tsx`
  - 增加 `share_landing_exit` 埋点。
  - 属性包含 `share_id`、`dwell_ms`、`scroll_depth`。
  - 使用 `visibilitychange` + `pagehide`，不发网络请求、不 await，不阻塞导航。
  - CTA 点击后设置 guard，避免已转化用户重复记录 exit。

## 验收点对应

| 必修项 | 修复结果 |
|---|---|
| 过期链接不能展示原 payload | Pass：Server Component 识别 expired 后不调用 `toPublicPayload`，客户端只展示通用 expired landing + CTA。 |
| expired landing + 生成今日卡 CTA | Pass：既有 CTA `/reading/start?ref=share&share_id=...` 保留，标题显示 `This YiShun card has expired`。 |
| `share_landing_exit` | Pass：隐藏/卸载时写入 local analytics queue + console/custom event，含 `dwell_ms`、`scroll_depth`、`share_id`。 |
| 不影响 P0 | Pass：未修改 P0 result/start 分享主流程。 |
| 不引入 PII | Pass：exit 埋点只含 share_id、停留时长、滚动深度。 |

## 测试命令

```bash
git diff --check
npm run lint
npm run build
```

## 测试结果

- `git diff --check`：通过，证据 `git-diff-check.txt`。
- `npm run lint`：通过，证据 `npm-run-lint.txt`。
- `npm run build`：通过，证据 `npm-run-build.txt`；route table 包含 `/s/[shareId]` 与 shares API。

## 风险 / 回滚

- 风险：`share_landing_exit` 使用 local analytics queue；满足当前 PRD 最小 dev collector，但仍未接真实 collector。
- 风险：未跑真实 DB smoke；本地未确认安全 P1 `DATABASE_URL`，以 build/lint/static inspection 作为本次最小替代验证。
- 回滚：撤销 `app/s/[shareId]/page.tsx` 与 `app/s/[shareId]/ShareLandingClient.tsx` 本次修改即可。

## Superpowers / skills 使用证明

### 收到的 Superpowers/skills

- `using-superpowers`
- `brainstorming`
- `writing-plans`
- `executing-plans`
- `test-driven-development`
- `systematic-debugging`
- `using-git-worktrees`
- `requesting-code-review`
- `receiving-code-review`
- `verification-before-completion`
- `finishing-a-development-branch`

### 实际使用的 Superpowers/skills

- `using-superpowers` / `nextjs-expert`：按 OpenClaw skill 选择规则读取 `~/.openclaw/skills/nextjs-expert/SKILL.md`，遵守 App Router Server/Client 边界与 async params。
- `writing-plans` + `executing-plans`：按「读 UX 报告 → 定位实现 → 修复 expired → 修复 exit analytics → 验证 → 报告/ADS」执行。
- `systematic-debugging`：lint 首次失败后，基于 `react-hooks/purity` 真实错误移除 render 阶段 `Date.now()` 调用。
- `verification-before-completion` / `test-driven-development`：完成前运行 `git diff --check`、`npm run lint`、`npm run build`，并保存证据。
- `using-git-worktrees`：沿用当前隔离分支/worktree `feat/p1-share-landing` 完成修复，未污染其他目录。
- `requesting-code-review` / `receiving-code-review`：本轮为 analyst UX 验收 Fail 后的修复闭环，修复项逐条对应验收报告。

### 证据/行为

- 已读取 skill：`~/.openclaw/skills/nextjs-expert/SKILL.md`。
- 已读取 UX 验收报告：`/Users/xiajarvan/.openclaw/workspace/knowledge-base/yishun-p1/YISHUN_P1_SHARE_LANDING_UX_ACCEPTANCE_2026-05-13.md`。
- 静态证据：`/Users/xiajarvan/.openclaw/workspace/opc/evidence/yishun-p1-share-landing-ux-fix/static-inspection.txt`。
- 验证证据：`git-diff-check.txt`、`npm-run-lint.txt`、`npm-run-build.txt`。

## 下一步

- main 复跑验证后交 analyst 二次 UX 验收。
- 若进入部署，operator 仍需确认 P1 ShareLink migration 已在目标环境执行。
