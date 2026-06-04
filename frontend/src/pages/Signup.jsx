import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as authService from '../services/authService'
import { toggleTheme, getTheme } from '../utils/theme'

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(getTheme())

  const handleThemeToggle = () => {
    const next = toggleTheme()
    setCurrentTheme(next)
  }

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setErrors((p) => ({ ...p, [e.target.name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.full_name.trim()) errs.full_name = 'Full name is required'
    if (!form.email) errs.email = 'Email is required'
    if (form.password.length < 8) errs.password = 'Min 8 characters required'
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must contain an uppercase letter'
    else if (!/\d/.test(form.password)) errs.password = 'Must contain a digit'
    else if (!/[!@#$%^&*()\-_=+[\]{};':",./<>?`~\\|]/.test(form.password)) errs.password = 'Must contain a special character'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setGlobalError('')
    setLoading(true)
    try {
      await authService.signup(form.email, form.password, form.full_name)
      await login(form.email, form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-html)] flex items-center justify-center px-4 py-12 relative transition-colors duration-250">
      {/* Theme Toggle Button (Top Right) */}
      <button
        onClick={handleThemeToggle}
        className="fixed top-4 right-4 z-50 w-9 h-9 rounded-xl bg-[var(--bg-secondary-btn)] border border-[var(--border-secondary-btn)] text-[var(--text-input)] hover:text-[var(--text-title)] flex items-center justify-center shadow-md transition-all duration-200 hover:-translate-y-0.5"
        aria-label="Toggle theme"
      >
        {currentTheme === 'light' ? (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-sm animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-xl font-extrabold text-[var(--text-title)] tracking-tight">Create account</h1>
          <p className="text-[var(--text-subtitle)] text-xs font-medium mt-1">Join Ethara AI</p>
        </div>

        <div className="card p-7 space-y-5">
          {globalError && (
            <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-xs text-rose-400 font-medium">
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input name="full_name" type="text" autoComplete="name" required value={form.full_name}
                onChange={handleChange} placeholder="Jane Smith"
                className={`input ${errors.full_name ? 'input-error' : ''}`} />
              {errors.full_name && <p className="field-error">{errors.full_name}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input name="email" type="email" autoComplete="email" required value={form.email}
                onChange={handleChange} placeholder="you@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`} />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input name="password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                  required value={form.password} onChange={handleChange} placeholder="Min 8, uppercase, digit, special char"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input name="confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                required value={form.confirm} onChange={handleChange} placeholder="Repeat password"
                className={`input ${errors.confirm ? 'input-error' : ''}`} />
              {errors.confirm && <p className="field-error">{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
