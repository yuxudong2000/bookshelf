# 代码审查报告

## 基本信息

- **审查时间**：2026-09-15
- **PR 链接**：https://github.com/yuxudong2000/bookshelf/compare/main...feature/01a09efe-bookshelf-mvp
- **目标分支**：main
- **base SHA**：`96c3543849b31fde95b0a6abfef4333726720a54`（产品分析最终提交）
- **head SHA（候选版本）**：`fa5e0b5d28ea3f6c3ff5dfec4acd36627b6deccc`

## 审查范围

- `server/`：后端 Express + SQLite 全部代码及 API 测试
- `client/`：前端 React + TypeScript 全部代码及单元测试、E2E 测试
- `features/2026-09-14-01a09efe-bookshelf-mvp/technical-design.md`：技术设计文档

共 32 个文件变更，8148 行新增，14 行修改。

## 问题清单

| 级别 | 位置（文件:行号） | 问题描述 | 修改建议 |
|------|----------------|---------|---------|
| 🔴 必须修改 | `server/src/index.ts:8` | `createDb()` 无参数调用时默认使用 `:memory:` 内存数据库，服务重启后所有数据全部丢失，违反核心需求"数据持久化：后端 API + 数据库" | 改为调用已实现的 `getDb()`（`db.ts` 中已有持久化逻辑），或向 `createDb()` 传入文件路径 |
| 🟡 建议修改 | `client/__tests__/e2e/bookshelf.e2e.test.ts`（F04-AC03 测试） | 测试中 `if (text?.includes('暂无简介'))` 条件分支导致当测试数据均有简介时断言被跳过，测试总是通过，未能真正验证 F04-AC03 | 在测试 setup 中插入一条 description 为空的书籍，或 mock API 返回空简介数据，确保 `expect` 必然执行 |
| 🟡 建议修改 | `server/src/routes/books.ts`（POST /api/books） | F02-AC05 需求描述"后端 API 处理成功（返回 200）"，但实现返回 201；API 测试也断言 201，与需求文档存在文字不一致 | 201 语义更正确（资源创建成功），建议同步更新需求文档 F02-AC05 中的状态码描述为 201，而非修改代码 |
| 🟡 建议修改 | `client/__tests__/e2e/bookshelf.e2e.test.ts`（F03-AC03、F03-AC04 缺失） | F03-AC03（空组不显示）和 F03-AC04（新类型自动成为新分组）无 E2E 测试覆盖，开发者报告中已指出 | 补充两条 E2E 测试：mock 数据覆盖空组场景（F03-AC03）和添加新类型书后切换分组出现新分组（F03-AC04） |
| 🟢 可选优化 | `server/src/db.ts`（`getDb()` 函数） | `getDb()` 已实现完整的持久化文件路径逻辑，但在 `index.ts` 中未被使用，是死代码 | 修复 🔴 问题时一并使用 `getDb()`，或若改为传参方式则可移除 `getDb()` |
| 🟢 可选优化 | `features/.../technical-design.md`（项目结构章节） | 设计文档列出 `BookList.tsx`、`BookGroup.tsx`、`ViewToggle.tsx` 为独立文件，实际均实现在 `BookViews.tsx` 中，文档与代码结构不一致 | 更新设计文档中的项目结构说明，反映实际文件布局 |

## 验收条件覆盖核查

| 验收编号 | 要求覆盖方式 | 实际覆盖情况 |
|----------|------------|------------|
| F01-AC01 | UI E2E | ✅ E2E 覆盖 |
| F01-AC02 | UI E2E | ✅ E2E 覆盖 |
| F01-AC03 | UI E2E | ✅ E2E 覆盖 |
| F01-AC04 | UI E2E | ✅ E2E 覆盖 |
| F01-AC05 | 黑盒 API | ✅ API 测试覆盖（标注 F01-AC05） |
| F02-AC01 | UI E2E | ✅ E2E 覆盖 |
| F02-AC02 | UI E2E + 黑盒 API | ✅ E2E + API 测试覆盖 |
| F02-AC03 | UI E2E | ✅ E2E 覆盖 |
| F02-AC04 | UI E2E | ✅ E2E 覆盖 |
| F02-AC05 | UI E2E + 黑盒 API | ⚠️ E2E 侧由 F02-AC02 测试兼覆盖；API 测试无独立 AC05 标注，但 F02-AC02 API 测试涵盖该场景 |
| F02-AC06 | UI E2E | ✅ E2E 覆盖 |
| F03-AC01 | UI E2E | ✅ E2E 覆盖 |
| F03-AC02 | UI E2E | ✅ E2E 覆盖 |
| F03-AC03 | UI E2E | ⚠️ 无 E2E 测试（代码逻辑已覆盖，E2E 场景缺失） |
| F03-AC04 | UI E2E | ⚠️ 无 E2E 测试 |
| F03-AC05 | UI E2E | ✅ E2E 覆盖 |
| F04-AC01 | UI E2E | ✅ E2E 覆盖 |
| F04-AC02 | UI E2E | ✅ E2E 覆盖 |
| F04-AC03 | UI E2E | ⚠️ 测试存在条件跳过漏洞，参见 🟡 问题 |
| F05-AC01 | UI E2E | ✅ E2E 覆盖 |
| F05-AC02 | UI E2E | ✅ E2E 覆盖 |
| F05-AC03 | UI E2E | ✅ E2E 覆盖 |
| F05-AC04 | UI E2E + 黑盒 API | ✅ E2E + API 测试覆盖（标注 F05-AC04） |
| F05-AC05 | UI E2E | ✅ E2E 覆盖 |

## 审查维度总结

**正确性**：所有 5 个功能点核心逻辑与需求文档对应，书名/类型/作者必填校验在前后端均已实现。🔴 数据持久化逻辑存在严重 Bug——服务器使用内存数据库，重启即丢数据。

**安全性**：SQL 参数化查询贯穿全部数据库操作，无注入风险。MVP 明确不含用户认证，无权限绕过问题。CORS 全开（`cors()` 无限制），MVP 阶段可接受。错误响应不暴露堆栈信息。

**规范性**：代码风格统一，TypeScript 类型使用规范。组件职责划分清晰，命名语义明确。测试文件按验收编号标注，覆盖映射在 technical-design.md 中有记录。

**可维护性**：前后端分离架构，`useBooks` hook 封装数据层，组件职责单一。API 测试数据库隔离良好（每个用例创建独立内存 DB）。F04-AC03、F03-AC03、F03-AC04 测试覆盖需补强。

## 审查结论

**不通过** ❌

原因：存在 1 项 🔴 必须修改问题（`server/src/index.ts:8` 使用内存数据库导致数据无法持久化，违反核心需求），需修复后重新审查。

- 🔴 必须修改 **1** 项（不通过）
- 🟡 建议修改 **3** 项
- 🟢 可选优化 **2** 项
