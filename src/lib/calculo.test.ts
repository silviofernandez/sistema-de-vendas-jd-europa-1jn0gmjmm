import { describe, it, expect } from 'vitest'
import { calcularFatorCorrecao, calcularFinanciamento } from './calculo'

describe('Cálculos de Financiamento Jd Europa', () => {
  const fatoresPadrao = {
    fator_24: 0.0470735,
    fator_36: 0.0332143,
    fator_48: 0.0263338,
  }

  it('deve retornar os fatores exatos para as âncoras de 24, 36 e 48 meses', () => {
    expect(calcularFatorCorrecao(24, fatoresPadrao)).toBeCloseTo(0.0470735, 7)
    expect(calcularFatorCorrecao(36, fatoresPadrao)).toBeCloseTo(0.0332143, 7)
    expect(calcularFatorCorrecao(48, fatoresPadrao)).toBeCloseTo(0.0263338, 7)
  })

  it('deve interpolar linearmente para prazos intermediários', () => {
    // Para 30 meses (ponto médio exato entre 24 e 36)
    const fator30 = calcularFatorCorrecao(30, fatoresPadrao)
    const esperado30 = (0.0470735 + 0.0332143) / 2
    expect(fator30).toBeCloseTo(esperado30, 7)

    // Para 42 meses (ponto médio exato entre 36 e 48)
    const fator42 = calcularFatorCorrecao(42, fatoresPadrao)
    const esperado42 = (0.0332143 + 0.0263338) / 2
    expect(fator42).toBeCloseTo(esperado42, 7)
  })

  it('deve calcular corretamente a parcela mensal e o saldo financiado', () => {
    // Exemplo: Lote 300m² a R$ 450/m² = R$ 135.000
    // Entrada: R$ 25.000 -> Financiado: R$ 110.000
    // 48 meses com fator 0.0263338 -> 110.000 * 0.0263338 = 2896.718 -> ~2896.72
    const res = calcularFinanciamento({
      largura: 12,
      comprimento: 25,
      valorM2: 450,
      entrada: 25000,
      numParcelas: 48,
      fatores: fatoresPadrao,
      ipcaAnual: 4.5,
    })

    expect(res.areaM2).toBe(300)
    expect(res.valorTotalLote).toBe(135000)
    expect(res.valorFinanciado).toBe(110000)
    expect(res.parcelaMensal).toBeCloseTo(2896.72, 2)
  })

  it('deve respeitar entrada e calcular para 36 meses', () => {
    // Lote 250m² a R$ 450 = R$ 112.500
    // Entrada R$ 20.000 -> Financiado R$ 92.500
    // 36 meses com fator 0.0332143 -> 92.500 * 0.0332143 = 3072.322 -> ~3072.32
    const res = calcularFinanciamento({
      largura: 10,
      comprimento: 25,
      valorM2: 450,
      entrada: 20000,
      numParcelas: 36,
      fatores: fatoresPadrao,
      ipcaAnual: 4.5,
    })

    expect(res.areaM2).toBe(250)
    expect(res.valorTotalLote).toBe(112500)
    expect(res.valorFinanciado).toBe(92500)
    expect(res.parcelaMensal).toBeCloseTo(3072.32, 2)
  })

  it('deve permitir calcular diretamente pela área total (lotes irregulares)', () => {
    // Exemplo de lote irregular: 342.75 m² a R$ 450 = R$ 154.237,50
    // Entrada R$ 30.000 -> Financiado R$ 124.237,50
    // 48 meses com fator 0.0263338 -> 124.237,50 * 0.0263338 = 3271.65
    const res = calcularFinanciamento({
      areaM2: 342.75,
      valorM2: 450,
      entrada: 30000,
      numParcelas: 48,
      fatores: fatoresPadrao,
      ipcaAnual: 4.5,
    })

    expect(res.areaM2).toBe(342.75)
    expect(res.valorTotalLote).toBe(154237.5)
    expect(res.valorFinanciado).toBe(124237.5)
    expect(res.parcelaMensal).toBeCloseTo(3271.65, 2)
  })
})
