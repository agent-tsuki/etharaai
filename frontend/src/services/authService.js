import api from './api'

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data.data)

export const signup = (email, password, full_name) =>
  api.post('/auth/signup', { email, password, full_name }).then((r) => r.data.data)

export const refresh = (refresh_token) =>
  api.post('/auth/refresh', { refresh_token }).then((r) => r.data.data)

export const logout = (refresh_token) =>
  api.post('/auth/logout', { refresh_token }).then((r) => r.data.data)

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data.data)

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data.data)

export const resetPassword = (token, new_password) =>
  api.post('/auth/reset-password', { token, new_password }).then((r) => r.data.data)
