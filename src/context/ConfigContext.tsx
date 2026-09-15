import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ConfiguracoesRecord } from '@/types/database'
import { configuracoesService } from '@/services/configuracoes'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from './AuthContext'

interface ConfigContextType {
  config: ConfiguracoesRecord | null
  isLoading: boolean
  refreshConfig: () => Promise<void>
  updateConfig: (data: Partial<ConfiguracoesRecord>) => Promise<ConfiguracoesRecord>
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

const DEFAULT_CONFIG_FALLBACK: ConfiguracoesRecord = {
  id: 'local_default',
  collectionId: 'configuracoes',
  collectionName: 'configuracoes',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  valor_m2: 450,
  entrada_minima: 20000,
  fator_24: 0.0470735,
  fator_36: 0.0332143,
  fator_48: 0.0263338,
  ipca_anual: 4.5,
  max_parcelas: 48,
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [config, setConfig] = useState<ConfiguracoesRecord | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchConfig = useCallback(async () => {
    if (!isAuthenticated) {
      setConfig(DEFAULT_CONFIG_FALLBACK)
      setIsLoading(false)
      return
    }

    try {
      const data = await configuracoesService.get()
      setConfig(data)
    } catch {
      setConfig(DEFAULT_CONFIG_FALLBACK)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // Atualização em tempo real caso outro usuário ou aba mude as configurações
  useRealtime<ConfiguracoesRecord>(
    'configuracoes',
    (e) => {
      if (e.action === 'update' || e.action === 'create') {
        setConfig(e.record)
      }
    },
    isAuthenticated,
  )

  const updateConfig = async (data: Partial<ConfiguracoesRecord>) => {
    if (!config?.id) {
      throw new Error('Configuração não carregada')
    }
    const updated = await configuracoesService.update(config.id, data)
    setConfig(updated)
    return updated
  }

  return (
    <ConfigContext.Provider
      value={{
        config: config || DEFAULT_CONFIG_FALLBACK,
        isLoading,
        refreshConfig: fetchConfig,
        updateConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig deve ser usado dentro de um ConfigProvider')
  }
  return context
}
