import pb from '@/lib/pocketbase/client'
import type { LoteRecord } from '@/types/database'

export const lotesService = {
  async getAll(): Promise<LoteRecord[]> {
    return await pb.collection<LoteRecord>('lotes').getFullList({
      sort: 'quadra,nome',
    })
  },

  async getById(id: string): Promise<LoteRecord> {
    return await pb.collection<LoteRecord>('lotes').getOne(id)
  },

  async create(data: {
    quadra: string
    nome?: string
    largura: number
    comprimento: number
  }): Promise<LoteRecord> {
    return await pb.collection<LoteRecord>('lotes').create(data)
  },

  async update(id: string, data: Partial<LoteRecord>): Promise<LoteRecord> {
    return await pb.collection<LoteRecord>('lotes').update(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('lotes').delete(id)
  },
}
