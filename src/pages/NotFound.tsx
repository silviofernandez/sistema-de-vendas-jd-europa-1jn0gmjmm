import { Link } from 'react-router-dom'
import { Trees, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-4 text-[#2E2A25]">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-[#E6DFD6] shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#C2501A]/10 text-[#C2501A] flex items-center justify-center mx-auto mb-4">
          <Trees className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-[#C2501A] mb-2 font-mono">404</h1>
        <h2 className="text-lg font-bold text-[#2E2A25] mb-2">Página não encontrada</h2>
        <p className="text-xs text-[#6E675F] mb-6">
          A rota solicitada não existe ou foi movida no sistema Jd Europa.
        </p>
        <Link to="/simulador">
          <Button className="bg-[#C2501A] hover:bg-[#A84415] text-white text-xs font-semibold rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Simulador
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFound
