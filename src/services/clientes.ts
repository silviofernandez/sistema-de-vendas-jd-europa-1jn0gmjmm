import pb from '@/lib/pocketbase/client'
import type { ClienteRecord } from '@/types/database'

export const clientesService = {
  async getAll(): Promise<ClienteRecord[]> {
    return await pb.collection<ClienteRecord>('clientes').getFullList({
      sort: 'nome',
    })
  },

  async getById(id: string): Promise<ClienteRecord> {
    return await pb.collection<ClienteRecord>('clientes').getOne(id)
  },

  async create(data: { nome: string; telefone?: string; email?: string }): Promise<ClienteRecord> {
    return await pb.collection<ClienteRecord>('clientes').create(data)
  },

  async update(id: string, data: Partial<ClienteRecord>): Promise<ClienteRecord> {
    return await pb.collection<ClienteRecord>('clientes').update(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('clientes').delete(id)
  },
}
