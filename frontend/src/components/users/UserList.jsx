import { useState } from 'react'

const ROLES = ['admin', 'manager', 'agent']

const roleBadge = {
  admin:   'badge-blue',
  manager: 'badge-yellow',
  agent:   'badge-gray',
}

function RoleSelect({ userId, currentRole, onRoleChange }) {
  const [saving, setSaving] = useState(false)

  const handle = async (e) => {
    const role = e.target.value
    if (role === currentRole) return
    setSaving(true)
    try {
      await onRoleChange(userId, role)
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      value={currentRole}
      onChange={handle}
      disabled={saving}
      className="input py-1.5 text-[11px] w-28"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
      ))}
    </select>
  )
}

export default function UserList({ users, loading, currentUserId, onRoleChange, onToggleActive, onDelete }) {
  if (loading) {
    return (
      <div className="card p-10 flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!users.length) {
    return (
      <div className="card px-6 py-10 text-center text-slate-500 text-xs font-medium">
        No users found.
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-slate-950/40 border-b border-slate-900">
              {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60">
            {users.map((u) => {
              const isSelf = u.id === currentUserId
              return (
                <tr key={u.id} className="hover:bg-indigo-500/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-indigo-400">
                          {u.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 truncate">
                          {u.full_name}
                          {isSelf && <span className="ml-1.5 text-[9px] text-indigo-400 font-bold">(you)</span>}
                        </p>
                        <p className="text-slate-500 truncate text-[10px] mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <RoleSelect userId={u.id} currentRole={u.role} onRoleChange={onRoleChange} />
                  </td>
                  <td className="px-5 py-4">
                    {u.is_active
                      ? <span className="badge-green">Active</span>
                      : <span className="badge-red">Inactive</span>}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleActive(u.id, !u.is_active)}
                        className="btn-icon text-[10px] px-2 py-1 w-auto h-auto"
                        title={u.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {u.is_active ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      {!isSelf && (
                        <button
                          onClick={() => onDelete(u.id)}
                          className="btn-icon-danger"
                          title="Delete user"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
