export interface GroupBase {
  id: number
  name: string
  created_at: string
}

export interface Group extends GroupBase {
  book_count: number
}

const API_BASE = '/api'

export async function fetchGroups(): Promise<Group[]> {
  const res = await fetch(`${API_BASE}/groups`)
  if (!res.ok) throw new Error('获取分组失败')
  const data = await res.json()
  return data.groups
}

export async function createGroup(name: string): Promise<GroupBase> {
  const res = await fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '创建分组失败，请重试')
  }
  const data = await res.json()
  return data.group
}

export async function renameGroup(id: number, name: string): Promise<GroupBase> {
  const res = await fetch(`${API_BASE}/groups/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '重命名分组失败，请重试')
  }
  const data = await res.json()
  return data.group
}

export async function deleteGroup(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/groups/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '删除分组失败，请重试')
  }
}

export async function fetchGroupBooks(id: number): Promise<import('./books').Book[]> {
  const res = await fetch(`${API_BASE}/groups/${id}/books`)
  if (!res.ok) throw new Error('获取分组书籍失败')
  const data = await res.json()
  return data.books
}

export async function fetchBookGroupIds(bookId: number): Promise<number[]> {
  const res = await fetch(`${API_BASE}/books/${bookId}/groups`)
  if (!res.ok) throw new Error('获取书籍分组失败')
  const data = await res.json()
  return data.groupIds
}

export async function setBookGroups(bookId: number, groupIds: number[]): Promise<number[]> {
  const res = await fetch(`${API_BASE}/books/${bookId}/groups`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupIds }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '设置分组失败，请重试')
  }
  const data = await res.json()
  return data.groupIds
}
