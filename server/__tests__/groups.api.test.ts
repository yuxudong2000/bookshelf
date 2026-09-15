import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { createDb } from '../src/db.js'
import { createBooksRouter } from '../src/routes/books.js'
import { createGroupsRouter } from '../src/routes/groups.js'
import type Database from 'better-sqlite3'

function createApp(): { app: express.Express; db: Database.Database } {
  const db = createDb()
  const app = express()
  app.use(express.json())
  app.use('/api', createBooksRouter(db))
  app.use('/api', createGroupsRouter(db))
  return { app, db }
}

function insertBook(db: Database.Database, overrides: Partial<{ title: string; type: string; author: string }> = {}) {
  const info = db
    .prepare('INSERT INTO books (title, type, author, description) VALUES (?, ?, ?, ?)')
    .run(overrides.title || '三体', overrides.type || '科技', overrides.author || '刘慈欣', '')
  return info.lastInsertRowid as number
}

describe('POST /api/groups', () => {
  it('F06-AC01: 正常创建分组', async () => {
    const { app } = createApp()
    const res = await request(app).post('/api/groups').send({ name: '在读' })
    expect(res.status).toBe(201)
    expect(res.body.group.name).toBe('在读')
  })

  it('F06-AC02: 名称为空返回 400', async () => {
    const { app } = createApp()
    const res = await request(app).post('/api/groups').send({ name: '   ' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('分组名称不能为空')
  })

  it('F06-AC03: 同名分组返回 409', async () => {
    const { app } = createApp()
    await request(app).post('/api/groups').send({ name: '收藏' })
    const res = await request(app).post('/api/groups').send({ name: '收藏' })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('分组名称已存在')
  })
})

describe('GET /api/groups', () => {
  it('返回分组列表并包含 book_count', async () => {
    const { app, db } = createApp()
    const g = await request(app).post('/api/groups').send({ name: '书单A' })
    const bookId = insertBook(db)
    await request(app).put(`/api/books/${bookId}/groups`).send({ groupIds: [g.body.group.id] })
    const res = await request(app).get('/api/groups')
    expect(res.status).toBe(200)
    expect(res.body.groups).toHaveLength(1)
    expect(res.body.groups[0].book_count).toBe(1)
  })
})

describe('PUT /api/groups/:id', () => {
  it('F06-AC04: 重命名分组，书籍归属保持不变', async () => {
    const { app, db } = createApp()
    const g = await request(app).post('/api/groups').send({ name: '在读' })
    const bookId = insertBook(db)
    await request(app).put(`/api/books/${bookId}/groups`).send({ groupIds: [g.body.group.id] })

    const rename = await request(app).put(`/api/groups/${g.body.group.id}`).send({ name: '精读' })
    expect(rename.status).toBe(200)
    expect(rename.body.group.name).toBe('精读')

    const groupIds = await request(app).get(`/api/books/${bookId}/groups`)
    expect(groupIds.body.groupIds).toEqual([g.body.group.id])
  })

  it('重命名为已存在名称返回 409', async () => {
    const { app } = createApp()
    await request(app).post('/api/groups').send({ name: 'A' })
    const b = await request(app).post('/api/groups').send({ name: 'B' })
    const res = await request(app).put(`/api/groups/${b.body.group.id}`).send({ name: 'A' })
    expect(res.status).toBe(409)
  })

  it('分组不存在返回 404', async () => {
    const { app } = createApp()
    const res = await request(app).put('/api/groups/999').send({ name: 'X' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/groups/:id', () => {
  it('F06-AC05: 删除分组仅解除归属，书籍本身不受影响', async () => {
    const { app, db } = createApp()
    const g = await request(app).post('/api/groups').send({ name: '待删除' })
    const bookId = insertBook(db)
    await request(app).put(`/api/books/${bookId}/groups`).send({ groupIds: [g.body.group.id] })

    const del = await request(app).delete(`/api/groups/${g.body.group.id}`)
    expect(del.status).toBe(200)
    expect(del.body.success).toBe(true)

    const book = await request(app).get(`/api/books/${bookId}`)
    expect(book.status).toBe(200)

    const groups = await request(app).get('/api/groups')
    expect(groups.body.groups).toHaveLength(0)
  })

  it('分组不存在返回 404', async () => {
    const { app } = createApp()
    const res = await request(app).delete('/api/groups/999')
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/books/:id/groups', () => {
  it('F07-AC02: 加入未归属分组', async () => {
    const { app, db } = createApp()
    const g = await request(app).post('/api/groups').send({ name: 'G1' })
    const bookId = insertBook(db)
    const res = await request(app).put(`/api/books/${bookId}/groups`).send({ groupIds: [g.body.group.id] })
    expect(res.status).toBe(200)
    expect(res.body.groupIds).toEqual([g.body.group.id])
    const inGroup = await request(app).get(`/api/groups/${g.body.group.id}/books`)
    expect(inGroup.body.books.map((b: any) => b.id)).toContain(bookId)
  })

  it('F07-AC03: 取消勾选后从分组移除，其他分组不受影响', async () => {
    const { app, db } = createApp()
    const g1 = await request(app).post('/api/groups').send({ name: 'G1' })
    const g2 = await request(app).post('/api/groups').send({ name: 'G2' })
    const bookId = insertBook(db)
    await request(app).put(`/api/books/${bookId}/groups`).send({ groupIds: [g1.body.group.id, g2.body.group.id] })

    const res = await request(app).put(`/api/books/${bookId}/groups`).send({ groupIds: [g2.body.group.id] })
    expect(res.status).toBe(200)
    expect(res.body.groupIds).toEqual([g2.body.group.id])
  })

  it('F07-AC05: 不勾选任何分组，书籍不出现在任何分组视图', async () => {
    const { app, db } = createApp()
    const g = await request(app).post('/api/groups').send({ name: 'G1' })
    const bookId = insertBook(db)
    await request(app).put(`/api/books/${bookId}/groups`).send({ groupIds: [g.body.group.id] })
    await request(app).put(`/api/books/${bookId}/groups`).send({ groupIds: [] })

    const inGroup = await request(app).get(`/api/groups/${g.body.group.id}/books`)
    expect(inGroup.body.books).toHaveLength(0)

    const book = await request(app).get(`/api/books/${bookId}`)
    expect(book.status).toBe(200)
  })

  it('groupIds 含不存在分组返回 400', async () => {
    const { app, db } = createApp()
    const bookId = insertBook(db)
    const res = await request(app).put(`/api/books/${bookId}/groups`).send({ groupIds: [999] })
    expect(res.status).toBe(400)
  })

  it('书籍不存在返回 404', async () => {
    const { app } = createApp()
    const res = await request(app).put('/api/books/999/groups').send({ groupIds: [] })
    expect(res.status).toBe(404)
  })
})

describe('F07-AC07: 删除书籍级联清除分组归属', () => {
  it('删除书籍后其分组归属一并清除', async () => {
    const { app, db } = createApp()
    const g = await request(app).post('/api/groups').send({ name: 'G1' })
    const bookId = insertBook(db)
    await request(app).put(`/api/books/${bookId}/groups`).send({ groupIds: [g.body.group.id] })

    const del = await request(app).delete(`/api/books/${bookId}`)
    expect(del.status).toBe(200)

    const inGroup = await request(app).get(`/api/groups/${g.body.group.id}/books`)
    expect(inGroup.body.books).toHaveLength(0)
  })
})

describe('GET /api/groups/:id/books', () => {
  it('分组不存在返回 404', async () => {
    const { app } = createApp()
    const res = await request(app).get('/api/groups/999/books')
    expect(res.status).toBe(404)
  })
})
