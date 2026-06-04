import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import StatCard from '../components/common/StatCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatCurrency } from '../utils/formatters'
import { createLogger } from '../utils/logger'

const logger = createLogger('Dashboard')

const quickActions = [
  {
    to: '/products',
    label: 'Inventory',
    desc: 'Manage stock items & pricing',
    accent: 'text-indigo-400',
    bg: 'bg-indigo-500/[0.03] hover:bg-indigo-500/[0.08]',
    border: 'border-indigo-500/10 hover:border-indigo-500/25',
  },
  {
    to: '/customers',
    label: 'Customers',
    desc: 'View & register customer accounts',
    accent: 'text-purple-400',
    bg: 'bg-purple-500/[0.03] hover:bg-purple-500/[0.08]',
    border: 'border-purple-500/10 hover:border-purple-500/25',
  },
  {
    to: '/orders',
    label: 'Orders',
    desc: 'Track sales & generate invoices',
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.08]',
    border: 'border-emerald-500/10 hover:border-emerald-500/25',
  },
]

function QuickAction({ to, label, desc, accent, bg, border }) {
  return (
    <Link
      to={to}
      className={`${bg} border ${border} rounded-2xl p-5 flex items-center justify-between
                  hover:shadow-xl hover:shadow-indigo-500/[0.02] hover:-translate-y-0.5 transition-all duration-300 group`}
    >
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider ${accent}`}>{label}</p>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">{desc}</p>
      </div>
      <svg
        className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-300"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

function LowStockTable({ products }) {
  if (!products?.length) return null
  return (
    <div className="card overflow-hidden border-slate-800/80">
      <div className="px-6 py-4.5 border-b border-slate-900 flex items-center justify-between bg-slate-950/20">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Low Stock Alert</h3>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {products.length} product{products.length !== 1 ? 's' : ''} need restocking
          </p>
        </div>
        <span className="badge-red font-bold font-mono text-[10px]">{products.length} item{products.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-slate-950/40 border-b border-slate-900">
              {['Product', 'SKU', 'Price', 'Stock Status'].map((h) => (
                <th key={h} className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60 bg-transparent">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-indigo-500/[0.03] transition-colors">
                <td className="px-6 py-4.5 font-bold text-slate-200">{p.name}</td>
                <td className="px-6 py-4.5">
                  <span className="font-mono text-[10px] font-bold bg-slate-950 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-900">
                    {p.sku}
                  </span>
                </td>
                <td className="px-6 py-4.5 text-slate-300 font-semibold tabular-nums">{formatCurrency(p.price)}</td>
                <td className="px-6 py-4.5">
                  {p.quantity === 0
                    ? <span className="badge-red">Out of stock</span>
                    : <span className="badge-yellow">{p.quantity} left</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Greeting() {
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return (
    <div className="mb-8">
      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{greeting} — control center</p>
      <h1 className="text-3xl font-extrabold text-white mt-2 tracking-tight leading-none">Dashboard Overview</h1>
    </div>
  )
}

export default function Dashboard() {
  const { stats, loading, loadStats } = useDashboard()

  useEffect(() => {
    logger.debug('Loading dashboard stats...')
    loadStats()
  }, [loadStats])

  if (stats) {
    logger.debug('Dashboard statistics loaded successfully', {
      totalProducts: stats.total_products,
      totalCustomers: stats.total_customers,
      totalOrders: stats.total_orders,
      lowStockCount: stats.low_stock_products?.length,
    })
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="page-container space-y-8 animate-slide-up">
      <Greeting />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Products" value={stats?.total_products ?? 0}             icon="📦" colorClass="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" />
        <StatCard label="Registered Customers" value={stats?.total_customers ?? 0}            icon="👥" colorClass="bg-purple-500/10 text-purple-400 border border-purple-500/20" />
        <StatCard label="Sales Orders"     value={stats?.total_orders ?? 0}               icon="🛒" colorClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" />
        <StatCard label="Low Stock Alert"  value={stats?.low_stock_products?.length ?? 0} icon="⚠️" colorClass="bg-rose-500/10 text-rose-400 border border-rose-500/20" />
      </div>

      {/* Quick actions */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          Quick Launch Pad
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((a) => <QuickAction key={a.to} {...a} />)}
        </div>
      </div>

      {/* Low stock alert */}
      <LowStockTable products={stats?.low_stock_products} />

      {stats && !stats?.low_stock_products?.length && (
        <div className="card px-6 py-5 flex items-center gap-4 bg-emerald-500/[0.02] border-emerald-500/15">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="pt-0.5">
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Inventory Status</p>
            <p className="text-[11px] text-emerald-500 mt-0.5 font-medium">All products are healthy and well stocked.</p>
          </div>
        </div>
      )}
    </div>
  )
}
