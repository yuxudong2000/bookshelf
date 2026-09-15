import { useEffect, useState } from 'react'

export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onClose()
    }, 2000)
    return () => clearTimeout(timer)
  }, [onClose])

  if (!visible) return null

  return (
    <div className={`toast show ${type}`}>{message}</div>
  )
}
