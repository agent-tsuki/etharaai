import api from './api'

function buildParams(filters = {}, skip = 0, limit = 100) {
  const p = { skip, limit }
  if (filters.name)                p.name           = filters.name
  if (filters.sku)                 p.sku            = filters.sku
  if (filters.stock_count != null) {
    p.stock_count    = filters.stock_count
    p.stock_operator = filters.stock_operator ?? 'gte'
  }
  if (filters.min_price != null)   p.min_price      = filters.min_price
  if (filters.max_price != null)   p.max_price      = filters.max_price
  // price_operator only sent when min_price present without max_price
  if (filters.min_price != null && filters.max_price == null)
    p.price_operator = filters.price_operator ?? 'gte'
  return p
}

// Returns { data: [...], pagination: { total, skip, limit, has_more } }
export const fetchProducts = (filters = {}, skip = 0, limit = 100) =>
  api.get('/products/', { params: buildParams(filters, skip, limit) }).then((r) => r.data)

export const fetchProduct = (id) => api.get(`/products/${id}`).then((r) => r.data.data)

// Uses the server-side stock filter instead of client-side filter
export const fetchLowStockProducts = () =>
  api
    .get('/products/', { params: { limit: 1000, stock_count: 10, stock_operator: 'lte' } })
    .then((r) => r.data.data)

export const createProduct = (data) => api.post('/products/', data).then((r) => r.data.data)

export const updateProduct = (id, data) =>
  api.put(`/products/${id}`, data).then((r) => r.data.data)

export const deleteProduct = (id) => api.delete(`/products/${id}`)
