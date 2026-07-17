import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Save, Scale } from 'lucide-react'
import { useFirestoreMutation } from '@/hooks/useFirestore'
import { GrupoInsumos } from '../ProducaoPage'

interface Props {
  lote: any;
  onClose: () => void;
}

export function EditarInsumosModal({ lote, onClose }: Props) {
  const [grupos, setGrupos] = useState<GrupoInsumos[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  const { update: updateLote } = useFirestoreMutation<any>('producao')

  useEffect(() => {
    if (lote && lote.insumosAgrupados) {
      setGrupos(JSON.parse(JSON.stringify(lote.insumosAgrupados)))
    }
  }, [lote])

  const handleUpdateQty = (grupoIndex: number, itemIndex: number, newQty: number) => {
    if (newQty < 0) return;
    const newGrupos = [...grupos]
    newGrupos[grupoIndex].itens[itemIndex].quantidadeParaBaixar = newQty
    setGrupos(newGrupos)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Criar a lista flat para baixaEstoque (compatibilidade)
      const novosInsumosNecessarios: any[] = []
      
      grupos.forEach(grupo => {
        grupo.itens.forEach(item => {
          if (item.quantidadeParaBaixar > 0) {
            // Verifica se já existe para somar (caso existam insumos repetidos em grupos diferentes)
            const existente = novosInsumosNecessarios.find(i => i.insumoId === item.insumoId)
            if (existente) {
              existente.quantidadeParaBaixar += item.quantidadeParaBaixar
            } else {
              novosInsumosNecessarios.push({
                insumoId: item.insumoId,
                insumoNome: item.insumoNome,
                unidade: item.unidade,
                quantidadeParaBaixar: item.quantidadeParaBaixar
              })
            }
          }
        })
      })

      // Atualizar o documento da Ordem de Produção (Lote)
      await updateLote.mutateAsync({ 
        id: lote.id, 
        data: { 
          insumosAgrupadosEditados: grupos,
          insumosNecessarios: novosInsumosNecessarios 
        } 
      })

      onClose()
    } catch (error: any) {
      alert('Erro ao salvar insumos: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-dolce-marrom/40 backdrop-blur-sm transition-opacity" />
        <Dialog.Content 
          className="fixed z-[60] bg-white p-5 md:p-6 shadow-2xl transition-transform animate-in
                     bottom-0 left-0 right-0 w-full rounded-t-3xl max-h-[90vh] overflow-y-auto slide-in-from-bottom
                     md:bottom-auto md:top-[50%] md:left-[50%] md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:rounded-2xl md:zoom-in-95"
        >
          <div className="md:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
          
          <div className="flex justify-between items-center mb-5">
            <Dialog.Title className="text-xl font-bold text-dolce-marrom flex items-center gap-2">
              <Scale className="w-5 h-5 text-dolce-rosa" />
              Editar Insumos
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-dolce-marrom/50 hover:bg-dolce-rosa-claro hover:text-dolce-marrom rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mb-6 text-sm text-dolce-marrom/70">
            Ajuste a quantidade de insumos que serão consumidos neste pedido. 
            Esses valores definirão a baixa no estoque.
          </div>

          <div className="space-y-6 mb-8 max-h-[50vh] overflow-y-auto pr-2">
            {grupos.map((grupo, gIndex) => (
              <div key={gIndex} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <div className="bg-orange-100 px-4 py-2 font-bold text-sm text-dolce-marrom uppercase">
                  {grupo.titulo}
                </div>
                <div className="p-2 space-y-2">
                  {grupo.itens.map((item, iIndex) => (
                    <div key={iIndex} className="flex flex-col gap-1 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-dolce-marrom truncate">{item.insumoNome}</span>
                        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{item.unidade}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Qtd. a baixar:</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantidadeParaBaixar}
                            onChange={(e) => handleUpdateQty(gIndex, iIndex, parseFloat(e.target.value) || 0)}
                            className="w-20 text-right font-bold text-dolce-marrom bg-gray-50 border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {grupo.itens.length === 0 && (
                    <div className="text-xs text-center text-gray-400 p-2">Sem insumos associados</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 bg-gray-100 text-dolce-marrom font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              type="button"
              className="flex-1 bg-dolce-rosa text-white font-bold py-3.5 rounded-xl hover:bg-dolce-rosa/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSaving ? 'Salvando...' : (
                <>
                  <Save className="w-5 h-5" /> Salvar
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
