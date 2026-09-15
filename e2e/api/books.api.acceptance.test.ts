/**
 * 独立验收 - 黑盒 API 测试
 * 测试环境：http://localhost:3001
 * 覆盖：F01-AC05, F02-AC02, F02-AC05, F05-AC04
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const BASE_URL = 'http://localhost:3001'

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

let createdBookId: number

describe('F01-AC05: GET /api/books - 返回书籍数组含必要字段', () => {
  beforeAll(async () => {
    const res = await api('POST', '/api/books', {
      title: 'AC05-测试书籍',
      type: '测试类型',
      author: 'AC05-测试作者',
      description: '用于F01-AC05验收',
    })
    createdBookId = res.data?.book?.id
  })

  afterAll(async () => {
    if (createdBookId) {
      await api('DELETE', `/api/books/${createdBookId}`)
    }
  })

  it('F01-AC05: 返回 200，books 是数组，每条记录含 id、title、type、author', async () => {
    const { status, data } = await api('GET', '/api/books')
    expect(status).toBe(200)
    expect(Array.isArray(data.books)).toBe(true)
    const book = data.books.find((b: any) => b.id === createdBookId)
    expect(book).toBeDefined()
    expect(book).toHaveProperty('id')
    expect(book).toHaveProperty('title')
    expect(book).toHaveProperty('type')
    expect(book).toHaveProperty('author')
  })
})

describe('F02-AC02 + F02-AC05: POST /api/books - 添加书籍', () => {
  let testBookId: number

  afterAll(async () => {
    if (testBookId) {
      await api('DELETE', `/api/books/${testBookId}`)
    }
  })

  it('F02-AC02: POST 合法数据 → 201 且返回书籍信息含书名、类型、作者', async () => {
    const { status, data } = await api('POST', '/api/books', {
      title: '独立验收-平凡的世界',
      type: '现实主义文学',
      author: '路遥',
      description: '深刻展现农村生活',
    })
    expect(status).toBe(201)
    expect(data.book.title).toBe('独立验收-平凡的世界')
    expect(data.book.type).toBe('现实主义文学')
    expect(data.book.author).toBe('路遥')
    testBookId = data.book.id
  })

  it('F02-AC05: 添加成功后 GET /api/books 列表中包含该新书', async () => {
    const { status, data } = await api('GET', '/api/books')
    expect(status).toBe(200)
    const found = data.books.find((b: any) => b.id === testBookId)
    expect(found).toBeDefined()
    expect(found.title).toBe('独立验收-平凡的世界')
  })
})

describe('F02-AC03: POST /api/books - 缺少必填字段校验', () => {
  it('F02-AC03: 缺少书名 → 400 + 错误提示「书名不能为空」', async () => {
    const { status, data } = await api('POST', '/api/books', {
      type: '文学',
      author: '测试作者',
    })
    expect(status).toBe(400)
    expect(data.error).toBe('书名不能为空')
  })

  it('F02-AC04: 缺少作者 → 400 + 错误提示「作者不能为空」', async () => {
    const { status, data } = await api('POST', '/api/books', {
      title: '测试书名',
      type: '文学',
    })
    expect(status).toBe(400)
    expect(data.error).toBe('作者不能为空')
  })
})

describe('F05-AC04: DELETE /api/books/:id - 删除书籍', () => {
  let deleteTargetId: number

  beforeAll(async () => {
    const res = await api('POST', '/api/books', {
      title: '独立验收-待删除书籍',
      type: '测试',
      author: '测试删除作者',
    })
    deleteTargetId = res.data?.book?.id
  })

  it('F05-AC04: DELETE 成功后 GET 列表不再包含该书', async () => {
    const delRes = await api('DELETE', `/api/books/${deleteTargetId}`)
    expect(delRes.status).toBe(200)
    expect(delRes.data.success).toBe(true)

    const listRes = await api('GET', '/api/books')
    const found = listRes.data.books.find((b: any) => b.id === deleteTargetId)
    expect(found).toBeUndefined()
  })
})
