/**
 * 独立验收 - 黑盒 API 测试（NEWW-6 书架分组能力）
 * 测试环境：http://localhost:3011
 * 覆盖：F06-AC01, F06-AC03, F06-AC04, F06-AC05, F07-AC02, F07-AC03, F07-AC05, F07-AC07
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const BASE_URL = 'http://localhost:3011'

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

describe('F06-AC01 + F06-AC03: POST /api/groups - 新建分组', () => {
  let groupId: number

  afterAll(async () => {
    if (groupId) await api('DELETE', `/api/groups/${groupId}`)
  })

  it('F06-AC01: 新建分组成功，出现在分组列表中', async () => {
    const { status, data } = await api('POST', '/api/groups', { name: '独立验收-在读' })
    expect(status).toBe(201)
    expect(data.group.name).toBe('独立验收-在读')
    groupId = data.group.id

    const list = await api('GET', '/api/groups')
    const found = list.data.groups.find((g: any) => g.id === groupId)
    expect(found).toBeDefined()
  })

  it('F06-AC03: 重复分组名返回 409', async () => {
    const { status, data } = await api('POST', '/api/groups', { name: '独立验收-在读' })
    expect(status).toBe(409)
    expect(data.error).toBe('分组名称已存在')
  })
})

describe('F06-AC04: PUT /api/groups/:id - 重命名分组', () => {
  let groupId: number
  let bookId: number

  beforeAll(async () => {
    const g = await api('POST', '/api/groups', { name: '独立验收-重命名前' })
    groupId = g.data.group.id
    const b = await api('POST', '/api/books', { title: '独立验收-分组测试书', type: '测试', author: '测试作者' })
    bookId = b.data.book.id
    await api('PUT', `/api/books/${bookId}/groups`, { groupIds: [groupId] })
  })

  afterAll(async () => {
    if (bookId) await api('DELETE', `/api/books/${bookId}`)
    if (groupId) await api('DELETE', `/api/groups/${groupId}`)
  })

  it('F06-AC04: 重命名后名称更新，书籍归属保持不变', async () => {
    const { status, data } = await api('PUT', `/api/groups/${groupId}`, { name: '独立验收-重命名后' })
    expect(status).toBe(200)
    expect(data.group.name).toBe('独立验收-重命名后')

    const groupIds = await api('GET', `/api/books/${bookId}/groups`)
    expect(groupIds.data.groupIds).toEqual([groupId])
  })
})

describe('F06-AC05: DELETE /api/groups/:id - 删除分组仅解除归属', () => {
  let groupId: number
  let bookId: number

  beforeAll(async () => {
    const g = await api('POST', '/api/groups', { name: '独立验收-待删除分组' })
    groupId = g.data.group.id
    const b = await api('POST', '/api/books', { title: '独立验收-待删除分组测试书', type: '测试', author: '测试作者' })
    bookId = b.data.book.id
    await api('PUT', `/api/books/${bookId}/groups`, { groupIds: [groupId] })
  })

  afterAll(async () => {
    if (bookId) await api('DELETE', `/api/books/${bookId}`)
  })

  it('F06-AC05: 删除分组后书籍本身仍存在', async () => {
    const del = await api('DELETE', `/api/groups/${groupId}`)
    expect(del.status).toBe(200)
    expect(del.data.success).toBe(true)

    const book = await api('GET', `/api/books/${bookId}`)
    expect(book.status).toBe(200)
  })
})

describe('F07-AC02 + F07-AC03 + F07-AC05: PUT /api/books/:id/groups - 书籍分组归属', () => {
  let groupAId: number
  let groupBId: number
  let bookId: number

  beforeAll(async () => {
    const gA = await api('POST', '/api/groups', { name: '独立验收-分组A' })
    groupAId = gA.data.group.id
    const gB = await api('POST', '/api/groups', { name: '独立验收-分组B' })
    groupBId = gB.data.group.id
    const b = await api('POST', '/api/books', { title: '独立验收-归属测试书', type: '测试', author: '测试作者' })
    bookId = b.data.book.id
  })

  afterAll(async () => {
    if (bookId) await api('DELETE', `/api/books/${bookId}`)
    if (groupAId) await api('DELETE', `/api/groups/${groupAId}`)
    if (groupBId) await api('DELETE', `/api/groups/${groupBId}`)
  })

  it('F07-AC02: 加入分组 A 和 B 成功', async () => {
    const { status, data } = await api('PUT', `/api/books/${bookId}/groups`, { groupIds: [groupAId, groupBId] })
    expect(status).toBe(200)
    expect(data.groupIds.sort()).toEqual([groupAId, groupBId].sort())
  })

  it('F07-AC03: 取消勾选分组 A，分组 B 归属不受影响', async () => {
    const { status, data } = await api('PUT', `/api/books/${bookId}/groups`, { groupIds: [groupBId] })
    expect(status).toBe(200)
    expect(data.groupIds).toEqual([groupBId])

    const groupBBooks = await api('GET', `/api/groups/${groupBId}/books`)
    expect(groupBBooks.data.books.some((b: any) => b.id === bookId)).toBe(true)
  })

  it('F07-AC05: 取消所有分组后，书籍不出现在任何分组视图中，但仍存在', async () => {
    const { status } = await api('PUT', `/api/books/${bookId}/groups`, { groupIds: [] })
    expect(status).toBe(200)

    const groupBBooks = await api('GET', `/api/groups/${groupBId}/books`)
    expect(groupBBooks.data.books.some((b: any) => b.id === bookId)).toBe(false)

    const book = await api('GET', `/api/books/${bookId}`)
    expect(book.status).toBe(200)
  })
})

describe('F07-AC07: 删除书籍级联清除分组归属', () => {
  let groupId: number
  let bookId: number

  beforeAll(async () => {
    const g = await api('POST', '/api/groups', { name: '独立验收-级联删除分组' })
    groupId = g.data.group.id
    const b = await api('POST', '/api/books', { title: '独立验收-级联删除测试书', type: '测试', author: '测试作者' })
    bookId = b.data.book.id
    await api('PUT', `/api/books/${bookId}/groups`, { groupIds: [groupId] })
  })

  afterAll(async () => {
    if (groupId) await api('DELETE', `/api/groups/${groupId}`)
  })

  it('F07-AC07: 删除书籍后分组内不再包含该书', async () => {
    const del = await api('DELETE', `/api/books/${bookId}`)
    expect(del.status).toBe(200)

    const groupBooks = await api('GET', `/api/groups/${groupId}/books`)
    expect(groupBooks.data.books.some((b: any) => b.id === bookId)).toBe(false)
  })
})
