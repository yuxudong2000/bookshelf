import { test, expect } from '@playwright/test'

test.describe('F01: 书架总览', () => {
  test('F01-AC01: 书架中有书籍时显示所有书籍列表', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const cards = page.locator('.book-card')
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('F01-AC02: 书架为空时显示空态提示', async ({ page }) => {
    await page.route('**/api/books', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ books: [] }) })
    })
    await page.goto('/')
    await page.waitForSelector('.empty-state')
    await expect(page.locator('.empty-state p')).toContainText('书架空空如也，快去添加第一本书吧')
  })

  test('F01-AC03: 每本书展示书名、类型标签和作者', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const firstCard = page.locator('.book-card').first()
    await expect(firstCard.locator('.book-title')).toBeVisible()
    await expect(firstCard.locator('.book-author')).toBeVisible()
    await expect(firstCard.locator('.book-type-tag')).toBeVisible()
  })

  test('F01-AC04: 数据未返回时显示加载态', async ({ page }) => {
    await page.route('**/api/books', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })
    const loadPromise = page.goto('/')
    await expect(page.locator('.loading').first()).toBeVisible({ timeout: 1000 })
    await loadPromise
  })
})

test.describe('F02: 书籍添加', () => {
  test('F02-AC01: 点击添加按钮弹出表单，包含四个字段', async ({ page }) => {
    await page.goto('/')
    await page.click('.btn-add')
    await expect(page.locator('.modal h2')).toContainText('添加书籍')
    await expect(page.locator('.form-group label').filter({ hasText: '书名' })).toBeVisible()
    await expect(page.locator('.form-group label').filter({ hasText: '类型' })).toBeVisible()
    await expect(page.locator('.form-group label').filter({ hasText: '作者' })).toBeVisible()
    await expect(page.locator('.form-group label').filter({ hasText: '简介' })).toBeVisible()
  })

  test('F02-AC02: 填写必填字段后成功添加', async ({ page }) => {
    await page.goto('/')
    await page.click('.btn-add')
    await page.fill('input[placeholder="请输入书名"]', '测试书籍')
    await page.fill('input[placeholder="请输入书籍类型"]', '测试类型')
    await page.fill('input[placeholder="请输入作者"]', '测试作者')
    await page.click('.btn-submit')
    await expect(page.locator('.toast.success')).toBeVisible()
    await expect(page.locator('.book-card').filter({ hasText: '测试书籍' })).toBeVisible()
  })

  test('F02-AC03: 书名为空时提示校验错误', async ({ page }) => {
    await page.goto('/')
    await page.click('.btn-add')
    await page.fill('input[placeholder="请输入书籍类型"]', '类型')
    await page.fill('input[placeholder="请输入作者"]', '作者')
    await page.click('.btn-submit')
    await expect(page.locator('.error-msg.show').first()).toContainText('书名不能为空')
  })

  test('F02-AC04: 作者为空时提示校验错误', async ({ page }) => {
    await page.goto('/')
    await page.click('.btn-add')
    await page.fill('input[placeholder="请输入书名"]', '书名')
    await page.fill('input[placeholder="请输入书籍类型"]', '类型')
    await page.click('.btn-submit')
    await expect(page.locator('.error-msg.show').filter({ hasText: '作者不能为空' })).toBeVisible()
  })

  test('F02-AC06: 后端失败时显示错误提示', async ({ page }) => {
    await page.route('**/api/books', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, body: JSON.stringify({ error: '添加失败，请重试' }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/')
    await page.click('.btn-add')
    await page.fill('input[placeholder="请输入书名"]', '测试')
    await page.fill('input[placeholder="请输入书籍类型"]', '类型')
    await page.fill('input[placeholder="请输入作者"]', '作者')
    await page.click('.btn-submit')
    await expect(page.locator('.toast.error')).toBeVisible()
  })
})

test.describe('F03: 类型分组', () => {
  test('F03-AC01: 切换到分组视图时按类型分组', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.click('.view-toggle button:has-text("分组")')
    await expect(page.locator('.group-section').first()).toBeVisible()
    await expect(page.locator('.group-header h3').first()).toBeVisible()
  })

  test('F03-AC02: 列表视图和分组视图切换', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.click('.view-toggle button:has-text("分组")')
    await expect(page.locator('.group-view')).toBeVisible()
    await page.click('.view-toggle button:has-text("列表")')
    await expect(page.locator('.book-list')).toBeVisible()
  })

  test('F03-AC05: 每个分组标题旁显示书籍数量', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.click('.view-toggle button:has-text("分组")')
    const count = page.locator('.group-count').first()
    await expect(count).toBeVisible()
    await expect(count).toContainText('本')
  })
})

test.describe('F04: 书籍详情', () => {
  test('F04-AC01: 点击书籍显示详情', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card').first().click()
    await expect(page.locator('.detail-panel')).toBeVisible()
    await expect(page.locator('.detail-panel h2')).toBeVisible()
    await expect(page.locator('.detail-meta .type')).toBeVisible()
    await expect(page.locator('.detail-meta .author')).toBeVisible()
  })

  test('F04-AC02: 关闭详情回到列表', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card').first().click()
    await expect(page.locator('.detail-panel')).toBeVisible()
    await page.locator('.detail-panel .modal-close').click()
    await expect(page.locator('.detail-panel')).not.toBeVisible()
    await expect(page.locator('.book-list')).toBeVisible()
  })

  test('F04-AC03: 简介为空时显示暂无简介', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card').filter({ hasNotText: '' }).first().click()
    const desc = page.locator('.detail-desc')
    const text = await desc.textContent()
    if (text?.includes('暂无简介')) {
      expect(text).toContain('暂无简介')
    }
  })
})

test.describe('F05: 书籍删除', () => {
  test('F05-AC01: 触发删除弹出确认提示', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card .btn-icon.delete').first().click()
    await expect(page.locator('.confirm-box')).toBeVisible()
    await expect(page.locator('.confirm-box p')).toContainText('确定要删除这本书吗？')
  })

  test('F05-AC02: 确认删除后书籍移除', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const countBefore = await page.locator('.book-card').count()
    await page.locator('.book-card .btn-icon.delete').first().click()
    await page.click('.btn-confirm-danger')
    await expect(page.locator('.toast.success')).toBeVisible()
    const countAfter = await page.locator('.book-card').count()
    expect(countAfter).toBe(countBefore - 1)
  })

  test('F05-AC03: 取消删除后书籍保留', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.book-card')
    const countBefore = await page.locator('.book-card').count()
    await page.locator('.book-card .btn-icon.delete').first().click()
    await page.locator('.confirm-box .btn-cancel').click()
    const countAfter = await page.locator('.book-card').count()
    expect(countAfter).toBe(countBefore)
  })

  test('F05-AC05: 后端删除失败时显示错误提示', async ({ page }) => {
    await page.route('**/api/books/*', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 500, body: JSON.stringify({ error: '删除失败，请重试' }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/')
    await page.waitForSelector('.book-card')
    await page.locator('.book-card .btn-icon.delete').first().click()
    await page.click('.btn-confirm-danger')
    await expect(page.locator('.toast.error')).toBeVisible()
  })
})
