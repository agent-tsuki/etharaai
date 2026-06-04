import { useNotification } from '../../context/NotificationContext'

const TYPES = {
  success: {
    iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  info: {
    iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
}

export default function NotificationList() {
  const { notifications, removeNotification } = useNotification()

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-80 max-w-[calc(100vw-3rem)]">
      {notifications.map((n) => {
        const t = TYPES[n.type] ?? TYPES.info
        return (
          <div key={n.id} className="toast-card p-4 animate-slide-in-right">
            <div className={`${t.iconBg} w-9 h-9 rounded-xl flex items-center justify-center shrink-0`}>
              {t.icon}
            </div>
            <p
              className="text-xs font-semibold flex-1 leading-relaxed pt-1.5"
              style={{ color: 'var(--text-html)' }}
            >
              {n.message}
            </p>
            <button
              onClick={() => removeNotification(n.id)}
              className="toast-dismiss-btn mt-0.5"
              aria-label="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
