import { useState, useCallback } from 'react'
import { useNotification } from '../context/NotificationContext'
import * as userService from '../services/userService'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotification()

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await userService.fetchUsers()
      setUsers(data)
    } catch (err) {
      addNotification(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  const updateRole = useCallback(async (id, role) => {
    try {
      const updated = await userService.updateUserRole(id, role)
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
      addNotification('Role updated successfully')
      return updated
    } catch (err) {
      addNotification(err.message, 'error')
      throw err
    }
  }, [addNotification])

  const toggleActive = useCallback(async (id, is_active) => {
    try {
      const updated = await userService.updateUser(id, { is_active })
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
      addNotification(is_active ? 'User activated' : 'User deactivated')
      return updated
    } catch (err) {
      addNotification(err.message, 'error')
      throw err
    }
  }, [addNotification])

  const deleteUser = useCallback(async (id) => {
    try {
      await userService.deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      addNotification('User deleted successfully')
    } catch (err) {
      addNotification(err.message, 'error')
      throw err
    }
  }, [addNotification])

  return { users, loading, loadUsers, updateRole, toggleActive, deleteUser }
}
