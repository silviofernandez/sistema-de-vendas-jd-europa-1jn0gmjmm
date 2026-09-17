import { useState, useEffect } from 'react'
import { Download, Share, PlusSquare, Smartphone, Laptop, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIosOrIpad, setIsIosOrIpad] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    // Verifica se já está rodando em modo standalone (PWA instalado)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
      setIsStandalone(isStandaloneMode)
    }

    checkStandalone()

    // Detecta iOS ou iPadOS (onde beforeinstallprompt não existe)
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIos =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    setIsIosOrIpad(isIos)

    // Captura evento beforeinstallprompt (Android / Chrome Desktop / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  // Se já estiver instalado ou se o usuário fechou o banner nesta sessão
  if (isStandalone || dismissed) {
    return null
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else if (isIosOrIpad) {
      setShowIosGuide(!showIosGuide)
    } else {
      // Outros navegadores sem suporte direto ao prompt
      alert(
        'Para instalar este aplicativo no seu computador ou celular, abra o menu do seu navegador (⋮) e clique em "Instalar aplicativo" ou "Adicionar à tela de início".',
      )
    }
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 via-[#FAF7F2] to-amber-50 border border-[#C2501A]/30 rounded-2xl p-4 shadow-sm mb-6 transition-all animate-fade-in no-print">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C2501A] text-white flex items-center justify-center shadow-xs shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-[#2E2A25]">
                Instalar App Jd Europa no seu Dispositivo
              </h4>
              <span className="text-[10px] bg-[#C2501A]/10 text-[#C2501A] px-2 py-0.5 rounded-full font-bold">
                PWA
              </span>
            </div>
            <p className="text-xs text-[#6E675F] mt-0.5">
              Tenha acesso direto com um clique na tela inicial do seu celular, iPad, notebook ou
              computador.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <Button
            type="button"
            onClick={handleInstallClick}
            className="h-9 bg-[#C2501A] hover:bg-[#A84415] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
          >
            <Download className="w-4 h-4" />
            {isIosOrIpad ? 'Como Instalar no iPhone/iPad' : 'Instalar Aplicativo'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-9 w-9 p-0 text-[#6E675F] hover:text-[#2E2A25] rounded-xl shrink-0"
            title="Fechar aviso de instalação"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Guia interativo para iPhone/iPad */}
      {showIosGuide && isIosOrIpad && (
        <div className="mt-3.5 pt-3.5 border-t border-[#C2501A]/20 bg-white/70 p-3 rounded-xl text-xs space-y-2 animate-fade-in">
          <div className="font-bold text-[#2E2A25] flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#C2501A]" />
            Passo a passo para instalar no Safari (iOS / iPadOS):
          </div>
          <ol className="list-decimal pl-4 space-y-1.5 text-[#6E675F]">
            <li className="flex items-center gap-1.5">
              <span>
                Toque no botão de <b>Compartilhar</b>
              </span>
              <Share className="w-3.5 h-3.5 text-[#C2501A] inline" />
              <span>(na barra inferior do Safari).</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span>
                Role para baixo e selecione <b>Adicionar à Tela de Início</b>
              </span>
              <PlusSquare className="w-3.5 h-3.5 text-[#C2501A] inline" />
              <span>.</span>
            </li>
            <li>
              <span>
                Toque em <b>Adicionar</b> no canto superior direito. Pronto! O ícone ficará na sua
                tela principal.
              </span>
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
