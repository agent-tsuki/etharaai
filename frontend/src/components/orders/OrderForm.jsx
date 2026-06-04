import { useState } from 'react'
import { formatCurrency } from '../../utils/formatters'

const emptyItem = { product_id: '', quantity: 1 }

export default function OrderForm({ customers, products, onSubmit, onCancel, loading }) {
  const [customerId, setCustomerId] = useState('')
  const [items, setItems]           = useState([{ ...emptyItem }])
  const [errors, setErrors]         = useState({})

  const addItem    = () => setItems((p) => [...p, { ...emptyItem }])
  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i))
  const setItem    = (i, field, val) =>
    setItems((p) => p.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)))

  const getProduct = (id) => products.find((p) => p.id === parseInt(id))
  const lineTotal  = (item) => {
    const p = getProduct(item.product_id)
    return p ? p.price * item.quantity : 0
  }
  const grandTotal = items.reduce((s, it) => s + lineTotal(it), 0)

  const validate = () => {
    const e = {}
    if (!customerId) e.customer = 'Please select a customer'
    items.forEach((it, i) => {
      if (!it.product_id)              e[`p${i}`] = 'required'
      if (!it.quantity || it.quantity < 1) e[`q${i}`] = 'min 1'
    })
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      customer_id: parseInt(customerId),
      items: items.map((it) => ({
        product_id: parseInt(it.product_id),
        quantity:   parseInt(it.quantity),
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer selector */}
      <div>
        <label className="label">
          Select Customer <span className="text-rose-500 ml-0.5">*</span>
        </label>
        <select
          value={customerId}
          onChange={(e) => { setCustomerId(e.target.value); setErrors((p) => ({ ...p, customer: undefined })) }}
          className={`input ${errors.customer ? 'input-error' : ''}`}
        >
          <option value="">Select a customer from records…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
          ))}
        </select>
        {errors.customer && <p className="field-error">{errors.customer}</p>}
      </div>

      {/* Order items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="label mb-0">Line Items</label>
          <button
            type="button"
            onClick={addItem}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 active:scale-95 transition-all duration-200"
          >
            + Add Product Item
          </button>
        </div>

        <div className="space-y-3.5 max-h-[30vh] overflow-y-auto pr-1">
          {items.map((item, i) => {
            const prod = getProduct(item.product_id)
            return (
              <div
                key={i}
                className="grid grid-cols-[1fr_90px_85px_auto] gap-3 items-start
                           p-4 bg-slate-950/40 rounded-2xl border border-slate-900"
              >
                {/* Product select */}
                <div>
                  <select
                    value={item.product_id}
                    onChange={(e) => { setItem(i, 'product_id', e.target.value); setErrors((p) => ({ ...p, [`p${i}`]: undefined })) }}
                    className={`input text-xs ${errors[`p${i}`] ? 'input-error' : ''}`}
                  >
                    <option value="">Select product to order…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                        {p.name} ({formatCurrency(p.price)}) {p.quantity === 0 ? '· out of stock' : `· ${p.quantity} left`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Qty */}
                <div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => { setItem(i, 'quantity', e.target.value); setErrors((p) => ({ ...p, [`q${i}`]: undefined })) }}
                    className={`input text-xs text-center ${errors[`q${i}`] ? 'input-error' : ''}`}
                    placeholder="Qty"
                  />
                </div>

                {/* Line total */}
                <div className="text-xs font-bold text-slate-300 pt-3 text-right tabular-nums">
                  {prod ? formatCurrency(lineTotal(item)) : '—'}
                </div>

                {/* Remove */}
                <div className="pt-1.5">
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500
                                 border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                      title="Remove product row"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <div className="w-9" />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Grand total */}
        <div className="flex justify-end mt-4 pt-4 border-t border-slate-900">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Grand Total</p>
            <p className="text-2xl font-extrabold text-white tabular-nums mt-1 tracking-tight">
              {formatCurrency(grandTotal)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-3 border-t border-slate-900">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Placing order…' : 'Place Sales Order'}
        </button>
      </div>
    </form>
  )
}
