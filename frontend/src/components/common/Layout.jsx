import { useState } from 'react'
import Sidebar from './Navbar'
import NotificationList from './NotificationList'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[var(--bg-html)] text-[var(--text-html)] overflow-hidden font-sans transition-colors duration-200">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center h-16 px-6 bg-[var(--bg-mobile-topbar)] border-b border-[var(--border-mobile-topbar)] backdrop-blur-md shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-900/10 hover:text-slate-100 transition-colors"
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5 ml-4">
            <span className="font-extrabold text-[var(--text-title)] text-sm tracking-wide">Ethara AI</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-main)]">
          <div className="animate-fade-in h-full">
            {children}
          </div>
        </main>
      </div>

      <NotificationList />
    </div>
  )
}
