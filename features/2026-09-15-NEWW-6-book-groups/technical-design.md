# 技术设计文档 - 书架分组能力（NEWW-6）

## 1. 方案说明

在现有 MVP（Express + better-sqlite3 + React/TS）基础上新增两张表：`groups`（自定义分组）与 `book_groups`（书籍-分组多对多关联），提供独立于既有 `type` 字段分组（F03）的一套并行分组体系，不影响现有 `books` 表结构与既有 API。

前端新增「自定义分组」第三视图，复用现有 Toast/Modal/DeleteConfirm 交互模式；书籍分组归属通过 `BookDetail` 内新增入口打开归属选择弹窗。

## 2. 涉及文件/模块

后端：
- `server/src/db.ts`：新增 `groups`、`book_groups` 表定义（外键 + `PRAGMA foreign_keys = ON` 以支持级联删除）
- `server/src/routes/groups.ts`（新增）：分组管理 + 书籍分组归属 API
- `server/src/index.ts`：挂载 `groupsRouter`
- `server/__tests__/groups.api.test.ts`（新增）：API 接口测试

前端：
- `client/src/api/groups.ts`（新增）：分组相关请求封装
- `client/src/hooks/useGroups.ts`（新增）：分组数据与操作 hook
- `client/src/components/GroupManageModal.tsx`（新增）：分组管理（新建/重命名/删除）弹窗
- `client/src/components/BookGroupPicker.tsx`（新增）：书籍分组归属选择弹窗
- `client/src/components/CustomGroupView.tsx`（新增）：F08 按自定义分组浏览视图
- `client/src/components/BookViews.tsx`：`ViewToggle` 增加「自定义分组」选项
- `client/src/components/BookDetail.tsx`：展示当前归属分组 + 打开归属弹窗入口
- `client/src/App.tsx`：接入第三视图与新增弹窗的状态编排
- `client/src/App.css`：新增分组管理/归属弹窗样式
- `client/__tests__/hooks/useGroups.test.ts`（新增）：hook 单测（Mock API）

过程文档：
- `features/2026-09-15-NEWW-6-book-groups/technical-design.md`（本文档）

黑盒 API 验收测试（独立验收，测试工程师视角，本次由全栈工程师先补齐覆盖映射所需的最小集）：
- `e2e/api/groups.api.acceptance.test.ts`（新增）

## 3. 数据库变更

### 表：groups

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| name | TEXT | NOT NULL UNIQUE | 分组名称（唯一，对应 F06-AC03） |
| created_at | TEXT | DEFAULT (datetime('now')) | 创建时间（分组默认按创建时间排序） |

### 表：book_groups（多对多关联）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| book_id | INTEGER | NOT NULL, REFERENCES books(id) ON DELETE CASCADE | 书籍 ID |
| group_id | INTEGER | NOT NULL, REFERENCES groups(id) ON DELETE CASCADE | 分组 ID |
| PRIMARY KEY | (book_id, group_id) | — | 复合主键防重复归属 |

`ON DELETE CASCADE` 满足 F06-AC05（删除分组仅解除归属，书籍不受影响）与 F07-AC07（删除书籍时同步清除其分组归属）。需要在连接上开启 `PRAGMA foreign_keys = ON`（better-sqlite3 默认关闭）。

## 4. API 设计

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | /api/groups | 获取所有分组（含书籍数量），按创建时间升序 | — | `{ groups: (Group & { book_count: number })[] }` |
| POST | /api/groups | 新建分组 | `{ name }` | `{ group: Group }` (201)；名称为空 400，重名 409 |
| PUT | /api/groups/:id | 重命名分组 | `{ name }` | `{ group: Group }`；不存在 404，重名 409 |
| DELETE | /api/groups/:id | 删除分组（级联解除归属，不删除书籍） | — | `{ success: true }`；不存在 404 |
| GET | /api/groups/:id/books | 获取分组下所有书籍 | — | `{ books: Book[] }`；不存在 404 |
| GET | /api/books/:id/groups | 获取书籍当前归属的分组 ID 列表 | — | `{ groupIds: number[] }`；书籍不存在 404 |
| PUT | /api/books/:id/groups | 覆盖式设置书籍的分组归属（整体替换） | `{ groupIds: number[] }` | `{ groupIds: number[] }`；书籍不存在 404，分组 ID 不存在 400 |

### 错误响应格式

沿用现有 `{ "error": "错误描述" }` 格式：
- 400：名称为空 / groupIds 含不存在的分组
- 404：分组或书籍不存在
- 409：分组名称已存在

## 5. 前端页面与组件

- Header 增加「分组管理」入口按钮，点击打开 `GroupManageModal`
- `ViewToggle` 增加第三选项「自定义分组」，选中后渲染 `CustomGroupView`
- `CustomGroupView`：按分组渲染书籍卡片列表；分组为空展示「该分组还没有书」；无分组时展示空态 + 创建入口（F08-AC04）
- `BookDetail` 新增「设置分组」按钮 → 打开 `BookGroupPicker`，展示所有分组勾选状态，保存后覆盖式提交 `PUT /api/books/:id/groups`；同时展示书籍当前归属分组名称（F07-AC04）
- 失败态：`BookGroupPicker` 保存失败时提示「设置分组失败，请重试」，并保持提交前的勾选状态（前端在失败时回滚本地已勾选状态到提交前快照，对应 F07-AC06）

## 6. 测试策略

### 后端测试（API 接口测试，必须）

`server/__tests__/groups.api.test.ts`，使用 vitest + supertest + 内存 SQLite（`createDb()` 无 dbPath），覆盖：
- 分组 CRUD 正常/边界/异常场景（F06-AC01~07）
- 书籍分组归属设置/查询/级联清除（F07-AC01~03、F07-AC05、F07-AC07）
- 分组下书籍列表查询（服务 F08 视图的数据来源）

### 前端测试

- 单元测试：`useGroups.test.ts`，Mock `api/groups.ts`，覆盖增删改与归属设置的状态更新逻辑
- 不编写前端 UI E2E（按团队约定由测试工程师在 `e2e/ui/` 独立实现）

### 黑盒 API 验收测试

`e2e/api/groups.api.acceptance.test.ts`，针对已部署测试环境（`http://localhost:3001`）跑通关键黑盒场景，作为候选版本证据的一部分，覆盖 F06-AC01/03/04/05、F07-AC02/03/05/07。

### 验收条件覆盖映射

| 验收编号 | 覆盖方式 | 测试位置 |
|----------|----------|----------|
| F06-AC01 | 黑盒 API（UI E2E 由测试工程师补充） | `e2e/api/groups.api.acceptance.test.ts` + `server/__tests__/groups.api.test.ts` |
| F06-AC02 | UI E2E（前端表单校验，测试工程师负责） | — |
| F06-AC03 | 黑盒 API | `e2e/api/groups.api.acceptance.test.ts` + `server/__tests__/groups.api.test.ts` |
| F06-AC04 | 黑盒 API | `e2e/api/groups.api.acceptance.test.ts` + `server/__tests__/groups.api.test.ts` |
| F06-AC05 | 黑盒 API | `e2e/api/groups.api.acceptance.test.ts` + `server/__tests__/groups.api.test.ts` |
| F06-AC06 | UI E2E（取消操作，测试工程师负责） | — |
| F06-AC07 | UI E2E（空态展示，测试工程师负责） | — |
| F07-AC01 | UI E2E（测试工程师负责） | — |
| F07-AC02 | 黑盒 API | `e2e/api/groups.api.acceptance.test.ts` + `server/__tests__/groups.api.test.ts` |
| F07-AC03 | 黑盒 API | `e2e/api/groups.api.acceptance.test.ts` + `server/__tests__/groups.api.test.ts` |
| F07-AC04 | UI E2E（测试工程师负责） | — |
| F07-AC05 | 黑盒 API | `e2e/api/groups.api.acceptance.test.ts` + `server/__tests__/groups.api.test.ts` |
| F07-AC06 | UI E2E（前端失败回滚，测试工程师负责） | — |
| F07-AC07 | 黑盒 API | `e2e/api/groups.api.acceptance.test.ts` + `server/__tests__/groups.api.test.ts` |
| F08-AC01~06 | UI E2E（测试工程师负责，服务端数据支撑已由 `GET /api/groups`、`GET /api/groups/:id/books` 提供） | — |

说明：UI 交互类验收条件（表单校验、空态、取消、失败回滚展示等）依赖真实浏览器渲染，按团队约定由测试工程师在 `e2e/ui/` 中编写独立验收 UI E2E 测试，不在本次全栈工程师交付范围内重复实现；本次交付聚焦服务端 API 与可 in-process 验证的场景，确保功能可用性有测试兜底。

## 7. 开发依赖

无新增第三方依赖，复用现有 express / better-sqlite3 / cors（后端）与 react / vite（前端）技术栈。
