import { useState } from 'react'

const emptyForm = { name: '', sku: '', price: '', quantity: '' }

function validate(form) {
  const e = {}
  if (!form.name.trim())                                  e.name     = 'Product name is required'
  if (!form.sku.trim())                                   e.sku      = 'SKU is required'
  if (!form.price || Number(form.price) <= 0)             e.price    = 'Price must be greater than 0'
  if (form.quantity === '' || Number(form.quantity) < 0)  e.quantity = 'Quantity must be 0 or more'
  return e
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
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

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Product Name" error={errors.name}>
          <input
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Wireless Mouse"
            className={`input ${errors.name ? 'input-error' : ''}`}
          />
        </Field>
        <Field label="SKU / Code" error={errors.sku}>
          <input
            value={form.sku}
            onChange={set('sku')}
            placeholder="e.g. WM-001"
            className={`input font-mono ${errors.sku ? 'input-error' : ''}`}
          />
        </Field>
        <Field label="Unit Price ($)" error={errors.price}>
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
        <Field label="Quantity in Stock" error={errors.quantity}>
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
