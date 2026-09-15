import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit2,
  Phone,
  Mail,
  Loader2,
  FileSpreadsheet,
  ChevronRight,
  User,
  Calendar,
  Share2,
} from 'lucide-react'
import { clientesService } from '@/services/clientes'
import { propostasService } from '@/services/propostas'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/context/AuthContext'
import type { ClienteRecord, PropostaRecord } from '@/types/database'
import { formatarMoeda, formatarNumero } from '@/lib/calculo'
import { gerarMensagemPropostaWhatsApp, abrirWhatsApp } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export default function Clientes() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [clientes, setClientes] = useState<ClienteRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Cliente selecionado para visualização de propostas
  const [viewingCliente, setViewingCliente] = useState<ClienteRecord | null>(null)
  const [clientePropostas, setClientePropostas] = useState<PropostaRecord[]>([])
  const [loadingPropostas, setLoadingPropostas] = useState(false)

  // Modal de Criar / Editar
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<ClienteRecord | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Modal de Exclusão
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchClientes = async () => {
    try {
      const data = await clientesService.getAll()
      setClientes(data)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar clientes',
        description: 'Não foi possível buscar a lista de clientes.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  // Tempo real
  useRealtime<ClienteRecord>('clientes', () => {
    fetchClientes()
  })

  // Filtro
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const search = searchTerm.toLowerCase()
      return (
        c.nome.toLowerCase().includes(search) ||
        (c.telefone || '').toLowerCase().includes(search) ||
        (c.email || '').toLowerCase().includes(search)
      )
    })
  }, [clientes, searchTerm])

  const handleOpenCreate = () => {
    setEditingCliente(null)
    setFormData({ nome: '', telefone: '', email: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cliente: ClienteRecord) => {
    setEditingCliente(cliente)
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      email: cliente.email || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim()) return

    setIsSaving(true)
    try {
      if (editingCliente) {
        await clientesService.update(editingCliente.id, {
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim() || undefined,
          email: formData.email.trim() || undefined,
        })
        toast({ title: 'Cliente atualizado com sucesso!' })
      } else {
        await clientesService.create({
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim() || undefined,
          email: formData.email.trim() || undefined,
        })
        toast({ title: 'Novo cliente cadastrado com sucesso!' })
      }
      setIsModalOpen(false)
      fetchClientes()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar cliente',
        description: 'Tente novamente.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await clientesService.delete(deletingId)
      toast({ title: 'Cliente removido' })
      setDeletingId(null)
      if (viewingCliente?.id === deletingId) {
        setViewingCliente(null)
      }
      fetchClientes()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir cliente',
        description: 'Verifique se existem propostas associadas a este cliente.',
      })
    }
  }

  // Visualizar cliente e suas propostas
  const handleViewCliente = async (cliente: ClienteRecord) => {
    setViewingCliente(cliente)
    setLoadingPropostas(true)
    try {
      const props = await propostasService.getByCliente(cliente.id)
      setClientePropostas(props)
    } catch {
      setClientePropostas([])
    } finally {
      setLoadingPropostas(false)
    }
  }

  // Máscara básica para telefone pt-BR
  const handleTelefoneChange = (value: string) => {
    let clean = value.replace(/\D/g, '')
    if (clean.length > 11) clean = clean.substring(0, 11)

    if (clean.length > 10) {
      clean = clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    } else if (clean.length > 6) {
      clean = clean.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3')
    } else if (clean.length > 2) {
      clean = clean.replace(/^(\d{2})(\d{0,5})$/, '($1) $2')
    }
    setFormData((prev) => ({ ...prev, telefone: clean }))
  }

  return (
    <div className="space-y-6">
      {/* Top Header com Busca e Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E6DFD6] shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 border-[#E6DFD6]"
          />
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-10 bg-[#C2501A] hover:bg-[#A84415] text-white font-semibold rounded-xl hover-lift flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Grid: Lista de Clientes e Painel de Propostas Vinculadas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna da Esquerda: Lista de Clientes */}
        <div className="lg:col-span-7 space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-[#E6DFD6] p-12 text-center text-[#6E675F]">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#C2501A]" />
              <p className="text-sm">Carregando clientes...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E6DFD6] p-10 text-center">
              <Users className="w-10 h-10 text-[#6E675F]/40 mx-auto mb-3" />
              <p className="font-bold text-[#2E2A25] text-sm">Nenhum cliente cadastrado</p>
              <p className="text-xs text-[#6E675F] mt-1 mb-4">
                Cadastre seus proponentes para gerar e salvar propostas.
              </p>
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                className="border-[#E6DFD6] text-xs font-semibold"
              >
                Cadastrar cliente
              </Button>
            </div>
          ) : (
            clientesFiltrados.map((cliente) => {
              const isSelected = viewingCliente?.id === cliente.id
              return (
                <div
                  key={cliente.id}
                  className={`bg-white rounded-xl p-4 border transition-all hover-lift ${
                    isSelected
                      ? 'border-[#C2501A] ring-1 ring-[#C2501A] bg-orange-50/20'
                      : 'border-[#E6DFD6] hover:border-[#C2501A]/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4A7C59]/10 text-[#4A7C59] flex items-center justify-center font-bold text-sm shrink-0">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-[#2E2A25]">
                          {cliente.nome}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6E675F] mt-0.5">
                          {cliente.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#C2501A]" />
                              {cliente.telefone}
                            </span>
                          )}
                          {cliente.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#4A7C59]" />
                              {cliente.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCliente(cliente)}
                        className={`text-xs px-2.5 h-8 font-semibold flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#C2501A] text-white hover:bg-[#A84415]'
                            : 'text-[#C2501A] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        Ver Propostas
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(cliente)}
                        className="h-8 w-8 p-0 text-[#6E675F] hover:text-[#2E2A25] hover:bg-[#FAF7F2]"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(cliente.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Coluna da Direita: Painel de Propostas Vinculadas */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#E6DFD6] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DFD6] pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#C2501A]" />
              <h3 className="font-bold text-[#2E2A25] text-sm sm:text-base">
                Propostas do Cliente
              </h3>
            </div>
            {viewingCliente && (
              <span className="text-[11px] font-semibold text-[#4A7C59] bg-[#4A7C59]/10 px-2.5 py-0.5 rounded-full truncate max-w-[150px]">
                {viewingCliente.nome}
              </span>
            )}
          </div>

          {!viewingCliente ? (
            <div className="py-12 text-center text-[#6E675F]">
              <User className="w-10 h-10 mx-auto mb-2 text-[#6E675F]/40" />
              <p className="text-sm font-semibold text-[#2E2A25]">Selecione um cliente ao lado</p>
              <p className="text-xs text-[#6E675F] max-w-xs mx-auto mt-1">
                Clique no botão "Ver Propostas" de qualquer cliente para visualizar as simulações
                salvas para ele.
              </p>
            </div>
          ) : loadingPropostas ? (
            <div className="py-12 text-center text-[#6E675F]">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C2501A]" />
              <p className="text-xs">Buscando propostas salvas...</p>
            </div>
          ) : clientePropostas.length === 0 ? (
            <div className="py-8 text-center bg-[#FAF7F2] rounded-xl border border-[#E6DFD6] p-6">
              <p className="text-sm font-semibold text-[#2E2A25]">Nenhuma proposta vinculada</p>
              <p className="text-xs text-[#6E675F] mt-1">
                Gere e salve uma proposta para {viewingCliente.nome} na tela do Simulador.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {clientePropostas.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-[#FAF7F2] rounded-xl p-3.5 border border-[#E6DFD6] space-y-2 text-xs"
                >
                  <div className="flex justify-between items-center border-b border-[#E6DFD6]/60 pb-2">
                    <span className="font-bold text-[#C2501A] text-sm">Quadra {prop.quadra}</span>
                    <span className="text-[11px] text-[#6E675F] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(prop.created).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#6E675F] block">Área:</span>
                      <span className="font-semibold text-[#2E2A25]">
                        {formatarNumero(prop.area_m2)} m²
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6E675F] block">Valor Total:</span>
                      <span className="font-semibold text-[#2E2A25]">
                        {formatarMoeda(prop.valor_total_lote)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6E675F] block">Entrada:</span>
                      <span className="font-bold text-[#4A7C59]">
                        {formatarMoeda(prop.entrada)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6E675F] block">Financiamento:</span>
                      <span className="font-bold text-[#2E2A25]">
                        {prop.num_parcelas}x de {formatarMoeda(prop.parcela_mensal)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E6DFD6]/60 flex items-center justify-between text-[11px] text-[#6E675F]">
                    <span>IPCA Anual: {formatarNumero(prop.ipca_anual)}%</span>
                    <span className="font-bold text-[#2E2A25]">
                      Total financiado: {formatarMoeda(prop.parcela_mensal * prop.num_parcelas)}
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const tel = viewingCliente.telefone || ''
                        const msg = gerarMensagemPropostaWhatsApp({
                          clienteNome: viewingCliente.nome,
                          quadra: prop.quadra,
                          modoArea: 'area_total',
                          areaM2: prop.area_m2,
                          valorM2: prop.valor_m2,
                          valorTotalLote: prop.valor_total_lote,
                          entrada: prop.entrada,
                          valorFinanciado: prop.valor_financiado,
                          numParcelas: prop.num_parcelas,
                          parcelaMensal: prop.parcela_mensal,
                          ipcaAnual: prop.ipca_anual,
                          corretorNome: user?.name,
                        })
                        abrirWhatsApp(tel, msg)
                      }}
                      className="h-8 px-3 text-xs bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center gap-1.5 rounded-lg"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Enviar no WhatsApp
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar / Editar Cliente */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E6DFD6]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#2E2A25]">
              {editingCliente ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6E675F]">
              Dados de contato do proponente comprador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-semibold text-[#6E675F]">
                Nome Completo <span className="text-[#C2501A]">*</span>
              </Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Carlos Eduardo Mendes"
                className="border-[#E6DFD6]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefone" className="text-xs font-semibold text-[#6E675F]">
                Telefone / WhatsApp
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleTelefoneChange(e.target.value)}
                placeholder="(11) 98765-4321"
                className="border-[#E6DFD6]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#6E675F]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="carlos@exemplo.com"
                className="border-[#E6DFD6]"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-[#E6DFD6]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !formData.nome.trim()}
                className="bg-[#C2501A] hover:bg-[#A84415] text-white"
              >
                {isSaving ? 'Salvando...' : 'Salvar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Excluir Cliente */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="max-w-sm bg-white border-[#E6DFD6]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#C0392B]">
              Excluir cliente?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6E675F]">
              Esta ação removerá o cliente cadastrado do sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingId(null)}
              className="border-[#E6DFD6]"
            >
              Cancelar
            </Button>
            <Button onClick={handleDelete} className="bg-[#C0392B] hover:bg-red-700 text-white">
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
