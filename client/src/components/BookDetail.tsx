import type { Book } from '../api/books'
import type { Group } from '../api/groups'

export function BookDetail({
  book,
  bookGroups,
  onClose,
  onDelete,
  onManageGroups,
}: {
  book: Book
  bookGroups?: Group[]
  onClose: () => void
  onDelete: () => void
  onManageGroups?: () => void
}) {
  return (
    <div className="detail-overlay show" onClick={onClose}>
      <div className="detail-panel" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{book.title}</h2>
        <div className="detail-meta">
          <span className="type">{book.type}</span>
          <span className="author">{book.author}</span>
        </div>
        {book.description ? (
          <div className="detail-desc">{book.description}</div>
        ) : (
          <div className="detail-desc" style={{ color: '#aaa' }}>暂无简介</div>
        )}
        {bookGroups && (
          <div className="detail-groups">
            {bookGroups.length === 0 ? (
              <span style={{ color: '#aaa', fontSize: 13 }}>未归属任何分组</span>
            ) : (
              bookGroups.map(g => <span key={g.id} className="detail-group-tag">{g.name}</span>)
            )}
          </div>
        )}
        <div className="detail-actions">
          {onManageGroups && <button className="btn-icon" onClick={onManageGroups}>设置分组</button>}
          <button className="btn-icon delete" onClick={onDelete}>删除书籍</button>
          <button className="btn-cancel" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}
