import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../hooks/useOrders'
import { useProducts } from '../hooks/useProducts'
import { useCustomers } from '../hooks/useCustomers'
import OrderList from '../components/orders/OrderList'
import OrderFilters from '../components/orders/OrderFilters'
import OrderForm from '../components/orders/OrderForm'
import OrderDetail from '../components/orders/OrderDetail'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { createLogger } from '../utils/logger'

const logger = createLogger('OrdersPage')

export default function Orders() {
  const { user } = useAuth()
  const canWrite = user?.role !== 'agent'
  const {
    orders, total, loading,
    loadOrders, applyFilters, clearFilters,
    loadOrder, createOrder, removeOrder,
  } = useOrders()
  const { products, loadProducts } = useProducts()
  const { customers, loadCustomers } = useCustomers()

  const [showForm,      setShowForm]    = useState(false)
  const [viewingOrder,  setViewing]     = useState(null)
  const [cancelingId,   setCanceling]   = useState(null)
  const [saving,        setSaving]      = useState(false)
  const [filterKey,     setFilterKey]   = useState(0)

  useEffect(() => {
    loadOrders()
    loadProducts()
    loadCustomers()
  }, [loadOrders, loadProducts, loadCustomers])

  const handleClear = () => {
    clearFilters()
    setFilterKey((k) => k + 1)
  }

  const handleCreate = async (data) => {
    logger.debug('Creating order', { customerId: data.customer_id, itemCount: data.items?.length })
    setSaving(true)
    try {
      await createOrder(data)
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleView = async (order) => {
    logger.debug('Viewing order', { id: order.id })
    const full = await loadOrder(order.id)
    setViewing(full)
  }

  return (
    <div className="page-container space-y-6 animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Orders</h1>
          <p className="page-subtitle">
            {total} total invoice record{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { logger.debug('Opening new order form'); setShowForm(true) }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Order
        </button>
      </div>

      {/* Filter bar */}
      <OrderFilters
        key={filterKey}
        onChange={applyFilters}
        onClear={handleClear}
      />

      <OrderList
        orders={orders}
        loading={loading}
        canWrite={canWrite}
        onView={handleView}
        onCancel={(id) => { logger.debug('Canceling order', { id }); setCanceling(id) }}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create New Sales Order" size="lg">
        <OrderForm
          customers={customers}
          products={products}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={saving}
        />
      </Modal>

      <Modal isOpen={!!viewingOrder} onClose={() => setViewing(null)} title="Order Invoice Details" size="lg">
        <OrderDetail order={viewingOrder} />
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelingId}
        onClose={() => setCanceling(null)}
        onConfirm={() => { removeOrder(cancelingId); setCanceling(null) }}
        title="Cancel Sales Order"
        message="This sales order will be voided. All reserved stock will be automatically replenished."
      />
    </div>
  )
}
