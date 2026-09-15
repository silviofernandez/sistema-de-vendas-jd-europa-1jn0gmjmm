import pb from '@/lib/pocketbase/client'
import type { PropostaRecord } from '@/types/database'

export const propostasService = {
  async getAll(): Promise<PropostaRecord[]> {
    return await pb.collection<PropostaRecord>('propostas').getFullList({
      sort: '-created',
      expand: 'cliente,lote',
    })
  },

  async getByCliente(clienteId: string): Promise<PropostaRecord[]> {
    return await pb.collection<PropostaRecord>('propostas').getFullList({
      filter: `cliente = "${clienteId}"`,
      sort: '-created',
      expand: 'cliente,lote',
    })
  },

  async create(data: {
    cliente?: string
    lote?: string
    quadra: string
    area_m2: number
    valor_m2: number
    valor_total_lote: number
    entrada: number
    valor_financiado: number
    num_parcelas: number
    parcela_mensal: number
    ipca_anual: number
  }): Promise<PropostaRecord> {
    return await pb.collection<PropostaRecord>('propostas').create(data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('propostas').delete(id)
  },
}
