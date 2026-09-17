import { describe, it, expect } from 'vitest'
import { aplicarMascaraTelefone, formatarNumeroWhatsapp } from '@/lib/whatsapp'

describe('Validações do fluxo de autenticação e corretor', () => {
  it('aplica a máscara de telefone brasileiro corretamente', () => {
    expect(aplicarMascaraTelefone('11999998888')).toBe('(11) 99999-8888')
    expect(aplicarMascaraTelefone('1938001122')).toBe('(19) 3800-1122')
    expect(aplicarMascaraTelefone('')).toBe('')
  })

  it('formata o WhatsApp com DDI internacional 55', () => {
    expect(formatarNumeroWhatsapp('(11) 99999-8888')).toBe('5511999998888')
  })
})
