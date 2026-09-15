import { Router, type Request, type Response } from 'express'
import { createDb, type Book } from '../db.js'
import type Database from 'better-sqlite3'

export function createBooksRouter(db?: Database.Database): Router {
  const router = Router()
  const database = db || createDb()

  router.get('/books', (_req: Request, res: Response) => {
    const books = database.prepare('SELECT * FROM books ORDER BY created_at DESC').all() as Book[]
    res.json({ books })
  })

  router.get('/books/:id', (req: Request, res: Response) => {
    const book = database.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id) as Book | undefined
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' })
    }
    res.json({ book })
  })

  router.post('/books', (req: Request, res: Response) => {
    const { title, type, author, description } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ error: '书名不能为空' })
    }
    if (!type || !type.trim()) {
      return res.status(400).json({ error: '类型不能为空' })
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ error: '作者不能为空' })
    }
    const stmt = database.prepare('INSERT INTO books (title, type, author, description) VALUES (?, ?, ?, ?)')
    const info = stmt.run(title.trim(), type.trim(), author.trim(), description?.trim() || '')
    const book = database.prepare('SELECT * FROM books WHERE id = ?').get(info.lastInsertRowid) as Book
    res.status(201).json({ book })
  })

  router.delete('/books/:id', (req: Request, res: Response) => {
    const book = database.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id) as Book | undefined
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' })
    }
    database.prepare('DELETE FROM books WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  })

  return router
}
