import Table from '../common/Table'
import { formatDate } from '../../utils/formatters'

const avatarColors = [
  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
]

function getAvatarColor(name) {
  if (!name) return avatarColors[0]
  let sum = 0
  for (const ch of name) sum += ch.charCodeAt(0)
  return avatarColors[sum % avatarColors.length]
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export default function CustomerList({ customers, onDelete, loading, canWrite = true }) {
  const columns = [
    {
      key: 'full_name', label: 'Customer',
      render: (r) => {
        const name = r.full_name || '?'
        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${getAvatarColor(name)} text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-sm`}>
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-slate-200 tracking-wide">{r.full_name ?? '—'}</span>
          </div>
        )
      },
    },
    {
      key: 'email', label: 'Email Address', nowrap: false,
      render: (r) => (
        <a href={`mailto:${r.email}`} className="text-indigo-400 hover:text-indigo-300 hover:underline text-xs font-semibold">
          {r.email}
        </a>
      ),
    },
    {
      key: 'phone', label: 'Phone Number',
      render: (r) =>
        r.phone
          ? <span className="text-slate-300 font-medium">{r.phone}</span>
          : <span className="text-slate-600 font-medium">—</span>,
    },
    {
      key: 'created_at', label: 'Registration Date',
      render: (r) => <span className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">{formatDate(r.created_at)}</span>,
    },
    {
      key: 'actions', label: '', className: 'w-px',
      render: (r) => (
        <div className="flex justify-end">
          {canWrite && (
            <button
              onClick={() => onDelete(r.id)}
              className="btn-icon-danger"
              title="Delete customer"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={customers}
      loading={loading}
      emptyMessage="No customer files found. Click Add Customer to begin."
    />
  )
}
