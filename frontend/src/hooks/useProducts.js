import { useState, useCallback, useRef } from 'react'
import { useNotification } from '../context/NotificationContext'
import * as productService from '../services/productService'
import { createLogger } from '../utils/logger'

const logger = createLogger('useProducts')

export function useProducts() {
  const [products, setProducts]   = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const { addNotification }       = useNotification()

  // Ref keeps the latest filters so loadProducts() doesn't need filters as a dep
  const filtersRef = useRef({})

  const _fetch = useCallback(async (filters) => {
    setLoading(true)
    setError(null)
    logger.debug('Loading products', { filters })
    try {
      const resp = await productService.fetchProducts(filters)
      setProducts(resp.data)
      setTotal(resp.pagination?.total ?? resp.data.length)
      logger.info(`Loaded ${resp.data.length} / ${resp.pagination?.total} products`)
    } catch (err) {
      logger.error('Failed to load products', { error: err.message })
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  /** Initial / manual refresh — uses whatever filters are currently active */
  const loadProducts = useCallback(() => _fetch(filtersRef.current), [_fetch])

  /** Apply new filters and reload */
  const applyFilters = useCallback((newFilters) => {
    filtersRef.current = newFilters
    return _fetch(newFilters)
  }, [_fetch])

  /** Clear all filters and reload */
  const clearFilters = useCallback(() => {
    filtersRef.current = {}
    return _fetch({})
  }, [_fetch])

  const createProduct = useCallback(async (data) => {
    logger.debug('Creating product', { data })
    try {
      const created = await productService.createProduct(data)
      setProducts((prev) => [...prev, created])
      setTotal((t) => t + 1)
      addNotification('Product created successfully')
      logger.info('Product created', { id: created.id })
      return created
    } catch (err) {
      addNotification(err.message, 'error')
      logger.error('Failed to create product', { error: err.message })
      throw err
    }
  }, [addNotification])

  const updateProduct = useCallback(async (id, data) => {
    logger.debug(`Updating product ${id}`, { data })
    try {
      const updated = await productService.updateProduct(id, data)
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      addNotification('Product updated successfully')
      logger.info('Product updated', { id })
      return updated
    } catch (err) {
      addNotification(err.message, 'error')
      logger.error(`Failed to update product ${id}`, { error: err.message })
      throw err
    }
  }, [addNotification])

  const removeProduct = useCallback(async (id) => {
    logger.debug(`Deleting product ${id}`)
    try {
      await productService.deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setTotal((t) => Math.max(0, t - 1))
      addNotification('Product deleted successfully')
      logger.info(`Product ${id} deleted`)
    } catch (err) {
      addNotification(err.message, 'error')
      logger.error(`Failed to delete product ${id}`, { error: err.message })
      throw err
    }
  }, [addNotification])

  return {
    products, total, loading, error,
    loadProducts, applyFilters, clearFilters,
    createProduct, updateProduct, removeProduct,
  }
}
