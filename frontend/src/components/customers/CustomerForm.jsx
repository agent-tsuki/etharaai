import { useState } from 'react'

const emptyForm = { full_name: '', email: '', phone: '' }

const NAME_RE  = /^[a-zA-Z\s]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\d{10}$/

function validate(form) {
  const e = {}

  if (!form.full_name.trim()) {
    e.full_name = 'Full name is required'
  } else if (!NAME_RE.test(form.full_name.trim())) {
    e.full_name = 'Only letters and spaces allowed — no numbers or special characters'
  }

  if (!form.email.trim()) {
    e.email = 'Email is required'
  } else if (!EMAIL_RE.test(form.email.trim())) {
    e.email = 'Enter a valid email address'
  }

  if (form.phone && !PHONE_RE.test(form.phone)) {
    e.phone = 'Phone number must be exactly 10 digits'
  }

  return e
}

function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error
        ? <p className="field-error">{error}</p>
        : hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>
      }
    </div>
  )
}

export default function CustomerForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(
    initialData
      ? { full_name: initialData.full_name, email: initialData.email, phone: initialData.phone ?? '' }
      : emptyForm
  )
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => ({ ...p, [field]: undefined }))
  }

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setForm((p) => ({ ...p, phone: digits }))
    setErrors((p) => ({ ...p, phone: undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      full_name: form.full_name.trim(),
      email:     form.email.trim(),
      phone:     form.phone || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Full Name" required hint="Letters and spaces only" error={errors.full_name}>
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

      <Field label="Phone Number" hint="10 digits, no spaces or dashes (optional)" error={errors.phone}>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.phone}
          onChange={handlePhoneChange}
          placeholder="e.g. 9876543210"
          className={`input ${errors.phone ? 'input-error' : ''}`}
        />
      </Field>

      <div className="flex gap-3 justify-end pt-3 border-t border-slate-900">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : initialData ? 'Update Customer' : 'Add Customer'}
        </button>
      </div>
    </form>
  )
}
