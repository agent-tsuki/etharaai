import Table from '../common/Table'
import { formatCurrency, formatDate, formatStatus } from '../../utils/formatters'

const statusBadge = {
  pending:   'badge-yellow',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function BanIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
}

export default function OrderList({ orders, onView, onCancel, loading, canWrite = true }) {
  const columns = [
    {
      key: 'id', label: 'Order ID',
      render: (r) => (
        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-lg select-none">
          #{String(r.id).padStart(4, '0')}
        </span>
      ),
    },
    {
      key: 'customer_name', label: 'Customer',
      render: (r) => <span className="font-bold text-slate-200 tracking-wide">{r.customer_name ?? '—'}</span>,
    },
    {
      key: 'items', label: 'Quantity',
      render: (r) => (
        <span className="badge-gray px-2 py-0.5 font-bold font-mono">
          {r.items?.length ?? 0} Item{r.items?.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'total_amount', label: 'Total Value',
      render: (r) => (
        <span className="font-bold text-slate-200 tabular-nums">{formatCurrency(r.total_amount)}</span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (r) => (
        <span className={statusBadge[r.status] ?? 'badge-gray'}>{formatStatus(r.status)}</span>
      ),
    },
    {
      key: 'created_at', label: 'Order Date',
      render: (r) => <span className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">{formatDate(r.created_at)}</span>,
    },
    {
      key: 'actions', label: '', className: 'w-px',
      render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => onView(r)}
            className="btn-icon"
            title="View order details"
          >
            <EyeIcon />
          </button>
          {canWrite && r.status === 'pending' && (
            <button
              onClick={() => onCancel(r.id)}
              className="btn-icon-danger"
              title="Cancel order"
            >
              <BanIcon />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={orders}
      loading={loading}
      emptyMessage="No orders found. Click New Order to place a sales order."
    />
  )
}
