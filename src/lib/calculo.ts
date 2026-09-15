/**
 * Helpers para formatação de moeda, números e interpolação de fatores de parcelamento
 */

export function formatarMoeda(valor: number): string {
  if (isNaN(valor) || valor === null || valor === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

export function formatarNumero(valor: number, casasDecimais: number = 2): string {
  if (isNaN(valor) || valor === null || valor === undefined) return '0'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(valor)
}

/**
 * Interpolação linear do fator de correção com base nas âncoras configuradas:
 * - 24 meses -> fator_24 (default 0.0470735)
 * - 36 meses -> fator_36 (default 0.0332143)
 * - 48 meses -> fator_48 (default 0.0263338)
 *
 * Para n parcelas:
 * Se n == 24, retorna fator_24
 * Se n == 36, retorna fator_36
 * Se n == 48, retorna fator_48
 * Se 1 <= n < 24: interpola linearmente entre n=1 (fator 1.0) e n=24 (fator_24)
 * Se 24 < n < 36: interpola linearmente entre (24, fator_24) e (36, fator_36)
 * Se 36 < n <= 48: interpola linearmente entre (36, fator_36) e (48, fator_48)
 */
export function calcularFatorCorrecao(
  parcelas: number,
  fatores: { fator_24: number; fator_36: number; fator_48: number },
): number {
  const n = Math.round(parcelas)
  const { fator_24, fator_36, fator_48 } = fatores

  if (n <= 1) return 1.0

  if (n === 24) return fator_24
  if (n === 36) return fator_36
  if (n === 48) return fator_48

  if (n < 24) {
    // Interpolação entre n=1 (fator 1/1 = 1) e n=24 (fator_24)
    // t vai de 0 a 1 conforme n vai de 1 a 24
    const t = (n - 1) / (24 - 1)
    return 1.0 + t * (fator_24 - 1.0)
  } else if (n < 36) {
    // Interpolação entre (24, fator_24) e (36, fator_36)
    const t = (n - 24) / (36 - 24)
    return fator_24 + t * (fator_36 - fator_24)
  } else {
    // Interpolação entre (36, fator_36) e (48, fator_48)
    const t = (n - 36) / (48 - 36)
    return fator_36 + t * (fator_48 - fator_36)
  }
}

/**
 * Realiza os cálculos do simulador:
 * - Parcela mensal = valor financiado * fator de correção
 * - Total financiado = parcela mensal * num_parcelas
 */
export function calcularFinanciamento(params: {
  largura: number
  comprimento: number
  valorM2: number
  entrada: number
  numParcelas: number
  fatores: { fator_24: number; fator_36: number; fator_48: number }
  ipcaAnual: number
}) {
  const areaM2 = Math.round(params.largura * params.comprimento * 100) / 100
  const valorTotalLote = Math.round(areaM2 * params.valorM2 * 100) / 100
  const valorFinanciado = Math.max(0, Math.round((valorTotalLote - params.entrada) * 100) / 100)
  const fatorAplicado = calcularFatorCorrecao(params.numParcelas, params.fatores)

  // Parcela mensal = valor financiado × fator de correção
  const parcelaMensal = Math.round(valorFinanciado * fatorAplicado * 100) / 100
  const valorTotalFinanciado = Math.round(parcelaMensal * params.numParcelas * 100) / 100
  const totalPagoComEntrada = Math.round((valorTotalFinanciado + params.entrada) * 100) / 100

  return {
    areaM2,
    valorTotalLote,
    valorFinanciado,
    entrada: params.entrada,
    numParcelas: params.numParcelas,
    fatorAplicado,
    parcelaMensal,
    valorTotalFinanciado,
    totalPagoComEntrada,
    ipcaAnual: params.ipcaAnual,
  }
}
