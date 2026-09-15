import { useState } from 'react'
import { useBooks } from './hooks/useBooks'
import type { Book } from './api/books'
import { ViewToggle, BookList, BookGroup } from './components/BookViews'
import { AddBookModal } from './components/AddBookModal'
import { BookDetail } from './components/BookDetail'
import { DeleteConfirm } from './components/DeleteConfirm'
import { Toast } from './components/Toast'
import './App.css'

export default function App() {
  const { books, loading, error, viewMode, setViewMode, addBook, removeBook, reload, groups } = useBooks()
  const [showAdd, setShowAdd] = useState(false)
  const [detailBook, setDetailBook] = useState<Book | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

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
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  return (
    <>
      <div className="header">
        <h1>我的书架</h1>
        <div className="header-actions">
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
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
      </div>

      {showAdd && <AddBookModal onSubmit={handleAdd} onClose={() => setShowAdd(false)} />}
      {detailBook && <BookDetail book={detailBook} onClose={() => setDetailBook(null)} onDelete={() => setDeleteTarget(detailBook)} />}
      {deleteTarget && <DeleteConfirm onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
