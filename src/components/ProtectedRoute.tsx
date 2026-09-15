import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  masterOnly?: boolean
}

export default function ProtectedRoute({ children, masterOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isMaster, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C2501A] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (masterOnly && !isMaster) {
    return <Navigate to="/simulador" replace />
  }

  return <>{children}</>
}
