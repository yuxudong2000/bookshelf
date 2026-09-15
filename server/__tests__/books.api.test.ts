import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { createDb } from '../src/db.js'
import { createBooksRouter } from '../src/routes/books.js'
import type Database from 'better-sqlite3'

function createApp(): { app: express.Express; db: Database.Database } {
  const db = createDb()
  const app = express()
  app.use(express.json())
  app.use('/api', createBooksRouter(db))
  return { app, db }
}

describe('GET /api/books', () => {
  it('F01-AC05: 返回书籍数组，每条包含 id、书名、类型、作者', async () => {
    const { app, db } = createApp()
    db.prepare("INSERT INTO books (title, type, author, description) VALUES (?, ?, ?, ?)")
      .run('百年孤独', '文学', '加西亚·马尔克斯', '魔幻现实主义')
    const res = await request(app).get('/api/books')
    expect(res.status).toBe(200)
    expect(res.body.books).toHaveLength(1)
    const book = res.body.books[0]
    expect(book).toHaveProperty('id')
    expect(book.title).toBe('百年孤独')
    expect(book.type).toBe('文学')
    expect(book.author).toBe('加西亚·马尔克斯')
  })

  it('空书架返回空数组', async () => {
    const { app } = createApp()
    const res = await request(app).get('/api/books')
    expect(res.status).toBe(200)
    expect(res.body.books).toHaveLength(0)
  })
})

describe('POST /api/books', () => {
  it('F02-AC02: 正常添加书籍', async () => {
    const { app, db } = createApp()
    const res = await request(app)
      .post('/api/books')
      .send({ title: '三体', type: '科技', author: '刘慈欣', description: '科幻小说' })
    expect(res.status).toBe(201)
    expect(res.body.book.title).toBe('三体')
    expect(res.body.book.type).toBe('科技')
    expect(res.body.book.author).toBe('刘慈欣')
    const all = db.prepare('SELECT * FROM books').all()
    expect(all).toHaveLength(1)
  })

  it('F02-AC03: 缺少书名返回 400', async () => {
    const { app } = createApp()
    const res = await request(app)
      .post('/api/books')
      .send({ type: '科技', author: '刘慈欣' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('书名不能为空')
  })

  it('缺少类型返回 400', async () => {
    const { app } = createApp()
    const res = await request(app)
      .post('/api/books')
      .send({ title: '三体', author: '刘慈欣' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('类型不能为空')
  })

  it('F02-AC04: 缺少作者返回 400', async () => {
    const { app } = createApp()
    const res = await request(app)
      .post('/api/books')
      .send({ title: '三体', type: '科技' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('作者不能为空')
  })

  it('书名为空字符串返回 400', async () => {
    const { app } = createApp()
    const res = await request(app)
      .post('/api/books')
      .send({ title: ' ', type: '科技', author: '刘慈欣' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('书名不能为空')
  })
})

describe('GET /api/books/:id', () => {
  it('正常返回单本书籍', async () => {
    const { app, db } = createApp()
    const info = db.prepare("INSERT INTO books (title, type, author, description) VALUES (?, ?, ?, ?)")
      .run('三体', '科技', '刘慈欣', '科幻小说')
    const res = await request(app).get(`/api/books/${info.lastInsertRowid}`)
    expect(res.status).toBe(200)
    expect(res.body.book.title).toBe('三体')
  })

  it('书籍不存在返回 404', async () => {
    const { app } = createApp()
    const res = await request(app).get('/api/books/9999')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('书籍不存在')
  })
})

describe('DELETE /api/books/:id', () => {
  it('F05-AC04: 正常删除书籍', async () => {
    const { app, db } = createApp()
    const info = db.prepare("INSERT INTO books (title, type, author, description) VALUES (?, ?, ?, ?)")
      .run('三体', '科技', '刘慈欣', '科幻小说')
    const res = await request(app).delete(`/api/books/${info.lastInsertRowid}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const all = db.prepare('SELECT * FROM books').all()
    expect(all).toHaveLength(0)
  })

  it('删除不存在书籍返回 404', async () => {
    const { app } = createApp()
    const res = await request(app).delete('/api/books/9999')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('书籍不存在')
  })
})
