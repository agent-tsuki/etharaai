import axios from 'axios'
import { createLogger } from '../utils/logger'
import { API_BASE_URL } from '../config'
import { handleMockRequest } from './mockDb'

const logger = createLogger('API')

const defaultAdapter = axios.getAdapter(axios.defaults.adapter)

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  adapter: (config) => {
    if (localStorage.getItem('guest_mode') === 'true') {
      logger.debug(`Mock Request: ${config.method?.toUpperCase()} ${config.url}`)
      return handleMockRequest(config)
    }
    return defaultAdapter(config)
  }
})

let _accessToken = null
let _onRefresh = null
let _isRefreshing = false
let _failedQueue = []

export function setAccessToken(token) {
  _accessToken = token
}

export function setRefreshCallback(fn) {
  _onRefresh = fn
}

function processQueue(error, token = null) {
  _failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)))
  _failedQueue = []
}

api.interceptors.request.use((config) => {
  logger.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`, {
    params: config.params,
    data: config.data,
  })
  if (_accessToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${_accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    logger.debug(`Response: ${response.status} ${response.config?.url}`)
    return response
  },
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isAuthEndpoint =
      original?.url?.endsWith('/auth/refresh') || original?.url?.endsWith('/auth/login')

    if (status === 401 && original && !original._retry && _onRefresh && !isAuthEndpoint) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
          .catch(() => Promise.reject(new Error('Session expired')))
      }

      original._retry = true
      _isRefreshing = true

      try {
        const newToken = await _onRefresh()
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        processQueue(new Error('Session expired'), null)
        return Promise.reject(new Error('Session expired. Please log in again.'))
      } finally {
        _isRefreshing = false
      }
    }

    const message = error.response?.data?.msg || error.message || 'An error occurred'
    logger.error(`Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} failed.`, {
      status,
      message,
    })
    return Promise.reject(new Error(message))
  }
)

export default api
