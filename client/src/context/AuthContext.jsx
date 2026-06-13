/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import api from '../utils/api'

const AuthContext = createContext({
  authUser: null,
  isAuthLoading: true,
  login: () => {},
  logout: () => {},
  updateAuthUser: () => {},
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
})

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/user/auth')
        setAuthUser(response.data?.user || null)
      } catch {
        setAuthUser(null)
      } finally {
        setIsAuthLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback((userData = null) => {
    setAuthUser(userData)
    setIsAuthModalOpen(false)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/user/logout')
    } finally {
      setAuthUser(null)
    }
  }, [])

  const updateAuthUser = useCallback((userData) => {
    setAuthUser((currentUser) => ({
      ...currentUser,
      ...userData,
    }))
  }, [])

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
  }, [])

  const value = useMemo(() => ({
    authUser,
    isAuthLoading,
    login,
    logout,
    updateAuthUser,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  }), [
    authUser,
    closeAuthModal,
    isAuthLoading,
    login,
    logout,
    openAuthModal,
    isAuthModalOpen,
    updateAuthUser,
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
