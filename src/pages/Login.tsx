import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trees,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  KeyRound,
  UserPlus,
  LogIn,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { aplicarMascaraTelefone } from '@/lib/whatsapp'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

type AuthMode = 'login' | 'register' | 'forgot-password'

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login')

  // Estado Login
  const [loginEmail, setLoginEmail] = useState('gabsilvio@gmail.com')
  const [loginPassword, setLoginPassword] = useState('Skip@Pass')

  // Estado Registro
  const [regNome, setRegNome] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regTelefone, setRegTelefone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('')

  // Estado Recuperação de Senha
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotNotice, setForgotNotice] = useState<string | null>(null)

  // Feedback geral
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login, register, requestPasswordReset } = useAuth()
  const navigate = useNavigate()

  const switchMode = (newMode: AuthMode) => {
    setError(null)
    setForgotNotice(null)
    setForgotSuccess(false)
    setMode(newMode)
  }

  // Submissão do Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(loginEmail.trim(), loginPassword)
      navigate('/simulador')
    } catch {
      setError('E-mail ou senha incorretos. Verifique suas credenciais.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submissão do Registro (Criar Conta de Corretor)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!regNome.trim()) {
      setError('Por favor, informe seu nome completo.')
      return
    }

    if (!regEmail.trim()) {
      setError('Por favor, informe seu e-mail.')
      return
    }

    if (regPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (regPassword !== regPasswordConfirm) {
      setError('A confirmação de senha não confere com a senha digitada.')
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        name: regNome.trim(),
        email: regEmail.trim().toLowerCase(),
        telefone: regTelefone.trim(),
        password: regPassword,
        passwordConfirm: regPasswordConfirm,
      })
      navigate('/simulador')
    } catch (err: unknown) {
      const fieldErrors = extractFieldErrors(err)
      if (fieldErrors.email) {
        setError('Este e-mail já está cadastrado ou é inválido.')
      } else if (fieldErrors.password || fieldErrors.passwordConfirm) {
        setError('A senha deve ter no mínimo 8 caracteres e coincidir.')
      } else {
        setError('Não foi possível concluir o cadastro. Verifique os dados e tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submissão de Recuperação de Senha
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setForgotNotice(null)

    if (!forgotEmail.trim()) {
      setError('Por favor, informe seu e-mail de acesso.')
      return
    }

    setIsSubmitting(true)

    try {
      await requestPasswordReset(forgotEmail.trim().toLowerCase())
      setForgotSuccess(true)
      setForgotNotice(
        'Caso o e-mail esteja cadastrado, enviamos as instruções para redefinição da sua senha. Verifique sua caixa de entrada e de spam.',
      )
    } catch {
      // Caso o backend não possua provedor de SMTP configurado ou haja restrição de envio de e-mails
      // Mostramos a mensagem amigável sem expor erro técnico e orientamos o corretor
      setForgotSuccess(true)
      setForgotNotice(
        'Solicitação registrada! Se o envio de e-mail automático estiver indisponível no servidor, entre em contato direto com o Administrador Master (Silvio) para redefinir sua senha.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F4EBE1] to-[#EBDCCE] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E6DFD6] p-8 animate-fade-in-up">
        {/* Topo / Marca */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#C2501A] flex items-center justify-center text-white mx-auto mb-4 shadow-md shadow-orange-900/20">
            <Trees className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2E2A25]">JD Europa</h1>
          <p className="text-sm text-[#6E675F] mt-1">
            Sistema de Vendas & Simulador de Parcelamento
          </p>
        </div>

        {/* Abas Alternadoras: Entrar vs Criar Conta (quando não estiver em 'forgot-password') */}
        {mode !== 'forgot-password' && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FAF7F2] rounded-xl border border-[#E6DFD6] mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#C2501A] shadow-sm font-bold'
                  : 'text-[#6E675F] hover:text-[#2E2A25]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-[#C2501A] shadow-sm font-bold'
                  : 'text-[#6E675F] hover:text-[#2E2A25]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Criar Conta
            </button>
          </div>
        )}

        {/* Cabeçalho específico do modo Esqueci a Senha */}
        {mode === 'forgot-password' && (
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E675F] hover:text-[#C2501A] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Login
            </button>
            <span className="text-xs font-semibold text-[#2E2A25] flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-[#C2501A]" />
              Redefinir Senha
            </span>
          </div>
        )}

        {/* Mensagem de Erro Geral */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#C0392B] mt-0.5" />
            <span className="font-medium text-xs leading-relaxed">{error}</span>
          </div>
        )}

        {/* FORMULÁRIO 1: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="login-email"
                className="text-xs font-semibold uppercase tracking-wider text-[#6E675F]"
              >
                E-mail do Corretor
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6E675F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="pl-10 h-11 border-[#E6DFD6] focus-visible:ring-[#C2501A]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="login-password"
                  className="text-xs font-semibold uppercase tracking-wider text-[#6E675F]"
                >
                  Senha de Acesso
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail !== 'gabsilvio@gmail.com' ? loginEmail : '')
                    switchMode('forgot-password')
                  }}
                  className="text-xs font-semibold text-[#C2501A] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6E675F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="login-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
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
        )}

        {/* FORMULÁRIO 2: REGISTRAR (CRIAR CONTA DE CORRETOR) */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <Label
                htmlFor="reg-nome"
                className="text-xs font-semibold uppercase tracking-wider text-[#6E675F]"
              >
                Nome Completo
              </Label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6E675F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="reg-nome"
                  type="text"
                  required
                  value={regNome}
                  onChange={(e) => setRegNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="pl-10 h-10 border-[#E6DFD6] focus-visible:ring-[#C2501A]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="reg-email"
                className="text-xs font-semibold uppercase tracking-wider text-[#6E675F]"
              >
                E-mail
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6E675F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="reg-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="pl-10 h-10 border-[#E6DFD6] focus-visible:ring-[#C2501A]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="reg-telefone"
                className="text-xs font-semibold uppercase tracking-wider text-[#6E675F]"
              >
                WhatsApp / Celular
              </Label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#6E675F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="reg-telefone"
                  type="tel"
                  value={regTelefone}
                  onChange={(e) => setRegTelefone(aplicarMascaraTelefone(e.target.value))}
                  placeholder="(11) 98765-4321"
                  className="pl-10 h-10 border-[#E6DFD6] focus-visible:ring-[#C2501A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="reg-password"
                  className="text-xs font-semibold uppercase tracking-wider text-[#6E675F]"
                >
                  Senha (mín. 8)
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="reg-password"
                    type="password"
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 h-10 border-[#E6DFD6] focus-visible:ring-[#C2501A]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="reg-confirm"
                  className="text-xs font-semibold uppercase tracking-wider text-[#6E675F]"
                >
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6E675F] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="reg-confirm"
                    type="password"
                    required
                    minLength={8}
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 h-10 border-[#E6DFD6] focus-visible:ring-[#C2501A]"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#6E675F] leading-tight">
              Sua conta será criada com perfil de{' '}
              <strong className="text-[#2E2A25]">Corretor</strong> para acesso imediato ao
              Simulador, Lotes e Clientes.
            </p>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#C2501A] hover:bg-[#A84415] text-white font-semibold text-sm rounded-xl shadow-sm transition-all hover-lift mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Concluir Cadastro & Entrar'
              )}
            </Button>
          </form>
        )}

        {/* FORMULÁRIO 3: ESQUECI MINHA SENHA */}
        {mode === 'forgot-password' && (
          <div className="space-y-4">
            {forgotSuccess ? (
              <div className="space-y-4 text-center animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#2E2A25]">Solicitação Enviada!</h3>
                <p className="text-xs text-[#6E675F] leading-relaxed bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E6DFD6]">
                  {forgotNotice}
                </p>
                <Button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full h-10 bg-[#C2501A] hover:bg-[#A84415] text-white font-semibold text-xs rounded-xl"
                >
                  Voltar ao Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-[#6E675F] leading-relaxed">
                  Digite seu e-mail cadastrado. O sistema gerará o link para você redefinir sua
                  senha com segurança.
                </p>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="forgot-email"
                    className="text-xs font-semibold uppercase tracking-wider text-[#6E675F]"
                  >
                    Seu E-mail Cadastrado
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#6E675F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="forgot-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="pl-10 h-11 border-[#E6DFD6] focus-visible:ring-[#C2501A]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[#C2501A] hover:bg-[#A84415] text-white font-semibold text-sm rounded-xl shadow-sm transition-all hover-lift"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando solicitação...
                    </>
                  ) : (
                    'Enviar Link de Redefinição'
                  )}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Dica do usuário de teste (apenas na aba login para manter o card limpo) */}
        {mode === 'login' && (
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
              Novos corretores podem se registrar diretamente na aba{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="font-semibold text-[#C2501A] underline"
              >
                Criar Conta
              </button>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
