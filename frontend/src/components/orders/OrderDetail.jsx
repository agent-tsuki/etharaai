import { formatCurrency, formatDate, formatStatus } from '../../utils/formatters'

const statusStyle = {
  pending:   'badge-yellow',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

export default function OrderDetail({ order }) {
  if (!order) return null

  return (
    <div className="space-y-6">
      {/* Top: order ID + status */}
      <div className="flex items-start justify-between bg-slate-950/30 p-4.5 rounded-2xl border border-slate-900">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reference ID</p>
          <p className="text-3xl font-extrabold text-white mt-1.5 tabular-nums leading-none tracking-tight">
            #{String(order.id).padStart(4, '0')}
          </p>
        </div>
        <span className={statusStyle[order.status] ?? 'badge-gray font-bold'}>
          {formatStatus(order.status)}
        </span>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card px-5 py-4 border-slate-800/80 bg-slate-900/20">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Customer Name</p>
          <p className="text-xs font-bold text-slate-200 mt-2">{order.customer_name ?? '—'}</p>
        </div>
        <div className="card px-5 py-4 border-slate-800/80 bg-slate-900/20">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Order Date</p>
          <p className="text-xs font-bold text-slate-200 mt-2">{formatDate(order.created_at)}</p>
        </div>
      </div>

      {/* Items table */}
      <div className="card overflow-hidden border-slate-800/80 bg-slate-900/20">
        <div className="px-5 py-4.5 bg-slate-950/40 border-b border-slate-900">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Line Items ({order.items?.length ?? 0})
          </p>
        </div>
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-transparent border-b border-slate-900/60">
              {['Product Name', 'Unit Price', 'Qty', 'Line Total'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60">
            {order.items?.map((item) => (
              <tr key={item.id} className="hover:bg-indigo-500/[0.02] transition-colors">
                <td className="px-5 py-4 font-bold text-slate-200">
                  {item.product_name ?? `Product #${item.product_id}`}
                </td>
                <td className="px-5 py-4 text-slate-400 font-medium tabular-nums">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="px-5 py-4 text-slate-300 font-bold tabular-nums">{item.quantity}</td>
                <td className="px-5 py-4 font-extrabold text-slate-200 tabular-nums">
                  {formatCurrency(item.unit_price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Order total */}
        <div className="px-6 py-5 bg-slate-950/40 border-t border-slate-900 flex justify-end">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Order Total</p>
            <p className="text-2xl font-extrabold text-white tabular-nums mt-1.5 tracking-tight">
              {formatCurrency(order.total_amount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
