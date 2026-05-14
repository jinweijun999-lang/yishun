# YiShun V3 P0 i18n/value/accuracy返工报告

## 结论
通过。英文模式 `/`, `/reports`, `/reading/start`, `/reading/result` 已通过渲染级中文残留 smoke；首页补强 5 秒价值主张；结果页新增 “Why this result?” 规则依据模块，明确 Gemini 只解释、不决定命盘事实。

## 泄漏范围确认
- `/` `app/page.tsx`: 英文首页可见中文 logo “易”；首页产品亮点不够直观，缺少 trusted Eastern timing rules + BaZi/Five Elements + Gemini + save/share/premium report 的 5 秒说明。
- `/reports` `app/reports/page.tsx` + `app/components/Navigation.tsx` + `app/components/LanguageSwitcher.tsx`: 第二个底部入口为 Reports；渲染 smoke 覆盖空态/历史态/底部导航/语言切换器，英文模式未发现中文残留。
- `/reading/start` `app/reading/start/page.tsx`: 渲染 smoke 覆盖入口表单，英文模式未发现中文残留。
- `/reading/result` `app/reading/result/page.tsx` + `app/components/FiveElementsChart.tsx`: 原有准确性提示不够集中；新增规则依据模块，并对英文 AI 文案做中文字符剥离兜底。

## 变更文件
- `app/page.tsx`
  - 英文 hero 改为 5 秒可理解价值主张。
  - 首页产品亮点改为：可信东方时机规则、BaZi/Five Elements、Gemini 解释、保存/分享/付费报告。
  - 英文 logo 从 “易” 改为 “YS”，中文模式保留 “易”。
  - 增加准确性 pipeline 区块：输入标准化、真太阳时、规则引擎、Gemini 边界。
- `app/reading/result/page.tsx`
  - 新增 “Why this result?” 模块：出生资料、真太阳时、四柱、日主、五行、今日信号、最佳窗口。
  - 明确：YiShun rules engine 决定事实；Gemini 只做个性化解释。
  - 英文模式对 Gemini 动态文案增加 `stripChineseText` 兜底。
- `scripts/i18n-en-no-chinese-smoke.mjs`
  - 新增渲染级英文中文残留 smoke，覆盖 `/`, `/reports`, `/reading/start`, `/reading/result`，并生成截图。
- `scripts/i18n-ux-copy-smoke.mjs`
  - 更新既有 i18n smoke 对首页/reading-start/reports 新文案的期望。
- `package.json`
  - 新增 `smoke:i18n-en-no-chinese`。

## 测试命令
```bash
npm run lint
npm run build
YISHUN_BASE_URL=http://127.0.0.1:3201 EVIDENCE_DIR=/Users/xiajarvan/.openclaw/workspace/yishun/evidence/yishun-p0-i18n-value-accuracy-20260515 npm run smoke:i18n-en-no-chinese
YISHUN_BASE_URL=http://127.0.0.1:3204 npm run smoke:i18n-ux
```

## 测试结果
- `npm run lint`: passed
- `npm run build`: passed（Next.js 16.2.6；仅提示 middleware convention deprecated）
- `smoke:i18n-en-no-chinese`: passed，覆盖 `/`, `/reports`, `/reading/start`, `/reading/result`
- `smoke:i18n-ux`: passed，覆盖 `/`, `/reading/result`, `/register`, `/reading/start`, `/reports`, `/tools/sample`, `/s/not-a-real-share-id`, `/membership`

## 证据
- 截图与日志目录：`/Users/xiajarvan/.openclaw/workspace/yishun/evidence/yishun-p0-i18n-value-accuracy-20260515/`
  - `home.png`
  - `reports.png`
  - `reading-start.png`
  - `reading-result.png`
  - `i18n-en-no-chinese-smoke.log`
  - `i18n-ux-smoke.log`

## Superpowers 使用证明
- 收到的 Superpowers/skills：`using-superpowers`, `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `using-git-worktrees`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `finishing-a-development-branch`。
- 实际使用：
  - `using-superpowers`: 按注入能力与 OPC gate 执行；读取 `nextjs-expert` SKILL.md。
  - `brainstorming`/`writing-plans`: 先确认泄漏范围，再拆分首页、Reports、Result、Smoke、验证、交付。
  - `executing-plans`: 逐步改代码、补脚本、跑验证。
  - `test-driven-development`: 新增 `smoke:i18n-en-no-chinese`，用渲染结果约束英文 0 中文残留。
  - `systematic-debugging`: smoke 初次因端口/旧期望失败，定位为服务端口占用与旧 smoke 文案期望，改用新端口并更新期望后通过。
  - `verification-before-completion`: 完成前执行 lint/build/smoke 并留截图证据。
- 证据/行为：已读取 `~/.openclaw/skills/nextjs-expert/SKILL.md`；新增 smoke gate 输出见证据目录。

## 风险/回滚
- 风险：当前仓库已有多处未提交改动，本次只提交与 P0 返工直接相关文件，避免误纳其他任务内容。
- 回滚：`git revert <本次commit>` 可回退；若只需关闭 smoke，可移除 `smoke:i18n-en-no-chinese` script 与对应脚本。

## 下一步
- 建议把 `smoke:i18n-en-no-chinese` 加入 CI/发布前检查，防止英文获客页再次出现中文残留。
