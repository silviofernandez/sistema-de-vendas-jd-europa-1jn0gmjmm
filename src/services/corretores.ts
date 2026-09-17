import pb from '@/lib/pocketbase/client'
import type { UserRecord } from '@/types/database'

export interface CreateCorretorData {
  name: string
  email: string
  password: string
  passwordConfirm: string
  telefone?: string
  role?: 'corretor' | 'master'
}

export interface UpdateCorretorData {
  name?: string
  telefone?: string
  password?: string
  passwordConfirm?: string
}

export const corretoresService = {
  async getAll(): Promise<UserRecord[]> {
    return await pb.collection('users').getFullList<UserRecord>({
      sort: '-created',
    })
  },

  async create(data: CreateCorretorData): Promise<UserRecord> {
    return await pb.collection('users').create<UserRecord>({
      ...data,
      role: data.role || 'corretor',
      emailVisibility: true,
    })
  },

  async requestPasswordReset(email: string): Promise<boolean> {
    return await pb.collection('users').requestPasswordReset(email)
  },

  async update(id: string, data: UpdateCorretorData): Promise<UserRecord> {
    return await pb.collection('users').update<UserRecord>(id, data)
  },

  async resetPassword(id: string, newPassword: string): Promise<UserRecord> {
    return await pb.collection('users').update<UserRecord>(id, {
      password: newPassword,
      passwordConfirm: newPassword,
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('users').delete(id)
  },
}
