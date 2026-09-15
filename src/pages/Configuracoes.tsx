import React, { useState, useEffect } from 'react'
import {
  Settings,
  Save,
  RotateCcw,
  Percent,
  DollarSign,
  Layers,
  HelpCircle,
  CheckCircle,
} from 'lucide-react'
import { useConfig } from '@/context/ConfigContext'
import { formatarMoeda, formatarNumero } from '@/lib/calculo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function Configuracoes() {
  const { config, updateConfig, isLoading } = useConfig()
  const { toast } = useToast()

  const [valorM2, setValorM2] = useState<number>(450)
  const [entradaMinima, setEntradaMinima] = useState<number>(20000)
  const [fator24, setFator24] = useState<number>(0.0470735)
  const [fator36, setFator36] = useState<number>(0.0332143)
  const [fator48, setFator48] = useState<number>(0.0263338)
  const [ipcaAnual, setIpcaAnual] = useState<number>(4.5)
  const [maxParcelas, setMaxParcelas] = useState<number>(48)

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (config) {
      setValorM2(config.valor_m2)
      setEntradaMinima(config.entrada_minima)
      setFator24(config.fator_24)
      setFator36(config.fator_36)
      setFator48(config.fator_48)
      setIpcaAnual(config.ipca_anual)
      setMaxParcelas(config.max_parcelas)
    }
  }, [config])

  const handleResetDefaults = () => {
    setValorM2(450)
    setEntradaMinima(20000)
    setFator24(0.0470735)
    setFator36(0.0332143)
    setFator48(0.0263338)
    setIpcaAnual(4.5)
    setMaxParcelas(48)
    toast({
      title: 'Valores padrão restaurados',
      description: 'Clique em "Salvar Configurações" para gravar no banco.',
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await updateConfig({
        valor_m2: Number(valorM2),
        entrada_minima: Number(entradaMinima),
        fator_24: Number(fator24),
        fator_36: Number(fator36),
        fator_48: Number(fator48),
        ipca_anual: Number(ipcaAnual),
        max_parcelas: Number(maxParcelas),
      })

      toast({
        title: 'Configurações salvas com sucesso',
        description: 'Os novos valores já estão ativos no Simulador e em todo o sistema.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar configurações',
        description: 'Verifique se você possui permissão para editar os dados.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner Explicativo */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E6DFD6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C2501A]/10 text-[#C2501A] flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-[#2E2A25]">
              Parâmetros Globais de Financiamento
            </h3>
            <p className="text-xs text-[#6E675F] max-w-xl mt-0.5">
              Defina os fatores de correção para cada prazo, o valor base do m², a entrada mínima e
              a taxa IPCA para correção anual do Jardim Europa.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleResetDefaults}
          className="border-[#E6DFD6] text-xs font-semibold hover:bg-[#FAF7F2] shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Restaurar Padrões
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bloco 1: Valores do Imóvel & Entrada */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E6DFD6] shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-[#2E2A25] uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#C2501A]" />
            Valores Base e Entrada Mínima
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="valorM2" className="text-xs font-semibold text-[#6E675F]">
                  Valor do m² para financiamento (R$)
                </Label>
                <span className="text-[11px] text-[#4A7C59] font-medium">
                  Atual: {formatarMoeda(valorM2)}
                </span>
              </div>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="valorM2"
                  type="number"
                  step="0.01"
                  required
                  value={valorM2}
                  onChange={(e) => setValorM2(parseFloat(e.target.value) || 0)}
                  className="pl-9 h-11 border-[#E6DFD6] font-semibold tabular-nums"
                />
              </div>
              <p className="text-[11px] text-[#6E675F]">
                Valor padrão aplicado no simulador para cálculo do valor total do lote.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="entradaMinima" className="text-xs font-semibold text-[#6E675F]">
                  Entrada Mínima Obrigatória (R$)
                </Label>
                <span className="text-[11px] text-[#4A7C59] font-medium">
                  Atual: {formatarMoeda(entradaMinima)}
                </span>
              </div>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="entradaMinima"
                  type="number"
                  step="500"
                  required
                  value={entradaMinima}
                  onChange={(e) => setEntradaMinima(parseFloat(e.target.value) || 0)}
                  className="pl-9 h-11 border-[#E6DFD6] font-semibold tabular-nums"
                />
              </div>
              <p className="text-[11px] text-[#6E675F]">
                Valor mínimo exigido no simulador (cliente pode pagar valor superior).
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Fatores de Correção das Âncoras */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E6DFD6] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-[#2E2A25] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C2501A]" />
              Fatores de Correção de Parcelamento (Âncoras)
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-[#6E675F]">
              <HelpCircle className="w-3.5 h-3.5 text-[#4A7C59]" />
              <span>Multiplicador direto da parcela mensal</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 24 meses */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E6DFD6]">
              <div className="flex items-center justify-between">
                <Label htmlFor="fator24" className="text-xs font-bold text-[#2E2A25]">
                  24 Meses
                </Label>
                <span className="text-[10px] bg-orange-100 text-[#C2501A] px-1.5 py-0.5 rounded font-mono">
                  0,0470735
                </span>
              </div>
              <Input
                id="fator24"
                type="number"
                step="0.0000001"
                required
                value={fator24}
                onChange={(e) => setFator24(parseFloat(e.target.value) || 0)}
                className="h-10 border-[#E6DFD6] bg-white font-mono text-sm tabular-nums"
              />
              <p className="text-[10px] text-[#6E675F]">Parcela = Valor Financiado × {fator24}</p>
            </div>

            {/* 36 meses */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E6DFD6]">
              <div className="flex items-center justify-between">
                <Label htmlFor="fator36" className="text-xs font-bold text-[#2E2A25]">
                  36 Meses
                </Label>
                <span className="text-[10px] bg-orange-100 text-[#C2501A] px-1.5 py-0.5 rounded font-mono">
                  0,0332143
                </span>
              </div>
              <Input
                id="fator36"
                type="number"
                step="0.0000001"
                required
                value={fator36}
                onChange={(e) => setFator36(parseFloat(e.target.value) || 0)}
                className="h-10 border-[#E6DFD6] bg-white font-mono text-sm tabular-nums"
              />
              <p className="text-[10px] text-[#6E675F]">Parcela = Valor Financiado × {fator36}</p>
            </div>

            {/* 48 meses */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E6DFD6]">
              <div className="flex items-center justify-between">
                <Label htmlFor="fator48" className="text-xs font-bold text-[#2E2A25]">
                  48 Meses
                </Label>
                <span className="text-[10px] bg-orange-100 text-[#C2501A] px-1.5 py-0.5 rounded font-mono">
                  0,0263338
                </span>
              </div>
              <Input
                id="fator48"
                type="number"
                step="0.0000001"
                required
                value={fator48}
                onChange={(e) => setFator48(parseFloat(e.target.value) || 0)}
                className="h-10 border-[#E6DFD6] bg-white font-mono text-sm tabular-nums"
              />
              <p className="text-[10px] text-[#6E675F]">Parcela = Valor Financiado × {fator48}</p>
            </div>
          </div>

          <div className="text-xs text-[#6E675F] bg-white p-3 rounded-lg border border-[#E6DFD6] flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#4A7C59] shrink-0" />
            <span>
              Para prazos intermediários (ex: 12, 18, 30 parcelas), o sistema realiza a interpolação
              linear automática com base nestas âncoras.
            </span>
          </div>
        </div>

        {/* Bloco 3: IPCA Anual e Limite de Parcelas */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E6DFD6] shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-[#2E2A25] uppercase tracking-wider flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#C2501A]" />
            Índice IPCA e Limites Globais
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="ipcaAnual" className="text-xs font-semibold text-[#6E675F]">
                Taxa IPCA Anual Estimada (%)
              </Label>
              <div className="relative">
                <Percent className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="ipcaAnual"
                  type="number"
                  step="0.01"
                  required
                  value={ipcaAnual}
                  onChange={(e) => setIpcaAnual(parseFloat(e.target.value) || 0)}
                  className="pl-9 h-11 border-[#E6DFD6] font-semibold tabular-nums"
                />
              </div>
              <p className="text-[11px] text-[#6E675F]">
                Índice indicado na nota de correção anual contratual da proposta.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxParcelas" className="text-xs font-semibold text-[#6E675F]">
                Máximo de Parcelas (Limite Global)
              </Label>
              <Input
                id="maxParcelas"
                type="number"
                min="12"
                max="120"
                required
                value={maxParcelas}
                onChange={(e) => setMaxParcelas(parseInt(e.target.value, 10) || 48)}
                className="h-11 border-[#E6DFD6] font-semibold tabular-nums"
              />
              <p className="text-[11px] text-[#6E675F]">
                Limite de parcelamento para as quadras S1, T1, U1, V1, W1, Y1 (padrão: 48).
              </p>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving || isLoading}
            className="h-12 px-8 bg-[#C2501A] hover:bg-[#A84415] text-white font-semibold text-sm rounded-xl shadow-sm hover-lift flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando Alterações...' : 'Salvar Configurações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
