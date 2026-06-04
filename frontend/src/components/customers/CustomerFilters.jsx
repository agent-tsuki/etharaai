import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '../../hooks/useDebounce'

export default function CustomerFilters({ onChange, onClear }) {
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')

  const debouncedName  = useDebounce(name,  450)
  const debouncedEmail = useDebounce(email, 450)

  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    const f = {}
    if (debouncedName)  f.name  = debouncedName
    if (debouncedEmail) f.email = debouncedEmail
    onChange(f)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName, debouncedEmail])

  const activeCount = [debouncedName, debouncedEmail].filter(Boolean).length

  const handleClear = () => {
    setName(''); setEmail('')
    onClear()
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Name search */}
      <div className="relative flex-1 min-w-[180px]">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Search by name…"
          className="input-search"
        />
      </div>

      {/* Email search */}
      <div className="relative flex-1 min-w-[180px]">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <input
          type="search"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Search by email…"
          className="input-search pl-10"
        />
      </div>

      {activeCount > 0 && (
        <button type="button" onClick={handleClear}
          className="btn-ghost text-rose-400 hover:text-rose-300 text-xs shrink-0">
          Clear
        </button>
      )}
    </div>
  )
}
