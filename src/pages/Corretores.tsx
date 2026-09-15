import React, { useState, useEffect, useMemo } from 'react'
import {
  UserCheck,
  Plus,
  Search,
  KeyRound,
  Trash2,
  Share2,
  Shield,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
  Lock,
  User,
  ExternalLink,
} from 'lucide-react'
import { corretoresService } from '@/services/corretores'
import { useAuth } from '@/context/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import type { UserRecord } from '@/types/database'
import {
  gerarMensagemAcessoCorretor,
  abrirWhatsApp,
  aplicarMascaraTelefone,
  formatarNumeroWhatsapp,
} from '@/lib/whatsapp'
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

export default function Corretores() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  const [corretores, setCorretores] = useState<UserRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Modal Novo Corretor
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formTelefone, setFormTelefone] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Modal Sucesso após cadastro (para envio imediato no WhatsApp)
  const [createdBrokerInfo, setCreatedBrokerInfo] = useState<{
    nome: string
    email: string
    senha: string
    telefone: string
  } | null>(null)

  // Modal Reset de Senha
  const [resettingUser, setResettingUser] = useState<UserRecord | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  // Modal Enviar WhatsApp para corretor existente
  const [whatsappBroker, setWhatsappBroker] = useState<UserRecord | null>(null)
  const [brokerTelInput, setBrokerTelInput] = useState('')
  const [brokerPasswordInput, setBrokerPasswordInput] = useState('')

  // Modal Deletar Corretor
  const [deletingBroker, setDeletingBroker] = useState<UserRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCorretores = async () => {
    try {
      const list = await corretoresService.getAll()
      setCorretores(list)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao listar corretores',
        description: 'Verifique suas credenciais de administrador.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCorretores()
  }, [])

  // Atualização em tempo real na collection users
  useRealtime<UserRecord>('users', () => {
    fetchCorretores()
  })

  // Filtro
  const corretoresFiltrados = useMemo(() => {
    return corretores.filter((c) => {
      const search = searchTerm.toLowerCase()
      return (
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        (c.telefone || '').toLowerCase().includes(search) ||
        (c.role || '').toLowerCase().includes(search)
      )
    })
  }, [corretores, searchTerm])

  // Abrir Modal de Criação
  const handleOpenCreate = () => {
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormTelefone('')
    setIsCreateModalOpen(true)
  }

  // Gerar senha sugerida rápida (ex: Jd2026! ou Europa@123)
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    let generated = 'Jd@'
    for (let i = 0; i < 5; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormPassword(generated)
  }

  // Submissão do cadastro
  const handleCreateCorretor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha nome, e-mail e senha do corretor.',
      })
      return
    }

    if (formPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Senha muito curta',
        description: 'A senha deve conter no mínimo 8 caracteres.',
      })
      return
    }

    setIsCreating(true)
    try {
      await corretoresService.create({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        password: formPassword,
        passwordConfirm: formPassword,
        telefone: formTelefone.trim() || undefined,
        role: 'corretor',
      })

      const savedData = {
        nome: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        senha: formPassword,
        telefone: formTelefone.trim(),
      }

      setIsCreateModalOpen(false)
      setCreatedBrokerInfo(savedData)
      fetchCorretores()

      toast({
        title: 'Corretor cadastrado!',
        description: `${savedData.nome} agora possui acesso ao sistema.`,
      })
    } catch (err: unknown) {
      const errObj = err as {
        data?: { data?: Record<string, { message?: string }> }
        message?: string
      }
      let msg = 'Erro ao cadastrar corretor.'
      if (errObj?.data?.data?.email) {
        msg = 'Este e-mail já está em uso por outro corretor.'
      } else if (errObj?.message) {
        msg = errObj.message
      }
      toast({
        variant: 'destructive',
        title: 'Não foi possível cadastrar',
        description: msg,
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Confirmar redefinição de senha
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resettingUser) return

    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Senha muito curta',
        description: 'A nova senha deve ter no mínimo 8 caracteres.',
      })
      return
    }

    setIsResetting(true)
    try {
      await corretoresService.resetPassword(resettingUser.id, newPassword)
      toast({
        title: 'Senha redefinida com sucesso!',
        description: `Nova senha salva para ${resettingUser.name}.`,
      })

      // Abre prompt de envio por WhatsApp com a nova senha
      const broker = resettingUser
      const pwd = newPassword
      setResettingUser(null)
      setNewPassword('')

      // Pergunta/abre envio por WhatsApp
      handleOpenSendWhatsApp(broker, pwd)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao redefinir senha',
        description: 'Tente novamente.',
      })
    } finally {
      setIsResetting(false)
    }
  }

  // Abrir envio WhatsApp para corretor
  const handleOpenSendWhatsApp = (broker: UserRecord, predefinedPassword?: string) => {
    setWhatsappBroker(broker)
    setBrokerTelInput(broker.telefone || '')
    setBrokerPasswordInput(predefinedPassword || '')
  }

  // Disparar envio de acesso por WhatsApp
  const handleConfirmSendWhatsApp = () => {
    if (!whatsappBroker) return

    const rawDigits = formatarNumeroWhatsapp(brokerTelInput)
    if (!rawDigits || rawDigits.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Telefone inválido',
        description: 'Informe o número do WhatsApp com DDD (ex: 11 99999-9999).',
      })
      return
    }

    const senha = brokerPasswordInput.trim() || 'Sua senha cadastrada'

    const msg = gerarMensagemAcessoCorretor({
      nome: whatsappBroker.name,
      email: whatsappBroker.email,
      senha: senha,
      appUrl: window.location.origin,
    })

    abrirWhatsApp(brokerTelInput, msg)

    // Se o telefone digitado for diferente do salvo, atualiza no banco
    if (brokerTelInput.trim() !== (whatsappBroker.telefone || '').trim()) {
      corretoresService
        .update(whatsappBroker.id, { telefone: brokerTelInput.trim() })
        .then(fetchCorretores)
        .catch(() => {})
    }

    setWhatsappBroker(null)
    toast({
      title: 'WhatsApp preparado!',
      description: 'A mensagem de boas-vindas com login e senha foi aberta.',
    })
  }

  // Deletar corretor
  const handleConfirmDelete = async () => {
    if (!deletingBroker) return
    setIsDeleting(true)
    try {
      await corretoresService.delete(deletingBroker.id)
      toast({
        title: 'Corretor removido',
        description: `${deletingBroker.name} não possui mais acesso ao sistema.`,
      })
      setDeletingBroker(null)
      fetchCorretores()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover corretor',
        description: 'Tente novamente mais tarde.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner Superior Exclusivo Master */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E6DFD6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C2501A]/10 text-[#C2501A] flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-[#2E2A25]">
                Equipe de Corretores & Acessos
              </h3>
              <span className="text-[10px] bg-[#C2501A] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Área Master
              </span>
            </div>
            <p className="text-xs text-[#6E675F] max-w-xl mt-0.5">
              Cadastre logins e senhas para novos corretores e envie as instruções de acesso
              diretamente no WhatsApp com 1 clique.
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-11 bg-[#C2501A] hover:bg-[#A84415] text-white font-semibold rounded-xl shadow-sm hover-lift flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Corretor
        </Button>
      </div>

      {/* Barra de Filtro e Totalizadores */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E6DFD6] shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Buscar por nome, e-mail ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 border-[#E6DFD6]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#6E675F]">
          <span className="font-semibold text-[#2E2A25]">{corretoresFiltrados.length}</span>
          <span>
            {corretoresFiltrados.length === 1 ? 'corretor cadastrado' : 'corretores cadastrados'}
          </span>
        </div>
      </div>

      {/* Lista de Corretores */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-[#E6DFD6] p-12 text-center text-[#6E675F]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#C2501A]" />
          <p className="text-sm">Carregando corretores cadastrados...</p>
        </div>
      ) : corretoresFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6DFD6] p-12 text-center">
          <UserCheck className="w-12 h-12 text-[#6E675F]/30 mx-auto mb-3" />
          <p className="font-bold text-[#2E2A25] text-base">Nenhum corretor encontrado</p>
          <p className="text-xs text-[#6E675F] mt-1 mb-4">
            Cadastre os corretores da equipe para que eles acessem o simulador e enviem propostas.
          </p>
          <Button
            onClick={handleOpenCreate}
            className="bg-[#C2501A] hover:bg-[#A84415] text-white text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Cadastrar Primeiro Corretor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {corretoresFiltrados.map((corretor) => {
            const isMaster = corretor.role === 'master' || corretor.email === 'gabsilvio@gmail.com'
            const isSelf = corretor.id === currentUser?.id

            return (
              <div
                key={corretor.id}
                className="bg-white rounded-2xl p-5 border border-[#E6DFD6] shadow-sm flex flex-col justify-between hover-lift transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl ${
                          isMaster ? 'bg-[#C2501A] text-white' : 'bg-[#4A7C59]/10 text-[#4A7C59]'
                        } flex items-center justify-center font-bold text-base shrink-0 shadow-sm`}
                      >
                        {corretor.name ? corretor.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-[#2E2A25]">
                            {corretor.name}
                          </h4>
                          {isSelf && (
                            <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-medium">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isMaster ? (
                            <span className="text-[10px] bg-orange-100 text-[#C2501A] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Master
                            </span>
                          ) : (
                            <span className="text-[10px] bg-[#4A7C59]/10 text-[#4A7C59] font-semibold px-2 py-0.5 rounded-full">
                              Corretor
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#6E675F] bg-[#FAF7F2] p-3 rounded-xl border border-[#E6DFD6]/60">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#C2501A] shrink-0" />
                      <span className="font-medium text-[#2E2A25] truncate">{corretor.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
                      <span>{corretor.telefone || 'Sem WhatsApp informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Ações do Corretor */}
                <div className="pt-4 mt-4 border-t border-[#E6DFD6] flex flex-wrap items-center justify-between gap-2">
                  {/* Botão Enviar WhatsApp */}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenSendWhatsApp(corretor)}
                    className="h-9 px-3 text-xs bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Enviar Acesso por WhatsApp
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* Botão Redefinir Senha */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setResettingUser(corretor)
                        setNewPassword('')
                      }}
                      className="h-9 px-2.5 text-xs border-[#E6DFD6] text-[#6E675F] hover:text-[#2E2A25] hover:bg-[#FAF7F2] rounded-xl flex items-center gap-1"
                      title="Redefinir Senha de Acesso"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Nova Senha</span>
                    </Button>

                    {/* Botão Excluir (apenas se não for o master nem ele mesmo) */}
                    {!isMaster && !isSelf && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingBroker(corretor)}
                        className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                        title="Remover Acesso do Corretor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal 1: Cadastrar Corretor */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E6DFD6]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2E2A25] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#C2501A]" />
              Cadastrar Novo Corretor
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6E675F]">
              Defina o login e senha de acesso. Em seguida você poderá encaminhar tudo pronto por
              WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCorretor} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="formName" className="text-xs font-semibold text-[#6E675F]">
                Nome Completo do Corretor <span className="text-[#C2501A]">*</span>
              </Label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="formName"
                  required
                  placeholder="Ex: João Pedro Silveira"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="pl-9 border-[#E6DFD6]"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="formEmail" className="text-xs font-semibold text-[#6E675F]">
                E-mail de Login <span className="text-[#C2501A]">*</span>
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="formEmail"
                  type="email"
                  required
                  placeholder="joao.silveira@exemplo.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="pl-9 border-[#E6DFD6]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="formTelefone" className="text-xs font-semibold text-[#6E675F]">
                WhatsApp do Corretor (com DDD)
              </Label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="formTelefone"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(aplicarMascaraTelefone(e.target.value))}
                  className="pl-9 border-[#E6DFD6]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="formPassword" className="text-xs font-semibold text-[#6E675F]">
                  Senha Provisória ou Definitiva <span className="text-[#C2501A]">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-[#C2501A] hover:underline font-semibold"
                >
                  Gerar Senha Forte
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="formPassword"
                  type="text"
                  required
                  placeholder="Mínimo 8 caracteres (ex: Skip@123)"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="pl-9 border-[#E6DFD6] font-mono"
                />
              </div>
              <p className="text-[11px] text-[#6E675F]">
                Esta senha será enviada diretamente na mensagem do WhatsApp do corretor.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="border-[#E6DFD6]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-[#C2501A] hover:bg-[#A84415] text-white"
              >
                {isCreating ? 'Cadastrando...' : 'Cadastrar Corretor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Corretor Criado com Sucesso -> Botão de Enviar WhatsApp Imediato */}
      <Dialog
        open={!!createdBrokerInfo}
        onOpenChange={(open) => !open && setCreatedBrokerInfo(null)}
      >
        <DialogContent className="max-w-md bg-white border-[#E6DFD6]">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#4A7C59] flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-[#2E2A25]">
              Corretor Cadastrado com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-[#6E675F]">
              Envie agora mesmo as credenciais de acesso para {createdBrokerInfo?.nome} via
              WhatsApp.
            </DialogDescription>
          </DialogHeader>

          {createdBrokerInfo && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E6DFD6] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6E675F]">Corretor:</span>
                  <span className="font-bold text-[#2E2A25]">{createdBrokerInfo.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E675F]">E-mail de Login:</span>
                  <span className="font-mono font-semibold text-[#2E2A25]">
                    {createdBrokerInfo.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E675F]">Senha:</span>
                  <span className="font-mono font-bold text-[#C2501A] bg-orange-100 px-1.5 py-0.5 rounded">
                    {createdBrokerInfo.senha}
                  </span>
                </div>
                {createdBrokerInfo.telefone && (
                  <div className="flex justify-between">
                    <span className="text-[#6E675F]">WhatsApp:</span>
                    <span className="font-medium text-[#2E2A25]">{createdBrokerInfo.telefone}</span>
                  </div>
                )}
              </div>

              {/* Se não tiver telefone, permite informar agora */}
              {!createdBrokerInfo.telefone && (
                <div className="space-y-1.5">
                  <Label htmlFor="whatsSuccess" className="text-xs font-semibold text-[#6E675F]">
                    Número do WhatsApp (com DDD):
                  </Label>
                  <Input
                    id="whatsSuccess"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={brokerTelInput}
                    onChange={(e) => setBrokerTelInput(aplicarMascaraTelefone(e.target.value))}
                    className="border-[#E6DFD6]"
                  />
                </div>
              )}

              <Button
                type="button"
                onClick={() => {
                  const tel = createdBrokerInfo.telefone || brokerTelInput
                  const msg = gerarMensagemAcessoCorretor({
                    nome: createdBrokerInfo.nome,
                    email: createdBrokerInfo.email,
                    senha: createdBrokerInfo.senha,
                    appUrl: window.location.origin,
                  })
                  abrirWhatsApp(tel, msg)
                  setCreatedBrokerInfo(null)
                  setBrokerTelInput('')
                }}
                className="w-full h-12 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <Share2 className="w-5 h-5" />
                Enviar Credenciais no WhatsApp Agora
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreatedBrokerInfo(null)
                setBrokerTelInput('')
              }}
              className="w-full text-xs text-[#6E675F]"
            >
              Concluir sem enviar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Redefinir Senha do Corretor */}
      <Dialog open={!!resettingUser} onOpenChange={(open) => !open && setResettingUser(null)}>
        <DialogContent className="max-w-md bg-white border-[#E6DFD6]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#2E2A25] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#C2501A]" />
              Redefinir Senha de Acesso
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6E675F]">
              Defina a nova senha para {resettingUser?.name} ({resettingUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmResetPassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-semibold text-[#6E675F]">
                Nova Senha <span className="text-[#C2501A]">*</span>
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="newPassword"
                  type="text"
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9 border-[#E6DFD6] font-mono"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-[#6E675F]">
                Após salvar, o sistema abrirá o WhatsApp para você encaminhar a nova senha ao
                corretor.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResettingUser(null)}
                className="border-[#E6DFD6]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isResetting || newPassword.length < 8}
                className="bg-[#C2501A] hover:bg-[#A84415] text-white"
              >
                {isResetting ? 'Salvando...' : 'Salvar Nova Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Enviar WhatsApp para Corretor Existente */}
      <Dialog open={!!whatsappBroker} onOpenChange={(open) => !open && setWhatsappBroker(null)}>
        <DialogContent className="max-w-md bg-white border-[#E6DFD6]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#2E2A25] flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#25D366]" />
              Enviar Dados de Acesso no WhatsApp
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6E675F]">
              Envie mensagem profissional com o link do sistema e as instruções de login para{' '}
              {whatsappBroker?.name}.
            </DialogDescription>
          </DialogHeader>

          {whatsappBroker && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E6DFD6] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6E675F]">Corretor:</span>
                  <span className="font-bold text-[#2E2A25]">{whatsappBroker.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E675F]">Login (E-mail):</span>
                  <span className="font-semibold text-[#2E2A25]">{whatsappBroker.email}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brokerTel" className="text-xs font-semibold text-[#6E675F]">
                  WhatsApp do Corretor (com DDD) <span className="text-[#C2501A]">*</span>
                </Label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="brokerTel"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={brokerTelInput}
                    onChange={(e) => setBrokerTelInput(aplicarMascaraTelefone(e.target.value))}
                    className="pl-9 border-[#E6DFD6] font-medium"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brokerPwd" className="text-xs font-semibold text-[#6E675F]">
                  Senha a ser informada na mensagem
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="brokerPwd"
                    type="text"
                    placeholder="Ex: Skip@Pass (ou deixe em branco para 'Sua senha cadastrada')"
                    value={brokerPasswordInput}
                    onChange={(e) => setBrokerPasswordInput(e.target.value)}
                    className="pl-9 border-[#E6DFD6] font-mono text-sm"
                  />
                </div>
                <p className="text-[11px] text-[#6E675F]">
                  Por segurança de criptografia do PocketBase, você pode redigitar a senha definida
                  para que apareça no WhatsApp.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setWhatsappBroker(null)}
              className="border-[#E6DFD6]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSendWhatsApp}
              className="bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center gap-1.5 font-semibold"
            >
              <Share2 className="w-4 h-4" />
              Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 5: Deletar Corretor */}
      <Dialog open={!!deletingBroker} onOpenChange={(open) => !open && setDeletingBroker(null)}>
        <DialogContent className="max-w-sm bg-white border-[#E6DFD6]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#C0392B]">
              Remover Corretor?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6E675F]">
              Tem certeza de que deseja revogar o acesso de {deletingBroker?.name}? O login deste
              usuário será desativado imediatamente.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingBroker(null)}
              className="border-[#E6DFD6]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-[#C0392B] hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Removendo...' : 'Confirmar Remoção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
