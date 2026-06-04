import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../hooks/useProducts'
import ProductList from '../components/products/ProductList'
import ProductFilters from '../components/products/ProductFilters'
import ProductForm from '../components/products/ProductForm'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { createLogger } from '../utils/logger'

const logger = createLogger('ProductsPage')

export default function Products() {
  const { user } = useAuth()
  const canWrite = user?.role !== 'agent'
  const {
    products, total, loading,
    loadProducts, applyFilters, clearFilters,
    createProduct, updateProduct, removeProduct,
  } = useProducts()

  const [showForm,       setShowForm]   = useState(false)
  const [editingProduct, setEditing]    = useState(null)
  const [deletingId,     setDeletingId] = useState(null)
  const [saving,         setSaving]     = useState(false)
  // Increment to remount ProductFilters (resets its form state on clear)
  const [filterKey,      setFilterKey]  = useState(0)

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleClear = () => {
    clearFilters()
    setFilterKey((k) => k + 1)
  }

  const handleCreate = async (data) => {
    logger.debug('Creating product', { name: data.name })
    setSaving(true)
    try {
      await createProduct(data)
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (data) => {
    logger.debug('Updating product', { id: editingProduct.id })
    setSaving(true)
    try {
      await updateProduct(editingProduct.id, data)
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container space-y-6 animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Catalog Inventory</h1>
          <p className="page-subtitle">
            {total} registered item{total !== 1 ? 's' : ''} in stock
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => { logger.debug('Opening add product form'); setShowForm(true) }}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        )}
      </div>

      {/* Filter bar */}
      <ProductFilters
        key={filterKey}
        onChange={applyFilters}
        onClear={handleClear}
      />

      <ProductList
        products={products}
        loading={loading}
        canWrite={canWrite}
        onEdit={(p) => { logger.debug('Editing product', { id: p.id }); setEditing(p) }}
        onDelete={(id) => { logger.debug('Deleting product', { id }); setDeletingId(id) }}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create New Product">
        <ProductForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={saving} />
      </Modal>

      <Modal isOpen={!!editingProduct} onClose={() => setEditing(null)} title="Update Product Specifications">
        {editingProduct && (
          <ProductForm
            initialData={editingProduct}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            loading={saving}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => { removeProduct(deletingId); setDeletingId(null) }}
        title="Remove Product"
        message="This inventory item will be permanently removed from the catalog. This action is irreversible."
      />
    </div>
  )
}
