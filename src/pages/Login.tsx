import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trees, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const [email, setEmail] = useState('gabsilvio@gmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(email.trim(), password)
      navigate('/simulador')
    } catch {
      setError('E-mail ou senha incorretos')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F4EBE1] to-[#EBDCCE] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E6DFD6] p-8 animate-fade-in-up">
        {/* Topo / Marca */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#C2501A] flex items-center justify-center text-white mx-auto mb-4 shadow-md shadow-orange-900/20">
            <Trees className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2E2A25]">JD Europa</h1>
          <p className="text-sm text-[#6E675F] mt-1">
            Sistema de Vendas & Simulador de Parcelamento
          </p>
        </div>

        {/* Erro inline */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#C0392B]" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider text-[#6E675F]"
            >
              E-mail do Corretor
            </Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6E675F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="pl-10 h-11 border-[#E6DFD6] focus-visible:ring-[#C2501A]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-[#6E675F]"
            >
              Senha de Acesso
            </Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6E675F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 h-11 border-[#E6DFD6] focus-visible:ring-[#C2501A]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-[#C2501A] hover:bg-[#A84415] text-white font-semibold text-sm rounded-xl shadow-sm transition-all hover-lift mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar no Sistema'
            )}
          </Button>
        </form>

        {/* Dica do usuário de teste */}
        <div className="mt-8 pt-6 border-t border-[#E6DFD6] text-center text-xs text-[#6E675F]">
          <p className="font-medium text-[#2E2A25] mb-1">Acesso Rápido Master / Gestor:</p>
          <p>
            E-mail:{' '}
            <code className="bg-[#FAF7F2] px-1.5 py-0.5 rounded text-[#C2501A] font-mono">
              gabsilvio@gmail.com
            </code>
          </p>
          <p className="mt-0.5">
            Senha:{' '}
            <code className="bg-[#FAF7F2] px-1.5 py-0.5 rounded text-[#C2501A] font-mono">
              Skip@Pass
            </code>
          </p>
          <p className="mt-2 text-[11px] text-[#6E675F]">
            Corretores utilizam o e-mail e senha enviados pelo Master via WhatsApp.
          </p>
        </div>
      </div>
    </div>
  )
}
