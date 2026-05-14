# YiShun 新用户日期/时间输入修复

## 结论
已将注册页 `/register` 与资料页 `/profile` 的出生日期/时间输入从原生 date/time 输入改为移动端友好的下拉选择器：年月日、时分分开选择，无需手打 `YYYY-MM-DD` 或 `HH:mm`，避免移动端键盘无法输入 `-` / `:` 的问题。

## 变更文件
- `app/components/BirthDateTimePicker.tsx`：新增复用组件，输出 `YYYY-MM-DD` 与 `HH:mm`，支持闰年/月天数自动调整，使用 select 作为可靠 fallback。
- `app/register/page.tsx`：注册表单使用新组件。
- `app/profile/page.tsx`：用户资料编辑表单使用新组件。

## 定位结果
- `/reading/start` 已是年月日/时分 select 交互，不存在手输格式问题，本次未修改。
- `/register`、`/profile` 原先依赖 `input type=date/time`；部分移动 WebView/浏览器 fallback 时会退化为难用文本输入，因此改为项目内稳定 select picker。

## 格式与校验
- 出生日期提交格式：`YYYY-MM-DD`。
- 出生时间提交格式：`HH:mm`。
- 原表单 `required` 语义保留；未完整选择时值为空，阻止提交。
- UI 提示更新为“不需要手输格式/冒号”。

## 测试命令与结果
- `npm run lint`：通过。
- `npm run build`：通过；Next.js 编译、TypeScript、静态页面生成全部成功。

## 风险/回滚
- 风险：年份范围固定为当前年往前 120 年；和 `/reading/start` 保持一致，覆盖常规出生年份。
- 风险：分钟从原生任意输入改为 00-59 全量下拉，功能完整但列表较长；比手输冒号更可靠。
- 回滚：恢复 `app/register/page.tsx` 与 `app/profile/page.tsx` 中原 `input type=date/time` 块，并删除新增组件。

## 推送状态
源码已存在于当前发布前收口分支历史提交；本报告随发布前收口提交纳入版本。未执行生产发布动作。

## Superpowers 使用证明
- 收到的 Superpowers/skills：using-superpowers、dispatching-parallel-agents、subagent-driven-development（任务要求）；开发者注入还包含 writing-plans、executing-plans、test-driven-development、verification-before-completion 等。
- 实际使用：subagent-driven-development（作为 coder 子 Agent 独立完成修复）、verification-before-completion（执行 lint/build 后才交付）。
- 证据/行为：按任务边界仅改业务前端代码；发布前收口确认 `BirthDateTimePicker`、`register`、`profile` 已在提交历史中；验证命令见上。
