import { useState, useEffect } from 'react'
import { useBooks } from './hooks/useBooks'
import { useGroups } from './hooks/useGroups'
import { fetchBookGroupIds } from './api/groups'
import type { Book } from './api/books'
import type { Group } from './api/groups'
import { ViewToggle, BookList, BookGroup, type ViewMode } from './components/BookViews'
import { AddBookModal } from './components/AddBookModal'
import { BookDetail } from './components/BookDetail'
import { DeleteConfirm } from './components/DeleteConfirm'
import { Toast } from './components/Toast'
import { GroupManageModal } from './components/GroupManageModal'
import { BookGroupPicker } from './components/BookGroupPicker'
import { CustomGroupView } from './components/CustomGroupView'
import './App.css'

export default function App() {
  const { books, loading, error, viewMode, setViewMode, addBook, removeBook, reload, groups } = useBooks()
  const {
    groups: customGroups,
    addGroup,
    updateGroupName,
    removeGroup,
    loadGroupBooks,
    reload: reloadGroups,
  } = useGroups()
  const [showAdd, setShowAdd] = useState(false)
  const [detailBook, setDetailBook] = useState<Book | null>(null)
  const [detailBookGroups, setDetailBookGroups] = useState<Group[] | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const [showGroupManage, setShowGroupManage] = useState(false)
  const [pickerBook, setPickerBook] = useState<Book | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  useEffect(() => {
    if (!detailBook) {
      setDetailBookGroups(undefined)
      return
    }
    let cancelled = false
    fetchBookGroupIds(detailBook.id)
      .then(ids => {
        if (cancelled) return
        setDetailBookGroups(customGroups.filter(g => ids.includes(g.id)))
      })
      .catch(() => { if (!cancelled) setDetailBookGroups([]) })
    return () => { cancelled = true }
  }, [detailBook, customGroups])

  const handleAdd = async (book: { title: string; type: string; author: string; description?: string }) => {
    try {
      await addBook(book)
      showToast('添加成功', 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
      throw e
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await removeBook(deleteTarget.id)
      showToast('删除成功', 'success')
      setDeleteTarget(null)
      setDetailBook(null)
      reloadGroups()
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  const handleCreateGroup = async (name: string) => {
    try {
      await addGroup(name)
    } catch (e) {
      throw e
    }
  }

  return (
    <>
      <div className="header">
        <h1>我的书架</h1>
        <div className="header-actions">
          <ViewToggle viewMode={viewMode as ViewMode} onChange={setViewMode as (v: ViewMode) => void} />
          <button className="btn-add" onClick={() => setShowGroupManage(true)} style={{ background: '#888' }}>分组管理</button>
          <button className="btn-add" onClick={() => setShowAdd(true)}>+ 添加书籍</button>
        </div>
      </div>

      <div className="main">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: 16 }}>加载中...</p>
          </div>
        )}
        {error && !loading && (
          <div className="empty-state">
            <div className="icon">⚠️</div>
            <p style={{ color: '#d9534f' }}>加载失败，请重试</p>
            <button className="btn-add" onClick={reload} style={{ marginTop: 8, background: '#888' }}>重新加载</button>
          </div>
        )}
        {!loading && !error && books.length === 0 && (
          <div className="empty-state">
            <div className="icon">📚</div>
            <p>书架空空如也，快去添加第一本书吧</p>
            <button className="btn-add" onClick={() => setShowAdd(true)}>+ 添加书籍</button>
          </div>
        )}
        {!loading && !error && books.length > 0 && viewMode === 'list' && (
          <BookList books={books} onDetail={setDetailBook} onDelete={b => setDeleteTarget(b)} />
        )}
        {!loading && !error && books.length > 0 && viewMode === 'group' && (
          <BookGroup groups={groups()} onDetail={setDetailBook} onDelete={b => setDeleteTarget(b)} />
        )}
        {!loading && !error && (viewMode as ViewMode) === 'custom-group' && (
          <CustomGroupView
            groups={customGroups}
            loadGroupBooks={loadGroupBooks}
            onDetail={setDetailBook}
            onDelete={b => setDeleteTarget(b)}
            onCreateGroup={() => setShowGroupManage(true)}
          />
        )}
      </div>

      {showAdd && <AddBookModal onSubmit={handleAdd} onClose={() => setShowAdd(false)} />}
      {detailBook && (
        <BookDetail
          book={detailBook}
          bookGroups={detailBookGroups}
          onClose={() => setDetailBook(null)}
          onDelete={() => setDeleteTarget(detailBook)}
          onManageGroups={() => setPickerBook(detailBook)}
        />
      )}
      {deleteTarget && <DeleteConfirm onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showGroupManage && (
        <GroupManageModal
          groups={customGroups}
          onCreate={handleCreateGroup}
          onRename={async (id, name) => { await updateGroupName(id, name) }}
          onDelete={async id => { await removeGroup(id) }}
          onClose={() => setShowGroupManage(false)}
        />
      )}
      {pickerBook && (
        <BookGroupPicker
          book={pickerBook}
          groups={customGroups}
          onClose={() => setPickerBook(null)}
          onSaved={() => {
            reloadGroups()
            showToast('设置分组成功', 'success')
            if (detailBook && pickerBook && detailBook.id === pickerBook.id) {
              fetchBookGroupIds(pickerBook.id).then(ids => setDetailBookGroups(customGroups.filter(g => ids.includes(g.id))))
            }
          }}
        />
      )}
    </>
  )
}
