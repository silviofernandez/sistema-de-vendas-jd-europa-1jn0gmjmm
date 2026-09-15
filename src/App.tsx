/* Main App Component - Handles routing, auth provider, config provider and toast notifications */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AuthProvider } from '@/context/AuthContext'
import { ConfigProvider } from '@/context/ConfigContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

import Index from '@/pages/Index'
import Login from '@/pages/Login'
import Simulador from '@/pages/Simulador'
import Lotes from '@/pages/Lotes'
import Clientes from '@/pages/Clientes'
import Corretores from '@/pages/Corretores'
import Configuracoes from '@/pages/Configuracoes'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ConfigProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Rota pública de login */}
            <Route path="/login" element={<Login />} />

            {/* Rotas protegidas dentro do Layout padrão */}
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route
                path="/simulador"
                element={
                  <ProtectedRoute>
                    <Simulador />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lotes"
                element={
                  <ProtectedRoute>
                    <Lotes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cliente"
                element={
                  <ProtectedRoute>
                    <Clientes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/corretores"
                element={
                  <ProtectedRoute masterOnly>
                    <Corretores />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute masterOnly>
                    <Configuracoes />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Rota de fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </ConfigProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
