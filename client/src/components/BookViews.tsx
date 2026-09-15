import type { Book } from '../api/books'

export type ViewMode = 'list' | 'group' | 'custom-group'

export function ViewToggle({ viewMode, onChange }: { viewMode: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="view-toggle">
      <button className={viewMode === 'list' ? 'active' : ''} onClick={() => onChange('list')}>列表</button>
      <button className={viewMode === 'group' ? 'active' : ''} onClick={() => onChange('group')}>分组</button>
      <button className={viewMode === 'custom-group' ? 'active' : ''} onClick={() => onChange('custom-group')}>自定义分组</button>
    </div>
  )
}

export function BookList({ books, onDetail, onDelete }: { books: Book[]; onDetail: (b: Book) => void; onDelete: (b: Book) => void }) {
  return (
    <div className="book-list">
      {books.map(b => (
        <div key={b.id} className="book-card" onClick={() => onDetail(b)}>
          <div className="book-info">
            <div className="book-title">{b.title}</div>
            <div className="book-author">{b.author}</div>
            <span className="book-type-tag">{b.type}</span>
          </div>
          <div className="book-actions">
            <button className="btn-icon delete" onClick={e => { e.stopPropagation(); onDelete(b) }}>删除</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function BookGroup({ groups, onDetail, onDelete }: { groups: Record<string, Book[]>; onDetail: (b: Book) => void; onDelete: (b: Book) => void }) {
  return (
    <div className="group-view">
      {Object.entries(groups).map(([type, books]) => (
        <div key={type} className="group-section">
          <div className="group-header">
            <h3>{type}</h3>
            <span className="group-count">{books.length} 本</span>
          </div>
          <div className="group-body">
            {books.length === 0 ? (
              <div className="group-empty">暂无书籍</div>
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
      ))}
    </div>
  )
}
