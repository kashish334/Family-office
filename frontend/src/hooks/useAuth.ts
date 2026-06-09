import { useState, useEffect, useCallback } from 'react'
import { authApi, tokenStore } from '../services/api'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tokenStore.getAccess()) {
      authApi.me()
        .then((u) => setUser(u as User))
        .catch(() => tokenStore.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await authApi.login(email, password)
    const me = await authApi.me()
    setUser(me as User)
    return me
  }, [])

  const logout = useCallback(() => {
    authApi.logout()
    setUser(null)
  }, [])

  return { user, loading, login, logout, isAuthenticated: !!user }
}