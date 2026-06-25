import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { Settings, Store, Camera, Check, Lock, ChevronRight, Download } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function ConfiguracoesPage() {
  const { user } = useAuth()
  const { data: configs, isLoading } = useFirestoreCollection<any>('configuracoes')
  const { add, update } = useFirestoreMutation<any>('configuracoes')
  const { isInstallable, isInstalled, install } = usePWAInstall()

  const configDoc = configs?.find(c => c.id === 'global') || configs?.[0]
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Sincroniza estado inicial ao carregar a doc do banco
  useEffect(() => {
    if (configDoc?.nomeNegocio) {
      setNomeNegocio(configDoc.nomeNegocio)
    }
  }, [configDoc])

  const handleSave = async () => {
    setIsSaving(true)
    setIsSaved(false)
    
    try {
      if (configDoc) {
        await update.mutateAsync({ id: configDoc.id, data: { nomeNegocio } })
      } else {
        await add.mutateAsync({ id: 'global', nomeNegocio })
      }
      
      // Feedback visual de sucesso
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      console.error('Erro ao salvar config', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="flex justify-center p-8 text-dolce-marrom/50">Carregando Configurações...</div>

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-dolce-rosa-claro p-3 rounded-2xl">
          <Settings className="w-7 h-7 text-dolce-rosa" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-dolce-marrom tracking-tight">Configurações</h2>
          <p className="text-sm text-dolce-marrom/60 mt-1">Gerencie os dados e a identidade da sua doceria.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* LOGO E CAPA (ESPAÇO FUTURO) */}
        <div className="h-32 bg-gradient-to-r from-dolce-rosa-claro/50 to-dolce-rosa/20 relative">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-md border border-gray-100 relative group cursor-pointer hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 group-hover:border-dolce-rosa transition-colors">
                <Store className="w-8 h-8 text-gray-300" />
              </div>
              <div className="absolute bottom-0 right-0 bg-dolce-rosa text-white p-1.5 rounded-full shadow-sm border-2 border-white">
                <Camera className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <div className="pt-16 p-6 md:p-8 space-y-8">
          
          {/* Seção: Identidade */}
          <div>
            <h3 className="text-lg font-bold text-dolce-marrom mb-4 flex items-center gap-2">
              Perfil da Confeitaria
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Nome do Estabelecimento</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom font-medium rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
                  value={nomeNegocio}
                  onChange={e => setNomeNegocio(e.target.value)}
                  placeholder="Ex: Doce Neves"
                />
                <p className="text-xs text-gray-400 mt-1.5 ml-1">
                  Este nome aparecerá em relatórios e futuramente na impressão de cupons.
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* Seção: Segurança */}
          <div>
            <h3 className="text-lg font-bold text-dolce-marrom mb-4 flex items-center gap-2">
              Conta e Acesso
            </h3>
            
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-gray-400">
                <Lock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Usuário Logado (E-mail)</label>
                <div className="font-semibold text-gray-700">
                  {user?.email || 'Desconhecido'}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* Seção: Aplicativo (PWA) */}
          <div>
            <h3 className="text-lg font-bold text-dolce-marrom mb-4">Aplicativo</h3>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-gray-700">Instalar no Dispositivo</div>
                <div className="text-sm text-gray-400 mt-0.5 max-w-sm">
                  Baixe o Dolce Neves diretamente para sua tela inicial. Mais rápido, em tela cheia e sem precisar do navegador.
                </div>
              </div>
              
              {isInstalled ? (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold border border-emerald-200 shadow-sm whitespace-nowrap">
                  <Check className="w-5 h-5" />
                  Instalado
                </div>
              ) : isInstallable ? (
                <button 
                  onClick={install}
                  className="flex items-center gap-2 bg-dolce-marrom hover:bg-dolce-marrom/90 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
                >
                  <Download className="w-5 h-5" />
                  Instalar App
                </button>
              ) : (
                <div className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-center max-w-[160px]">
                  Instalação não suportada ou já instalada neste navegador
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* Seção: Outros Ajustes (Futuro) */}
          <div className="opacity-50 cursor-not-allowed">
            <h3 className="text-lg font-bold text-dolce-marrom mb-4">Mais Opções</h3>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-700">Notificações no WhatsApp</div>
                <div className="text-sm text-gray-400">Em breve</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>
          </div>

        </div>
        
        {/* FOOTER / AÇÕES */}
        <div className="bg-gray-50 p-6 md:p-8 flex justify-end items-center border-t border-gray-100">
          <button 
            onClick={handleSave}
            disabled={isSaving || isSaved}
            className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-white shadow-sm transition-all active:scale-[0.98] flex justify-center items-center gap-2
              ${isSaved 
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_14px_rgba(16,185,129,0.4)]' 
                : isSaving
                  ? 'bg-dolce-rosa/50 cursor-wait'
                  : 'bg-dolce-rosa hover:bg-dolce-rosa/90 shadow-[0_4px_14px_rgba(201,107,122,0.4)]'
              }`}
          >
            {isSaved ? (
              <>
                <Check className="w-5 h-5" />
                Salvo com sucesso!
              </>
            ) : isSaving ? (
              'Salvando...'
            ) : (
              'Salvar Configurações'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
