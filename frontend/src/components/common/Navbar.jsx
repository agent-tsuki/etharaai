import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toggleTheme, getTheme } from '../../utils/theme'

const roleBadgeClass = {
  admin:   'bg-indigo-500/10 text-indigo-400 ring-indigo-500/25',
  manager: 'bg-amber-500/10 text-amber-400 ring-amber-500/25',
  agent:   'bg-slate-800/60 text-slate-400 ring-slate-800',
}

const baseNavItems = [
  {
    to: '/', end: true, label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/products', label: 'Products',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    to: '/customers', label: 'Customers',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    to: '/orders', label: 'Orders',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
]

const adminNavItems = [
  {
    to: '/users', label: 'Users',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(getTheme())

  const handleThemeToggle = () => {
    const next = toggleTheme()
    setTheme(next)
  }

  const navItems = user?.role === 'admin'
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)]',
        'transform transition-transform duration-300 ease-in-out',
        'lg:relative lg:z-auto lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-20 border-b border-[var(--border-sidebar)] shrink-0">
        <div className="min-w-0 flex-1">
          <p className="text-[var(--text-title)] font-extrabold text-sm tracking-wide leading-tight">Ethara AI</p>
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-tight">Management</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-900/10 transition-all shrink-0"
          aria-label="Close navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest px-3 mb-4">
          Core Platform
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? 'nav-link-active' : 'nav-link-inactive'
            }
          >
            {item.icon}
            <span className="font-semibold">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-[var(--border-sidebar)] shrink-0 space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-indigo-400">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[var(--text-title)] text-xs font-bold truncate leading-tight">{user.full_name}</p>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ring-1 mt-0.5 ${roleBadgeClass[user.role] || roleBadgeClass.agent}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleThemeToggle}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-subtitle)] hover:text-[var(--text-title)] hover:bg-[var(--bg-secondary-btn)] border border-transparent hover:border-[var(--border-sidebar)] transition-all duration-200"
        >
          {theme === 'light' ? (
            <>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Dark Mode
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              Light Mode
            </>
          )}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/15 transition-all duration-200"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
