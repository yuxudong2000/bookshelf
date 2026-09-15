/**
 * 独立验收 UI E2E 测试
 * 测试环境：前端 http://localhost:5173，后端 http://localhost:3001
 * 覆盖：F01-F05 全部 UI E2E 验收条件
 *
 * 注意：本测试使用真实后端，不使用 Mock API
 * 每个 describe 块负责管理自己的测试数据
 */

import { test, expect, type Page } from '@playwright/test'

const API = 'http://localhost:3001'

async function apiPost(body: object) {
  const res = await fetch(`${API}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function apiDelete(id: number) {
  await fetch(`${API}/api/books/${id}`, { method: 'DELETE' })
}

async function apiGetAll(): Promise<{ id: number; title: string; type: string; author: string }[]> {
  const res = await fetch(`${API}/api/books`)
  const data = await res.json()
  return data.books
}

async function cleanupBooks(ids: number[]) {
  for (const id of ids) {
    await apiDelete(id)
  }
}

test.describe('F01: 书架总览', () => {
  let bookId: number

  test.beforeAll(async () => {
    const data = await apiPost({ title: 'F01测试-三体', type: '科幻', author: '刘慈欣', description: '科幻小说' })
    bookId = data.book.id
  })

  test.afterAll(async () => {
    await cleanupBooks([bookId])
  })

  test('F01-AC01: 书架中有书籍时显示书籍列表', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const cards = page.locator('.book-card')
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('F01-AC02: 书架为空时显示空态提示', async ({ page }) => {
    await page.route('**/api/books', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ books: [] }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/')
    await expect(page.locator('.empty-state p')).toContainText('书架空空如也，快去添加第一本书吧')
  })

  test('F01-AC03: 每本书至少展示书名、类型标签和作者', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const firstCard = page.locator('.book-card').first()
    await expect(firstCard.locator('.book-title')).toBeVisible()
    await expect(firstCard.locator('.book-author')).toBeVisible()
    await expect(firstCard.locator('.book-type-tag')).toBeVisible()
  })

  test('F01-AC04: 数据加载中显示加载态指示器', async ({ page }) => {
    let resolveDelay: () => void
    const delayPromise = new Promise<void>(resolve => { resolveDelay = resolve })
    await page.route('**/api/books', async route => {
      if (route.request().method() === 'GET') {
        await delayPromise
        await route.continue()
      } else {
        await route.continue()
      }
    })
    await page.goto('/')
    const loading = page.locator('.loading')
    await expect(loading).toBeVisible()
    resolveDelay!()
  })
})

test.describe('F02: 书籍添加', () => {
  let addedBookIds: number[] = []

  test.afterAll(async () => {
    await cleanupBooks(addedBookIds)
  })

  test('F02-AC01: 点击添加按钮弹出含四个字段的表单', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.btn-add')
    await page.click('.btn-add')
    await expect(page.locator('.modal')).toBeVisible()
    await expect(page.locator('input[placeholder="请输入书名"]')).toBeVisible()
    await expect(page.locator('input[placeholder="请输入书籍类型"]')).toBeVisible()
    await expect(page.locator('input[placeholder="请输入作者"]')).toBeVisible()
    await expect(page.locator('textarea[placeholder="选填"]')).toBeVisible()
  })

  test('F02-AC02: 填写书名、类型、作者后提交 → 书籍成功添加到列表', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.btn-add')
    await page.click('.btn-add')
    await page.fill('input[placeholder="请输入书名"]', 'F02测试-独立验收书')
    await page.fill('input[placeholder="请输入书籍类型"]', '验收类型')
    await page.fill('input[placeholder="请输入作者"]', '独立验收作者')
    await page.click('.btn-submit')
    await expect(page.locator('.modal')).not.toBeVisible()
    await expect(page.locator('.book-title').filter({ hasText: 'F02测试-独立验收书' })).toBeVisible()
    const books = await apiGetAll()
    const book = books.find(b => b.title === 'F02测试-独立验收书')
    if (book) addedBookIds.push(book.id)
  })

  test('F02-AC03: 未填写书名提交 → 提示「书名不能为空」并阻止提交', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.btn-add')
    await page.click('.btn-add')
    await page.fill('input[placeholder="请输入书籍类型"]', '类型')
    await page.fill('input[placeholder="请输入作者"]', '作者')
    await page.click('.btn-submit')
    await expect(page.locator('.error-msg.show').first()).toContainText('书名不能为空')
    await expect(page.locator('.modal')).toBeVisible()
  })

  test('F02-AC04: 未填写作者提交 → 提示「作者不能为空」并阻止提交', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.btn-add')
    await page.click('.btn-add')
    await page.fill('input[placeholder="请输入书名"]', '测试书名')
    await page.fill('input[placeholder="请输入书籍类型"]', '类型')
    await page.click('.btn-submit')
    await expect(page.locator('.error-msg.show').filter({ hasText: '作者不能为空' })).toBeVisible()
    await expect(page.locator('.modal')).toBeVisible()
  })

  test('F02-AC05: 添加成功后列表实时刷新并包含新书', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.btn-add')
    await page.click('.btn-add')
    await page.fill('input[placeholder="请输入书名"]', 'F02AC05-刷新验证书')
    await page.fill('input[placeholder="请输入书籍类型"]', '测试类型')
    await page.fill('input[placeholder="请输入作者"]', '刷新验证作者')
    await page.click('.btn-submit')
    await expect(page.locator('.book-title').filter({ hasText: 'F02AC05-刷新验证书' })).toBeVisible()
    const books = await apiGetAll()
    const book = books.find(b => b.title === 'F02AC05-刷新验证书')
    if (book) addedBookIds.push(book.id)
  })

  test('F02-AC06: 后端API失败时显示「添加失败，请重试」', async ({ page }) => {
    await page.route('**/api/books', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/')
    await page.waitForSelector('.btn-add')
    await page.click('.btn-add')
    await page.fill('input[placeholder="请输入书名"]', '失败测试书')
    await page.fill('input[placeholder="请输入书籍类型"]', '类型')
    await page.fill('input[placeholder="请输入作者"]', '作者')
    await page.click('.btn-submit')
    const errorMsg = page.locator('.error-msg.show').filter({ hasText: '添加失败，请重试' })
    await expect(errorMsg).toBeVisible()
  })
})

test.describe('F03: 类型分组', () => {
  let bookIds: number[] = []

  test.beforeAll(async () => {
    const b1 = await apiPost({ title: 'F03-科幻书', type: 'F03科幻', author: '作者A' })
    const b2 = await apiPost({ title: 'F03-文学书', type: 'F03文学', author: '作者B' })
    const b3 = await apiPost({ title: 'F03-科幻书2', type: 'F03科幻', author: '作者C' })
    bookIds = [b1.book.id, b2.book.id, b3.book.id]
  })

  test.afterAll(async () => {
    await cleanupBooks(bookIds)
  })

  test('F03-AC01: 切换到分组视图时书籍按类型分组展示', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.view-toggle')
    await page.click('.view-toggle button:nth-child(2)')
    await expect(page.locator('.group-view')).toBeVisible()
    const f03SciGroup = page.locator('.group-section').filter({ hasText: 'F03科幻' })
    await expect(f03SciGroup).toBeVisible()
    await expect(f03SciGroup.locator('.group-header h3')).toContainText('F03科幻')
  })

  test('F03-AC02: 列表视图与分组视图切换时数据一致', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-list')
    const listTitlesCount = await page.locator('.book-title').count()
    await page.click('.view-toggle button:nth-child(2)')
    await expect(page.locator('.group-view')).toBeVisible()
    const groupTitlesCount = await page.locator('.group-view .book-title').count()
    expect(groupTitlesCount).toBe(listTitlesCount)
    await page.click('.view-toggle button:nth-child(1)')
    await expect(page.locator('.book-list')).toBeVisible()
  })

  test('F03-AC03: 某类型无书时该分组不显示（分组视图只包含有书的类型）', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.view-toggle')
    await page.click('.view-toggle button:nth-child(2)')
    await expect(page.locator('.group-view')).toBeVisible()
    const emptySections = page.locator('.group-section').filter({ hasText: '暂无书籍' })
    const emptyCount = await emptySections.count()
    expect(emptyCount).toBe(0)
  })

  test('F03-AC04: 添加新类型书籍后分组视图出现新分组', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.view-toggle')
    await page.click('.view-toggle button:nth-child(2)')
    const beforeGroupCount = await page.locator('.group-section').count()

    await page.click('.btn-add')
    const newType = `F03新类型-${Date.now()}`
    await page.fill('input[placeholder="请输入书名"]', 'F03-新类型测试书')
    await page.fill('input[placeholder="请输入书籍类型"]', newType)
    await page.fill('input[placeholder="请输入作者"]', '新类型作者')
    await page.click('.btn-submit')
    await page.waitForSelector(`.group-section:has-text("${newType}")`)
    const afterGroupCount = await page.locator('.group-section').count()
    expect(afterGroupCount).toBeGreaterThan(beforeGroupCount)

    const books = await apiGetAll()
    const newBook = books.find(b => b.title === 'F03-新类型测试书')
    if (newBook) bookIds.push(newBook.id)
  })

  test('F03-AC05: 分组标题旁显示该组书籍数量', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.view-toggle')
    await page.click('.view-toggle button:nth-child(2)')
    await expect(page.locator('.group-view')).toBeVisible()
    const f03SciGroup = page.locator('.group-section').filter({ hasText: 'F03科幻' })
    await expect(f03SciGroup.locator('.group-count')).toContainText('2 本')
  })
})

test.describe('F04: 书籍详情', () => {
  let bookWithDescId: number
  let bookNoDescId: number

  test.beforeAll(async () => {
    const b1 = await apiPost({ title: 'F04-有简介书', type: 'F04类型', author: 'F04作者', description: '这是一本有简介的书' })
    const b2 = await apiPost({ title: 'F04-无简介书', type: 'F04类型', author: 'F04作者2', description: '' })
    bookWithDescId = b1.book.id
    bookNoDescId = b2.book.id
  })

  test.afterAll(async () => {
    await cleanupBooks([bookWithDescId, bookNoDescId])
  })

  test('F04-AC01: 点击书籍进入详情，展示书名、类型、作者', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const bookCard = page.locator('.book-card').filter({ hasText: 'F04-有简介书' })
    await bookCard.click()
    await expect(page.locator('.detail-panel')).toBeVisible()
    await expect(page.locator('.detail-panel h2')).toContainText('F04-有简介书')
    await expect(page.locator('.detail-meta .type')).toContainText('F04类型')
    await expect(page.locator('.detail-meta .author')).toContainText('F04作者')
  })

  test('F04-AC02: 关闭详情后回到书架列表视图', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const bookCard = page.locator('.book-card').filter({ hasText: 'F04-有简介书' })
    await bookCard.click()
    await expect(page.locator('.detail-panel')).toBeVisible()
    await page.click('.detail-panel .modal-close')
    await expect(page.locator('.detail-panel')).not.toBeVisible()
    await expect(page.locator('.book-list')).toBeVisible()
  })

  test('F04-AC03: 书籍简介为空时显示「暂无简介」', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const bookCard = page.locator('.book-card').filter({ hasText: 'F04-无简介书' })
    await bookCard.click()
    await expect(page.locator('.detail-panel')).toBeVisible()
    await expect(page.locator('.detail-desc')).toContainText('暂无简介')
    await expect(page.locator('.detail-meta .author')).toContainText('F04作者2')
  })
})

test.describe('F05: 书籍删除', () => {
  let bookToDeleteId: number
  let bookToKeepId: number

  test.beforeAll(async () => {
    const b1 = await apiPost({ title: 'F05-待删除书', type: 'F05类型', author: 'F05作者' })
    const b2 = await apiPost({ title: 'F05-保留书', type: 'F05类型', author: 'F05作者2' })
    bookToDeleteId = b1.book.id
    bookToKeepId = b2.book.id
  })

  test.afterAll(async () => {
    await cleanupBooks([bookToKeepId])
    const books = await apiGetAll()
    const remain = books.find(b => b.title === 'F05-待删除书')
    if (remain) await apiDelete(remain.id)
  })

  test('F05-AC01: 触发删除操作时弹出确认提示「确定要删除这本书吗？」', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const bookCard = page.locator('.book-card').filter({ hasText: 'F05-待删除书' })
    const deleteBtn = bookCard.locator('.btn-icon.delete')
    await deleteBtn.click()
    await expect(page.locator('.confirm-box p')).toContainText('确定要删除这本书吗？')
  })

  test('F05-AC02: 确认删除后书籍从书架中移除', async ({ page }) => {
    const newBook = await apiPost({ title: 'F05-AC02-删除测试', type: 'F05类型', author: 'F05作者' })
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const bookCard = page.locator('.book-card').filter({ hasText: 'F05-AC02-删除测试' })
    await bookCard.locator('.btn-icon.delete').click()
    await expect(page.locator('.confirm-box')).toBeVisible()
    await page.click('.btn-confirm-danger')
    await expect(page.locator('.book-title').filter({ hasText: 'F05-AC02-删除测试' })).not.toBeVisible()
    const books = await apiGetAll()
    expect(books.find(b => b.id === newBook.book.id)).toBeUndefined()
  })

  test('F05-AC03: 取消删除后书籍保留在书架中', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const bookCard = page.locator('.book-card').filter({ hasText: 'F05-待删除书' })
    await bookCard.locator('.btn-icon.delete').click()
    await expect(page.locator('.confirm-box')).toBeVisible()
    await page.click('.btn-cancel')
    await expect(page.locator('.confirm-box')).not.toBeVisible()
    await expect(page.locator('.book-title').filter({ hasText: 'F05-待删除书' })).toBeVisible()
  })

  test('F05-AC04: 删除成功后列表不再显示该书', async ({ page }) => {
    const newBook = await apiPost({ title: 'F05-AC04-删除验证', type: 'F05类型', author: 'F05作者' })
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card').filter({ hasText: 'F05-AC04-删除验证' }).locator('.btn-icon.delete').click()
    await page.click('.btn-confirm-danger')
    await expect(page.locator('.book-title').filter({ hasText: 'F05-AC04-删除验证' })).not.toBeVisible()
    const books = await apiGetAll()
    expect(books.find(b => b.id === newBook.book.id)).toBeUndefined()
  })

  test('F05-AC05: 后端删除API失败时显示「删除失败，请重试」并书籍保留', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.route('**/api/books/*', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) })
      } else {
        await route.continue()
      }
    })
    const bookCard = page.locator('.book-card').filter({ hasText: 'F05-保留书' })
    await bookCard.locator('.btn-icon.delete').click()
    await expect(page.locator('.confirm-box')).toBeVisible()
    await page.click('.btn-confirm-danger')
    const toast = page.locator('.toast').filter({ hasText: '删除失败，请重试' })
    await expect(toast).toBeVisible()
    await expect(page.locator('.book-title').filter({ hasText: 'F05-保留书' })).toBeVisible()
  })
})
