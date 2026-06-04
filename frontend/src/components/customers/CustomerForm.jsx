import { useState } from 'react'

const emptyForm = { full_name: '', email: '', phone: '' }

function validate(form) {
  const e = {}
  if (!form.full_name.trim()) e.full_name = 'Full name is required'
  if (!form.email.trim())     e.email     = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
  return e
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

export default function CustomerForm({ onSubmit, onCancel, loading }) {
  const [form, setForm]     = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => ({ ...p, [field]: undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({ full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Full Name" required error={errors.full_name}>
        <input
          value={form.full_name}
          onChange={set('full_name')}
          placeholder="e.g. Jane Smith"
          className={`input ${errors.full_name ? 'input-error' : ''}`}
        />
      </Field>
      <Field label="Email Address" required error={errors.email}>
        <input
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="e.g. jane@example.com"
          className={`input ${errors.email ? 'input-error' : ''}`}
        />
      </Field>
      <Field label="Phone Number" error={errors.phone}>
        <input
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          placeholder="e.g. +1 555 0100 (optional)"
          className="input"
        />
      </Field>

      <div className="flex gap-3 justify-end pt-3 border-t border-slate-900">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : 'Add Customer'}
        </button>
      </div>
    </form>
  )
}
