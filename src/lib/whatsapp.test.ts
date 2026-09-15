import { describe, it, expect } from 'vitest'
import {
  formatarNumeroWhatsapp,
  aplicarMascaraTelefone,
  gerarMensagemPropostaWhatsApp,
  gerarMensagemAcessoCorretor,
} from './whatsapp'

describe('Utilitários de WhatsApp e Mensagens Profissionais', () => {
  it('deve normalizar telefones para formato internacional wa.me (DDI 55)', () => {
    expect(formatarNumeroWhatsapp('(11) 98765-4321')).toBe('5511987654321')
    expect(formatarNumeroWhatsapp('19 99123-4567')).toBe('5519991234567')
    expect(formatarNumeroWhatsapp('5511987654321')).toBe('5511987654321')
    expect(formatarNumeroWhatsapp('(11) 3456-7890')).toBe('551134567890')
  })

  it('deve aplicar máscara visual de telefone corretamente', () => {
    expect(aplicarMascaraTelefone('11987654321')).toBe('(11) 98765-4321')
    expect(aplicarMascaraTelefone('1134567890')).toBe('(11) 3456-7890')
  })

  it('deve formatar proposta de WhatsApp com todos os dados essenciais requeridos', () => {
    const msg = gerarMensagemPropostaWhatsApp({
      clienteNome: 'Roberto Santos',
      quadra: 'S1',
      loteIdentificador: 'Lote 04',
      modoArea: 'dimensoes',
      largura: 12,
      comprimento: 25,
      areaM2: 300,
      valorM2: 450,
      valorTotalLote: 135000,
      entrada: 25000,
      valorFinanciado: 110000,
      numParcelas: 48,
      parcelaMensal: 2896.72,
      ipcaAnual: 4.5,
      corretorNome: 'Silvio (Master)',
    })

    expect(msg).toContain('LOTEAMENTO JARDIM EUROPA')
    expect(msg).toContain('Roberto Santos')
    expect(msg).toContain('Quadra: S1')
    expect(msg).toContain('Lote 04')
    expect(msg).toContain('12,0m × 25,0m')
    expect(msg).toContain('300 m²')
    expect(msg).toContain('R$ 450,00')
    expect(msg).toContain('R$ 135.000,00')
    expect(msg).toContain('R$ 25.000,00') // Entrada
    expect(msg).toContain('48 meses') // Parcelas
    expect(msg).toContain('VALOR DE CADA PARCELA')
    expect(msg).toContain('R$ 2.896,72')
    expect(msg).toContain('IPCA')
    expect(msg).toContain('Silvio (Master)')
  })

  it('deve formatar proposta para lote irregular por área total', () => {
    const msg = gerarMensagemPropostaWhatsApp({
      quadra: 'T1',
      modoArea: 'area_total',
      areaM2: 342.5,
      valorM2: 450,
      valorTotalLote: 154125,
      entrada: 30000,
      valorFinanciado: 124125,
      numParcelas: 36,
      parcelaMensal: 4122.75,
    })

    expect(msg).toContain('342,5 m²* (Área Total)')
    expect(msg).toContain('36 meses')
    expect(msg).toContain('R$ 4.122,75')
  })

  it('deve gerar mensagem de acesso do corretor completa com login e senha', () => {
    const msg = gerarMensagemAcessoCorretor({
      nome: 'Carlos Corretor',
      email: 'carlos@vendas.com',
      senha: 'SenhaForte123!',
      appUrl: 'https://jd-europa.app',
    })

    expect(msg).toContain('Carlos Corretor')
    expect(msg).toContain('carlos@vendas.com')
    expect(msg).toContain('SenhaForte123!')
    expect(msg).toContain('https://jd-europa.app/login')
  })
})
