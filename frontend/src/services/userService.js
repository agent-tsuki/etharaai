import api from './api'

export const fetchUsers = (skip = 0, limit = 100) =>
  api.get('/users', { params: { skip, limit } }).then((r) => r.data.data)

export const fetchUser = (id) =>
  api.get(`/users/${id}`).then((r) => r.data.data)

export const updateUser = (id, data) =>
  api.put(`/users/${id}`, data).then((r) => r.data.data)

export const updateUserRole = (id, role) =>
  api.patch(`/users/${id}/role`, { role }).then((r) => r.data.data)

export const updateUserPermissions = (id, permissions) =>
  api.patch(`/users/${id}/permissions`, { permissions }).then((r) => r.data.data)

export const deleteUser = (id) =>
  api.delete(`/users/${id}`)
