import { formatarMoeda, formatarNumero } from './calculo'

/**
 * Normaliza e formata telefone para padrão internacional WhatsApp (DDI 55 padrão Brasil)
 */
export function formatarNumeroWhatsapp(telefone: string): string {
  const digits = telefone.replace(/\D/g, '')
  if (!digits) return ''
  // Se já tiver DDI 55 com 12 ou 13 dígitos
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits
  }
  // Se for DDD + Número (10 ou 11 dígitos, ex: 11987654321 ou 1938001122)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }
  // Fallback: se digitou sem DDD mas com 8 ou 9 dígitos, ou qualquer outro, retorna dígitos limpos
  return digits
}

/**
 * Aplica máscara visual de telefone brasileiro (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function aplicarMascaraTelefone(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) {
    return `(${digits}`
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export interface PropostaWhatsAppParams {
  clienteNome?: string
  quadra: string
  loteIdentificador?: string
  modoArea: 'dimensoes' | 'area_total'
  largura?: number
  comprimento?: number
  areaM2: number
  valorM2: number
  valorTotalLote: number
  entrada: number
  valorFinanciado: number
  numParcelas: number
  parcelaMensal: number
  ipcaAnual?: number
  corretorNome?: string
  corretorTelefone?: string
}

/**
 * Gera mensagem de proposta comercial de venda elegante, visual e profissional
 */
export function gerarMensagemPropostaWhatsApp(params: PropostaWhatsAppParams): string {
  const {
    clienteNome,
    quadra,
    loteIdentificador,
    modoArea,
    largura,
    comprimento,
    areaM2,
    valorM2,
    valorTotalLote,
    entrada,
    valorFinanciado,
    numParcelas,
    parcelaMensal,
    ipcaAnual = 4.5,
    corretorNome,
  } = params

  const saudacaoCliente = clienteNome?.trim()
    ? `Olá, *${clienteNome.trim()}*! Tudo bem?`
    : `Olá! Tudo bem?`

  const metragemLinha =
    modoArea === 'dimensoes' && largura && comprimento
      ? `📐 *Metragem do Lote:* ${formatarNumero(largura, 1)}m × ${formatarNumero(comprimento, 1)}m (*${formatarNumero(areaM2)} m²*)`
      : `📐 *Metragem do Lote:* *${formatarNumero(areaM2)} m²* (Área Total)`

  const identificadorLote = loteIdentificador?.trim()
    ? `Lote ${loteIdentificador.trim()}`
    : `Lote a definir`

  const totalFinanciado = parcelaMensal * numParcelas

  const linhas = [
    `🏡 *LOTEAMENTO JARDIM EUROPA*`,
    `_Proposta Exclusiva de Financiamento Direto_`,
    ``,
    saudacaoCliente,
    `Conforme combinamos, segue a simulação especial para o seu lote no *Jardim Europa*:`,
    ``,
    `📍 *LOCALIZAÇÃO & METRAGEM*`,
    `• *Quadra:* ${quadra}`,
    `• *Identificação:* ${identificadorLote}`,
    `• ${metragemLinha}`,
    `• *Valor do m²:* ${formatarMoeda(valorM2)}`,
    `• *Valor Total do Imóvel:* *${formatarMoeda(valorTotalLote)}*`,
    ``,
    `💳 *PLANO DE PAGAMENTO FACILITADO*`,
    `⭐ *Entrada:* *${formatarMoeda(entrada)}*`,
    `• *Saldo Financiado:* ${formatarMoeda(valorFinanciado)}`,
    `• *Prazo:* *${numParcelas} meses*`,
    `💰 *VALOR DE CADA PARCELA:* *${formatarMoeda(parcelaMensal)}*`,
    `• *Total financiado:* ${formatarMoeda(totalFinanciado)}`,
    ``,
    `ℹ️ *Condições & Correção:*`,
    `• Correção anual pelo índice IPCA (${formatarNumero(ipcaAnual, 2)}% a.a.).`,
    `• Financiamento direto, sem burocracia bancária.`,
    `• Entrada facilitada e aprovação rápida.`,
    ``,
    corretorNome ? `👤 *Corretor Responsável:* ${corretorNome}` : `👤 *Atendimento Jardim Europa*`,
    `Fico à sua disposição para agendarmos uma visita ao local ou darmos andamento na reserva do lote!`,
  ]

  return linhas.join('\n')
}

export interface AcessoCorretorParams {
  nome: string
  email: string
  senha: string
  appUrl?: string
}

/**
 * Gera mensagem de WhatsApp com credenciais e link de acesso para novos corretores
 */
export function gerarMensagemAcessoCorretor(params: AcessoCorretorParams): string {
  const { nome, email, senha, appUrl } = params
  const url = appUrl || window.location.origin

  const linhas = [
    `🔑 *BEM-VINDO À EQUIPE DE VENDAS - JD EUROPA*`,
    ``,
    `Olá, *${nome}*!`,
    `Seu acesso ao sistema oficial de vendas e simulador de parcelamento do *Loteamento Jardim Europa* foi liberado com sucesso.`,
    ``,
    `📲 *DADOS DE ACESSO:*`,
    `• *Link do Sistema:* ${url}/login`,
    `• *Login (E-mail):* ${email}`,
    `• *Senha de Acesso:* *${senha}*`,
    ``,
    `🚀 *O que você pode fazer:*`,
    `• Simular parcelamentos em tempo real (24x, 36x, 48x)`,
    `• Cadastrar seus clientes e propostas`,
    `• Enviar propostas profissionais direto no WhatsApp do cliente`,
    `• Imprimir propostas com cálculo oficial do loteamento`,
    ``,
    `Guarde seus dados com segurança. Boas vendas! 🎯`,
  ]

  return linhas.join('\n')
}

/**
 * Abre o WhatsApp com a mensagem formatada
 */
export function abrirWhatsApp(telefone: string, mensagem: string): void {
  const rawClean = formatarNumeroWhatsapp(telefone)
  const encodedText = encodeURIComponent(mensagem)
  const url = rawClean
    ? `https://wa.me/${rawClean}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
