import React, { useState, useEffect, useMemo } from 'react'
import {
  Grid,
  Plus,
  Search,
  Trash2,
  Edit2,
  Maximize2,
  MapPin,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { lotesService } from '@/services/lotes'
import { useConfig } from '@/context/ConfigContext'
import { useRealtime } from '@/hooks/use-realtime'
import type { LoteRecord, QuadraValida } from '@/types/database'
import { QUADRAS_VALIDAS } from '@/types/database'
import { formatarMoeda, formatarNumero } from '@/lib/calculo'
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

export default function Lotes() {
  const { config } = useConfig()
  const { toast } = useToast()

  const [lotes, setLotes] = useState<LoteRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [quadraFilter, setQuadraFilter] = useState<string>('todas')
  const [isLoading, setIsLoading] = useState(true)

  // Modal de Criar / Editar
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLote, setEditingLote] = useState<LoteRecord | null>(null)
  const [formData, setFormData] = useState({
    quadra: 'S1' as QuadraValida,
    nome: '',
    largura: 12,
    comprimento: 25,
  })
  const [isSaving, setIsSaving] = useState(false)

  // Modal de confirmação de exclusão
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchLotes = async () => {
    try {
      const data = await lotesService.getAll()
      setLotes(data)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar lotes',
        description: 'Não foi possível buscar a lista de lotes.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLotes()
  }, [])

  // Sincroniza em tempo real
  useRealtime<LoteRecord>('lotes', () => {
    fetchLotes()
  })

  // Filtros de busca
  const lotesFiltrados = useMemo(() => {
    return lotes.filter((lote) => {
      const matchSearch =
        (lote.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        lote.quadra.toLowerCase().includes(searchTerm.toLowerCase())
      const matchQuadra = quadraFilter === 'todas' || lote.quadra === quadraFilter
      return matchSearch && matchQuadra
    })
  }, [lotes, searchTerm, quadraFilter])

  const handleOpenCreate = () => {
    setEditingLote(null)
    setFormData({
      quadra: 'S1',
      nome: '',
      largura: 12,
      comprimento: 25,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (lote: LoteRecord) => {
    setEditingLote(lote)
    setFormData({
      quadra: (QUADRAS_VALIDAS.includes(lote.quadra as QuadraValida)
        ? lote.quadra
        : 'S1') as QuadraValida,
      nome: lote.nome || '',
      largura: lote.largura,
      comprimento: lote.comprimento,
    })
    setIsModalOpen(true)
  }

  const handleSaveLote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.largura <= 0 || formData.comprimento <= 0) {
      toast({
        variant: 'destructive',
        title: 'Dimensões inválidas',
        description: 'Largura e comprimento devem ser maiores que zero.',
      })
      return
    }

    setIsSaving(true)
    try {
      if (editingLote) {
        await lotesService.update(editingLote.id, {
          quadra: formData.quadra,
          nome: formData.nome.trim() || undefined,
          largura: Number(formData.largura),
          comprimento: Number(formData.comprimento),
        })
        toast({ title: 'Lote atualizado com sucesso!' })
      } else {
        await lotesService.create({
          quadra: formData.quadra,
          nome: formData.nome.trim() || undefined,
          largura: Number(formData.largura),
          comprimento: Number(formData.comprimento),
        })
        toast({ title: 'Novo lote cadastrado com sucesso!' })
      }
      setIsModalOpen(false)
      fetchLotes()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar lote',
        description: 'Tente novamente.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteLote = async () => {
    if (!deletingId) return
    try {
      await lotesService.delete(deletingId)
      toast({ title: 'Lote excluído com sucesso' })
      setDeletingId(null)
      fetchLotes()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir lote',
        description: 'Pode haver propostas vinculadas a este lote.',
      })
    }
  }

  const valorM2Padrao = config?.valor_m2 || 450

  return (
    <div className="space-y-6">
      {/* Top Header com Busca e Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E6DFD6] shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Buscar por lote ou quadra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 border-[#E6DFD6]"
            />
          </div>

          <Select value={quadraFilter} onValueChange={setQuadraFilter}>
            <SelectTrigger className="w-32 h-10 border-[#E6DFD6] text-xs font-semibold">
              <SelectValue placeholder="Quadra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {QUADRAS_VALIDAS.map((q) => (
                <SelectItem key={q} value={q}>
                  Quadra {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-10 bg-[#C2501A] hover:bg-[#A84415] text-white font-semibold rounded-xl hover-lift flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Lote
        </Button>
      </div>

      {/* Lista de Lotes em Cards / Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-[#6E675F]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#C2501A]" />
          <p className="text-sm">Carregando lotes cadastrados...</p>
        </div>
      ) : lotesFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6DFD6] p-12 text-center">
          <Grid className="w-12 h-12 text-[#6E675F]/40 mx-auto mb-3" />
          <h3 className="font-bold text-[#2E2A25] text-base mb-1">Nenhum lote encontrado</h3>
          <p className="text-xs text-[#6E675F] max-w-sm mx-auto mb-4">
            Não há lotes correspondentes à sua busca ou filtro de quadra.
          </p>
          <Button
            onClick={handleOpenCreate}
            variant="outline"
            className="border-[#E6DFD6] text-xs font-semibold"
          >
            Cadastrar primeiro lote
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lotesFiltrados.map((lote) => {
            const area = lote.largura * lote.comprimento
            const valorTotal = area * valorM2Padrao

            return (
              <div
                key={lote.id}
                className="bg-white rounded-2xl p-5 border border-[#E6DFD6] shadow-sm hover:border-[#C2501A]/40 transition-all space-y-4 hover-lift"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E6DFD6] flex items-center justify-center font-bold text-[#C2501A]">
                      {lote.quadra}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2E2A25] text-base leading-tight">
                        {lote.nome || 'Lote Padrão'}
                      </h4>
                      <p className="text-xs text-[#6E675F] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#4A7C59]" />
                        Quadra {lote.quadra} • Jd Europa
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(lote)}
                      className="h-8 w-8 p-0 text-[#6E675F] hover:text-[#2E2A25] hover:bg-[#FAF7F2]"
                      title="Editar lote"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(lote.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Excluir lote"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#FAF7F2] p-3 rounded-xl border border-[#E6DFD6]/70 text-xs">
                  <div>
                    <span className="text-[#6E675F] block text-[11px]">Dimensões</span>
                    <span className="font-semibold text-[#2E2A25]">
                      {formatarNumero(lote.largura, 1)}m × {formatarNumero(lote.comprimento, 1)}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6E675F] block text-[11px]">Área Computada</span>
                    <span className="font-bold text-[#2E2A25] flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-[#4A7C59]" />
                      {formatarNumero(area)} m²
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-[#E6DFD6]">
                  <div>
                    <span className="text-[11px] text-[#6E675F] block">
                      Valor Estimado ({formatarMoeda(valorM2Padrao)}/m²)
                    </span>
                    <span className="text-base font-bold text-[#C2501A] tabular-nums">
                      {formatarMoeda(valorTotal)}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#4A7C59] bg-[#4A7C59]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Até 48x
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Criar / Editar Lote */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E6DFD6]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#2E2A25]">
              {editingLote ? 'Editar Lote' : 'Cadastrar Novo Lote'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6E675F]">
              Preencha os dados do terreno no loteamento Jardim Europa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveLote} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#6E675F]">
                  Quadra <span className="text-[#C2501A]">*</span>
                </Label>
                <Select
                  value={formData.quadra}
                  onValueChange={(val: QuadraValida) =>
                    setFormData((prev) => ({ ...prev, quadra: val }))
                  }
                >
                  <SelectTrigger className="border-[#E6DFD6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUADRAS_VALIDAS.map((q) => (
                      <SelectItem key={q} value={q}>
                        Quadra {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-xs font-semibold text-[#6E675F]">
                  Nome / Número
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Lote 05"
                  className="border-[#E6DFD6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="largura" className="text-xs font-semibold text-[#6E675F]">
                  Largura (m) <span className="text-[#C2501A]">*</span>
                </Label>
                <Input
                  id="largura"
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={formData.largura || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      largura: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="border-[#E6DFD6] tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comprimento" className="text-xs font-semibold text-[#6E675F]">
                  Comprimento (m) <span className="text-[#C2501A]">*</span>
                </Label>
                <Input
                  id="comprimento"
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={formData.comprimento || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      comprimento: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="border-[#E6DFD6] tabular-nums"
                />
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E6DFD6] text-xs flex justify-between items-center">
              <span className="text-[#6E675F]">Área Resultante:</span>
              <span className="font-bold text-sm text-[#2E2A25]">
                {formatarNumero(formData.largura * formData.comprimento)} m²
              </span>
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
                disabled={isSaving}
                className="bg-[#C2501A] hover:bg-[#A84415] text-white"
              >
                {isSaving ? 'Salvando...' : 'Salvar Lote'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="max-w-sm bg-white border-[#E6DFD6]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#C0392B]">
              Excluir este lote?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6E675F]">
              Esta ação removerá o lote do catálogo. Propostas associadas não serão apagadas.
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
            <Button onClick={handleDeleteLote} className="bg-[#C0392B] hover:bg-red-700 text-white">
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
