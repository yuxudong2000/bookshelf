/**
 * 独立验收 UI E2E 测试 - NEWW-6 书架自定义分组
 * 测试环境：前端 http://localhost:5183，后端 http://localhost:3021
 * 覆盖：F06/F07/F08 中依赖真实浏览器渲染的 UI 交互类验收条件
 * （表单校验、空态、取消、失败回滚展示等），黑盒 API 场景已由
 * e2e/api/groups.api.acceptance.test.ts 覆盖，此处不重复。
 *
 * 覆盖映射（验收编号 -> 用例）：
 * F06-AC01 -> F06: 分组管理 > 新建分组成功
 * F06-AC02 -> F06: 分组管理 > 新建分组名称为空校验
 * F06-AC03 -> F06: 分组管理 > 新建同名分组提示已存在
 * F06-AC04 -> F06: 分组管理 > 重命名分组保持归属不变
 * F06-AC05 -> F06: 分组管理 > 删除分组仅解除归属不删除书籍
 * F06-AC06 -> F06: 分组管理 > 取消删除分组保留
 * F06-AC07 -> F06: 分组管理 > 分组列表为空态提示
 * F07-AC01 -> F07: 书籍分组归属 > 打开归属入口展示勾选状态
 * F07-AC02 -> F07: 书籍分组归属 > 勾选分组后该书加入分组
 * F07-AC03 -> F07: 书籍分组归属 > 取消勾选后该书从分组移除
 * F07-AC04 -> F07: 书籍分组归属 > 详情页展示所有归属分组名称
 * F07-AC05 -> F07: 书籍分组归属 > 不勾选任何分组仍保留在总览
 * F07-AC06 -> F07: 书籍分组归属 > 保存失败提示并回滚勾选状态
 * F08-AC01 -> F08: 按分组浏览 > 按分组展示名称数量与书籍
 * F08-AC02 -> F08: 按分组浏览 > 空分组提示该分组还没有书
 * F08-AC03 -> F08: 按分组浏览 > 一本书出现在其归属的每个分组
 * F08-AC04 -> F08: 按分组浏览 > 无分组时空态并提供创建入口
 * F08-AC05 -> F08: 按分组浏览 > 类型分组与自定义分组视图互不影响
 * F08-AC06 -> F08: 按分组浏览 > 删除书籍后从所有分组视图同步消失
 *
 * 注意：本测试使用真实后端（隔离端口 3021/5183），不使用 Mock API
 * 每个 describe 块负责管理自己的测试数据（beforeAll 创建、afterAll 清理）
 */

import { test, expect } from '@playwright/test'

const API = 'http://localhost:3021'

async function apiPostBook(body: object) {
  const res = await fetch(`${API}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function apiDeleteBook(id: number) {
  await fetch(`${API}/api/books/${id}`, { method: 'DELETE' })
}

async function apiCreateGroup(name: string) {
  const res = await fetch(`${API}/api/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return res.json()
}

async function apiDeleteGroup(id: number) {
  await fetch(`${API}/api/groups/${id}`, { method: 'DELETE' })
}

async function apiSetBookGroups(bookId: number, groupIds: number[]) {
  const res = await fetch(`${API}/api/books/${bookId}/groups`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupIds }),
  })
  return res.json()
}

async function apiListGroups(): Promise<{ id: number; name: string; book_count: number }[]> {
  const res = await fetch(`${API}/api/groups`)
  const data = await res.json()
  return data.groups
}

async function apiGetAllBooks(): Promise<{ id: number; title: string }[]> {
  const res = await fetch(`${API}/api/books`)
  const data = await res.json()
  return data.books
}

async function cleanupBooks(ids: number[]) {
  for (const id of ids) await apiDeleteBook(id)
}

async function cleanupGroups(ids: number[]) {
  for (const id of ids) await apiDeleteGroup(id)
}

async function removeGroupsByName(names: string[]) {
  const groups = await apiListGroups()
  for (const n of names) {
    const g = groups.find(g => g.name === n)
    if (g) await apiDeleteGroup(g.id)
  }
}

test.describe('F06: 分组管理', () => {
  test.beforeAll(async () => {
    await removeGroupsByName(['F06新建分组', 'F06重复分组', 'F06重命名前', 'F06重命名后', 'F06待删除分组'])
  })

  test.afterAll(async () => {
    await removeGroupsByName(['F06新建分组', 'F06重复分组', 'F06重命名前', 'F06重命名后', 'F06待删除分组'])
  })

  test('F06-AC01: 新建分组并提交后出现在分组列表中', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("分组管理")')
    await expect(page.locator('.modal')).toBeVisible()
    await page.fill('input[placeholder="请输入分组名称"]', 'F06新建分组')
    await page.click('.btn-submit:has-text("新建分组")')
    await expect(page.locator('.group-manage-item').filter({ hasText: 'F06新建分组' })).toBeVisible()
  })

  test('F06-AC02: 未填写名称提交提示分组名称不能为空并阻止提交', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has-text("分组管理")')
    await expect(page.locator('.modal')).toBeVisible()
    await page.click('.btn-submit:has-text("新建分组")')
    await expect(page.locator('.error-msg.show')).toContainText('分组名称不能为空')
    await expect(page.locator('.modal')).toBeVisible()
  })

  test('F06-AC03: 新建同名分组提示分组名称已存在并阻止创建', async ({ page }) => {
    await apiCreateGroup('F06重复分组')
    await page.goto('/')
    await page.click('button:has-text("分组管理")')
    await expect(page.locator('.modal')).toBeVisible()
    await page.fill('input[placeholder="请输入分组名称"]', 'F06重复分组')
    await page.click('.btn-submit:has-text("新建分组")')
    await expect(page.locator('.error-msg.show')).toContainText('分组名称已存在')
    const items = page.locator('.group-manage-item').filter({ hasText: 'F06重复分组' })
    await expect(items).toHaveCount(1)
  })

  test('F06-AC04: 重命名分组后名称更新且归属关系不变', async ({ page }) => {
    const created = await apiCreateGroup('F06重命名前')
    const bookData = await apiPostBook({ title: 'F06重命名归属书', type: 'F06类型', author: 'F06作者' })
    await apiSetBookGroups(bookData.book.id, [created.group.id])

    await page.goto('/')
    await page.click('button:has-text("分组管理")')
    await expect(page.locator('.modal')).toBeVisible()
    const item = page.locator('.group-manage-item').filter({ hasText: 'F06重命名前' })
    await item.locator('button:has-text("重命名")').click()
    const renameInput = page.locator('.group-manage-item input[type="text"]')
    await renameInput.fill('F06重命名后')
    await page.locator('.group-manage-item button:has-text("保存")').click()
    await expect(page.locator('.group-manage-item').filter({ hasText: 'F06重命名后' })).toBeVisible()
    await page.click('.modal-close')

    const groupsAfter = await apiListGroups()
    const renamed = groupsAfter.find(g => g.name === 'F06重命名后')
    expect(renamed).toBeTruthy()
    expect(renamed!.book_count).toBe(1)

    await cleanupBooks([bookData.book.id])
  })

  test('F06-AC05: 删除分组后从列表移除，分组内书籍不被删除仅解除归属', async ({ page }) => {
    const created = await apiCreateGroup('F06待删除分组')
    const bookData = await apiPostBook({ title: 'F06待删除分组归属书', type: 'F06类型', author: 'F06作者' })
    await apiSetBookGroups(bookData.book.id, [created.group.id])

    await page.goto('/')
    await page.click('button:has-text("分组管理")')
    await expect(page.locator('.modal')).toBeVisible()
    const item = page.locator('.group-manage-item').filter({ hasText: 'F06待删除分组' })
    await item.locator('button:has-text("删除")').click()
    await expect(page.locator('.confirm-box')).toBeVisible()
    await page.click('.btn-confirm-danger')
    await expect(page.locator('.group-manage-item').filter({ hasText: 'F06待删除分组' })).not.toBeVisible()

    const books = await apiGetAllBooks()
    const stillExists = books.find(b => b.id === bookData.book.id)
    expect(stillExists).toBeTruthy()

    await cleanupBooks([bookData.book.id])
  })

  test('F06-AC06: 取消删除分组后分组保留归属关系不变', async ({ page }) => {
    const created = await apiCreateGroup('F06取消删除分组')
    await page.goto('/')
    await page.click('button:has-text("分组管理")')
    await expect(page.locator('.modal')).toBeVisible()
    const item = page.locator('.group-manage-item').filter({ hasText: 'F06取消删除分组' })
    await item.locator('button:has-text("删除")').click()
    await expect(page.locator('.confirm-box')).toBeVisible()
    await page.click('.confirm-box .btn-cancel')
    await expect(page.locator('.confirm-box')).not.toBeVisible()
    await expect(page.locator('.group-manage-item').filter({ hasText: 'F06取消删除分组' })).toBeVisible()
    await cleanupGroups([created.group.id])
  })

  test('F06-AC07: 分组列表为空时显示空态提示', async ({ page }) => {
    await page.route('**/api/groups', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ groups: [] }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/')
    await page.waitForSelector('.header')
    await page.click('button:has-text("分组管理")')
    await expect(page.locator('.modal')).toBeVisible()
    await expect(page.locator('.group-empty')).toContainText('还没有分组，创建一个开始整理书架吧')
  })
})

test.describe('F07: 书籍分组归属', () => {
  let bookId: number
  let groupAId: number
  let groupBId: number

  test.beforeAll(async () => {
    await removeGroupsByName(['F07分组A', 'F07分组B'])
    const gA = await apiCreateGroup('F07分组A')
    const gB = await apiCreateGroup('F07分组B')
    groupAId = gA.group.id
    groupBId = gB.group.id
    const b = await apiPostBook({ title: 'F07归属测试书', type: 'F07类型', author: 'F07作者' })
    bookId = b.book.id
  })

  test.afterAll(async () => {
    await cleanupBooks([bookId])
    await cleanupGroups([groupAId, groupBId])
  })

  test('F07-AC01: 打开分组归属入口展示所有分组及当前勾选状态', async ({ page }) => {
    await apiSetBookGroups(bookId, [groupAId])
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card').filter({ hasText: 'F07归属测试书' }).click()
    await page.click('button:has-text("设置分组")')
    await expect(page.locator('.modal').filter({ hasText: '设置分组' })).toBeVisible()
    const itemA = page.locator('.group-picker-item').filter({ hasText: 'F07分组A' })
    const itemB = page.locator('.group-picker-item').filter({ hasText: 'F07分组B' })
    await expect(itemA).toBeVisible()
    await expect(itemB).toBeVisible()
    await expect(itemA.locator('input[type="checkbox"]')).toBeChecked()
    await expect(itemB.locator('input[type="checkbox"]')).not.toBeChecked()
    await page.click('.modal .btn-cancel')
  })

  test('F07-AC02: 勾选未归属分组并确认后该书加入该分组，分组详情页可见', async ({ page }) => {
    await apiSetBookGroups(bookId, [])
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card').filter({ hasText: 'F07归属测试书' }).click()
    await page.click('button:has-text("设置分组")')
    await page.locator('.group-picker-item').filter({ hasText: 'F07分组A' }).locator('input[type="checkbox"]').check()
    await page.click('.modal .btn-submit')
    await expect(page.locator('.modal').filter({ hasText: '设置分组' })).not.toBeVisible()

    const groupBooksRes = await fetch(`${API}/api/groups/${groupAId}/books`)
    const groupBooks = (await groupBooksRes.json()).books
    expect(groupBooks.find((b: { id: number }) => b.id === bookId)).toBeTruthy()
  })

  test('F07-AC03: 取消勾选已归属分组并确认后该书从该分组移除，其他分组归属不受影响', async ({ page }) => {
    await apiSetBookGroups(bookId, [groupAId, groupBId])
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card').filter({ hasText: 'F07归属测试书' }).click()
    await page.click('button:has-text("设置分组")')
    await page.locator('.group-picker-item').filter({ hasText: 'F07分组A' }).locator('input[type="checkbox"]').uncheck()
    await page.click('.modal .btn-submit')
    await expect(page.locator('.modal').filter({ hasText: '设置分组' })).not.toBeVisible()

    const idsRes = await fetch(`${API}/api/books/${bookId}/groups`)
    const ids = (await idsRes.json()).groupIds
    expect(ids).not.toContain(groupAId)
    expect(ids).toContain(groupBId)
  })

  test('F07-AC04: 书籍同时归属分组A和B时详情页展示所有归属分组名称', async ({ page }) => {
    await apiSetBookGroups(bookId, [groupAId, groupBId])
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card').filter({ hasText: 'F07归属测试书' }).click()
    await expect(page.locator('.detail-groups')).toBeVisible()
    await expect(page.locator('.detail-group-tag').filter({ hasText: 'F07分组A' })).toBeVisible()
    await expect(page.locator('.detail-group-tag').filter({ hasText: 'F07分组B' })).toBeVisible()
  })

  test('F07-AC05: 不勾选任何分组保存后该书不在任何自定义分组视图但仍存在于书架总览', async ({ page }) => {
    await apiSetBookGroups(bookId, [groupAId])
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card').filter({ hasText: 'F07归属测试书' }).click()
    await page.click('button:has-text("设置分组")')
    await page.locator('.group-picker-item').filter({ hasText: 'F07分组A' }).locator('input[type="checkbox"]').uncheck()
    await page.click('.modal .btn-submit')
    await expect(page.locator('.modal').filter({ hasText: '设置分组' })).not.toBeVisible()
    await page.click('.detail-panel .modal-close')
    await expect(page.locator('.detail-overlay')).not.toBeVisible()

    await page.click('.view-toggle button:nth-child(1)')
    await expect(page.locator('.book-title').filter({ hasText: 'F07归属测试书' })).toBeVisible()

    await page.click('.view-toggle button:nth-child(3)')
    const groupASection = page.locator('.group-section').filter({ hasText: 'F07分组A' })
    await expect(groupASection.locator('.book-title').filter({ hasText: 'F07归属测试书' })).not.toBeVisible()
  })

  test('F07-AC06: 提交分组归属变更时后端失败显示错误提示并回退到变更前状态', async ({ page }) => {
    await apiSetBookGroups(bookId, [groupAId])
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card').filter({ hasText: 'F07归属测试书' }).click()
    await page.click('button:has-text("设置分组")')

    await page.route('**/api/books/*/groups', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) })
      } else {
        await route.continue()
      }
    })

    await page.locator('.group-picker-item').filter({ hasText: 'F07分组B' }).locator('input[type="checkbox"]').check()
    await page.click('.modal .btn-submit')
    await expect(page.locator('.error-msg.show')).toContainText('设置分组失败，请重试')

    const checkboxA = page.locator('.group-picker-item').filter({ hasText: 'F07分组A' }).locator('input[type="checkbox"]')
    const checkboxB = page.locator('.group-picker-item').filter({ hasText: 'F07分组B' }).locator('input[type="checkbox"]')
    await expect(checkboxA).toBeChecked()
    await expect(checkboxB).not.toBeChecked()

    const idsRes = await fetch(`${API}/api/books/${bookId}/groups`)
    const ids = (await idsRes.json()).groupIds
    expect(ids).toEqual([groupAId])
  })
})

test.describe('F08: 按分组浏览', () => {
  test.describe('有分组场景', () => {
    let groupXId: number
    let groupYId: number
    let bookIds: number[] = []

    test.beforeAll(async () => {
      await removeGroupsByName(['F08分组X', 'F08分组Y'])
      const gx = await apiCreateGroup('F08分组X')
      const gy = await apiCreateGroup('F08分组Y')
      groupXId = gx.group.id
      groupYId = gy.group.id
      const b1 = await apiPostBook({ title: 'F08书籍1', type: 'F08类型', author: 'F08作者1' })
      const b2 = await apiPostBook({ title: 'F08书籍2', type: 'F08类型', author: 'F08作者2' })
      bookIds = [b1.book.id, b2.book.id]
      await apiSetBookGroups(b1.book.id, [groupXId, groupYId])
      await apiSetBookGroups(b2.book.id, [groupXId])
    })

    test.afterAll(async () => {
      await cleanupBooks(bookIds)
      await cleanupGroups([groupXId, groupYId])
    })

    test('F08-AC01: 切换到自定义分组视图按分组展示名称数量和书籍', async ({ page }) => {
      await page.goto('/')
      await page.click('.view-toggle button:nth-child(3)')
      await expect(page.locator('.group-view')).toBeVisible()
      const sectionX = page.locator('.group-section').filter({ hasText: 'F08分组X' })
      await expect(sectionX).toBeVisible()
      await expect(sectionX.locator('.group-count')).toContainText('2 本')
      await expect(sectionX.locator('.book-title').filter({ hasText: 'F08书籍1' })).toBeVisible()
      await expect(sectionX.locator('.book-title').filter({ hasText: 'F08书籍2' })).toBeVisible()
    })

    test('F08-AC02: 分组下没有归属书籍时展示空组提示', async ({ page }) => {
      const gEmpty = await apiCreateGroup('F08空分组')
      await page.goto('/')
      await page.click('.view-toggle button:nth-child(3)')
      const sectionEmpty = page.locator('.group-section').filter({ hasText: 'F08空分组' })
      await expect(sectionEmpty.locator('.group-empty')).toContainText('该分组还没有书')
      await cleanupGroups([gEmpty.group.id])
    })

    test('F08-AC03: 一本书同时归属多个分组时在每个分组中都出现', async ({ page }) => {
      await page.goto('/')
      await page.click('.view-toggle button:nth-child(3)')
      const sectionX = page.locator('.group-section').filter({ hasText: 'F08分组X' })
      const sectionY = page.locator('.group-section').filter({ hasText: 'F08分组Y' })
      await expect(sectionX.locator('.book-title').filter({ hasText: 'F08书籍1' })).toBeVisible()
      await expect(sectionY.locator('.book-title').filter({ hasText: 'F08书籍1' })).toBeVisible()
    })

    test('F08-AC05: 类型分组视图与自定义分组视图切换互不影响各自正确展示', async ({ page }) => {
      await page.goto('/')
      await page.click('.view-toggle button:nth-child(2)')
      await expect(page.locator('.group-view')).toBeVisible()
      const typeSection = page.locator('.group-section').filter({ hasText: 'F08类型' })
      await expect(typeSection).toBeVisible()
      await expect(typeSection.locator('.group-count')).toContainText('2 本')

      await page.click('.view-toggle button:nth-child(3)')
      await expect(page.locator('.group-view')).toBeVisible()
      const sectionX = page.locator('.group-section').filter({ hasText: 'F08分组X' })
      await expect(sectionX).toBeVisible()

      await page.click('.view-toggle button:nth-child(2)')
      const typeSectionAgain = page.locator('.group-section').filter({ hasText: 'F08类型' })
      await expect(typeSectionAgain.locator('.group-count')).toContainText('2 本')
    })

    test('F08-AC06: 在自定义分组视图中删除某本书后从所有分组视图同步消失', async ({ page }) => {
      const b3 = await apiPostBook({ title: 'F08待删除书', type: 'F08类型', author: 'F08作者3' })
      await apiSetBookGroups(b3.book.id, [groupXId, groupYId])
      await page.goto('/')
      await page.click('.view-toggle button:nth-child(3)')
      const sectionX = page.locator('.group-section').filter({ hasText: 'F08分组X' })
      const sectionY = page.locator('.group-section').filter({ hasText: 'F08分组Y' })
      await expect(sectionX.locator('.book-title').filter({ hasText: 'F08待删除书' })).toBeVisible()
      await sectionX.locator('.book-card').filter({ hasText: 'F08待删除书' }).locator('.btn-icon.delete').click()
      await page.click('.btn-confirm-danger')
      await expect(sectionX.locator('.book-title').filter({ hasText: 'F08待删除书' })).not.toBeVisible()
      await expect(sectionY.locator('.book-title').filter({ hasText: 'F08待删除书' })).not.toBeVisible()
      const books = await apiGetAllBooks()
      expect(books.find(b => b.id === b3.book.id)).toBeUndefined()
    })
  })

  test.describe('无分组场景', () => {
    let placeholderBookId: number

    test.beforeEach(async () => {
      const groups = await apiListGroups()
      await cleanupGroups(groups.map(g => g.id))
      const b = await apiPostBook({ title: 'F08无分组场景占位书', type: 'F08类型', author: 'F08作者' })
      placeholderBookId = b.book.id
    })

    test.afterEach(async () => {
      await cleanupBooks([placeholderBookId])
    })

    test('F08-AC04: 尚未创建任何分组时切换到自定义分组视图显示空态并提供创建入口', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.book-card')
      await page.click('.view-toggle button:nth-child(3)')
      const customGroupEmpty = page.locator('.empty-state').filter({ hasText: '还没有分组，创建一个开始整理书架吧' })
      await expect(customGroupEmpty).toBeVisible()
      await expect(customGroupEmpty.locator('button.btn-add')).toBeVisible()
      await customGroupEmpty.locator('button.btn-add').click()
      await expect(page.locator('.modal').filter({ hasText: '分组管理' })).toBeVisible()
    })
  })
})
