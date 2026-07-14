import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    api.me()
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  function login(token, user) {
    setToken(token)
    setUser(user)
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  function updateUser(user) {
    setUser(user)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
