# YiShun V3 P0 Gap Fixes — coder delivery

**Task ID**: yishun-v3-p0-gap-fixes  
**Agent**: coder  
**Date**: 2026-05-14 GMT+8

## 30 秒结论

✅ 已修复并验证 2 个代码缺口 + 1 个配置容错：
- `/api/events` 已新增最小 analytics ingest，POST JSON 返回 200/ok，不阻塞前端，结构校验 + 私密字段脱敏 + structured log/file 可选落地。
- `/api/v1/shares` 已兼容 `payload` 与 `public_payload`，结果页分享 payload 保持 public-only，不泄露出生日期/地点/姓名/email。
- Stripe checkout 缺 key/price 时返回明确 `checkout_config_missing`，前端展示友好 fallback，不写入任何密钥。

## 变更文件

- `app/api/events/route.ts` — 新增 analytics ingest API。
- `lib/share-links.ts` — 分享 API contract 兼容 `public_payload` alias。
- `app/api/stripe/checkout/route.ts` — checkout 配置缺失/非法返回明确 code 和友好错误。
- `app/components/StripeCheckoutButton.tsx` — 前端对 checkout 配置错误展示 fallbackLabel。
- `scripts/yishun-v3-gap-smoke.mjs` — 新增 smoke 覆盖 events/share/checkout graceful behavior。
- `package.json` — 新增 `smoke:yishun-v3-gaps`。

## 测试命令

```bash
npm run lint
npm run build
PORT=3127 npm run start
SMOKE_BASE_URL=http://127.0.0.1:3127 npm run smoke:yishun-v3-gaps
```

## 测试结果

- ✅ `npm run lint` PASS
- ✅ `npm run build` PASS，构建路由包含 `/api/events`
- ✅ `npm run smoke:yishun-v3-gaps` PASS
  - events: HTTP 200, `{ ok: true, accepted: 1 }`
  - share create: HTTP 201, 返回 `shr_*` 与 `/s/shr_*`
  - checkout: 缺配置时 HTTP 503 + `checkout_config_missing`，用户错误不暴露 secret env 名
- ⚠️ 3127 smoke 中 share DB 写入降级：本地无 `DATABASE_URL`，生产配置 DB 后会走 `ShareLink` 表持久化。

## 后续 DB 迁移计划（analytics）

当前 analytics 为安全 structured log / optional file sink 最小实现。后续建议新增：

```prisma
model AnalyticsEvent {
  id          String   @id @default(cuid())
  event       String
  anonymousId String?
  source      String?
  properties  Json
  receivedAt  DateTime @default(now())

  @@index([event])
  @@index([anonymousId])
  @@index([receivedAt])
}
```

上线后将 `/api/events` 切到 `createMany` 批量落库，保留 catch fallback，确保埋点永不阻塞前端。

## Superpowers 使用证明

- 收到：`using-superpowers`, `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `using-git-worktrees`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `finishing-a-development-branch`。
- 实际使用：`nextjs-expert`（已读取 SKILL.md）、systematic debugging、执行计划、TDD-style smoke、完成前验证。
- 证据：见 `reports/evidence/yishun-v3-p0-gap-fixes-20260514.txt`。
- 风险：注入的 Superpowers 没有作为本地 available_skills 暴露独立 SKILL.md，因此按流程能力执行并记录风险。

## 风险/回滚

- 风险：analytics 当前不是 DB 强一致落库；但满足 P0 “不阻塞前端 + 可上报 + 可观察”。
- 回滚：`git revert <commit>` 可回退；不涉及 schema/migration/secret。

