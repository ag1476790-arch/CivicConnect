import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import AuthContext from './authContextValue'

const STORAGE_KEY = 'civicconnect-user'

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
  })
  const [logoutError, setLogoutError] = useState('')

  const setUser = useCallback((nextUser) => {
    if (nextUser) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
    setUserState(nextUser)
    setLogoutError('')
  }, [])

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const logout = useCallback(async () => {
    setLogoutError('')
    try {
      if (user?.token) await api.post('/auth/logout/')
    } catch {
      setLogoutError('Your browser session ended, but the server token could not be revoked. Sign out again when the API is available.')
    } finally {
      setUserState(null)
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,
      setUser,
      logout,
      logoutError,
    }),
    [user, setUser, logout, logoutError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
