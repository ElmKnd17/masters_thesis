import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation()
  const { authUser, isAuthLoading } = useAuth()
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  if (isAuthLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-16 text-sm text-neutral-500 sm:px-8 lg:px-12">
        Проверяем авторизацию...
      </div>
    )
  }

  if (!authUser) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  if (roles.length > 0 && !roles.includes(authUser.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
