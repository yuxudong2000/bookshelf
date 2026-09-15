# Code Review 报告 - NEWW-6 书架分组能力

## 基本信息

- 审查时间：2026-09-15
- PR：未合并（runtime 无 GitHub 认证，待手动创建），链接：https://github.com/yuxudong2000/bookshelf/compare/feature/01a09efe-bookshelf-mvp...feature/NEWW-6-book-groups?expand=1
- 目标分支：`feature/01a09efe-bookshelf-mvp`
- 审查分支：`feature/NEWW-6-book-groups`
- base SHA：`88430ada98fc981d1efa6be817de0400c5974eab`（需求文档末次提交）
- head SHA（候选版本）：`2072868b871e66da7fe271b954d035749c275eba`
- 复审记录：无（首次审查）

## 审查范围

`git diff` base→head 全部改动，重点覆盖：

- 后端：`server/src/db.ts`（`groups`/`book_groups` 表定义）、`server/src/routes/groups.ts`（分组 CRUD + 书籍归属 API）、`server/src/index.ts`（路由挂载）
- 前端：`client/src/api/groups.ts`、`client/src/hooks/useGroups.ts`、`client/src/components/GroupManageModal.tsx`、`BookGroupPicker.tsx`、`CustomGroupView.tsx`，及集成点 `App.tsx`、`BookViews.tsx`、`BookDetail.tsx`
- 测试代码：`server/__tests__/groups.api.test.ts`（16 项）、`client/__tests__/hooks/useGroups.test.ts`（6 项）、`e2e/api/groups.api.acceptance.test.ts`（8 项黑盒）
- 已在本地实际执行 `server` 与 `client` 单元测试验证：27（server）+ 13（client，含既有 useBooks）全部通过，与全栈工程师报告一致

## 需求/设计一致性核对

- 数据模型与 `technical-design.md` 一致：`groups` 表 `name UNIQUE`、`book_groups` 复合主键 + `ON DELETE CASCADE`，并在 `createDb` 中显式开启 `foreign_keys = ON`，满足 F06-AC05（删除分组仅解除归属）与 F07-AC07（删除书籍级联清除归属）。
- 7 个 API 端点与设计文档表格一一对应，错误码（400/404/409）与响应体格式一致。
- 前端第三视图 `CustomGroupView` 接入 `ViewToggle`，`BookGroupPicker` 失败回滚（`setChecked(snapshot)`）符合 F07-AC06 设计。
- 验收编号覆盖映射表中列出的黑盒/服务端测试项，经抽查测试文件确认标注准确（如 F06-AC01/03/04/05、F07-AC02/03/05/07 均可在 `groups.api.test.ts` 中找到对应用例）。UI 交互类验收条件（F06-AC02/06/07、F07-AC01/04、F08 全部）明确标注留给测试工程师在 `e2e/ui/` 补充，未被静默跳过或弱化。

## 问题清单

| 级别 | 位置（文件:行号） | 问题描述 | 修改建议 |
|------|----------------|---------|---------|
| 🟡 建议修改 | `server/src/routes/groups.ts:28-32` | `POST /groups` 存在"先查重后插入"的 TOCTOU 竞态：并发请求下两次重名检查都可能通过，第二次 `INSERT` 会因 `UNIQUE` 约束抛出未捕获异常，导致 500 而非预期的 409 | 捕获 insert 异常并按 `UNIQUE constraint` 错误码转换为 409，或改用 `INSERT ... ON CONFLICT DO NOTHING` 后判断影响行数 |
| 🟡 建议修改 | `server/src/routes/groups.ts:47-50` | `PUT /groups/:id` 重命名同样存在与上面相同的查重竞态 | 同上，统一处理 |
| 🟡 建议修改 | `server/src/routes/groups.ts:98-107` | `groupIds` 仅校验为数组和逐个存在性，未校验元素类型（如传入字符串、浮点数、负数等非常规输入会被静默接受，依赖 SQLite 类型强转） | 增加 `Number.isInteger` 校验，非法类型直接 400 |
| 🟢 可选优化 | `client/src/components/BookGroupPicker.tsx:47-49` | catch 分支中错误提示硬编码为固定文案，未区分网络错误/业务错误（如后端返回的具体 400 信息会被丢弃） | 可考虑优先展示后端返回的 `error` 字段，网络异常时才用兜底文案 |
| 🟢 可选优化 | `server/src/routes/groups.ts` | `groups.ts` 与 `books.ts` 中重复的"查询存在性→404"模式（4 处以上）可抽取为公共 helper | 提取 `getBookOrThrow404` / `getGroupOrThrow404` 辅助函数，减少重复 |

## 总结

- 🔴 必须修改：0 项
- 🟡 建议修改：3 项
- 🟢 可选优化：2 项

未发现权限校验缺失、SQL 注入、敏感信息泄露等安全问题（所有查询均使用参数化绑定）。数据库设计、API 设计、前端组件划分与 `technical-design.md` 一致，验收编号覆盖映射准确、未见弱化或静默跳过验收标准的情况。本地复跑测试与报告的 27+13+8 项通过结果一致。

**审查结论：通过**（🟡/🟢 项由全栈工程师自行判断是否处理，不阻塞合并前置条件；是否合并仍需满足团队统一合并门禁：测试验证通过 + yuxudong 业务确认）。
