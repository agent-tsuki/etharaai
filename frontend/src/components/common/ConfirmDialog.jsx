import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/20">
          <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="pt-1">
          <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-subtitle)' }}>{message}</p>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-3 border-t" style={{ borderColor: 'var(--border-sidebar)' }}>
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleConfirm} className="btn-danger">Confirm Delete</button>
      </div>
    </Modal>
  )
}
