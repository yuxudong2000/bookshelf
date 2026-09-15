# NEWW-6 独立验收测试报告 - 书架自定义分组能力

## 测试时间

2026-09-15 13:06 ~ 13:10（本机时区）

## 测试环境与版本

- 测试环境地址：前端 `http://localhost:5183`，后端 `http://localhost:3021`（隔离端口，避免与 3001/3011/5173 已占用环境冲突）
- 被测 feature 分支：`feature/NEWW-6-book-groups`
- 部署版本 Commit SHA（产品代码，候选版本）：`2072868b871e66da7fe271b954d035749c275eba`
- 代码审查报告 SHA：`fada4d39a664aefb8da57cb71addc04d1a53b877`
- 测试代码 Commit SHA：见本报告提交时的同分支 commit（本次提交新增 `e2e/ui/groups.acceptance.e2e.test.ts`、`e2e/playwright.groups.config.ts`、`client/vite.groups.config.ts`、本报告）

版本核验：拉取分支 `feature/NEWW-6-book-groups` 后 `git rev-parse HEAD` 为 `fada4d3...`（review 报告提交），其父提交 `2072868...` 为全栈工程师交付的候选版本，与业务负责人评论中给出的候选 SHA 一致；工作区 `git status` 为 clean，未见未经确认的额外改动。

## 执行命令

- 后端/前端单元与集成测试（回归）：
  - `cd server && npx vitest run`
  - `cd client && npx vitest run`
- 黑盒 API 验收测试（回归，全栈工程师交付范围）：
  - 临时拉起 `PORT=3011 npx tsx src/index.ts`（server 目录）
  - `cd e2e && npx vitest run api/groups.api.acceptance.test.ts`
- 本次新增 UI E2E 独立验收测试：
  - `cd e2e && npx playwright test --config playwright.groups.config.ts --reporter=list`
  - 已重复执行 3 次，结果一致，均为全部通过（可重复运行，不依赖手动前置步骤，测试自建/自清理数据）

## 结果汇总

| 类别 | 通过 | 失败 | 未执行 | 跳过 | 不适用 |
|------|------|------|--------|------|--------|
| 回归：server 单元测试 | 27 | 0 | 0 | 0 | 0 |
| 回归：client 单元测试 | 13 | 0 | 0 | 0 | 0 |
| 回归：黑盒 API 验收（`e2e/api/groups.api.acceptance.test.ts`） | 8 | 0 | 0 | 0 | 0 |
| 新增：UI E2E 独立验收（`e2e/ui/groups.acceptance.e2e.test.ts`） | 19 | 0 | 0 | 0 | 0 |

**测试结论：通过**

## 功能点 F06：分组管理

| 验收编号 | 验收条件 | 测试用例/检查项 | 结果 | 证据与说明 |
|---------|---------|---------------|------|-----------|
| F06-AC01 | 新建分组名称提交后出现在列表中 | `e2e/ui/groups.acceptance.e2e.test.ts` › F06-AC01（UI）+ `e2e/api/groups.api.acceptance.test.ts`（API） | 通过 | UI/API 双证据 |
| F06-AC02 | 未填名称提交提示「分组名称不能为空」并阻止提交 | `e2e/ui/groups.acceptance.e2e.test.ts` › F06-AC02 | 通过 | UI 表单校验通过，模态框保持打开 |
| F06-AC03 | 新建同名分组提示「分组名称已存在」并阻止创建 | `e2e/ui/groups.acceptance.e2e.test.ts` › F06-AC03（UI）+ API 用例 | 通过 | 列表中同名项仍为 1 条 |
| F06-AC04 | 重命名分组后名称更新且归属关系不变 | `e2e/ui/groups.acceptance.e2e.test.ts` › F06-AC04（UI）+ API 用例 | 通过 | 重命名后通过 API 核验 `book_count` 保持为 1 |
| F06-AC05 | 删除分组后从列表移除，书籍不被删除仅解除归属 | `e2e/ui/groups.acceptance.e2e.test.ts` › F06-AC05（UI）+ API 用例 | 通过 | 删除后通过 API 核验书籍仍存在 |
| F06-AC06 | 取消删除后分组保留、归属不变 | `e2e/ui/groups.acceptance.e2e.test.ts` › F06-AC06 | 通过 | 取消后确认框关闭，分组项仍可见 |
| F06-AC07 | 分组为空时显示空态提示「还没有分组，创建一个开始整理书架吧」 | `e2e/ui/groups.acceptance.e2e.test.ts` › F06-AC07 | 通过 | 通过路由 Mock 空列表验证前端渲染 |

## 功能点 F07：书籍分组归属

| 验收编号 | 验收条件 | 测试用例/检查项 | 结果 | 证据与说明 |
|---------|---------|---------------|------|-----------|
| F07-AC01 | 打开归属入口展示所有分组及已归属勾选状态 | `e2e/ui/groups.acceptance.e2e.test.ts` › F07-AC01 | 通过 | 已归属分组勾选，未归属未勾选 |
| F07-AC02 | 勾选未归属分组确认后该书加入该分组，分组下可见 | `e2e/ui/groups.acceptance.e2e.test.ts` › F07-AC02（UI）+ API 用例 | 通过 | UI 保存后 API 核验分组书籍列表包含该书 |
| F07-AC03 | 取消勾选已归属分组确认后从该分组移除，其他分组不受影响 | `e2e/ui/groups.acceptance.e2e.test.ts` › F07-AC03（UI）+ API 用例 | 通过 | API 核验 groupIds 不含 A 含 B |
| F07-AC04 | 书籍详情页展示当前归属的所有分组名称 | `e2e/ui/groups.acceptance.e2e.test.ts` › F07-AC04 | 通过 | 详情页 `.detail-group-tag` 同时展示分组A、分组B |
| F07-AC05 | 不勾选任何分组保存后该书不在任何自定义分组视图，仍在总览 | `e2e/ui/groups.acceptance.e2e.test.ts` › F07-AC05（UI）+ API 用例 | 通过 | 列表视图可见，自定义分组视图对应分组下不可见 |
| F07-AC06 | 后端 API 失败时显示「设置分组失败，请重试」，归属状态回退到变更前 | `e2e/ui/groups.acceptance.e2e.test.ts` › F07-AC06 | 通过 | 通过 `page.route` 模拟 500，前端勾选状态回滚且提示可见；API 核验后端归属未被改变 |
| F07-AC07 | 书籍删除后与所有分组的归属关系一并清除 | `e2e/api/groups.api.acceptance.test.ts`（黑盒 API） | 通过 | 按验收条件本身标注为黑盒 API 覆盖，无需 UI 复测 |

## 功能点 F08：按分组浏览

| 验收编号 | 验收条件 | 测试用例/检查项 | 结果 | 证据与说明 |
|---------|---------|---------------|------|-----------|
| F08-AC01 | 按分组展示分组名称、书籍数量及组内书籍 | `e2e/ui/groups.acceptance.e2e.test.ts` › F08-AC01 | 通过 | 分组X展示2本，标题与书名均可见 |
| F08-AC02 | 分组下无书时展示「该分组还没有书」 | `e2e/ui/groups.acceptance.e2e.test.ts` › F08-AC02 | 通过 | 新建空分组验证空组提示 |
| F08-AC03 | 一本书同时归属多个分组时在每个归属分组中都出现 | `e2e/ui/groups.acceptance.e2e.test.ts` › F08-AC03 | 通过 | 书籍1同时出现在分组X与分组Y |
| F08-AC04 | 尚未创建任何分组时显示空态提示并提供创建入口 | `e2e/ui/groups.acceptance.e2e.test.ts` › F08-AC04 | 通过 | 需保留至少一本书避免总览空态遮蔽，已通过占位书籍规避该干扰后验证空态与创建入口点击可打开分组管理 |
| F08-AC05 | 类型分组（F03）与自定义分组视图切换互不影响 | `e2e/ui/groups.acceptance.e2e.test.ts` › F08-AC05 | 通过 | 来回切换两个视图后数据均保持一致 |
| F08-AC06 | 在自定义分组视图删除某本书后从所有分组视图同步消失 | `e2e/ui/groups.acceptance.e2e.test.ts` › F08-AC06 | 通过 | 删除后分组X、分组Y均不再展示该书，API 核验书籍已删除 |

## 覆盖说明

- 与技术设计文档覆盖映射表一致：黑盒 API 场景（F06-AC01/03/04/05、F07-AC02/03/05/07）已由全栈工程师 `e2e/api/groups.api.acceptance.test.ts` 与 `server/__tests__/groups.api.test.ts` 覆盖并本次回归通过；本次新增的 UI E2E 测试补充了全部标注为「测试工程师负责」的 UI 交互类验收条件（表单校验、空态、取消、失败回滚展示等），共 19 项 UI 用例，覆盖 F06 全部 7 条、F07 全部 6 条 UI 相关条件（AC07 为黑盒专属未重复）、F08 全部 6 条。
- 所有适用验收条件均有通过证据，无未执行、跳过或不适用项。

## 发现的问题

无（未发现产品缺陷）。测试过程中发现两处测试代码本身的问题并已在提交前修复：
1. `GroupManageModal` 重命名交互中 `.group-manage-item` 进入编辑态后 `hasText` 过滤失效，已改为直接定位 `input[type="text"]`。
2. `App.tsx` 中书架为空（`books.length === 0`）时会优先渲染全局空态而非自定义分组视图空态；这是既有产品行为（书架总览空态优先级更高），测试用例已相应补充占位书籍以准确验证 F08-AC04 分组维度的空态展示，不属于产品缺陷。

## 测试代码

- 新增文件：
  - `e2e/ui/groups.acceptance.e2e.test.ts`（19 项 UI E2E，含验收编号覆盖映射见文件头注释）
  - `e2e/playwright.groups.config.ts`（独立验收专用 Playwright 配置，隔离端口 3021/5183）
  - `client/vite.groups.config.ts`（独立验收专用 vite 配置，代理指向隔离后端端口，不影响既有 `client/vite.config.ts` 默认配置）
- 已提交并推送至 `feature/NEWW-6-book-groups` 分支，请业务负责人安排代码审查员对新增测试代码进行审查。

## 结论

NEWW-6（F06/F07/F08 书架自定义分组能力）候选版本 `2072868b871e66da7fe271b954d035749c275eba` 独立验收测试**通过**。测试通过本身不允许合并，仍需等待新增测试代码审查通过及 yuxudong 业务确认。
