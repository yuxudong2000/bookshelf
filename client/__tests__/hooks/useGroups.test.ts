import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGroups } from '../../src/hooks/useGroups'
import * as api from '../../src/api/groups'

vi.mock('../../src/api/groups', () => ({
  fetchGroups: vi.fn(),
  createGroup: vi.fn(),
  renameGroup: vi.fn(),
  deleteGroup: vi.fn(),
  fetchGroupBooks: vi.fn(),
  fetchBookGroupIds: vi.fn(),
  setBookGroups: vi.fn(),
}))

const mockGroups = [
  { id: 1, name: '在读', created_at: '2026-01-01', book_count: 2 },
  { id: 2, name: '收藏', created_at: '2026-01-02', book_count: 0 },
]

describe('useGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('F06: loads groups on mount', async () => {
    vi.mocked(api.fetchGroups).mockResolvedValue(mockGroups)
    const { result } = renderHook(() => useGroups())
    await act(() => new Promise(r => setTimeout(r, 0)))
    expect(result.current.groups).toEqual(mockGroups)
    expect(result.current.loading).toBe(false)
  })

  it('F06-AC01: adds a group and updates list', async () => {
    vi.mocked(api.fetchGroups).mockResolvedValue(mockGroups)
    const created = { id: 3, name: '书单A', created_at: '2026-01-03' }
    vi.mocked(api.createGroup).mockResolvedValue(created)
    const { result } = renderHook(() => useGroups())
    await act(() => new Promise(r => setTimeout(r, 0)))
    await act(async () => {
      await result.current.addGroup('书单A')
    })
    expect(result.current.groups).toHaveLength(3)
    expect(result.current.groups[2].name).toBe('书单A')
  })

  it('F06-AC04: renames a group in place, preserving order', async () => {
    vi.mocked(api.fetchGroups).mockResolvedValue(mockGroups)
    vi.mocked(api.renameGroup).mockResolvedValue({ id: 1, name: '精读', created_at: '2026-01-01' })
    const { result } = renderHook(() => useGroups())
    await act(() => new Promise(r => setTimeout(r, 0)))
    await act(async () => {
      await result.current.updateGroupName(1, '精读')
    })
    expect(result.current.groups[0].name).toBe('精读')
    expect(result.current.groups[0].book_count).toBe(2)
  })

  it('F06-AC05: removes a group from list', async () => {
    vi.mocked(api.fetchGroups).mockResolvedValue(mockGroups)
    vi.mocked(api.deleteGroup).mockResolvedValue(undefined)
    const { result } = renderHook(() => useGroups())
    await act(() => new Promise(r => setTimeout(r, 0)))
    await act(async () => {
      await result.current.removeGroup(1)
    })
    expect(result.current.groups).toHaveLength(1)
    expect(result.current.groups.find(g => g.id === 1)).toBeUndefined()
  })

  it('handles fetch error', async () => {
    vi.mocked(api.fetchGroups).mockRejectedValue(new Error('获取分组失败'))
    const { result } = renderHook(() => useGroups())
    await act(() => new Promise(r => setTimeout(r, 0)))
    expect(result.current.error).toBe('获取分组失败')
  })

  it('loadGroupBooks delegates to api', async () => {
    vi.mocked(api.fetchGroups).mockResolvedValue(mockGroups)
    const books = [{ id: 1, title: 'A', type: 'x', author: 'y', description: '', created_at: '' }]
    vi.mocked(api.fetchGroupBooks).mockResolvedValue(books)
    const { result } = renderHook(() => useGroups())
    await act(() => new Promise(r => setTimeout(r, 0)))
    const res = await result.current.loadGroupBooks(1)
    expect(res).toEqual(books)
  })
})
