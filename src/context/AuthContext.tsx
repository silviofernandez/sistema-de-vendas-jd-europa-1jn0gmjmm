import React, { createContext, useContext, useEffect, useState } from 'react'
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

import type { UserRecord } from '@/types/database'

interface AuthContextType {
  user: UserRecord | null
  token: string
  isAuthenticated: boolean
  isMaster: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  register: (data: {
    name: string
    email: string
    password: string
    passwordConfirm: string
    telefone?: string
  }) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(
    (pb.authStore.record as unknown as UserRecord) || null,
  )
  const [token, setToken] = useState<string>(pb.authStore.token)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshUser = async () => {
    try {
      if (pb.authStore.isValid && pb.authStore.record?.id) {
        const fresh = await pb.collection('users').getOne<UserRecord>(pb.authStore.record.id)
        setUser(fresh)
      }
    } catch {
      // Falha silenciosa ao atualizar
    }
  }

  useEffect(() => {
    // Escuta mudanças no authStore do PocketBase
    const unsubscribe = pb.authStore.onChange((newToken, newModel) => {
      setToken(newToken)
      setUser((newModel as unknown as UserRecord) || null)
    })

    // Valida token ao inicializar se existir
    if (pb.authStore.isValid) {
      setUser((pb.authStore.record as unknown as UserRecord) || null)
      setToken(pb.authStore.token)
      // Faz refresh para garantir que role e campos novos estejam no state
      refreshUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    const authData = await pb.collection('users').authWithPassword(email, pass)
    setUser(authData.record as unknown as UserRecord)
    setToken(authData.token)
  }

  const register = async (data: {
    name: string
    email: string
    password: string
    passwordConfirm: string
    telefone?: string
  }) => {
    await pb.collection('users').create({
      ...data,
      role: 'corretor',
      emailVisibility: true,
    })
    // Efetua login automaticamente após o registro bem-sucedido
    await login(data.email, data.password)
  }

  const requestPasswordReset = async (email: string) => {
    await pb.collection('users').requestPasswordReset(email)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken('')
  }

  const isMaster = user?.role === 'master' || user?.email === 'gabsilvio@gmail.com'

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isMaster,
        isLoading,
        login,
        register,
        requestPasswordReset,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
