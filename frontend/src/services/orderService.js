import api from './api'

function buildParams(filters = {}, skip = 0, limit = 100) {
  const p = { skip, limit }
  if (filters.customer_id != null) p.customer_id     = filters.customer_id
  if (filters.status)              p.status          = filters.status
  if (filters.min_amount != null)  p.min_amount      = filters.min_amount
  if (filters.max_amount != null)  p.max_amount      = filters.max_amount
  if (filters.min_amount != null && filters.max_amount == null)
    p.amount_operator = filters.amount_operator ?? 'gte'
  if (filters.date_from)           p.date_from       = filters.date_from
  if (filters.date_to)             p.date_to         = filters.date_to
  return p
}

// Returns { data: [...], pagination: { total, skip, limit, has_more } }
export const fetchOrders = (filters = {}, skip = 0, limit = 100) =>
  api.get('/orders/', { params: buildParams(filters, skip, limit) }).then((r) => r.data)

export const fetchOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data.data)

export const createOrder = (data) => api.post('/orders/', data).then((r) => r.data.data)

export const deleteOrder = (id) => api.delete(`/orders/${id}`)
