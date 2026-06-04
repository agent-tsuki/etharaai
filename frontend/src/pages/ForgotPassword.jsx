import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as authService from '../services/authService'
import { toggleTheme, getTheme } from '../utils/theme'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [resetToken, setResetToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentTheme, setCurrentTheme] = useState(getTheme())

  const handleThemeToggle = () => {
    const next = toggleTheme()
    setCurrentTheme(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authService.forgotPassword(email)
      setResetToken(data.reset_token || null)
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
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
          <h1 className="text-xl font-extrabold text-[var(--text-title)] tracking-tight">Reset password</h1>
          <p className="text-[var(--text-subtitle)] text-xs font-medium mt-1">We'll send you a reset token</p>
        </div>

        <div className="card p-7 space-y-5">
          {!submitted ? (
            <>
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-xs text-rose-400 font-medium">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" className="input" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : 'Send Reset Token'}
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3 text-xs text-emerald-400 font-medium">
                If that email exists, a reset token has been generated.
              </div>

              {resetToken && (
                <div className="space-y-2">
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                    Dev mode — reset token
                  </p>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-slate-300 break-all select-all">
                    {resetToken}
                  </div>
                  <button
                    onClick={() => navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`)}
                    className="btn-primary w-full mt-2"
                  >
                    Reset Password Now
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-[11px] text-slate-500">
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
