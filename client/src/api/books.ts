export interface Book {
  id: number
  title: string
  type: string
  author: string
  description: string
  created_at: string
}

const API_BASE = '/api'

export async function fetchBooks(): Promise<Book[]> {
  const res = await fetch(`${API_BASE}/books`)
  if (!res.ok) throw new Error('获取书籍失败')
  const data = await res.json()
  return data.books
}

export async function fetchBook(id: number): Promise<Book> {
  const res = await fetch(`${API_BASE}/books/${id}`)
  if (!res.ok) throw new Error('获取书籍详情失败')
  const data = await res.json()
  return data.book
}

export async function createBook(book: { title: string; type: string; author: string; description?: string }): Promise<Book> {
  const res = await fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '添加失败，请重试')
  }
  const data = await res.json()
  return data.book
}

export async function deleteBook(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/books/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '删除失败，请重试')
  }
}
