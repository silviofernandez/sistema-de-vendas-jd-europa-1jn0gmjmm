import type { RecordModel } from 'pocketbase'

export type QuadraValida = 'S1' | 'T1' | 'U1' | 'V1' | 'W1' | 'Y1'

export const QUADRAS_VALIDAS: QuadraValida[] = ['S1', 'T1', 'U1', 'V1', 'W1', 'Y1']

export interface ConfiguracoesRecord extends RecordModel {
  valor_m2: number
  entrada_minima: number
  fator_24: number
  fator_36: number
  fator_48: number
  ipca_anual: number
  max_parcelas: number
}

export interface LoteRecord extends RecordModel {
  quadra: QuadraValida | string
  nome?: string
  largura: number
  comprimento: number
}

export interface ClienteRecord extends RecordModel {
  nome: string
  telefone?: string
  email?: string
}

export interface PropostaRecord extends RecordModel {
  cliente?: string
  lote?: string
  quadra: string
  area_m2: number
  valor_m2: number
  valor_total_lote: number
  entrada: number
  valor_financiado: number
  num_parcelas: number
  parcela_mensal: number
  ipca_anual: number
  expand?: {
    cliente?: ClienteRecord
    lote?: LoteRecord
  }
}

export interface CalculoSimulacaoResult {
  areaM2: number
  valorTotalLote: number
  valorFinanciado: number
  entrada: number
  numParcelas: number
  fatorAplicado: number
  parcelaMensal: number
  valorTotalFinanciado: number
  totalPagoComEntrada: number
  ipcaAnual: number
}
