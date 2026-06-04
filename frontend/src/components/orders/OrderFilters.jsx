import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '../../hooks/useDebounce'

const STATUS_OPTIONS = [
  { value: '',          label: 'All statuses' },
  { value: 'pending',   label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function OperatorToggle({ value, onChange }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-slate-800/80 shrink-0">
      {['gte', 'lte'].map((op) => (
        <button
          key={op}
          type="button"
          onClick={() => onChange(op)}
          className={`px-2.5 py-2 text-[11px] font-bold transition-colors duration-150 ${
            value === op
              ? 'bg-indigo-600/80 text-white'
              : 'bg-slate-950/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          {op === 'gte' ? '≥' : '≤'}
        </button>
      ))}
    </div>
  )
}

export default function OrderFilters({ onChange, onClear }) {
  const [status,       setStatus]       = useState('')
  const [customerId,   setCustomerId]   = useState('')
  const [minAmount,    setMinAmount]    = useState('')
  const [maxAmount,    setMaxAmount]    = useState('')
  const [amountOp,     setAmountOp]     = useState('gte')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [open,         setOpen]         = useState(false)

  const debouncedCustomerId = useDebounce(customerId, 450)

  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    const f = {}
    if (status)                   f.status      = status
    if (debouncedCustomerId)      f.customer_id = Number(debouncedCustomerId)
    if (minAmount !== '')         f.min_amount  = Number(minAmount)
    if (maxAmount !== '')         f.max_amount  = Number(maxAmount)
    if (minAmount !== '' && maxAmount === '') f.amount_operator = amountOp
    if (dateFrom)                 f.date_from   = new Date(dateFrom).toISOString()
    if (dateTo) {
      // include the full end day
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      f.date_to = end.toISOString()
    }
    onChange(f)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debouncedCustomerId, minAmount, maxAmount, amountOp, dateFrom, dateTo])

  const advancedActive = [
    debouncedCustomerId,
    minAmount !== '' || maxAmount !== '' ? 1 : null,
    dateFrom || dateTo ? 1 : null,
  ].filter(Boolean).length

  const totalActive = (status ? 1 : 0) + advancedActive

  const handleClear = () => {
    setStatus(''); setCustomerId(''); setMinAmount(''); setMaxAmount('')
    setAmountOp('gte'); setDateFrom(''); setDateTo('')
    onClear()
  }

  return (
    <div className="space-y-3">
      {/* ── Toolbar row ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status inline */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input w-auto min-w-[160px]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`btn-secondary flex items-center gap-2 ${open ? 'border-indigo-500/40 text-indigo-300' : ''}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          More Filters
          {advancedActive > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-extrabold">
              {advancedActive}
            </span>
          )}
          <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {totalActive > 0 && (
          <button type="button" onClick={handleClear}
            className="btn-ghost text-rose-400 hover:text-rose-300 text-xs">
            Clear all
          </button>
        )}
      </div>

      {/* ── Expandable advanced panel ─────────────── */}
      {open && (
        <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">

          {/* Customer ID */}
          <div>
            <label className="label">Customer ID</label>
            <input
              type="number"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="e.g. 42"
              min="1"
              className="input"
            />
          </div>

          {/* Amount range */}
          <div>
            <label className="label">
              Order amount
              {minAmount !== '' && maxAmount === '' && (
                <span className="ml-2 text-indigo-400 normal-case font-medium">— operator →</span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="Min"
                  min="0"
                  step="0.01"
                  className="input pl-6"
                />
              </div>
              {maxAmount !== '' || minAmount === '' ? (
                <>
                  <span className="text-slate-600 text-xs font-bold shrink-0">to</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      placeholder="Max"
                      min="0"
                      step="0.01"
                      className="input pl-6"
                    />
                  </div>
                </>
              ) : (
                <>
                  <OperatorToggle value={amountOp} onChange={setAmountOp} />
                  <button
                    type="button"
                    onClick={() => setMaxAmount(' ')}
                    className="text-[10px] text-slate-500 hover:text-slate-300 shrink-0 underline"
                  >
                    + max
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="label">Order date range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input flex-1 [color-scheme:dark]"
              />
              <span className="text-slate-600 text-xs font-bold shrink-0">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input flex-1 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
