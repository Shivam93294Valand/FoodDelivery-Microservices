import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsedUser)
      } catch (e) {
        // Invalid user data in localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      // Only force-logout if there is actually a stored token that's being rejected.
      // This avoids wiping a perfectly valid in-memory session due to a transient
      // network error or a single failing microservice.
      const storedToken = localStorage.getItem('token')
      if (!storedToken) return
      setUser(null)
      setToken(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const login = async (email, password) => {
    try {
      const normalizedEmail = (email || '').trim()
      let lastError = null

      // 1. Try Admin login first
      try {
        const data = await api.adminLogin({ email: normalizedEmail, password })
        if (data && data.success !== false) {
          const token = data.token || data.Token
          const userData = data.user || data.User

          if (token && userData) {
            const normalizedUser = {
              userId: userData.userId || userData.UserId,
              firstName: userData.firstName || userData.FirstName,
              lastName: userData.lastName || userData.LastName,
              email: userData.email || userData.Email,
              phoneNumber: userData.phoneNumber || userData.PhoneNumber,
              role: userData.role || userData.Role || 'Admin',
              isActive: userData.isActive ?? userData.IsActive ?? true
            }

            setToken(token)
            setUser(normalizedUser)
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(normalizedUser))
            return true
          }
        }
      } catch (err) {
        lastError = err
        console.warn('Admin login failed, trying Customer:', err?.message || err)
      }

      // 2. Try Customer login
      try {
        const data = await api.login({ email: normalizedEmail, password })
        const token = data.token || data.Token || data.token?.toString()
        const userData = data.customer || data.Customer || data.user || data.User

        if (token && userData) {
          const customerId = userData.userId || userData.UserId || userData.customerId || userData.CustomerId
          const normalizedUser = {
            userId: customerId,
            customerId: customerId,
            firstName: userData.firstName || userData.FirstName,
            lastName: userData.lastName || userData.LastName,
            email: userData.email || userData.Email,
            phoneNumber: userData.phoneNumber || userData.PhoneNumber,
            role: 'Customer',
            isActive: userData.isActive ?? userData.IsActive ?? true,
            createdAt: userData.createdAt || userData.CreatedAt
          }

          setToken(token)
          setUser(normalizedUser)
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(normalizedUser))
          return true
        }
      } catch (err) {
        lastError = err
        console.warn('Customer login failed, trying Delivery:', err?.message || err)
      }

      // 3. Try DeliveryPerson login
      try {
        const data = await api.deliveryLogin({ email: normalizedEmail, password })
        const token = data.token || data.Token || data.token?.toString()
        const person = data.deliveryPerson || data.DeliveryPerson || data.DeliveryPersonDto || data.deliveryPerson

        if (token && person) {
          const id = person.deliveryPersonId || person.DeliveryPersonId
          const normalizedUser = {
            userId: id,
            deliveryPersonId: id,
            firstName: person.firstName || person.FirstName,
            lastName: person.lastName || person.LastName,
            email: person.email || person.Email,
            phoneNumber: person.phoneNumber || person.PhoneNumber,
            role: 'DeliveryPerson',
            isAvailable: person.isAvailable ?? person.IsAvailable ?? true
          }

          setToken(token)
          setUser(normalizedUser)
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(normalizedUser))
          return true
        }
      } catch (err) {
        lastError = err
        console.warn('Delivery login failed:', err?.message || err)
      }

      throw lastError || new Error('Invalid email or password')
    } catch (e) {
      console.error('Login error:', e)
      throw e
    }
  }

  const register = async (userData) => {
    try {
      const data = await api.register(userData)
      return data
    } catch (e) {
      throw e
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}