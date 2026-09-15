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

---

## 增量审查 #1 — 新增测试代码（UI E2E 独立验收）

- 审查时间：2026-09-15
- 对比基准（上次审查候选 SHA）：`2072868b871e66da7fe271b954d035749c275eba`
- 本次新增测试 SHA：`3c4fa65d357b6aa4686283f917e9dd9f4430b5fc`
- 审查范围：`e2e/ui/groups.acceptance.e2e.test.ts`（新增 19 项 UI E2E）、`e2e/playwright.groups.config.ts`（隔离端口 Playwright 配置）、`client/vite.groups.config.ts`（隔离端口 vite 配置），以及同批提交的 `features/2026-09-15-NEWW-6-book-groups/test-report.md`

### 审查发现

- 隔离环境配置正确：`playwright.groups.config.ts` 使用独立端口 3021/5183，与 3001/3011/5173 已占用环境不冲突，`webServer.reuseExistingServer: true` 避免重复起服务冲突。
- 覆盖映射准确：文件头注释列出的 F06/F07/F08 验收编号与实际 `test()` 用例逐一对应，抽查确认与 `test-report.md` 中的映射表一致，未发现遗漏或张冠李戴。
- 数据自建/自清理总体符合规范：多数 `describe` 块通过 `beforeAll`/`afterAll` 或 `beforeEach`/`afterEach` 创建并清理自己的分组与书籍（`cleanupBooks`/`cleanupGroups`/`removeGroupsByName` 按名称/ID 精确清理）。
- 失败回滚场景（F07-AC06）通过 `page.route` 模拟后端 500，验证前端勾选状态回滚与错误提示展示，测试手段恰当，未弱化验收标准。

### 问题清单（增量）

| 级别 | 位置（文件:行号） | 问题描述 | 修改建议 |
|------|----------------|---------|---------|
| 🟡 建议修改 | `e2e/ui/groups.acceptance.e2e.test.ts:429-437`（`F08: 按分组浏览 > 无分组场景` 的 `beforeEach`） | `await cleanupGroups(groups.map(g => g.id))` 会删除测试环境中**当前存在的全部分组**，而不仅是本测试块自建的数据；与团队"测试自建所需数据并仅清理自身数据"的隔离原则不符。当前因该 `describe` 排在文件末尾且同环境无并发任务而未暴露问题，但存在耦合风险（例如后续新增用例插入到其后、或该隔离环境被其他任务并发复用时，会误删无关分组数据） | 改为仅清理本测试块自己创建的分组 ID（如记录 `beforeAll` 阶段快照并做差集，或该场景本身就该假设"环境已知无分组"而不做全量清理，改为断言/跳过而非主动清空） |
| 🟢 可选优化 | `e2e/ui/groups.acceptance.e2e.test.ts:198-211`（F06-AC07） | 通过 `page.route` mock `GET /api/groups` 返回空列表来验证空态，而非用真实无分组的后端状态；与 F08-AC04（同一空态文案）测试方式不一致（后者使用真实清空分组） | 非必须统一，只是记录说明：两种方式均可验证前端渲染逻辑，无功能性问题 |

### 增量结论

- 🔴 必须修改：0 项
- 🟡 建议修改：1 项（测试数据清理范围过大，存在隔离风险）
- 🟢 可选优化：1 项

未发现验收标准被弱化、静默跳过或产品代码被夹带修改（`git diff` 确认本次提交仅新增测试与文档文件，未触及 `server/src`、`client/src` 产品代码）。回归执行的 server/client/黑盒 API 测试结果与本地复核一致。

**增量审查结论：通过**。上述 🟡 项不阻塞本次验收结论，建议全栈工程师或测试工程师在后续维护测试代码时收敛清理范围至自身测试数据。
