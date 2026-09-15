# 测试报告

## 测试概要

- **测试时间**：2026-09-15 10:45–11:00
- **被测 Feature 分支**：`feature/01a09efe-bookshelf-mvp`
- **候选 SHA**：`95bedbc25184d31fb0efca83166cfc1c5808d91f`
- **测试代码 SHA**：`485da9224ef1000ce60949f991fce28ce7b0a515`
- **执行命令**：
  - API 黑盒：`cd e2e && npx vitest run api/ --reporter=verbose`
  - UI E2E：`cd e2e && npx playwright test ui/ --reporter=list`
- **总计**：API 黑盒 6 passed，UI E2E 23 passed，**合计 29 passed，0 failed**

## 测试环境

- 后端：`http://localhost:3001`（`cd server && npx tsx src/index.ts`）
- 前端：`http://localhost:5173`（`cd client && npx vite`）
- 版本核验：`git show 95bedbc` 确认为候选 SHA，`server/src/index.ts` 使用 `getDb()` 持久化文件 DB

## 测试结果

**功能点 F01：书架总览**

| 验收编号 | 验收条件 | 测试用例/检查项 | 结果 | 证据与说明 |
|---------|---------|---------------|------|-----------|
| F01-AC01 | Given 书架中有书籍 When 用户访问书架首页 Then 显示所有书籍的列表 | `e2e/ui/acceptance.e2e.test.ts` › F01-AC01 | 通过 | `.book-card` 元素数量 > 0 |
| F01-AC02 | Given 书架为空 When 用户访问书架首页 Then 显示「书架空空如也，快去添加第一本书吧」 | `e2e/ui/acceptance.e2e.test.ts` › F01-AC02 | 通过 | Mock 空列表，`.empty-state p` 包含指定文字 |
| F01-AC03 | Given 书架中有 N 本书 When 书架列表加载 Then 每本书至少展示书名、类型标签和作者 | `e2e/ui/acceptance.e2e.test.ts` › F01-AC03 | 通过 | `.book-title`、`.book-author`、`.book-type-tag` 均可见 |
| F01-AC04 | Given 书架列表正在加载 When 数据未返回 Then 显示加载态指示器 | `e2e/ui/acceptance.e2e.test.ts` › F01-AC04 | 通过 | 延迟响应场景下 `.loading` 元素可见 |
| F01-AC05 | Given 书架中有书籍 When 前端请求书架列表 API Then 后端返回书籍数组且每条记录包含 id、书名、类型、作者字段 | `e2e/api/books.api.acceptance.test.ts` › F01-AC05 | 通过 | GET /api/books 返回 200，books 数组含 id/title/type/author |

**F01 小计：通过 5 / 失败 0 / 未执行 0 / 跳过 0 / 不适用 0**

---

**功能点 F02：书籍添加**

| 验收编号 | 验收条件 | 测试用例/检查项 | 结果 | 证据与说明 |
|---------|---------|---------------|------|-----------|
| F02-AC01 | Given 用户在书架页面 When 点击添加按钮 Then 弹出包含四个字段的表单 | `e2e/ui/acceptance.e2e.test.ts` › F02-AC01 | 通过 | 书名/类型/作者/简介四个输入框均可见 |
| F02-AC02 | Given 添加表单已打开 When 用户填写书名、类型和作者并提交 Then 书籍成功添加到书架列表中 | `e2e/ui/acceptance.e2e.test.ts` › F02-AC02；`e2e/api/books.api.acceptance.test.ts` › F02-AC02 | 通过 | UI 显示新书；API 返回 201 含书名/类型/作者 |
| F02-AC03 | Given 添加表单已打开 When 用户未填写书名就提交 Then 提示「书名不能为空」并阻止提交 | `e2e/ui/acceptance.e2e.test.ts` › F02-AC03；`e2e/api/books.api.acceptance.test.ts` › F02-AC03 | 通过 | 前端弹出错误提示；API 返回 400 + 「书名不能为空」 |
| F02-AC04 | Given 添加表单已打开 When 用户未填写作者就提交 Then 提示「作者不能为空」并阻止提交 | `e2e/ui/acceptance.e2e.test.ts` › F02-AC04；`e2e/api/books.api.acceptance.test.ts` › F02-AC04 | 通过 | 前端弹出错误提示；API 返回 400 + 「作者不能为空」 |
| F02-AC05 | Given 用户提交了添加请求 When 后端 API 处理成功（返回 201） Then 书架列表实时刷新并包含新书 | `e2e/ui/acceptance.e2e.test.ts` › F02-AC05；`e2e/api/books.api.acceptance.test.ts` › F02-AC05 | 通过 | UI 刷新包含新书；GET 列表确认包含该书 |
| F02-AC06 | Given 用户提交了添加请求 When 后端 API 处理失败（返回非 200） Then 显示错误提示「添加失败，请重试」 | `e2e/ui/acceptance.e2e.test.ts` › F02-AC06 | 通过 | Mock 500 空响应体时显示「添加失败，请重试」 |

**F02 小计：通过 6 / 失败 0 / 未执行 0 / 跳过 0 / 不适用 0**

---

**功能点 F03：类型分组**

| 验收编号 | 验收条件 | 测试用例/检查项 | 结果 | 证据与说明 |
|---------|---------|---------------|------|-----------|
| F03-AC01 | Given 书架中有多种类型的书籍 When 用户切换到分组视图 Then 书籍按类型分组展示 | `e2e/ui/acceptance.e2e.test.ts` › F03-AC01 | 通过 | `.group-section` 包含类型名和对应书籍 |
| F03-AC02 | Given 书架中有书籍 When 用户在列表视图和分组视图之间切换 Then 视图正确切换并保持数据一致 | `e2e/ui/acceptance.e2e.test.ts` › F03-AC02 | 通过 | 两视图书籍数量一致 |
| F03-AC03 | Given 分组视图中某类型下无书 When 显示该分组 Then 该分组不显示或显示空组提示 | `e2e/ui/acceptance.e2e.test.ts` › F03-AC03 | 通过 | 分组视图仅展示有书的类型，无空组 |
| F03-AC04 | Given 用户添加了一本新类型书 When 切换到分组视图 Then 新类型自动成为一个新分组 | `e2e/ui/acceptance.e2e.test.ts` › F03-AC04 | 通过 | 添加新类型后分组数量增加，新分组可见 |
| F03-AC05 | Given 书架中有 N 种类型 When 分组视图加载 Then 每个分组标题旁显示该组书籍数量 | `e2e/ui/acceptance.e2e.test.ts` › F03-AC05 | 通过 | `.group-count` 显示正确数量 |

**F03 小计：通过 5 / 失败 0 / 未执行 0 / 跳过 0 / 不适用 0**

---

**功能点 F04：书籍详情**

| 验收编号 | 验收条件 | 测试用例/检查项 | 结果 | 证据与说明 |
|---------|---------|---------------|------|-----------|
| F04-AC01 | Given 书架列表中有书籍 When 用户点击某本书 Then 进入/弹出该书的详情，展示书名、类型、作者（必填）和简介（选填） | `e2e/ui/acceptance.e2e.test.ts` › F04-AC01 | 通过 | `.detail-panel` 可见，书名/类型/作者均展示 |
| F04-AC02 | Given 书籍详情已展示 When 用户关闭详情 Then 回到之前的书架列表视图 | `e2e/ui/acceptance.e2e.test.ts` › F04-AC02 | 通过 | 关闭后 `.detail-panel` 消失，`.book-list` 可见 |
| F04-AC03 | Given 书籍简介为空 When 详情展示 Then 简介区域显示「暂无简介」，不影响其他必填信息展示 | `e2e/ui/acceptance.e2e.test.ts` › F04-AC03 | 通过 | `.detail-desc` 显示「暂无简介」，作者等字段正常 |

**F04 小计：通过 3 / 失败 0 / 未执行 0 / 跳过 0 / 不适用 0**

---

**功能点 F05：书籍删除**

| 验收编号 | 验收条件 | 测试用例/检查项 | 结果 | 证据与说明 |
|---------|---------|---------------|------|-----------|
| F05-AC01 | Given 书架中有书籍 When 用户触发删除操作 Then 弹出确认提示「确定要删除这本书吗？」 | `e2e/ui/acceptance.e2e.test.ts` › F05-AC01 | 通过 | `.confirm-box p` 包含指定文字 |
| F05-AC02 | Given 删除确认提示已弹出 When 用户确认删除 Then 书籍从书架中移除，列表刷新 | `e2e/ui/acceptance.e2e.test.ts` › F05-AC02 | 通过 | 删除后列表和 API 均无该书 |
| F05-AC03 | Given 删除确认提示已弹出 When 用户取消删除 Then 提示关闭，书籍保留在书架中 | `e2e/ui/acceptance.e2e.test.ts` › F05-AC03 | 通过 | 取消后提示关闭，书籍仍在列表 |
| F05-AC04 | Given 用户确认删除 When 后端 API 处理成功 Then 列表不再显示该书 | `e2e/ui/acceptance.e2e.test.ts` › F05-AC04；`e2e/api/books.api.acceptance.test.ts` › F05-AC04 | 通过 | UI 和 API 双重验证书已删除 |
| F05-AC05 | Given 用户确认删除 When 后端 API 处理失败 Then 显示错误提示「删除失败，请重试」，书籍保留在列表 | `e2e/ui/acceptance.e2e.test.ts` › F05-AC05 | 通过 | Mock 500 空响应体时 Toast 显示「删除失败，请重试」，书籍保留 |

**F05 小计：通过 5 / 失败 0 / 未执行 0 / 跳过 0 / 不适用 0**

---

### 总体统计

| 功能点 | 通过 | 失败 | 未执行 | 跳过 | 不适用 |
|--------|------|------|--------|------|--------|
| F01 | 5 | 0 | 0 | 0 | 0 |
| F02 | 6 | 0 | 0 | 0 | 0 |
| F03 | 5 | 0 | 0 | 0 | 0 |
| F04 | 3 | 0 | 0 | 0 | 0 |
| F05 | 5 | 0 | 0 | 0 | 0 |
| **合计** | **24** | **0** | **0** | **0** | **0** |

## 测试结论

**通过** ✅

全部 5 个功能点、24 条验收条件均覆盖并通过。无失败、未执行或跳过的适用条件。

## 遗留问题

无产品缺陷，无阻塞项。
