import { Router, type Request, type Response } from 'express'
import { createDb, type Book, type Group } from '../db.js'
import type Database from 'better-sqlite3'

export function createGroupsRouter(db?: Database.Database): Router {
  const router = Router()
  const database = db || createDb()

  router.get('/groups', (_req: Request, res: Response) => {
    const groups = database
      .prepare(
        `SELECT g.*, COUNT(bg.book_id) as book_count
         FROM groups g
         LEFT JOIN book_groups bg ON bg.group_id = g.id
         GROUP BY g.id
         ORDER BY g.created_at ASC, g.id ASC`
      )
      .all() as (Group & { book_count: number })[]
    res.json({ groups })
  })

  router.post('/groups', (req: Request, res: Response) => {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '分组名称不能为空' })
    }
    const trimmed = name.trim()
    const existing = database.prepare('SELECT id FROM groups WHERE name = ?').get(trimmed)
    if (existing) {
      return res.status(409).json({ error: '分组名称已存在' })
    }
    const info = database.prepare('INSERT INTO groups (name) VALUES (?)').run(trimmed)
    const group = database.prepare('SELECT * FROM groups WHERE id = ?').get(info.lastInsertRowid) as Group
    res.status(201).json({ group })
  })

  router.put('/groups/:id', (req: Request, res: Response) => {
    const group = database.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id) as Group | undefined
    if (!group) {
      return res.status(404).json({ error: '分组不存在' })
    }
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '分组名称不能为空' })
    }
    const trimmed = name.trim()
    const dup = database.prepare('SELECT id FROM groups WHERE name = ? AND id != ?').get(trimmed, req.params.id)
    if (dup) {
      return res.status(409).json({ error: '分组名称已存在' })
    }
    database.prepare('UPDATE groups SET name = ? WHERE id = ?').run(trimmed, req.params.id)
    const updated = database.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id) as Group
    res.json({ group: updated })
  })

  router.delete('/groups/:id', (req: Request, res: Response) => {
    const group = database.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id) as Group | undefined
    if (!group) {
      return res.status(404).json({ error: '分组不存在' })
    }
    database.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  })

  router.get('/groups/:id/books', (req: Request, res: Response) => {
    const group = database.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id) as Group | undefined
    if (!group) {
      return res.status(404).json({ error: '分组不存在' })
    }
    const books = database
      .prepare(
        `SELECT b.* FROM books b
         JOIN book_groups bg ON bg.book_id = b.id
         WHERE bg.group_id = ?
         ORDER BY b.created_at DESC`
      )
      .all(req.params.id) as Book[]
    res.json({ books })
  })

  router.get('/books/:id/groups', (req: Request, res: Response) => {
    const book = database.prepare('SELECT id FROM books WHERE id = ?').get(req.params.id)
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' })
    }
    const rows = database
      .prepare('SELECT group_id FROM book_groups WHERE book_id = ?')
      .all(req.params.id) as { group_id: number }[]
    res.json({ groupIds: rows.map(r => r.group_id) })
  })

  router.put('/books/:id/groups', (req: Request, res: Response) => {
    const book = database.prepare('SELECT id FROM books WHERE id = ?').get(req.params.id)
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' })
    }
    const { groupIds } = req.body
    if (!Array.isArray(groupIds)) {
      return res.status(400).json({ error: 'groupIds 必须为数组' })
    }
    const uniqueIds = [...new Set(groupIds)]
    for (const gid of uniqueIds) {
      const exists = database.prepare('SELECT id FROM groups WHERE id = ?').get(gid)
      if (!exists) {
        return res.status(400).json({ error: `分组 ${gid} 不存在` })
      }
    }
    const tx = database.transaction(() => {
      database.prepare('DELETE FROM book_groups WHERE book_id = ?').run(req.params.id)
      const insert = database.prepare('INSERT INTO book_groups (book_id, group_id) VALUES (?, ?)')
      for (const gid of uniqueIds) {
        insert.run(req.params.id, gid)
      }
    })
    tx()
    res.json({ groupIds: uniqueIds })
  })

  return router
}
