import { createContext, useCallback, useContext, useState } from 'react'

const NotificationContext = createContext(null)

let nextId = 0

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const addNotification = useCallback(
    (message, type = 'success') => {
      const id = ++nextId
      setNotifications((prev) => [...prev, { id, message, type }])
      setTimeout(() => removeNotification(id), 4000)
    },
    [removeNotification]
  )

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider')
  return ctx
}
