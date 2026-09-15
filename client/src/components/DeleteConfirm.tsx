export function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="confirm-overlay show">
      <div className="confirm-box">
        <p>确定要删除这本书吗？</p>
        <div className="btn-row">
          <button className="btn-cancel" onClick={onCancel}>取消</button>
          <button className="btn-confirm-danger" onClick={onConfirm}>删除</button>
        </div>
      </div>
    </div>
  )
}
