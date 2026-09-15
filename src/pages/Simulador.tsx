import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Printer,
  Save,
  Calculator,
  UserPlus,
  Info,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Maximize2,
  User,
  Share2,
  Phone,
} from 'lucide-react'
import { useConfig } from '@/context/ConfigContext'
import { useAuth } from '@/context/AuthContext'
import {
  gerarMensagemPropostaWhatsApp,
  abrirWhatsApp,
  aplicarMascaraTelefone,
  formatarNumeroWhatsapp,
} from '@/lib/whatsapp'
import { lotesService } from '@/services/lotes'
import { clientesService } from '@/services/clientes'
import { propostasService } from '@/services/propostas'
import { useRealtime } from '@/hooks/use-realtime'
import type { LoteRecord, ClienteRecord, QuadraValida } from '@/types/database'
import { QUADRAS_VALIDAS } from '@/types/database'
import { formatarMoeda, formatarNumero, calcularFinanciamento } from '@/lib/calculo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export default function Simulador() {
  const { config } = useConfig()
  const { user } = useAuth()
  const { toast } = useToast()
  const resultsRef = useRef<HTMLDivElement>(null)

  // Modal WhatsApp de Proposta
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false)
  const [whatsAppTelefone, setWhatsAppTelefone] = useState(() => {
    try {
      return localStorage.getItem('last_whatsapp_tel') || ''
    } catch {
      return ''
    }
  })

  // Modo de entrada da área: 'dimensoes' (Frente x Lateral) ou 'area_total' (Área total direta)
  const [modoArea, setModoArea] = useState<'dimensoes' | 'area_total'>(() => {
    try {
      const salvo = sessionStorage.getItem('simulador_modo_area')
      return salvo === 'area_total' ? 'area_total' : 'dimensoes'
    } catch {
      return 'dimensoes'
    }
  })

  // Salva no sessionStorage quando o corretor altera o modo
  useEffect(() => {
    try {
      sessionStorage.setItem('simulador_modo_area', modoArea)
    } catch {
      // sessionStorage pode falhar em modo restrito
    }
  }, [modoArea])

  // Estados dos inputs do formulário
  const [quadra, setQuadra] = useState<QuadraValida>('S1')
  const [loteIdentificador, setLoteIdentificador] = useState('')
  const [largura, setLargura] = useState<number>(12)
  const [comprimento, setComprimento] = useState<number>(25)
  const [areaTotalManual, setAreaTotalManual] = useState<number>(300)
  const [valorM2, setValorM2] = useState<number>(450)
  const [entrada, setEntrada] = useState<number>(20000)
  const [numParcelas, setNumParcelas] = useState<number>(48)
  const [isCustomParcelas, setIsCustomParcelas] = useState(false)

  // Listas de lotes e clientes do banco para facilitar seleção
  const [lotes, setLotes] = useState<LoteRecord[]>([])
  const [clientes, setClientes] = useState<ClienteRecord[]>([])
  const [selectedClienteId, setSelectedClienteId] = useState<string>('none')
  const [selectedLoteId, setSelectedLoteId] = useState<string>('none')

  // Modal para salvar proposta
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Modal para criar cliente rápido
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false)
  const [newClientNome, setNewClientNome] = useState('')
  const [newClientTelefone, setNewClientTelefone] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  // Atualiza os valores padrão quando a configuração carrega/muda
  useEffect(() => {
    if (config) {
      setValorM2((prev) => (prev === 450 ? config.valor_m2 : prev))
      setEntrada((prev) => (prev === 20000 ? config.entrada_minima : prev))
    }
  }, [config])

  // Busca lotes e clientes
  useEffect(() => {
    lotesService
      .getAll()
      .then(setLotes)
      .catch(() => {})
    clientesService
      .getAll()
      .then(setClientes)
      .catch(() => {})
  }, [])

  // Sincroniza em tempo real
  useRealtime<LoteRecord>('lotes', () => {
    lotesService
      .getAll()
      .then(setLotes)
      .catch(() => {})
  })
  useRealtime<ClienteRecord>('clientes', () => {
    clientesService
      .getAll()
      .then(setClientes)
      .catch(() => {})
  })

  // Se o corretor escolher um lote existente da lista
  const handleSelectLote = (loteId: string) => {
    setSelectedLoteId(loteId)
    if (loteId === 'none') return
    const lote = lotes.find((l) => l.id === loteId)
    if (lote) {
      if (QUADRAS_VALIDAS.includes(lote.quadra as QuadraValida)) {
        setQuadra(lote.quadra as QuadraValida)
      }
      setLoteIdentificador(lote.nome || '')
      setLargura(lote.largura)
      setComprimento(lote.comprimento)
      setAreaTotalManual(Math.round(lote.largura * lote.comprimento * 100) / 100)
    }
  }

  // Limite máximo de parcelas da quadra atual
  const maxParcelasPermitidas = useMemo(() => {
    // As quadras S1, T1, U1, V1, W1, Y1 podem ser parceladas em até 48 meses
    if (['S1', 'T1', 'U1', 'V1', 'W1', 'Y1'].includes(quadra)) {
      return config?.max_parcelas || 48
    }
    return config?.max_parcelas || 48
  }, [quadra, config])

  // Validações
  const entradaMinima = config?.entrada_minima || 20000
  const isEntradaValida = entrada >= entradaMinima
  const isParcelasValida = numParcelas >= 1 && numParcelas <= maxParcelasPermitidas
  const isAreaValida =
    modoArea === 'area_total' ? areaTotalManual > 0 : largura > 0 && comprimento > 0

  // Cálculo da simulação
  const simulacao = useMemo(() => {
    const fatores = {
      fator_24: config?.fator_24 || 0.0470735,
      fator_36: config?.fator_36 || 0.0332143,
      fator_48: config?.fator_48 || 0.0263338,
    }
    const ipca = config?.ipca_anual || 4.5

    if (modoArea === 'area_total') {
      return calcularFinanciamento({
        areaM2: areaTotalManual || 0,
        valorM2: valorM2 || 0,
        entrada: entrada || 0,
        numParcelas: Math.max(1, Math.min(numParcelas || 1, maxParcelasPermitidas)),
        fatores,
        ipcaAnual: ipca,
      })
    }

    return calcularFinanciamento({
      largura: largura || 0,
      comprimento: comprimento || 0,
      valorM2: valorM2 || 0,
      entrada: entrada || 0,
      numParcelas: Math.max(1, Math.min(numParcelas || 1, maxParcelasPermitidas)),
      fatores,
      ipcaAnual: ipca,
    })
  }, [
    modoArea,
    areaTotalManual,
    largura,
    comprimento,
    valorM2,
    entrada,
    numParcelas,
    maxParcelasPermitidas,
    config,
  ])

  const handleChipClick = (parcelas: number) => {
    setNumParcelas(parcelas)
    setIsCustomParcelas(false)
  }

  const handleCustomParcelasChange = (val: number) => {
    setNumParcelas(val)
    setIsCustomParcelas(true)
  }

  // Rolar suavemente para resultados no mobile
  const handleCalcular = () => {
    if (window.innerWidth < 768 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' })
    }
    toast({
      title: 'Cálculo atualizado',
      description: `Parcela mensal de ${formatarMoeda(simulacao.parcelaMensal)} em ${numParcelas}x`,
    })
  }

  // Imprimir Proposta
  const handleImprimir = () => {
    window.print()
  }

  // Abrir Modal de Envio por WhatsApp
  const handleOpenWhatsApp = () => {
    if (!isEntradaValida || !isParcelasValida || !isAreaValida) {
      toast({
        variant: 'destructive',
        title: 'Verifique os dados',
        description:
          modoArea === 'area_total'
            ? 'Preencha valores válidos de entrada, área total e parcelas antes de enviar a proposta.'
            : 'Preencha valores válidos de entrada, dimensões e parcelas antes de enviar a proposta.',
      })
      return
    }

    // Se houver cliente selecionado com telefone, preenche automaticamente
    const clienteObj = clientes.find((c) => c.id === selectedClienteId)
    if (clienteObj?.telefone) {
      setWhatsAppTelefone(clienteObj.telefone)
    }
    setIsWhatsAppModalOpen(true)
  }

  // Confirmar e Enviar Proposta por WhatsApp
  const handleConfirmEnviarWhatsApp = () => {
    const rawDigits = formatarNumeroWhatsapp(whatsAppTelefone)
    if (!rawDigits || rawDigits.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Telefone inválido',
        description: 'Digite o telefone do cliente com DDD (ex: 11 99999-9999).',
      })
      return
    }

    // Grava último telefone no localStorage
    try {
      localStorage.setItem('last_whatsapp_tel', whatsAppTelefone)
    } catch {
      /* intentionally ignored */
    }

    const clienteObj = clientes.find((c) => c.id === selectedClienteId)
    const msg = gerarMensagemPropostaWhatsApp({
      clienteNome: clienteObj?.nome,
      quadra,
      loteIdentificador,
      modoArea,
      largura,
      comprimento,
      areaM2: simulacao.areaM2,
      valorM2,
      valorTotalLote: simulacao.valorTotalLote,
      entrada: simulacao.entrada,
      valorFinanciado: simulacao.valorFinanciado,
      numParcelas: simulacao.numParcelas,
      parcelaMensal: simulacao.parcelaMensal,
      ipcaAnual: simulacao.ipcaAnual,
      corretorNome: user?.name,
    })

    abrirWhatsApp(whatsAppTelefone, msg)
    setIsWhatsAppModalOpen(false)
    toast({
      title: 'WhatsApp aberto com sucesso!',
      description: 'A proposta formatada foi encaminhada para a conversa.',
    })
  }

  // Abrir Modal de Salvar
  const handleOpenSalvar = () => {
    if (!isEntradaValida || !isParcelasValida || !isAreaValida) {
      toast({
        variant: 'destructive',
        title: 'Verifique os dados',
        description:
          modoArea === 'area_total'
            ? 'Preencha valores válidos de entrada, área total e parcelas antes de salvar.'
            : 'Preencha valores válidos de entrada, dimensões e parcelas antes de salvar.',
      })
      return
    }
    setIsSaveModalOpen(true)
  }

  // Confirmar Salvamento da Proposta
  const handleConfirmSalvar = async () => {
    setIsSaving(true)
    try {
      await propostasService.create({
        cliente: selectedClienteId !== 'none' ? selectedClienteId : undefined,
        lote: selectedLoteId !== 'none' ? selectedLoteId : undefined,
        quadra,
        area_m2: simulacao.areaM2,
        valor_m2: valorM2,
        valor_total_lote: simulacao.valorTotalLote,
        entrada: simulacao.entrada,
        valor_financiado: simulacao.valorFinanciado,
        num_parcelas: simulacao.numParcelas,
        parcela_mensal: simulacao.parcelaMensal,
        ipca_anual: simulacao.ipcaAnual,
      })

      toast({
        title: 'Proposta salva com sucesso!',
        description: `Proposta para Quadra ${quadra} registrada no sistema.`,
      })
      setIsSaveModalOpen(false)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar proposta',
        description: 'Tente novamente ou verifique os dados informados.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Criar cliente rápido
  const handleQuickCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClientNome.trim()) return

    setIsCreatingClient(true)
    try {
      const novo = await clientesService.create({
        nome: newClientNome.trim(),
        telefone: newClientTelefone.trim() || undefined,
        email: newClientEmail.trim() || undefined,
      })
      setClientes((prev) => [...prev, novo])
      setSelectedClienteId(novo.id)
      setIsNewClientModalOpen(false)
      setNewClientNome('')
      setNewClientTelefone('')
      setNewClientEmail('')
      toast({
        title: 'Cliente cadastrado!',
        description: `${novo.nome} foi vinculado à proposta.`,
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar cliente',
        description: 'Verifique os dados informados.',
      })
    } finally {
      setIsCreatingClient(false)
    }
  }

  const clienteSelecionadoObj = clientes.find((c) => c.id === selectedClienteId)

  return (
    <div className="space-y-6">
      {/* Visualização de Impressão (aparece apenas ao imprimir) */}
      <div className="hidden print:block proposal-print-card bg-white p-8 rounded-none border border-neutral-300">
        <div className="border-b border-neutral-300 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Loteamento Jardim Europa</h1>
            <p className="text-sm text-neutral-600">Proposta Comercial de Venda e Financiamento</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-neutral-800">
              Data: {new Date().toLocaleDateString('pt-BR')}
            </p>
            <p className="text-xs text-neutral-500">
              Corretor: {user?.name || user?.email || 'gabsilvio@gmail.com'}
            </p>
          </div>
        </div>

        {clienteSelecionadoObj && (
          <div className="bg-neutral-50 p-4 rounded-lg mb-6 border border-neutral-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Dados do Proponente / Cliente
            </h2>
            <p className="text-base font-bold text-neutral-900">{clienteSelecionadoObj.nome}</p>
            <div className="text-sm text-neutral-600 flex gap-6 mt-1">
              {clienteSelecionadoObj.telefone && (
                <span>Telefone: {clienteSelecionadoObj.telefone}</span>
              )}
              {clienteSelecionadoObj.email && <span>E-mail: {clienteSelecionadoObj.email}</span>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-neutral-200 p-4 rounded-lg">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
              Identificação do Lote
            </h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Quadra:</span>
                <span className="font-bold text-neutral-900">{quadra}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Lote:</span>
                <span className="font-semibold text-neutral-900">
                  {loteIdentificador || 'A definir'}
                </span>
              </div>
              {modoArea === 'dimensoes' ? (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Dimensões:</span>
                  <span className="font-semibold text-neutral-900">
                    {formatarNumero(largura, 1)}m × {formatarNumero(comprimento, 1)}m
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Tipo do Lote:</span>
                  <span className="font-semibold text-neutral-900">
                    Irregular (Área Total Direta)
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-600">Área Total:</span>
                <span className="font-bold text-neutral-900">
                  {formatarNumero(simulacao.areaM2)} m²
                </span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-1.5">
                <span className="text-neutral-600">Valor do m²:</span>
                <span className="font-semibold text-neutral-900">{formatarMoeda(valorM2)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-neutral-800">Valor Total do Lote:</span>
                <span className="font-bold text-lg text-neutral-900">
                  {formatarMoeda(simulacao.valorTotalLote)}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-neutral-200 p-4 rounded-lg bg-neutral-50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
              Condições de Pagamento
            </h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Entrada (à vista):</span>
                <span className="font-bold text-neutral-900">
                  {formatarMoeda(simulacao.entrada)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Saldo Financiado:</span>
                <span className="font-semibold text-neutral-900">
                  {formatarMoeda(simulacao.valorFinanciado)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Número de Parcelas:</span>
                <span className="font-bold text-neutral-900">{simulacao.numParcelas} meses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Fator de Correção:</span>
                <span className="font-mono text-xs text-neutral-700">
                  {simulacao.fatorAplicado.toFixed(7)}
                </span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2">
                <span className="font-bold text-neutral-800">Parcela Mensal:</span>
                <span className="font-extrabold text-xl text-neutral-900">
                  {formatarMoeda(simulacao.parcelaMensal)}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-neutral-600">Total Financiado:</span>
                <span className="font-semibold text-neutral-900">
                  {formatarMoeda(simulacao.valorTotalFinanciado)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-xs text-neutral-700 mb-8 space-y-1">
          <p className="font-bold text-neutral-900">Observações Contratuais:</p>
          <p>
            • O valor da parcela mensal será corrigido anualmente pelo índice IPCA (
            {formatarNumero(simulacao.ipcaAnual, 2)}% a.a.) conforme cláusula contratual.
          </p>
          <p>
            • Proposta sujeita à análise de crédito e disponibilidade do lote na data de assinatura.
          </p>
          <p>• Quadras S1, T1, U1, V1, W1, Y1 parceláveis em até 48 meses.</p>
        </div>

        <div className="grid grid-cols-2 gap-12 pt-10 text-center text-xs">
          <div>
            <div className="border-t border-neutral-400 pt-2 font-medium">
              Assinatura do Corretor Credenciado
            </div>
          </div>
          <div>
            <div className="border-t border-neutral-400 pt-2 font-medium">
              Assinatura do Proponente Comprador
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal do Simulador (2 colunas no desktop, empilhada no mobile) */}
      <div className="print-hide grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Formulário de Entrada (5 ou 6 colunas) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#E6DFD6] space-y-5">
          <div className="flex items-center justify-between border-b border-[#E6DFD6] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#C2501A]/10 text-[#C2501A] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#2E2A25] text-base">Parâmetros do Lote</h3>
                <p className="text-xs text-[#6E675F]">Selecione a quadra e dimensões</p>
              </div>
            </div>

            {/* Atalho para carregar lote pré-cadastrado se desejar */}
            {lotes.length > 0 && (
              <div className="w-40 sm:w-48">
                <Select value={selectedLoteId} onValueChange={handleSelectLote}>
                  <SelectTrigger className="h-8 text-xs border-[#E6DFD6]">
                    <SelectValue placeholder="Carregar lote salvo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Novo Lote Livre</SelectItem>
                    {lotes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.quadra} - {l.nome || `${l.largura}x${l.comprimento}m`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quadra */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#6E675F]">
                Quadra <span className="text-[#C2501A]">*</span>
              </Label>
              <Select value={quadra} onValueChange={(val: QuadraValida) => setQuadra(val)}>
                <SelectTrigger className="h-10 border-[#E6DFD6] font-medium">
                  <SelectValue placeholder="Selecione a quadra" />
                </SelectTrigger>
                <SelectContent>
                  {QUADRAS_VALIDAS.map((q) => (
                    <SelectItem key={q} value={q}>
                      Quadra {q} (até 48x)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lote (Texto opcional) */}
            <div className="space-y-1.5">
              <Label htmlFor="lote" className="text-xs font-semibold text-[#6E675F]">
                Lote (identificador)
              </Label>
              <Input
                id="lote"
                type="text"
                value={loteIdentificador}
                onChange={(e) => setLoteIdentificador(e.target.value)}
                placeholder="Ex: Lote 12"
                className="h-10 border-[#E6DFD6]"
              />
            </div>
          </div>

          {/* Seletor de Modo de Área: Frente x Lateral vs Área Total (Irregulares) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#6E675F]">
                Forma de Cálculo da Área
              </Label>
              <span className="text-[11px] text-[#C2501A] font-medium">
                {modoArea === 'area_total' ? 'Lote Irregular' : 'Lote Regular'}
              </span>
            </div>
            <div className="grid grid-cols-2 p-1 bg-[#FAF7F2] border border-[#E6DFD6] rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setModoArea('dimensoes')
                  // Sincroniza se a área manual estava em uso
                  if (largura > 0 && comprimento > 0) {
                    setAreaTotalManual(Math.round(largura * comprimento * 100) / 100)
                  }
                }}
                className={`py-2 px-3 rounded-lg transition-all text-center ${
                  modoArea === 'dimensoes'
                    ? 'bg-white text-[#C2501A] shadow-sm font-bold border border-[#E6DFD6]'
                    : 'text-[#6E675F] hover:text-[#2E2A25]'
                }`}
              >
                Frente × Lateral
              </button>
              <button
                type="button"
                onClick={() => {
                  setModoArea('area_total')
                  // Garante valor coerente para a área manual inicial
                  if (simulacao.areaM2 > 0) {
                    setAreaTotalManual(simulacao.areaM2)
                  }
                }}
                className={`py-2 px-3 rounded-lg transition-all text-center ${
                  modoArea === 'area_total'
                    ? 'bg-white text-[#C2501A] shadow-sm font-bold border border-[#E6DFD6]'
                    : 'text-[#6E675F] hover:text-[#2E2A25]'
                }`}
              >
                Área Total (m²)
              </button>
            </div>
          </div>

          {/* Campos de Dimensões / Área dependendo do modo selecionado */}
          {modoArea === 'dimensoes' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="largura" className="text-xs font-semibold text-[#6E675F]">
                  Largura / Frente (m)
                </Label>
                <Input
                  id="largura"
                  type="number"
                  step="0.1"
                  min="0"
                  value={largura || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setLargura(val)
                    setAreaTotalManual(Math.round(val * comprimento * 100) / 100)
                  }}
                  className="h-10 border-[#E6DFD6] tabular-nums"
                  placeholder="Ex: 12"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comprimento" className="text-xs font-semibold text-[#6E675F]">
                  Comprimento (m)
                </Label>
                <Input
                  id="comprimento"
                  type="number"
                  step="0.1"
                  min="0"
                  value={comprimento || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setComprimento(val)
                    setAreaTotalManual(Math.round(largura * val * 100) / 100)
                  }}
                  className="h-10 border-[#E6DFD6] tabular-nums"
                  placeholder="Ex: 25"
                />
              </div>

              {/* Área Computada */}
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <Label className="text-xs font-semibold text-[#6E675F]">Área Calculada</Label>
                <div className="h-10 px-3 bg-[#FAF7F2] border border-[#E6DFD6] rounded-md flex items-center justify-between font-bold text-[#2E2A25] tabular-nums text-sm">
                  <span>{formatarNumero(simulacao.areaM2)}</span>
                  <span className="text-[11px] font-normal text-[#6E675F]">m²</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="areaTotalManual" className="text-xs font-semibold text-[#6E675F]">
                  Área Total do Lote (m²) <span className="text-[#C2501A]">*</span>
                </Label>
                <span className="text-[11px] text-[#6E675F]">Para lotes irregulares</span>
              </div>
              <div className="relative">
                <Input
                  id="areaTotalManual"
                  type="number"
                  step="0.01"
                  min="1"
                  value={areaTotalManual || ''}
                  onChange={(e) => setAreaTotalManual(parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 342.50"
                  className={`h-10 border-[#E6DFD6] font-bold tabular-nums pr-12 ${
                    areaTotalManual <= 0 ? 'border-red-500' : ''
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6E675F] pointer-events-none">
                  m²
                </span>
              </div>
              <p className="text-[11px] text-[#6E675F]">
                Informe a metragem total diretamente conforme a matrícula / planta do lote
                irregular.
              </p>
            </div>
          )}

          {/* Valores Financeiros: Valor do m² e Valor Total Computado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E6DFD6]">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="valorM2" className="text-xs font-semibold text-[#6E675F]">
                  Valor do m² (R$)
                </Label>
                <span className="text-[10px] text-[#4A7C59] bg-[#4A7C59]/10 px-1.5 py-0.5 rounded font-medium">
                  Editável
                </span>
              </div>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="valorM2"
                  type="number"
                  step="1"
                  min="1"
                  value={valorM2 || ''}
                  onChange={(e) => setValorM2(parseFloat(e.target.value) || 0)}
                  className="pl-9 h-10 border-[#E6DFD6] font-semibold tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#6E675F]">Valor Total do Lote</Label>
              <div className="h-10 px-3.5 bg-[#FAF7F2] border border-[#E6DFD6] rounded-md flex items-center font-bold text-[#C2501A] tabular-nums text-base">
                {formatarMoeda(simulacao.valorTotalLote)}
              </div>
            </div>
          </div>

          {/* Entrada (R$) */}
          <div className="space-y-1.5 pt-2 border-t border-[#E6DFD6]">
            <div className="flex items-center justify-between">
              <Label htmlFor="entrada" className="text-xs font-semibold text-[#6E675F]">
                Entrada (R$)
              </Label>
              <span className="text-[11px] text-[#6E675F]">
                Mínimo: {formatarMoeda(entradaMinima)}
              </span>
            </div>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="entrada"
                type="number"
                step="500"
                min={entradaMinima}
                value={entrada || ''}
                onChange={(e) => setEntrada(parseFloat(e.target.value) || 0)}
                className={`pl-9 h-10 font-semibold tabular-nums ${
                  !isEntradaValida
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'border-[#E6DFD6]'
                }`}
              />
            </div>
            {!isEntradaValida && (
              <p className="text-xs text-[#C0392B] flex items-center gap-1 font-medium mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Entrada deve ser no mínimo {formatarMoeda(entradaMinima)}
              </p>
            )}
          </div>

          {/* Nº de Parcelas (Chips rápidos + input livre 1 a 48) */}
          <div className="space-y-2 pt-2 border-t border-[#E6DFD6]">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#6E675F]">Número de Parcelas</Label>
              <span className="text-[11px] text-[#4A7C59] font-medium">
                Até {maxParcelasPermitidas} meses
              </span>
            </div>

            {/* Chips Rápidos 24, 36, 48 */}
            <div className="grid grid-cols-4 gap-2">
              {[24, 36, 48].map((parcelaOption) => {
                const isSelected = numParcelas === parcelaOption && !isCustomParcelas
                return (
                  <button
                    key={parcelaOption}
                    type="button"
                    onClick={() => handleChipClick(parcelaOption)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'bg-[#C2501A] border-[#C2501A] text-white shadow-sm scale-102 ring-2 ring-[#C2501A]/20'
                        : 'bg-white border-[#E6DFD6] text-[#2E2A25] hover:border-[#C2501A]/50 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {parcelaOption}x
                  </button>
                )
              })}

              {/* Input Livre */}
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max={maxParcelasPermitidas}
                  value={numParcelas || ''}
                  onChange={(e) => handleCustomParcelasChange(parseInt(e.target.value, 10) || 1)}
                  placeholder="Livre"
                  className={`h-9 text-xs font-bold text-center border-[#E6DFD6] ${
                    isCustomParcelas ? 'border-[#C2501A] ring-1 ring-[#C2501A]' : ''
                  }`}
                />
              </div>
            </div>
            {!isParcelasValida && (
              <p className="text-xs text-[#C0392B] flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Nº de parcelas deve ser entre 1 e {maxParcelasPermitidas}
              </p>
            )}
          </div>

          {/* Botão Calcular */}
          <Button
            type="button"
            onClick={handleCalcular}
            disabled={!isEntradaValida || !isParcelasValida || !isAreaValida}
            className="w-full h-11 bg-[#C2501A] hover:bg-[#A84415] text-white font-semibold text-sm rounded-xl shadow-sm hover-lift flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Recalcular Financiamento
          </Button>
        </div>

        {/* Coluna Direita: Painel de Resultados (6 ou 7 colunas) */}
        <div ref={resultsRef} className="lg:col-span-6 space-y-5">
          {/* Card de Destaque da Parcela Mensal */}
          <div className="bg-gradient-to-br from-[#2E2A25] to-[#1E1B17] text-white rounded-2xl p-6 shadow-md border border-[#443E38] relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#C2501A]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block text-[10px] font-bold tracking-wider uppercase bg-[#C2501A] text-white px-2.5 py-1 rounded-full mb-2">
                  Parcela Mensal Estimada
                </span>
                <h4 className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white">
                  {formatarMoeda(simulacao.parcelaMensal)}
                </h4>
                <p className="text-xs text-[#E6DFD6]/80 mt-1">
                  {simulacao.numParcelas}x de {formatarMoeda(simulacao.parcelaMensal)} (sem correção
                  anual)
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#E6DFD6]/70 block">Fator Aplicado</span>
                <span className="font-mono text-xs font-semibold text-[#E6DFD6]">
                  {simulacao.fatorAplicado.toFixed(7)}
                </span>
              </div>
            </div>

            {/* Nota de Correção Anual IPCA */}
            <div className="mt-5 pt-4 border-t border-white/10 flex items-start gap-2.5 text-xs text-[#E6DFD6]/90">
              <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">
                  Correção anual pelo índice IPCA ({formatarNumero(simulacao.ipcaAnual, 2)}% a.a.)
                </p>
                <p className="text-[11px] text-[#E6DFD6]/70 mt-0.5">
                  O valor da parcela será corrigido anualmente pelo IPCA conforme contrato.
                </p>
              </div>
            </div>
          </div>

          {/* Cards de Resumo em Grid 2x2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card Resumo do Lote */}
            <div className="bg-white rounded-xl p-4 border border-[#E6DFD6] shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#6E675F] uppercase tracking-wider">
                <Maximize2 className="w-3.5 h-3.5 text-[#4A7C59]" />
                Resumo do Lote
              </div>
              <div className="space-y-1.5 text-sm pt-1">
                <div className="flex justify-between">
                  <span className="text-[#6E675F] text-xs">Área Total:</span>
                  <span className="font-bold tabular-nums text-[#2E2A25]">
                    {formatarNumero(simulacao.areaM2)} m²
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E675F] text-xs">Valor do m²:</span>
                  <span className="font-semibold tabular-nums text-[#2E2A25]">
                    {formatarMoeda(valorM2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#E6DFD6] pt-1">
                  <span className="text-[#2E2A25] font-semibold text-xs">Valor Total:</span>
                  <span className="font-bold text-[#C2501A] tabular-nums">
                    {formatarMoeda(simulacao.valorTotalLote)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Resumo do Pagamento */}
            <div className="bg-white rounded-xl p-4 border border-[#E6DFD6] shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#6E675F] uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-[#C2501A]" />
                Resumo do Pagamento
              </div>
              <div className="space-y-1.5 text-sm pt-1">
                <div className="flex justify-between">
                  <span className="text-[#6E675F] text-xs">Entrada à Vista:</span>
                  <span className="font-bold text-[#4A7C59] tabular-nums">
                    {formatarMoeda(simulacao.entrada)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E675F] text-xs">Saldo Financiado:</span>
                  <span className="font-bold text-[#2E2A25] tabular-nums">
                    {formatarMoeda(simulacao.valorFinanciado)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#E6DFD6] pt-1">
                  <span className="text-[#2E2A25] font-semibold text-xs">Total Financiado:</span>
                  <span className="font-bold text-[#2E2A25] tabular-nums">
                    {formatarMoeda(simulacao.valorTotalFinanciado)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Primeira Parcela e Total Geral */}
          <div className="bg-white rounded-xl p-4 border border-[#E6DFD6] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4A7C59]/10 text-[#4A7C59] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#6E675F] font-medium">Primeira Parcela</p>
                <p className="text-lg font-bold text-[#2E2A25] tabular-nums">
                  {formatarMoeda(simulacao.parcelaMensal)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-[#6E675F] font-medium">Total Geral (com entrada)</p>
              <p className="text-base font-bold text-[#C2501A] tabular-nums">
                {formatarMoeda(simulacao.totalPagoComEntrada)}
              </p>
            </div>
          </div>

          {/* Ações: WhatsApp, Imprimir Proposta e Salvar Proposta */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 h-11 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-sm rounded-xl shadow-sm hover-lift flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Enviar no WhatsApp
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleImprimir}
              className="flex-1 h-11 border-[#E6DFD6] bg-white hover:bg-[#FAF7F2] text-[#2E2A25] font-semibold text-sm rounded-xl hover-lift flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-[#6E675F]" />
              Imprimir
            </Button>

            <Button
              type="button"
              onClick={handleOpenSalvar}
              className="flex-1 h-11 bg-[#4A7C59] hover:bg-[#3d6749] text-white font-semibold text-sm rounded-xl shadow-sm hover-lift flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para Envio de Proposta por WhatsApp */}
      <Dialog open={isWhatsAppModalOpen} onOpenChange={setIsWhatsAppModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E6DFD6]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-[#2E2A25] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              Enviar Proposta no WhatsApp
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6E675F]">
              A proposta será montada com formato profissional, pronta para o cliente visualizar no
              WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Resumo do que será enviado */}
            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E6DFD6] space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#6E675F]">Imóvel:</span>
                <span className="font-bold text-[#2E2A25]">
                  Quadra {quadra} {loteIdentificador ? `• ${loteIdentificador}` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E675F]">Metragem:</span>
                <span className="font-semibold text-[#2E2A25]">
                  {modoArea === 'dimensoes'
                    ? `${formatarNumero(largura, 1)}m × ${formatarNumero(comprimento, 1)}m (${formatarNumero(simulacao.areaM2)} m²)`
                    : `${formatarNumero(simulacao.areaM2)} m² (Área Total)`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E675F]">Valor do m²:</span>
                <span className="font-semibold text-[#2E2A25]">{formatarMoeda(valorM2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E675F]">Valor Total do Lote:</span>
                <span className="font-bold text-[#2E2A25]">
                  {formatarMoeda(simulacao.valorTotalLote)}
                </span>
              </div>
              <div className="border-t border-[#E6DFD6] pt-1.5 flex justify-between items-center">
                <span className="text-[#6E675F]">Entrada:</span>
                <span className="font-bold text-[#4A7C59]">{formatarMoeda(simulacao.entrada)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E675F]">Parcelas:</span>
                <span className="font-bold text-[#C2501A]">
                  {simulacao.numParcelas}x de {formatarMoeda(simulacao.parcelaMensal)}
                </span>
              </div>
              {clienteSelecionadoObj && (
                <div className="border-t border-[#E6DFD6] pt-1.5 flex justify-between items-center">
                  <span className="text-[#6E675F]">Cliente destinatário:</span>
                  <span className="font-bold text-[#2E2A25]">{clienteSelecionadoObj.nome}</span>
                </div>
              )}
            </div>

            {/* Input do WhatsApp com máscara */}
            <div className="space-y-1.5">
              <Label
                htmlFor="whatsAppTelefone"
                className="text-xs font-semibold text-[#2E2A25] flex items-center justify-between"
              >
                <span>WhatsApp do Cliente (com DDD)</span>
                <span className="text-[11px] text-[#6E675F] font-normal">Ex: (11) 99999-9999</span>
              </Label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="whatsAppTelefone"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={whatsAppTelefone}
                  onChange={(e) => setWhatsAppTelefone(aplicarMascaraTelefone(e.target.value))}
                  className="pl-9 h-11 border-[#E6DFD6] font-medium"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-[#6E675F]">
                O sistema abrirá a conversa com a mensagem 100% pronta com entrada, metragem e valor
                de cada parcela.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWhatsAppModalOpen(false)}
              className="border-[#E6DFD6]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmEnviarWhatsApp}
              className="bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              Abrir no WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Vincular Cliente e Salvar Proposta */}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E6DFD6]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2E2A25] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#C2501A]" />
              Salvar Proposta Comercial
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6E675F]">
              Vincule a proposta a um cliente ou grave como pré-proposta para a Quadra {quadra}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Resumo da proposta */}
            <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E6DFD6] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6E675F]">Quadra / Lote:</span>
                <span className="font-bold text-[#2E2A25]">
                  {quadra} {loteIdentificador ? `- ${loteIdentificador}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E675F]">Área:</span>
                <span className="font-semibold text-[#2E2A25]">
                  {formatarNumero(simulacao.areaM2)} m²
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E675F]">Entrada + Financiado:</span>
                <span className="font-semibold text-[#2E2A25]">
                  {formatarMoeda(simulacao.entrada)} + {simulacao.numParcelas}x de{' '}
                  {formatarMoeda(simulacao.parcelaMensal)}
                </span>
              </div>
            </div>

            {/* Seleção do Cliente */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#6E675F]">
                  Cliente Proponente (opcional)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNewClientModalOpen(true)}
                  className="h-6 text-[11px] text-[#C2501A] hover:text-[#A84415] hover:bg-[#C2501A]/10 p-1"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />+ Novo Cliente
                </Button>
              </div>

              <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                <SelectTrigger className="border-[#E6DFD6]">
                  <SelectValue placeholder="Selecione um cliente (ou nenhum)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum cliente selecionado</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} {c.telefone ? `(${c.telefone})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSaveModalOpen(false)}
              className="border-[#E6DFD6]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSalvar}
              disabled={isSaving}
              className="bg-[#C2501A] hover:bg-[#A84415] text-white"
            >
              {isSaving ? 'Salvando...' : 'Confirmar e Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação Rápida de Cliente */}
      <Dialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E6DFD6]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#2E2A25] flex items-center gap-2">
              <User className="w-4 h-4 text-[#4A7C59]" />
              Cadastrar Novo Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6E675F]">
              Insira os dados do comprador para vincular imediatamente à proposta.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCreateCliente} className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="nomeCliente" className="text-xs font-semibold text-[#6E675F]">
                Nome Completo <span className="text-[#C2501A]">*</span>
              </Label>
              <Input
                id="nomeCliente"
                required
                value={newClientNome}
                onChange={(e) => setNewClientNome(e.target.value)}
                placeholder="Ex: Fernando de Oliveira"
                className="border-[#E6DFD6]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telCliente" className="text-xs font-semibold text-[#6E675F]">
                Telefone / WhatsApp
              </Label>
              <Input
                id="telCliente"
                value={newClientTelefone}
                onChange={(e) => setNewClientTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="border-[#E6DFD6]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emailCliente" className="text-xs font-semibold text-[#6E675F]">
                E-mail
              </Label>
              <Input
                id="emailCliente"
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="cliente@exemplo.com"
                className="border-[#E6DFD6]"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewClientModalOpen(false)}
                className="border-[#E6DFD6]"
              >
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingClient || !newClientNome.trim()}
                className="bg-[#4A7C59] hover:bg-[#3d6749] text-white"
              >
                {isCreatingClient ? 'Criando...' : 'Salvar e Selecionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
