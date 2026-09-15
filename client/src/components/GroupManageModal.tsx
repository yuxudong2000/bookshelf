import { useState } from 'react'
import type { Group } from '../api/groups'

interface GroupManageModalProps {
  groups: Group[]
  onCreate: (name: string) => Promise<void>
  onRename: (id: number, name: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onClose: () => void
}

export function GroupManageModal({ groups, onCreate, onRename, onDelete, onClose }: GroupManageModalProps) {
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState('')
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null)
  const [apiError, setApiError] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateError('分组名称不能为空')
      return
    }
    setCreateError('')
    setApiError('')
    try {
      await onCreate(newName.trim())
      setNewName('')
    } catch (e) {
      setApiError((e as Error).message)
    }
  }

  const startRename = (g: Group) => {
    setRenamingId(g.id)
    setRenameValue(g.name)
  }

  const submitRename = async () => {
    if (renamingId == null) return
    if (!renameValue.trim()) return
    try {
      await onRename(renamingId, renameValue.trim())
      setRenamingId(null)
    } catch (e) {
      setApiError((e as Error).message)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await onDelete(deleteTarget.id)
      setDeleteTarget(null)
    } catch (e) {
      setApiError((e as Error).message)
    }
  }

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>分组管理</h2>

        <div className="form-group">
          <label>新建分组</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="请输入分组名称"
            />
            <button className="btn-submit" onClick={handleCreate}>新建分组</button>
          </div>
          {createError && <div className="error-msg show">{createError}</div>}
        </div>

        {apiError && <div className="error-msg show" style={{ marginBottom: 12 }}>{apiError}</div>}

        {groups.length === 0 ? (
          <div className="group-empty">还没有分组，创建一个开始整理书架吧</div>
        ) : (
          <div className="group-manage-list">
            {groups.map(g => (
              <div key={g.id} className="group-manage-item">
                {renamingId === g.id ? (
                  <>
                    <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)} />
                    <button className="btn-submit" onClick={submitRename}>保存</button>
                    <button className="btn-cancel" onClick={() => setRenamingId(null)}>取消</button>
                  </>
                ) : (
                  <>
                    <span className="group-manage-name">{g.name}（{g.book_count} 本）</span>
                    <button className="btn-icon" onClick={() => startRename(g)}>重命名</button>
                    <button className="btn-icon delete" onClick={() => setDeleteTarget(g)}>删除</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="confirm-overlay" onClick={e => e.stopPropagation()}>
          <div className="confirm-box">
            <p>确定删除分组「{deleteTarget.name}」吗？分组内的书籍不会被删除。</p>
            <div className="btn-row">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="btn-confirm-danger" onClick={confirmDelete}>删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
