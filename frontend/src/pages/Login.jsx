import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toggleTheme, getTheme } from '../utils/theme'

export default function Login() {
  const { login, loginAsGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(getTheme())

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleThemeToggle = () => {
    const next = toggleTheme()
    setCurrentTheme(next)
  }

  const handleTestLoginFill = () => {
    setForm({ email: 'admin@admin.in', password: 'Admin@123' })
  }

  const handleGuestLogin = () => {
    loginAsGuest()
    navigate(from, { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-html)] flex items-center justify-center px-4 py-12 relative transition-colors duration-250">
      {/* Test Login Button (Top Right) */}
      <button
        onClick={handleTestLoginFill}
        className="fixed top-4 right-4 z-50 btn-primary px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-115 text-white text-[11px] font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        Test Login
      </button>

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-xl font-extrabold text-[var(--text-title)] tracking-tight">Ethara AI</h1>
          <p className="text-[var(--text-subtitle)] text-xs font-medium mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card p-7 space-y-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-xs text-rose-400 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Forgot password?
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={handleGuestLogin}
                className="btn-secondary w-full"
              >
                Guest Login
              </button>
            </div>
          </form>

          <p className="text-center text-[11px] text-slate-500">
            No account?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
