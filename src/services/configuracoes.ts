import pb from '@/lib/pocketbase/client'
import type { ConfiguracoesRecord } from '@/types/database'

const DEFAULT_CONFIG = {
  valor_m2: 450,
  entrada_minima: 20000,
  fator_24: 0.0470735,
  fator_36: 0.0332143,
  fator_48: 0.0263338,
  ipca_anual: 4.5,
  max_parcelas: 48,
}

export const configuracoesService = {
  async get(): Promise<ConfiguracoesRecord> {
    try {
      const records = await pb.collection<ConfiguracoesRecord>('configuracoes').getFullList({
        sort: '-created',
        batch: 1,
      })
      if (records.length > 0) {
        return records[0]
      }
      // Se não existir, cria o padrão
      return await pb.collection<ConfiguracoesRecord>('configuracoes').create(DEFAULT_CONFIG)
    } catch {
      // Retorna objeto fallback
      return {
        id: 'fallback',
        collectionId: 'configuracoes',
        collectionName: 'configuracoes',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        ...DEFAULT_CONFIG,
      } as ConfiguracoesRecord
    }
  },

  async update(id: string, data: Partial<ConfiguracoesRecord>): Promise<ConfiguracoesRecord> {
    return await pb.collection<ConfiguracoesRecord>('configuracoes').update(id, data)
  },
}
