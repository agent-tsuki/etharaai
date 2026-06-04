import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '../../hooks/useDebounce'

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

export default function ProductFilters({ onChange, onClear }) {
  const [name,       setName]       = useState('')
  const [sku,        setSku]        = useState('')
  const [stockCount, setStockCount] = useState('')
  const [stockOp,    setStockOp]    = useState('gte')
  const [minPrice,   setMinPrice]   = useState('')
  const [maxPrice,   setMaxPrice]   = useState('')
  const [priceOp,    setPriceOp]    = useState('gte')
  const [open,       setOpen]       = useState(false)

  const debouncedName = useDebounce(name, 450)
  const debouncedSku  = useDebounce(sku,  450)

  // Skip firing onChange on the very first render
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    const f = {}
    if (debouncedName) f.name = debouncedName
    if (debouncedSku)  f.sku  = debouncedSku
    if (stockCount !== '') {
      f.stock_count    = Number(stockCount)
      f.stock_operator = stockOp
    }
    if (minPrice !== '') f.min_price = Number(minPrice)
    if (maxPrice !== '') f.max_price = Number(maxPrice)
    if (minPrice !== '' && maxPrice === '') f.price_operator = priceOp
    onChange(f)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName, debouncedSku, stockCount, stockOp, minPrice, maxPrice, priceOp])

  const activeCount = [
    debouncedName, debouncedSku,
    stockCount !== '' ? 1 : null,
    minPrice !== '' || maxPrice !== '' ? 1 : null,
  ].filter(Boolean).length

  const handleClear = () => {
    setName(''); setSku(''); setStockCount(''); setStockOp('gte')
    setMinPrice(''); setMaxPrice(''); setPriceOp('gte')
    onClear()
  }

  return (
    <div className="space-y-3">
      {/* ── Toolbar row ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Name search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search by name…"
            className="input-search"
          />
        </div>

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
          Filters
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-extrabold">
              {activeCount}
            </span>
          )}
          <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {activeCount > 0 && (
          <button type="button" onClick={handleClear}
            className="btn-ghost text-rose-400 hover:text-rose-300 text-xs">
            Clear all
          </button>
        )}
      </div>

      {/* ── Expandable advanced panel ─────────────── */}
      {open && (
        <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">

          {/* SKU */}
          <div>
            <label className="label">SKU (exact match)</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. PROD-001"
              className="input font-mono"
            />
          </div>

          {/* Stock count */}
          <div>
            <label className="label">Stock quantity</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                placeholder="0"
                min="0"
                className="input"
              />
              <OperatorToggle value={stockOp} onChange={setStockOp} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              {stockOp === 'gte' ? 'Stock ≥ value (in-stock threshold)' : 'Stock ≤ value (low-stock threshold)'}
            </p>
          </div>

          {/* Price range */}
          <div>
            <label className="label">
              Price range
              {minPrice !== '' && maxPrice === '' && (
                <span className="ml-2 text-indigo-400 normal-case font-medium">
                  — use operator below
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  min="0"
                  step="0.01"
                  className="input pl-6"
                />
              </div>
              {maxPrice !== '' || minPrice === '' ? (
                <>
                  <span className="text-slate-600 text-xs font-bold shrink-0">to</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      min="0"
                      step="0.01"
                      className="input pl-6"
                    />
                  </div>
                </>
              ) : (
                <>
                  <OperatorToggle value={priceOp} onChange={setPriceOp} />
                  <button
                    type="button"
                    onClick={() => setMaxPrice(' ')}
                    className="text-[10px] text-slate-500 hover:text-slate-300 shrink-0 underline"
                  >
                    + max
                  </button>
                </>
              )}
            </div>
            {minPrice !== '' && maxPrice !== '' && (
              <p className="text-[10px] text-slate-500 mt-1.5">
                Showing products priced ${minPrice} – ${maxPrice}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
