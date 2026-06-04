import LoadingSpinner from './LoadingSpinner'

function EmptyState({ message }) {
  return (
    <tr>
      <td colSpan={100}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-inner border"
            style={{ backgroundColor: 'var(--bg-table-header)', borderColor: 'var(--border-card)' }}
          >
            <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-xs font-semibold max-w-xs" style={{ color: 'var(--text-subtitle)' }}>{message}</p>
        </div>
      </td>
    </tr>
  )
}

/**
 * Column shape:
 *   key       – row field name (also used as React key)
 *   label     – header text
 *   render    – optional (row) => ReactNode
 *   className – optional extra classes applied to every <td> in this column
 *   nowrap    – set false to allow cell content to wrap (default: true)
 */
export default function Table({ columns, data, loading, emptyMessage = 'No records found.' }) {
  const rows = Array.isArray(data) ? data : []
  const cols = Array.isArray(columns) ? columns : []

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-sidebar)' }}>
              {cols.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: 'var(--text-subtitle)' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ borderColor: 'var(--border-table-row)' }} className="divide-y">
            {rows.length === 0 ? (
              <EmptyState message={emptyMessage} />
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  className="transition-colors group"
                  style={{ borderColor: 'var(--border-table-row)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.04)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '' }}
                >
                  {cols.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 font-medium text-sm ${col.nowrap !== false ? 'whitespace-nowrap' : ''} ${col.className ?? ''}`}
                      style={{ color: 'var(--text-html)' }}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div
          className="px-4 py-3 flex items-center justify-between border-t"
          style={{ backgroundColor: 'var(--bg-table-header)', borderColor: 'var(--border-sidebar)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-subtitle)' }}>
            Total
          </p>
          <span className="badge-gray font-bold font-mono text-[10px]">
            {rows.length}
          </span>
        </div>
      )}
    </div>
  )
}
