import React, { createContext, useContext, useState, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('twin_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (email, password, role) => {
    const res = await api.post('/api/auth/login', { email, password, role })
    const { access_token, role: userRole, name, user_id } = res.data
    const userData = { name, role: userRole, user_id }
    localStorage.setItem('twin_token', access_token)
    localStorage.setItem('twin_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (payload) => {
    const res = await api.post('/api/auth/register', payload)
    const { access_token, role: userRole, name, user_id } = res.data
    const userData = { name, role: userRole, user_id }
    localStorage.setItem('twin_token', access_token)
    localStorage.setItem('twin_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('twin_token')
    localStorage.removeItem('twin_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
