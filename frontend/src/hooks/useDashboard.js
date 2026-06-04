import { useState, useCallback } from 'react'
import { fetchDashboardStats } from '../services/dashboardService'
import { createLogger } from '../utils/logger'

const logger = createLogger('useDashboard')

export function useDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    logger.debug('Fetching dashboard summary stats...')
    try {
      const data = await fetchDashboardStats()
      setStats(data)
      logger.info('Dashboard stats loaded successfully', {
        lowStockAlerts: data?.low_stock_products?.length,
      })
    } catch (err) {
      logger.error('Failed to fetch dashboard stats', { error: err.message })
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { stats, loading, error, loadStats }
}
