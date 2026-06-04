import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUsers } from '../hooks/useUsers'
import UserList from '../components/users/UserList'
import ConfirmDialog from '../components/common/ConfirmDialog'

export default function Users() {
  const { user: currentUser } = useAuth()
  const { users, loading, loadUsers, updateRole, toggleActive, deleteUser } = useUsers()
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.full_name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users

  return (
    <div className="page-container space-y-6 animate-slide-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="input-search"
        />
      </div>

      <UserList
        users={filtered}
        loading={loading}
        currentUserId={currentUser?.id}
        onRoleChange={updateRole}
        onToggleActive={toggleActive}
        onDelete={(id) => setDeletingId(id)}
      />

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => { deleteUser(deletingId); setDeletingId(null) }}
        title="Delete User"
        message="This user account will be permanently deleted. This action cannot be undone."
      />
    </div>
  )
}
