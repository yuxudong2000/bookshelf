import { useState } from 'react'

interface AddBookModalProps {
  onSubmit: (book: { title: string; type: string; author: string; description?: string }) => Promise<void>
  onClose: () => void
}

export function AddBookModal({ onSubmit, onClose }: AddBookModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [titleError, setTitleError] = useState('')
  const [typeError, setTypeError] = useState('')
  const [authorError, setAuthorError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleSubmit = async () => {
    let valid = true
    if (!title.trim()) { setTitleError('书名不能为空'); valid = false } else { setTitleError('') }
    if (!type.trim()) { setTypeError('类型不能为空'); valid = false } else { setTypeError('') }
    if (!author.trim()) { setAuthorError('作者不能为空'); valid = false } else { setAuthorError('') }
    if (!valid) return

    setSubmitting(true)
    setApiError('')
    try {
      await onSubmit({ title: title.trim(), type: type.trim(), author: author.trim(), description: description.trim() || undefined })
      onClose()
    } catch (e) {
      setApiError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>添加书籍</h2>
        <div className="form-group">
          <label>书名 <span className="required">*</span></label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="请输入书名" />
          {titleError && <div className="error-msg show">{titleError}</div>}
        </div>
        <div className="form-group">
          <label>类型 <span className="required">*</span></label>
          <input type="text" value={type} onChange={e => setType(e.target.value)} placeholder="请输入书籍类型" />
          {typeError && <div className="error-msg show">{typeError}</div>}
        </div>
        <div className="form-group">
          <label>作者 <span className="required">*</span></label>
          <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder="请输入作者" />
          {authorError && <div className="error-msg show">{authorError}</div>}
        </div>
        <div className="form-group">
          <label>简介</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="选填" />
        </div>
        {apiError && <div className="error-msg show" style={{ marginBottom: 12 }}>{apiError}</div>}
        <div className="form-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>添加</button>
        </div>
      </div>
    </div>
  )
}
