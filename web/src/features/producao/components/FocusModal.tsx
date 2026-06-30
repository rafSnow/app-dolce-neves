import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Clock, Play, Pause, CheckCircle, X, PackageOpen, CheckSquare } from 'lucide-react'

interface Props {
  lote: any
  onClose: () => void
  onUpdateState: (data: Partial<any>) => Promise<void>
  onConcluir: () => Promise<void>
}

export function FocusModal({ lote, onClose, onUpdateState, onConcluir }: Props) {
  const [now, setNow] = useState(Date.now())
  const [isFinishing, setIsFinishing] = useState(false)

  // Force re-render every second to update the timer
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const isRunning = lote.status === 'Em Andamento' && !!lote.focoInicioAt
  const accumulatedSecs = lote.focoAcumuladoSegundos || 0
  const runningSecs = isRunning ? Math.floor((now - lote.focoInicioAt) / 1000) : 0
  const totalSecs = accumulatedSecs + runningSecs

  const hours = Math.floor(totalSecs / 3600)
  const minutes = Math.floor((totalSecs % 3600) / 60)
  const seconds = totalSecs % 60

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const handleToggle = async () => {
    if (isRunning) {
      // Pause
      await onUpdateState({
        status: 'Em Andamento',
        focoInicioAt: null,
        focoAcumuladoSegundos: totalSecs
      })
    } else {
      // Play
      await onUpdateState({
        status: 'Em Andamento',
        focoInicioAt: Date.now(),
        focoAcumuladoSegundos: totalSecs // keeping what we already have
      })
    }
  }

  const handleConcluir = async () => {
    if (!window.confirm('Tem certeza que deseja encerrar a produção? O tempo real será salvo e o estoque será baixado.')) return
    setIsFinishing(true)
    
    // Save final time before completing
    const finalSecs = totalSecs
    await onUpdateState({
      focoAcumuladoSegundos: finalSecs,
      tempoRealMinutos: Math.ceil(finalSecs / 60),
      focoInicioAt: null
    })

    try {
      await onConcluir()
      onClose()
    } catch (e) {
      setIsFinishing(false)
    }
  }

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all" />
        <Dialog.Content 
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
        >
          
          <div className="bg-orange-500 p-6 text-white text-center relative flex flex-col items-center">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-widest text-orange-200 mb-2">Modo Foco</h2>
            <div className="text-6xl font-black font-mono tracking-tighter shadow-sm">{timeString}</div>
            
            <div className="mt-6 flex gap-4">
              <button 
                onClick={handleToggle}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${isRunning ? 'bg-orange-700 text-white' : 'bg-white text-orange-600'}`}
              >
                {isRunning ? (
                  <><Pause className="w-5 h-5" /> Pausar</>
                ) : (
                  <><Play className="w-5 h-5" /> Iniciar</>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
            <h3 className="font-bold text-xl text-dolce-marrom mb-4">Pedido: {lote.clienteNome}</h3>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4">
              <strong className="text-sm text-dolce-marrom/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <PackageOpen className="w-4 h-4" /> Produzir
              </strong>
              <ul className="space-y-2">
                {lote.produtos?.map((p: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-dolce-marrom font-medium text-lg">
                    <span className="font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded">{p.quantidade}x</span>
                    <span className="pt-0.5">{p.nome}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <strong className="text-sm text-dolce-marrom/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" /> Insumos Separados?
              </strong>
              <div className="space-y-4 mt-3">
                {lote.insumosAgrupados && lote.insumosAgrupados.length > 0 ? (
                  lote.insumosAgrupados.map((grupo: any, gIdx: number) => (
                    <div key={gIdx} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <strong className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">
                        {grupo.titulo}
                      </strong>
                      <div className="space-y-2">
                        {grupo.itens.map((ins: any, i: number) => (
                          <label key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer hover:bg-emerald-50 transition-colors shadow-sm">
                            <input type="checkbox" className="w-5 h-5 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500 transition-all" />
                            <span className="text-dolce-marrom flex-1">
                              <span className="font-bold">{ins.quantidadeParaBaixar.toFixed(2)} {ins.unidade}</span> de {ins.insumoNome}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    {lote.insumosNecessarios?.map((ins: any, i: number) => (
                      <label key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                        <input type="checkbox" className="w-5 h-5 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500 transition-all" />
                        <span className="text-dolce-marrom flex-1">
                          <span className="font-bold">{ins.quantidadeParaBaixar.toFixed(2)} {ins.unidade}</span> de {ins.insumoNome}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <button 
              onClick={handleConcluir}
              disabled={isFinishing}
              className="w-full flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] text-lg"
            >
              <CheckCircle className="w-6 h-6" />
              {isFinishing ? 'Concluindo...' : 'Encerrar e Concluir Pedido'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
