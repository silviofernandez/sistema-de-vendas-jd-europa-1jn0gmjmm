import pb from '@/lib/pocketbase/client'
import type { PedidoCadastroRecord } from '@/types/database'

export interface SolicitarCadastroParams {
  nome: string
  email: string
  telefone?: string
  password: string
}

export const pedidosService = {
  // Solicita cadastro: cria o usuário em users (com status 'pendente') e cria o registro em pedidos_cadastro com token único
  solicitarCadastro: async (params: SolicitarCadastroParams): Promise<{ pedidoId: string }> => {
    // 1. Gera token seguro aleatório
    const randPart =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const timestampPart = Date.now().toString(36)
    const token = `${timestampPart}-${randPart}`

    // 2. Cria o usuário com a senha escolhida pelo corretor
    // O hook on_user_create garante role='corretor' e status='pendente'
    const user = await pb.collection('users').create({
      name: params.nome.trim(),
      email: params.email.trim().toLowerCase(),
      telefone: params.telefone?.trim() || '',
      password: params.password,
      passwordConfirm: params.password,
      role: 'corretor',
      status: 'pendente',
      emailVisibility: true,
    })

    // 3. Cria o pedido de cadastro com o token
    // O hook on_pedido_create disparará e-mail para gabsilvio@gmail.com com o link direto
    const pedido = await pb.collection('pedidos_cadastro').create<PedidoCadastroRecord>({
      nome: params.nome.trim(),
      email: params.email.trim().toLowerCase(),
      telefone: params.telefone?.trim() || '',
      status: 'pendente',
      token: token,
      user_id: user.id,
    })

    return { pedidoId: pedido.id }
  },

  // Busca dados de um pedido pelo token (via backend customizado ou fallback do PocketBase)
  getPedidoPorToken: async (token: string): Promise<PedidoCadastroRecord> => {
    try {
      const res = await fetch(
        `${pb.baseUrl}/backend/v1/autorizar?token=${encodeURIComponent(token)}`,
      )
      if (res.ok) {
        return await res.json()
      }
    } catch {
      /* intentionally ignored */
    }

    // Fallback: consulta direta pelo PB SDK
    return await pb
      .collection('pedidos_cadastro')
      .getFirstListItem<PedidoCadastroRecord>(`token="${token}"`)
  },

  // Aprova ou rejeita via token público
  decidirPedidoPorToken: async (
    token: string,
    action: 'aprovar' | 'rejeitar',
  ): Promise<{ success: boolean; status: string; message: string; emailEnviado?: boolean }> => {
    try {
      const res = await fetch(`${pb.baseUrl}/backend/v1/autorizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      })
      if (res.ok) {
        return await res.json()
      }
      const err = await res.json()
      throw new Error(err.error || 'Erro ao processar solicitação.')
    } catch (e: unknown) {
      // Se a rota falhar, tenta fallback caso seja master logado
      if (pb.authStore.isValid) {
        const pedido = await pb
          .collection('pedidos_cadastro')
          .getFirstListItem<PedidoCadastroRecord>(`token="${token}"`)
        const novoStatus = action === 'aprovar' ? 'aprovado' : 'rejeitado'
        await pb.collection('pedidos_cadastro').update(pedido.id, { status: novoStatus })
        if (pedido.user_id) {
          await pb.collection('users').update(pedido.user_id, { status: novoStatus })
        }
        return {
          success: true,
          status: novoStatus,
          message: action === 'aprovar' ? 'Acesso autorizado!' : 'Pedido rejeitado!',
        }
      }
      throw e
    }
  },

  // Para o Master dentro do sistema: listar pedidos
  listarPedidos: async (): Promise<PedidoCadastroRecord[]> => {
    return await pb.collection('pedidos_cadastro').getFullList<PedidoCadastroRecord>({
      sort: '-created',
    })
  },

  // Para o Master dentro do sistema: autorizar com um clique
  autorizarPedido: async (pedido: PedidoCadastroRecord): Promise<void> => {
    // 1. Tenta via endpoint para disparar o e-mail de boas-vindas ao corretor
    try {
      const res = await fetch(`${pb.baseUrl}/backend/v1/autorizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: pedido.token, action: 'aprovar' }),
      })
      if (res.ok) return
    } catch {
      /* intentionally ignored */
    }

    // 2. Fallback direto no PocketBase
    await pb.collection('pedidos_cadastro').update(pedido.id, { status: 'aprovado' })
    if (pedido.user_id) {
      await pb.collection('users').update(pedido.user_id, { status: 'aprovado' })
    } else {
      const user = await pb.collection('users').getFirstListItem(`email="${pedido.email}"`)
      if (user) {
        await pb.collection('users').update(user.id, { status: 'aprovado' })
      }
    }
  },

  // Para o Master dentro do sistema: rejeitar pedido
  rejeitarPedido: async (pedido: PedidoCadastroRecord): Promise<void> => {
    try {
      const res = await fetch(`${pb.baseUrl}/backend/v1/autorizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: pedido.token, action: 'rejeitar' }),
      })
      if (res.ok) return
    } catch {
      /* intentionally ignored */
    }

    await pb.collection('pedidos_cadastro').update(pedido.id, { status: 'rejeitado' })
    if (pedido.user_id) {
      await pb.collection('users').update(pedido.user_id, { status: 'rejeitado' })
    } else {
      try {
        const user = await pb.collection('users').getFirstListItem(`email="${pedido.email}"`)
        if (user) {
          await pb.collection('users').update(user.id, { status: 'rejeitado' })
        }
      } catch {
        /* intentionally ignored */
      }
    }
  },

  // Excluir registro de pedido
  deletarPedido: async (id: string): Promise<void> => {
    await pb.collection('pedidos_cadastro').delete(id)
  },
}
