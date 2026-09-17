import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Trees,
  CheckCircle2,
  XCircle,
  Loader2,
  UserCheck,
  Mail,
  Phone,
  Shield,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { pedidosService } from '@/services/pedidos'
import type { PedidoCadastroRecord } from '@/types/database'

export default function Autorizar() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(true)
  const [pedido, setPedido] = useState<PedidoCadastroRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionDone, setActionDone] = useState<{
    status: 'aprovado' | 'rejeitado'
    message: string
  } | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token de autorização não informado ou link incompleto.')
      setIsLoading(false)
      return
    }

    const carregarPedido = async () => {
      try {
        const data = await pedidosService.getPedidoPorToken(token)
        setPedido(data)
        if (data.status === 'aprovado') {
          setActionDone({
            status: 'aprovado',
            message: 'Este convidado já foi autorizado anteriormente.',
          })
        } else if (data.status === 'rejeitado') {
          setActionDone({
            status: 'rejeitado',
            message: 'Este pedido já foi recusado.',
          })
        }
      } catch (err) {
        setError('Solicitação não encontrada, expirada ou link inválido.')
      } finally {
        setIsLoading(false)
      }
    }

    carregarPedido()
  }, [token])

  const handleAction = async (action: 'aprovar' | 'rejeitar') => {
    if (!token) return
    setIsProcessing(true)
    setError(null)
    try {
      const res = await pedidosService.decidirPedidoPorToken(token, action)
      setActionDone({
        status: action === 'aprovar' ? 'aprovado' : 'rejeitado',
        message: res.message || (action === 'aprovar' ? 'Acesso autorizado!' : 'Pedido rejeitado.'),
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar autorização.'
      setError(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F4EBE1] to-[#EBDCCE] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E6DFD6] p-6 sm:p-8 animate-fade-in-up">
        {/* Topo / Marca */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#C2501A] flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-orange-900/20">
            <Trees className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#2E2A25]">Loteamento Jd Europa</h1>
          <p className="text-xs text-[#6E675F] mt-0.5">Autorização de Cadastro de Convidado</p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="py-12 text-center text-[#6E675F] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C2501A]" />
            <p className="text-xs font-medium">Validando token de autorização...</p>
          </div>
        )}

        {/* Erro */}
        {!isLoading && error && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#2E2A25]">Link Inválido ou Expirado</h3>
            <p className="text-xs text-[#6E675F] leading-relaxed bg-[#FAF7F2] p-3 rounded-xl border border-[#E6DFD6]">
              {error}
            </p>
            <Button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full bg-[#C2501A] hover:bg-[#A84415] text-white text-xs font-semibold h-10 rounded-xl"
            >
              Ir para o Sistema
            </Button>
          </div>
        )}

        {/* Concluído com Sucesso (Aprovado ou Rejeitado) */}
        {!isLoading && !error && actionDone && (
          <div className="space-y-4 text-center py-2 animate-fade-in">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                actionDone.status === 'aprovado'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {actionDone.status === 'aprovado' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-[#2E2A25]">
                {actionDone.status === 'aprovado'
                  ? 'Acesso Autorizado com Sucesso!'
                  : 'Solicitação Rejeitada'}
              </h3>
              <p className="text-xs text-[#6E675F] mt-1">{actionDone.message}</p>
            </div>

            {pedido && (
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E6DFD6] text-xs text-left space-y-1.5 text-[#6E675F]">
                <div>
                  <span className="font-semibold text-[#2E2A25]">Convidado:</span> {pedido.nome}
                </div>
                <div>
                  <span className="font-semibold text-[#2E2A25]">E-mail:</span> {pedido.email}
                </div>
                {pedido.telefone && (
                  <div>
                    <span className="font-semibold text-[#2E2A25]">WhatsApp:</span>{' '}
                    {pedido.telefone}
                  </div>
                )}
                {actionDone.status === 'aprovado' && (
                  <div className="pt-1.5 text-[11px] text-[#4A7C59] font-medium border-t border-[#E6DFD6]/60">
                    ✓ O corretor já pode acessar o sistema usando a senha definida por ele.
                  </div>
                )}
              </div>
            )}

            <Button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full bg-[#C2501A] hover:bg-[#A84415] text-white text-xs font-semibold h-11 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
            >
              Acessar Sistema Jd Europa
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Exibição dos dados do pedido e botões de 1 clique */}
        {!isLoading && !error && !actionDone && pedido && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E6DFD6] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C2501A]">
                <Shield className="w-3.5 h-3.5" />
                Pedido de Acesso de Corretor
              </div>

              <div className="space-y-1.5 text-xs text-[#6E675F]">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#C2501A] shrink-0" />
                  <span className="font-semibold text-[#2E2A25] text-sm">{pedido.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#6E675F] shrink-0" />
                  <span className="truncate">{pedido.email}</span>
                </div>
                {pedido.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#4A7C59] shrink-0" />
                    <span>{pedido.telefone}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-[#6E675F] text-center leading-relaxed">
              Ao autorizar, este corretor terá acesso liberado imediatamente para entrar no sistema
              com a senha que ele mesmo cadastrou.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <Button
                type="button"
                onClick={() => handleAction('aprovar')}
                disabled={isProcessing}
                className="flex-1 h-11 bg-[#C2501A] hover:bg-[#A84415] text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Autorizando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Autorizar Acesso com 1 Clique
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleAction('rejeitar')}
                disabled={isProcessing}
                className="h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-semibold rounded-xl"
              >
                Recusar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
