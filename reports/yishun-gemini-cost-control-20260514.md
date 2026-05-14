# YiShun Gemini 成本控制交付报告

## 结论
已落地最小成本控制：`/api/bazi/preview` 默认不调用 Gemini，只有请求体显式 `enableAi: true` 才进入 AI 路径；服务端支持 `YISHUN_GEMINI_SERVER_ENABLED=0` 总开关，并在真实 Gemini 请求前增加采样、每日预算、内存缓存和输出 token 上限。fallback 保留。

## 变更文件
- `app/api/bazi/preview/route.ts`
  - mock header 仅在 `YISHUN_ENABLE_GEMINI_MOCKS=1` 时生效。
  - AI 调用改为 `enableAi === true` 显式启用。
- `lib/gemini-bazi-enrichment.ts`
  - 增加 Gemini key env 兼容名读取（仅引用环境变量名，不输出密钥）。
  - 增加服务端开关 `YISHUN_GEMINI_SERVER_ENABLED=0`。
  - 接入成本 guard：预算超限 `budget_exceeded`、采样跳过 `sampled_out`、缓存命中复用结果。
  - 降低 temperature，并增加 `maxOutputTokens` 限制。
- `lib/gemini-cost-guard.ts`
  - 新增最小成本控制模块：稳定 hash key、内存 TTL cache、采样率、每日内存预算、输出 token 上限。
- `scripts/gemini-hybrid-smoke.mjs`
  - 增加默认省略 `enableAi` fallback 覆盖。
  - mock 成功/失败路径统一显式 `enableAi: true`。
  - 增加可选预算 guard smoke：`EXPECT_GEMINI_GUARD_REASON=budget_exceeded`。

## 测试命令
```bash
npm run lint
npm run build
YISHUN_ENABLE_GEMINI_MOCKS=1 YISHUN_GEMINI_DAILY_LIMIT=0 GEMINI_API_KEY_YISHUN=dummy-key npm run start -- -p 3127
BASE_URL=http://localhost:3127 EVIDENCE_DIR=/Users/xiajarvan/.openclaw/workspace/opc-evidence/yishun-gemini-cost-control-20260514-smoke EXPECT_GEMINI_GUARD_REASON=budget_exceeded npm run smoke:gemini-hybrid
```

## 测试结果
- `npm run lint`: PASS
- `npm run build`: PASS（Next.js 16.2.6，构建成功；仅有 middleware/proxy deprecation warning）
- `npm run smoke:gemini-hybrid`: PASS
  - 证据目录：`/Users/xiajarvan/.openclaw/workspace/opc-evidence/yishun-gemini-cost-control-20260514-smoke`
  - 摘要：`gemini-hybrid-smoke-summary.json`
  - 覆盖项：默认禁用、显式禁用、mock success、invalid JSON fallback、timeout fallback、API failure fallback、核心规则事实稳定、预算拦截 fallback。

## 风险/回滚
- 当前每日预算/缓存为单进程内存级，适合最小落地；多实例生产若要严格全局预算，应后续接 Redis/DB 计数器。
- `enableAi` 变为显式 opt-in，未传该字段的旧客户端会走 rules fallback；这是成本保护预期行为。
- 回滚：撤回 4 个目标文件改动即可恢复旧行为。

## 下一步
- 前端/付费链路只在合适场景传 `enableAi: true`。
- 生产建议设置：`YISHUN_GEMINI_DAILY_LIMIT`、`YISHUN_GEMINI_SAMPLE_RATE`、`YISHUN_GEMINI_CACHE_TTL_MS`、`YISHUN_GEMINI_MAX_OUTPUT_TOKENS`。

## Superpowers 使用证明
- 收到的 Superpowers/skills：`using-superpowers`、`brainstorming`、`writing-plans`、`executing-plans`、`test-driven-development`、`systematic-debugging`、`using-git-worktrees`、`requesting-code-review`、`receiving-code-review`、`verification-before-completion`、`finishing-a-development-branch`。
- 实际使用：
  - `nextjs-expert`：已读取 `~/.openclaw/skills/nextjs-expert/SKILL.md`，按 Next.js App Router Route Handler 服务端优先原则修改 API route。
  - `writing/executing-plans`：按“检查现状 → 最小实现 → smoke 覆盖 → lint/build 验证 → 精确 staging → ADS”执行。
  - `test-driven-development`：先明确成本控制验收点，再扩展 smoke 覆盖默认禁用和预算拦截。
  - `verification-before-completion`：完成前执行 lint、build、smoke 并保留证据。
- 证据/行为：
  - 技能读取：本会话读取 `~/.openclaw/skills/nextjs-expert/SKILL.md`。
  - Gate 输出：`npm run lint` PASS、`npm run build` PASS、`npm run smoke:gemini-hybrid` PASS。
  - 精确 staging：仅暂存 `app/api/bazi/preview/route.ts`、`lib/gemini-bazi-enrichment.ts`、`lib/gemini-cost-guard.ts`、`scripts/gemini-hybrid-smoke.mjs`。
