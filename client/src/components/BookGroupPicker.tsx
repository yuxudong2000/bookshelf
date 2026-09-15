import { useEffect, useState } from 'react'
import type { Group } from '../api/groups'
import { fetchBookGroupIds, setBookGroups } from '../api/groups'
import type { Book } from '../api/books'

interface BookGroupPickerProps {
  book: Book
  groups: Group[]
  onClose: () => void
  onSaved: (groupIds: number[]) => void
}

export function BookGroupPicker({ book, groups, onClose, onSaved }: BookGroupPickerProps) {
  const [checked, setChecked] = useState<number[]>([])
  const [snapshot, setSnapshot] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchBookGroupIds(book.id)
      .then(ids => {
        if (cancelled) return
        setChecked(ids)
        setSnapshot(ids)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [book.id])

  const toggle = (id: number) => {
    setChecked(prev => (prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const result = await setBookGroups(book.id, checked)
      onSaved(result)
      onClose()
    } catch (e) {
      setError('设置分组失败，请重试')
      setChecked(snapshot)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>设置分组 - {book.title}</h2>
        {loading ? (
          <div className="loading" style={{ padding: '20px 0' }}>加载中...</div>
        ) : groups.length === 0 ? (
          <div className="group-empty">还没有分组，创建一个开始整理书架吧</div>
        ) : (
          <div className="group-picker-list">
            {groups.map(g => (
              <label key={g.id} className="group-picker-item">
                <input type="checkbox" checked={checked.includes(g.id)} onChange={() => toggle(g.id)} />
                <span>{g.name}</span>
              </label>
            ))}
          </div>
        )}
        {error && <div className="error-msg show" style={{ marginTop: 12 }}>{error}</div>}
        <div className="form-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-submit" onClick={handleSave} disabled={saving || loading}>保存</button>
        </div>
      </div>
    </div>
  )
}
