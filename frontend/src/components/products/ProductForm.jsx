import { useState } from 'react'

const emptyForm = { name: '', sku: '', price: '', quantity: '' }

const NAME_RE = /^[a-zA-Z\s]+$/
const SKU_RE  = /^[A-Z0-9_-]+$/

function validate(form) {
  const e = {}

  if (!form.name.trim()) {
    e.name = 'Product name is required'
  } else if (!NAME_RE.test(form.name.trim())) {
    e.name = 'Only letters and spaces allowed — no numbers or special characters'
  }

  if (!form.sku.trim()) {
    e.sku = 'SKU is required'
  } else if (!SKU_RE.test(form.sku.trim())) {
    e.sku = 'Only uppercase letters, numbers, _ and - allowed'
  }

  const priceNum = parseFloat(form.price)
  if (form.price === '') {
    e.price = 'Price is required'
  } else if (isNaN(priceNum) || !isFinite(priceNum)) {
    e.price = 'Enter a valid decimal number (e.g. 9.99)'
  } else if (priceNum <= 0) {
    e.price = 'Price must be greater than 0'
  }

  const qtyNum = Number(form.quantity)
  if (form.quantity === '') {
    e.quantity = 'Quantity is required'
  } else if (!Number.isInteger(qtyNum)) {
    e.quantity = 'Quantity must be a whole number (no decimals)'
  } else if (qtyNum < 0) {
    e.quantity = 'Quantity cannot be negative'
  }

  return e
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error
        ? <p className="field-error">{error}</p>
        : hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>
      }
    </div>
  )
}

export default function ProductForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(
    initialData
      ? { name: initialData.name, sku: initialData.sku, price: String(initialData.price), quantity: String(initialData.quantity) }
      : emptyForm
  )
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => ({ ...p, [field]: undefined }))
  }

  const handleSkuChange = (e) => {
    const upper = e.target.value.toUpperCase()
    setForm((p) => ({ ...p, sku: upper }))
    setErrors((p) => ({ ...p, sku: undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      name:     form.name.trim(),
      sku:      form.sku.trim(),
      price:    parseFloat(form.price),
      quantity: parseInt(form.quantity, 10),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Product Name" hint="Letters and spaces only" error={errors.name}>
          <input
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Wireless Mouse"
            className={`input ${errors.name ? 'input-error' : ''}`}
          />
        </Field>

        <Field label="SKU / Code" hint="Uppercase letters, numbers, _ and - only" error={errors.sku}>
          <input
            value={form.sku}
            onChange={handleSkuChange}
            placeholder="e.g. WM-001"
            className={`input font-mono ${errors.sku ? 'input-error' : ''}`}
          />
        </Field>

        <Field label="Unit Price ($)" hint="Decimal value, e.g. 9.99" error={errors.price}>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={set('price')}
            placeholder="0.00"
            className={`input ${errors.price ? 'input-error' : ''}`}
          />
        </Field>

        <Field label="Quantity in Stock" hint="Whole number — zero is allowed" error={errors.quantity}>
          <input
            type="number"
            min="0"
            step="1"
            value={form.quantity}
            onChange={set('quantity')}
            placeholder="0"
            className={`input ${errors.quantity ? 'input-error' : ''}`}
          />
        </Field>
      </div>

      <div className="flex gap-3 justify-end pt-3 border-t border-slate-900">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : initialData ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  )
}
