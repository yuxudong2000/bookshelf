import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface Book {
  id: number
  title: string
  type: string
  author: string
  description: string
  created_at: string
}

export interface Group {
  id: number
  name: string
  created_at: string
}

export function createDb(dbPath?: string): Database.Database {
  const db = new Database(dbPath || ':memory:')
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS book_groups (
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      PRIMARY KEY (book_id, group_id)
    )
  `)
  return db
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    const dataDir = path.resolve(__dirname, '..', 'data')
    mkdirSync(dataDir, { recursive: true })
    _db = createDb(path.join(dataDir, 'bookshelf.db'))
  }
  return _db
}
