import { useState, useEffect, useCallback } from 'react'
import {
  fetchGroups,
  createGroup,
  renameGroup,
  deleteGroup,
  fetchGroupBooks,
  type Group,
} from '../api/groups'
import type { Book } from '../api/books'

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGroups()
      setGroups(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addGroup = useCallback(async (name: string) => {
    const created = await createGroup(name)
    setGroups(prev => [...prev, { ...created, book_count: 0 }])
    return created
  }, [])

  const updateGroupName = useCallback(async (id: number, name: string) => {
    const updated = await renameGroup(id, name)
    setGroups(prev => prev.map(g => (g.id === id ? { ...g, name: updated.name } : g)))
    return updated
  }, [])

  const removeGroup = useCallback(async (id: number) => {
    await deleteGroup(id)
    setGroups(prev => prev.filter(g => g.id !== id))
  }, [])

  const loadGroupBooks = useCallback(async (id: number): Promise<Book[]> => {
    return fetchGroupBooks(id)
  }, [])

  return { groups, loading, error, reload: load, addGroup, updateGroupName, removeGroup, loadGroupBooks }
}
