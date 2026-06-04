import Table from '../common/Table'
import { formatCurrency } from '../../utils/formatters'

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export default function ProductList({ products, onEdit, onDelete, loading, canWrite = true }) {
  const columns = [
    {
      key: 'name', label: 'Product',
      render: (r) => (
        <span className="font-bold text-slate-200 tracking-wide">{r.name}</span>
      ),
    },
    {
      key: 'sku', label: 'SKU',
      render: (r) => (
        <span className="font-mono text-[10px] font-bold bg-slate-950 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-900">
          {r.sku}
        </span>
      ),
    },
    {
      key: 'price', label: 'Price',
      render: (r) => (
        <span className="font-semibold text-slate-300 tabular-nums">{formatCurrency(r.price)}</span>
      ),
    },
    {
      key: 'quantity', label: 'Stock Status',
      render: (r) =>
        r.quantity === 0
          ? <span className="badge-red">Out of stock</span>
          : r.quantity <= 10
          ? <span className="badge-yellow">{r.quantity} low</span>
          : <span className="badge-green">{r.quantity} in stock</span>,
    },
    {
      key: 'actions', label: '', className: 'w-px',
      render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          {canWrite && (
            <button
              onClick={() => onEdit(r)}
              className="btn-icon"
              title="Edit product"
            >
              <EditIcon />
            </button>
          )}
          {canWrite && (
            <button
              onClick={() => onDelete(r.id)}
              className="btn-icon-danger"
              title="Delete product"
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
      data={products}
      loading={loading}
      emptyMessage="No products found in catalog. Get started by adding a product."
    />
  )
}
