# 技术设计文档

## 1. 方案说明

采用前后端分离架构：

- **后端**：Node.js + Express + SQLite（via better-sqlite3）
- **前端**：React 18 + TypeScript + Vite

选择 SQLite 作为 MVP 数据库，无需额外部署数据库服务，单文件存储、零配置，同时满足后端 API + 数据持久化的需求。

## 2. 项目结构

```
bookshelf/
├── server/                    # 后端
│   ├── src/
│   │   ├── index.ts           # 入口，启动 Express
│   │   ├── db.ts              # SQLite 初始化 + 连接
│   │   ├── routes/
│   │   │   └── books.ts       # 书籍 CRUD API
│   │   └── middleware/
│   │       └── error.ts       # 统一错误处理
│   ├── __tests__/
│   │   └── books.api.test.ts  # API 接口测试
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── client/                    # 前端
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/
│   │   │   └── books.ts       # API 调用封装
│   │   ├── components/
│   │   │   ├── BookList.tsx
│   │   │   ├── BookGroup.tsx
│   │   │   ├── AddBookModal.tsx
│   │   │   ├── BookDetail.tsx
│   │   │   ├── DeleteConfirm.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ViewToggle.tsx
│   │   └── hooks/
│   │       └── useBooks.ts    # 数据获取与操作 hook
│   ├── __tests__/
│   │   ├── hooks/
│   │   │   └── useBooks.test.ts
│   │   └── e2e/
│   │       └── bookshelf.e2e.test.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
└── features/                  # 过程文档
```

## 3. 数据库设计

### 表：books

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| title | TEXT | NOT NULL | 书名（必填） |
| type | TEXT | NOT NULL | 类型（必填，自由输入） |
| author | TEXT | NOT NULL | 作者（必填） |
| description | TEXT | DEFAULT '' | 简介（选填） |
| created_at | TEXT | DEFAULT (datetime('now')) | 创建时间 |

无关联表，MVP 单用户场景。

## 4. API 设计

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | /api/books | 获取所有书籍 | — | `{ books: Book[] }` |
| POST | /api/books | 添加书籍 | `{ title, type, author, description? }` | `{ book: Book }` (201) |
| GET | /api/books/:id | 获取单本书籍详情 | — | `{ book: Book }` |
| DELETE | /api/books/:id | 删除书籍 | — | `{ success: true }` |

### 错误响应格式

```json
{ "error": "错误描述" }
```

- 400：参数校验失败（title/type/author 缺失）
- 404：书籍不存在
- 500：服务端错误

## 5. 前端页面与组件

### 页面结构

- **Header**：标题 + 视图切换（列表/分组） + 添加按钮
- **Main**：根据视图渲染 BookList 或 BookGroup
- **Modal/Overlay**：AddBookModal、BookDetail、DeleteConfirm
- **Toast**：操作反馈提示

### 关键交互

1. 加载中 → spinner
2. 空书架 → 空态提示
3. 列表视图 → BookList 渲染每本书的卡片（书名、作者、类型标签）
4. 分组视图 → BookGroup 按 type 分组，每组显示类型名 + 数量
5. 添加 → 弹窗表单，校验必填字段，提交后刷新列表
6. 详情 → 弹窗展示完整信息，简介为空时显示「暂无简介」
7. 删除 → 确认弹窗，确认后调用 API 删除并刷新

## 6. 测试策略

### 后端测试（API 接口测试）

使用 vitest + supertest，对每个 API 端点编写测试：

- GET /api/books：正常返回、空列表
- POST /api/books：正常添加、缺少 title/type/author 校验
- GET /api/books/:id：正常返回、404
- DELETE /api/books/:id：正常删除、404

每个测试使用内存数据库隔离。

### 前端测试

- **单元测试**：useBooks hook 的增删查逻辑
- **E2E 测试**：使用 Playwright 验收 UI 交互流程

### 验收条件覆盖映射

| 验收编号 | 测试方式 |
|----------|----------|
| F01-AC01 | UI E2E |
| F01-AC02 | UI E2E |
| F01-AC03 | UI E2E |
| F01-AC04 | UI E2E |
| F01-AC05 | 黑盒 API |
| F02-AC01 | UI E2E |
| F02-AC02 | UI E2E + 黑盒 API |
| F02-AC03 | UI E2E |
| F02-AC04 | UI E2E |
| F02-AC05 | UI E2E + 黑盒 API |
| F02-AC06 | UI E2E |
| F03-AC01 | UI E2E |
| F03-AC02 | UI E2E |
| F03-AC03 | UI E2E |
| F03-AC04 | UI E2E |
| F03-AC05 | UI E2E |
| F04-AC01 | UI E2E |
| F04-AC02 | UI E2E |
| F04-AC03 | UI E2E |
| F05-AC01 | UI E2E |
| F05-AC02 | UI E2E |
| F05-AC03 | UI E2E |
| F05-AC04 | UI E2E + 黑盒 API |
| F05-AC05 | UI E2E |

## 7. 开发依赖

### 后端

- express
- better-sqlite3
- cors
- typescript, tsx (开发)
- vitest, supertest (测试)

### 前端

- react, react-dom
- typescript
- vite
- vitest, @testing-library/react (单元测试)
- playwright (E2E)
