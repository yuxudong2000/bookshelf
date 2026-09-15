import type { Book } from '../api/books'

export function BookDetail({ book, onClose, onDelete }: { book: Book; onClose: () => void; onDelete: () => void }) {
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
        <div className="detail-actions">
          <button className="btn-icon delete" onClick={onDelete}>删除书籍</button>
          <button className="btn-cancel" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}
