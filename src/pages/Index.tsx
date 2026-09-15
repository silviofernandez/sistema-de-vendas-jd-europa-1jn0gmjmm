import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Rota raiz: redireciona para /simulador se autenticado, ou /login se não autenticado.
 */
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/simulador" replace />
  }

  return <Navigate to="/login" replace />
}
