import api from './api'

function buildParams(filters = {}, skip = 0, limit = 100) {
  const p = { skip, limit }
  if (filters.name)  p.name  = filters.name
  if (filters.email) p.email = filters.email
  return p
}

// Returns { data: [...], pagination: { total, skip, limit, has_more } }
export const fetchCustomers = (filters = {}, skip = 0, limit = 100) =>
  api.get('/customers/', { params: buildParams(filters, skip, limit) }).then((r) => r.data)

export const fetchCustomer = (id) => api.get(`/customers/${id}`).then((r) => r.data.data)

export const createCustomer = (data) => api.post('/customers/', data).then((r) => r.data.data)

export const deleteCustomer = (id) => api.delete(`/customers/${id}`)
