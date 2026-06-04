import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api, { setAccessToken, setRefreshCallback } from '../services/api'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshToken = useCallback(async () => {
    const rt = localStorage.getItem('refresh_token')
    if (!rt) throw new Error('No refresh token')
    const tokens = await authService.refresh(rt)
    setAccessToken(tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    return tokens.access_token
  }, [])

  useEffect(() => {
    setRefreshCallback(async () => {
      try {
        return await refreshToken()
      } catch {
        setUser(null)
        setAccessToken(null)
        localStorage.removeItem('refresh_token')
        throw new Error('Session expired')
      }
    })
  }, [refreshToken])

  useEffect(() => {
    const isGuest = localStorage.getItem('guest_mode') === 'true'
    if (isGuest) {
      setUser({ id: 'guest', full_name: 'Guest User', email: 'guest@example.com', role: 'admin' })
      setLoading(false)
      return
    }
    const rt = localStorage.getItem('refresh_token')
    if (!rt) {
      setLoading(false)
      return
    }
    refreshToken()
      .then(() => authService.getMe())
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('refresh_token')
        setAccessToken(null)
      })
      .finally(() => setLoading(false))
  }, [refreshToken])

  const login = useCallback(async (email, password) => {
    localStorage.removeItem('guest_mode') // clear guest mode if logging in with real credentials
    const tokens = await authService.login(email, password)
    setAccessToken(tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    const me = await authService.getMe()
    setUser(me)
    return me
  }, [])

  const loginAsGuest = useCallback(() => {
    localStorage.setItem('guest_mode', 'true')
    setUser({ id: 'guest', full_name: 'Guest User', email: 'guest@example.com', role: 'admin' })
  }, [])

  const logout = useCallback(async () => {
    const isGuest = localStorage.getItem('guest_mode') === 'true'
    localStorage.removeItem('guest_mode')
    if (!isGuest) {
      const rt = localStorage.getItem('refresh_token')
      if (rt) await authService.logout(rt).catch(() => {})
      setAccessToken(null)
      localStorage.removeItem('refresh_token')
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsGuest, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
