import { useLocation, Link, useNavigate, Outlet } from 'react-router-dom'
import {
  Calculator,
  Grid,
  Users,
  Settings,
  LogOut,
  MapPin,
  Trees,
  UserCheck,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, isMaster } = useAuth()

  const navItems = [
    { path: '/simulador', label: 'Simulador', icon: Calculator, masterOnly: false },
    { path: '/lotes', label: 'Lotes', icon: Grid, masterOnly: false },
    { path: '/cliente', label: 'Clientes', icon: Users, masterOnly: false },
    ...(isMaster
      ? [
          { path: '/corretores', label: 'Corretores', icon: UserCheck, masterOnly: true },
          { path: '/configuracoes', label: 'Configurações', icon: Settings, masterOnly: true },
        ]
      : []),
  ]

  // Se for a rota de login, não mostra sidebar nem header
  if (location.pathname === '/login' || !isAuthenticated) {
    return <Outlet />
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/simulador':
        return 'Simulador de Parcelamento'
      case '/lotes':
        return 'Gerenciamento de Lotes'
      case '/cliente':
        return 'Cadastro de Clientes'
      case '/corretores':
        return 'Gestão de Corretores'
      case '/configuracoes':
        return 'Configurações de Venda'
      default:
        return 'Jd Europa'
    }
  }

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] text-[#2E2A25]">
      {/* Sidebar Desktop (>= 1025px normal, 641-1024px compacto) */}
      <aside className="no-print hidden md:flex flex-col border-r border-[#E6DFD6] bg-white w-64 lg:w-64 md:w-20 shrink-0 transition-all duration-200">
        {/* Marca / Logo */}
        <div className="h-16 flex items-center gap-3 px-4 md:px-3 lg:px-5 border-b border-[#E6DFD6]">
          <div className="w-10 h-10 rounded-xl bg-[#C2501A] flex items-center justify-center text-white shadow-sm shrink-0">
            <Trees className="w-5 h-5 text-white" />
          </div>
          <div className="hidden lg:block overflow-hidden">
            <h1 className="font-bold text-base tracking-tight leading-tight text-[#2E2A25]">
              Jd Europa
            </h1>
            <p className="text-xs text-[#6E675F] font-medium">Vendas & Financiamento</p>
          </div>
        </div>

        {/* Links de navegação */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#C2501A] text-white shadow-sm'
                    : 'text-[#6E675F] hover:bg-[#FAF7F2] hover:text-[#2E2A25]'
                } justify-center lg:justify-start`}
                title={item.label}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-[#6E675F]'}`}
                />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Rodapé da sidebar com usuário e logout */}
        <div className="p-3 border-t border-[#E6DFD6]">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF7F2] mb-2 justify-center lg:justify-start">
            <div
              className={`w-8 h-8 rounded-full ${isMaster ? 'bg-[#C2501A]' : 'bg-[#4A7C59]'} text-white flex items-center justify-center font-semibold text-xs shrink-0`}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden lg:block min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-[#2E2A25] truncate">
                  {user?.name || (isMaster ? 'Master' : 'Corretor')}
                </p>
                {isMaster && (
                  <span className="text-[10px] bg-orange-100 text-[#C2501A] px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                    Master
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6E675F] truncate">
                {user?.email || 'gabsilvio@gmail.com'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-center lg:justify-start text-xs text-[#C0392B] hover:text-[#C0392B] hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-0 lg:mr-2 shrink-0" />
            <span className="hidden lg:inline">Sair do sistema</span>
          </Button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Header */}
        <header className="no-print h-16 bg-white border-b border-[#E6DFD6] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            {/* Logo visível apenas no mobile */}
            <div className="md:hidden w-8 h-8 rounded-lg bg-[#C2501A] flex items-center justify-center text-white shrink-0 mr-1">
              <Trees className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#2E2A25]">{getPageTitle()}</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-[#6E675F]">
                <MapPin className="w-3 h-3 text-[#4A7C59]" />
                <span>Loteamento Jd Europa • Quadras S1–Y1</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-right">
              <span className="text-xs font-medium text-[#2E2A25]">
                {user?.name || (isMaster ? 'Silvio (Master)' : 'Corretor')}
              </span>
              {isMaster ? (
                <span className="text-[10px] bg-[#C2501A]/10 text-[#C2501A] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Master
                </span>
              ) : (
                <span className="text-[10px] bg-[#4A7C59]/10 text-[#4A7C59] px-2 py-0.5 rounded-full font-semibold">
                  Corretor
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs border-[#E6DFD6] hover:bg-red-50 hover:text-[#C0392B] hover:border-red-200"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Sair
            </Button>
          </div>
        </header>

        {/* Viewport da Página */}
        <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto animate-fade-in-up">
          <Outlet />
        </main>
      </div>

      {/* Bottom Tab Bar Mobile (< 768px) */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E6DFD6] z-40 flex items-center justify-around h-16 px-1 safe-bottom">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                isActive ? 'text-[#C2501A]' : 'text-[#6E675F] hover:text-[#2E2A25]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-[#C2501A] rounded-b-full transition-all" />
              )}
              <Icon className="w-5 h-5 mb-0.5" />
              <span
                className={`text-[9px] font-medium leading-tight ${isActive ? 'font-bold' : ''}`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
