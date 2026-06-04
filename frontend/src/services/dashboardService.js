import api from './api'

export const fetchDashboardStats = () => api.get('/dashboard').then((r) => r.data.data)
