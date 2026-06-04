import { useState, useCallback, useRef } from 'react'
import { useNotification } from '../context/NotificationContext'
import * as orderService from '../services/orderService'
import { createLogger } from '../utils/logger'

const logger = createLogger('useOrders')

export function useOrders() {
  const [orders, setOrders]           = useState([])
  const [total, setTotal]             = useState(0)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const { addNotification }           = useNotification()

  const filtersRef = useRef({})

  const _fetch = useCallback(async (filters) => {
    setLoading(true)
    setError(null)
    logger.debug('Loading orders', { filters })
    try {
      const resp = await orderService.fetchOrders(filters)
      setOrders(resp.data)
      setTotal(resp.pagination?.total ?? resp.data.length)
      logger.info(`Loaded ${resp.data.length} / ${resp.pagination?.total} orders`)
    } catch (err) {
      logger.error('Failed to load orders', { error: err.message })
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadOrders = useCallback(() => _fetch(filtersRef.current), [_fetch])

  const applyFilters = useCallback((newFilters) => {
    filtersRef.current = newFilters
    return _fetch(newFilters)
  }, [_fetch])

  const clearFilters = useCallback(() => {
    filtersRef.current = {}
    return _fetch({})
  }, [_fetch])

  const loadOrder = useCallback(async (id) => {
    logger.debug(`Fetching order ${id}`)
    try {
      const data = await orderService.fetchOrder(id)
      setSelectedOrder(data)
      logger.info(`Loaded order ${id}`)
      return data
    } catch (err) {
      logger.error(`Failed to fetch order ${id}`, { error: err.message })
      addNotification(err.message, 'error')
      throw err
    }
  }, [addNotification])

  const createOrder = useCallback(async (data) => {
    logger.debug('Creating order', { data })
    try {
      const created = await orderService.createOrder(data)
      setOrders((prev) => [created, ...prev])
      setTotal((t) => t + 1)
      addNotification('Order created successfully')
      logger.info('Order created', { id: created.id })
      return created
    } catch (err) {
      logger.error('Failed to create order', { error: err.message })
      addNotification(err.message, 'error')
      throw err
    }
  }, [addNotification])

  const removeOrder = useCallback(async (id) => {
    logger.debug(`Canceling order ${id}`)
    try {
      await orderService.deleteOrder(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
      setTotal((t) => Math.max(0, t - 1))
      addNotification('Order cancelled successfully')
      logger.info(`Order ${id} cancelled`)
    } catch (err) {
      logger.error(`Failed to cancel order ${id}`, { error: err.message })
      addNotification(err.message, 'error')
      throw err
    }
  }, [addNotification])

  return {
    orders, total, selectedOrder, loading, error,
    loadOrders, applyFilters, clearFilters,
    loadOrder, createOrder, removeOrder,
  }
}
