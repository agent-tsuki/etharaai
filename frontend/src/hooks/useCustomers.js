import { useState, useCallback, useRef } from 'react'
import { useNotification } from '../context/NotificationContext'
import * as customerService from '../services/customerService'
import { createLogger } from '../utils/logger'

const logger = createLogger('useCustomers')

export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const { addNotification }       = useNotification()

  const filtersRef = useRef({})

  const _fetch = useCallback(async (filters) => {
    setLoading(true)
    setError(null)
    logger.debug('Loading customers', { filters })
    try {
      const resp = await customerService.fetchCustomers(filters)
      setCustomers(resp.data)
      setTotal(resp.pagination?.total ?? resp.data.length)
      logger.info(`Loaded ${resp.data.length} / ${resp.pagination?.total} customers`)
    } catch (err) {
      logger.error('Failed to load customers', { error: err.message })
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCustomers = useCallback(() => _fetch(filtersRef.current), [_fetch])

  const applyFilters = useCallback((newFilters) => {
    filtersRef.current = newFilters
    return _fetch(newFilters)
  }, [_fetch])

  const clearFilters = useCallback(() => {
    filtersRef.current = {}
    return _fetch({})
  }, [_fetch])

  const createCustomer = useCallback(async (data) => {
    logger.debug('Creating customer', { data })
    try {
      const created = await customerService.createCustomer(data)
      setCustomers((prev) => [...prev, created])
      setTotal((t) => t + 1)
      addNotification('Customer created successfully')
      logger.info('Customer created', { id: created.id })
      return created
    } catch (err) {
      addNotification(err.message, 'error')
      logger.error('Failed to create customer', { error: err.message })
      throw err
    }
  }, [addNotification])

  const removeCustomer = useCallback(async (id) => {
    logger.debug(`Deleting customer ${id}`)
    try {
      await customerService.deleteCustomer(id)
      setCustomers((prev) => prev.filter((c) => c.id !== id))
      setTotal((t) => Math.max(0, t - 1))
      addNotification('Customer deleted successfully')
      logger.info(`Customer ${id} deleted`)
    } catch (err) {
      addNotification(err.message, 'error')
      logger.error(`Failed to delete customer ${id}`, { error: err.message })
      throw err
    }
  }, [addNotification])

  return {
    customers, total, loading, error,
    loadCustomers, applyFilters, clearFilters,
    createCustomer, removeCustomer,
  }
}
