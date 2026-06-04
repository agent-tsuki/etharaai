import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCustomers } from '../hooks/useCustomers'
import CustomerList from '../components/customers/CustomerList'
import CustomerFilters from '../components/customers/CustomerFilters'
import CustomerForm from '../components/customers/CustomerForm'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { createLogger } from '../utils/logger'

const logger = createLogger('CustomersPage')

export default function Customers() {
  const { user } = useAuth()
  const canWrite = user?.role !== 'agent'
  const {
    customers, total, loading,
    loadCustomers, applyFilters, clearFilters,
    createCustomer, removeCustomer,
  } = useCustomers()

  const [showForm,   setShowForm]   = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [filterKey,  setFilterKey]  = useState(0)

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const handleClear = () => {
    clearFilters()
    setFilterKey((k) => k + 1)
  }

  const handleCreate = async (data) => {
    logger.debug('Creating customer', { email: data.email })
    setSaving(true)
    try {
      await createCustomer(data)
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container space-y-6 animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Accounts</h1>
          <p className="page-subtitle">
            {total} registered account{total !== 1 ? 's' : ''}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => { logger.debug('Opening add customer modal'); setShowForm(true) }}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </button>
        )}
      </div>

      {/* Filter bar */}
      <CustomerFilters
        key={filterKey}
        onChange={applyFilters}
        onClear={handleClear}
      />

      <CustomerList
        customers={customers}
        loading={loading}
        canWrite={canWrite}
        onDelete={(id) => { logger.debug('Deleting customer', { id }); setDeletingId(id) }}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Register Customer Account">
        <CustomerForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={saving} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => { removeCustomer(deletingId); setDeletingId(null) }}
        title="Remove Customer Account"
        message="This customer record will be permanently deleted. Connected transaction records will not be altered."
      />
    </div>
  )
}
