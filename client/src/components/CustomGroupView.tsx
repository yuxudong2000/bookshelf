import { useEffect, useState } from 'react'
import type { Group } from '../api/groups'
import type { Book } from '../api/books'

interface CustomGroupViewProps {
  groups: Group[]
  loadGroupBooks: (id: number) => Promise<Book[]>
  onDetail: (b: Book) => void
  onDelete: (b: Book) => void
  onCreateGroup: () => void
}

export function CustomGroupView({ groups, loadGroupBooks, onDetail, onDelete, onCreateGroup }: CustomGroupViewProps) {
  const [booksByGroup, setBooksByGroup] = useState<Record<number, Book[]>>({})

  useEffect(() => {
    let cancelled = false
    Promise.all(groups.map(g => loadGroupBooks(g.id).then(books => [g.id, books] as const))).then(entries => {
      if (cancelled) return
      const map: Record<number, Book[]> = {}
      entries.forEach(([id, books]) => { map[id] = books })
      setBooksByGroup(map)
    })
    return () => { cancelled = true }
  }, [groups, loadGroupBooks])

  if (groups.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">🗂️</div>
        <p>还没有分组，创建一个开始整理书架吧</p>
        <button className="btn-add" onClick={onCreateGroup}>+ 新建分组</button>
      </div>
    )
  }

  return (
    <div className="group-view">
      {groups.map(g => {
        const books = booksByGroup[g.id] || []
        return (
          <div key={g.id} className="group-section">
            <div className="group-header">
              <h3>{g.name}</h3>
              <span className="group-count">{books.length} 本</span>
            </div>
            <div className="group-body">
              {books.length === 0 ? (
                <div className="group-empty">该分组还没有书</div>
              ) : (
                books.map(b => (
                  <div key={b.id} className="book-card" onClick={() => onDetail(b)}>
                    <div className="book-info">
                      <div className="book-title">{b.title}</div>
                      <div className="book-author">{b.author}</div>
                    </div>
                    <div className="book-actions">
                      <button className="btn-icon delete" onClick={e => { e.stopPropagation(); onDelete(b) }}>删除</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
