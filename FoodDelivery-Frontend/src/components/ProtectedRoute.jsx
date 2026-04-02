import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="size-12 rounded-full border-4 border-rose-600/20 border-t-rose-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const userRole = user.role || user.Role || 'Customer'
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
