import { useState, useEffect, useCallback } from 'react'
import { fetchBooks, createBook, deleteBook, type Book } from '../api/books'

type ViewMode = 'list' | 'group' | 'custom-group'

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBooks()
      setBooks(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addBook = useCallback(async (book: { title: string; type: string; author: string; description?: string }) => {
    const created = await createBook(book)
    setBooks(prev => [created, ...prev])
    return created
  }, [])

  const removeBook = useCallback(async (id: number) => {
    await deleteBook(id)
    setBooks(prev => prev.filter(b => b.id !== id))
  }, [])

  const groups = useCallback(() => {
    const map: Record<string, Book[]> = {}
    books.forEach(b => {
      if (!map[b.type]) map[b.type] = []
      map[b.type].push(b)
    })
    return map
  }, [books])

  return { books, loading, error, viewMode, setViewMode, addBook, removeBook, reload: load, groups }
}
