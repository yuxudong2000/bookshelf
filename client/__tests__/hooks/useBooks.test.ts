import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBooks } from '../../src/hooks/useBooks'
import * as api from '../../src/api/books'

vi.mock('../../src/api/books', () => ({
  fetchBooks: vi.fn(),
  createBook: vi.fn(),
  deleteBook: vi.fn(),
  fetchBook: vi.fn(),
}))

const mockBooks = [
  { id: 1, title: '百年孤独', type: '文学', author: '马尔克斯', description: '魔幻现实', created_at: '2026-01-01' },
  { id: 2, title: '三体', type: '科技', author: '刘慈欣', description: '', created_at: '2026-01-02' },
]

describe('useBooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads books on mount', async () => {
    vi.mocked(api.fetchBooks).mockResolvedValue(mockBooks)
    const { result } = renderHook(() => useBooks())
    await act(() => new Promise(r => setTimeout(r, 0)))
    expect(result.current.books).toEqual(mockBooks)
    expect(result.current.loading).toBe(false)
  })

  it('handles empty book list', async () => {
    vi.mocked(api.fetchBooks).mockResolvedValue([])
    const { result } = renderHook(() => useBooks())
    await act(() => new Promise(r => setTimeout(r, 0)))
    expect(result.current.books).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('handles fetch error', async () => {
    vi.mocked(api.fetchBooks).mockRejectedValue(new Error('获取书籍失败'))
    const { result } = renderHook(() => useBooks())
    await act(() => new Promise(r => setTimeout(r, 0)))
    expect(result.current.error).toBe('获取书籍失败')
  })

  it('adds a book and updates list', async () => {
    vi.mocked(api.fetchBooks).mockResolvedValue(mockBooks)
    const newBook = { id: 3, title: '活着', type: '文学', author: '余华', description: '', created_at: '2026-01-03' }
    vi.mocked(api.createBook).mockResolvedValue(newBook)
    const { result } = renderHook(() => useBooks())
    await act(() => new Promise(r => setTimeout(r, 0)))
    await act(async () => {
      await result.current.addBook({ title: '活着', type: '文学', author: '余华' })
    })
    expect(result.current.books).toHaveLength(3)
    expect(result.current.books[0].title).toBe('活着')
  })

  it('removes a book and updates list', async () => {
    vi.mocked(api.fetchBooks).mockResolvedValue(mockBooks)
    vi.mocked(api.deleteBook).mockResolvedValue(undefined)
    const { result } = renderHook(() => useBooks())
    await act(() => new Promise(r => setTimeout(r, 0)))
    await act(async () => {
      await result.current.removeBook(1)
    })
    expect(result.current.books).toHaveLength(1)
    expect(result.current.books.find(b => b.id === 1)).toBeUndefined()
  })

  it('groups books by type', async () => {
    vi.mocked(api.fetchBooks).mockResolvedValue(mockBooks)
    const { result } = renderHook(() => useBooks())
    await act(() => new Promise(r => setTimeout(r, 0)))
    const groups = result.current.groups()
    expect(Object.keys(groups)).toEqual(['文学', '科技'])
    expect(groups['文学']).toHaveLength(1)
    expect(groups['科技']).toHaveLength(1)
  })

  it('toggles view mode', async () => {
    vi.mocked(api.fetchBooks).mockResolvedValue(mockBooks)
    const { result } = renderHook(() => useBooks())
    await act(() => new Promise(r => setTimeout(r, 0)))
    expect(result.current.viewMode).toBe('list')
    act(() => { result.current.setViewMode('group') })
    expect(result.current.viewMode).toBe('group')
  })
})
