import { useState, useMemo } from 'react'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { InsumoForm, InsumoFormData } from './InsumoForm'
import { RegistrarCompraModal } from './RegistrarCompraModal'
import { Pencil, Trash2, Plus, ShoppingCart, AlertCircle, PackageOpen, X, Search } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { useConfirm } from '@/contexts/ConfirmContext'
import { toast } from 'sonner'

export function InsumosPage() {
  const { data: insumos, isLoading } = useFirestoreCollection<InsumoFormData & {id: string}>('insumos')
  const { add, update, remove } = useFirestoreMutation<InsumoFormData & {id: string}>('insumos')
  const confirm = useConfirm()
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<(InsumoFormData & {id: string}) | null>(null)
  const [buyingInsumo, setBuyingInsumo] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleOpenNew = () => {
    setEditingInsumo(null)
    setIsFormOpen(true)
  }

  const handleSubmit = async (data: InsumoFormData) => {
    try {
      if (editingInsumo) {
        await update.mutateAsync({ id: editingInsumo.id, data })
        toast.success('Insumo atualizado com sucesso!')
      } else {
        await add.mutateAsync(data)
        toast.success('Insumo cadastrado com sucesso!')
      }
      setIsFormOpen(false)
    } catch (error: any) {
      toast.error('Erro ao salvar insumo: ' + error.message)
    }
  }

  const filteredInsumos = useMemo(() => {
    if (!insumos) return []
    return insumos
      .filter(i => i.ativo !== false)
      .filter(i => 
        i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      )
  }, [insumos, searchTerm])

  if (isLoading) return <div className="flex justify-center p-8 text-dolce-marrom/50">Carregando insumos...</div>

  return (
    <div className="flex flex-col gap-6 w-full relative min-h-full">
      {/* HEADER DE TÍTULO E BOTÃO DESKTOP */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-3xl font-bold text-dolce-marrom tracking-tight">Gestão de Insumos</h2>
        
        {/* Botão Desktop */}
        <button 
          onClick={handleOpenNew} 
          className="hidden md:flex items-center gap-2 bg-dolce-rosa hover:bg-dolce-rosa/90 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Insumo
        </button>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-dolce-marrom/40" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-3 bg-white/70 border border-gray-200 rounded-2xl text-dolce-marrom placeholder-dolce-marrom/40 focus:outline-none focus:ring-2 focus:ring-dolce-rosa focus:border-transparent transition-all shadow-sm font-medium"
          placeholder="Buscar por nome ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* FORMULÁRIO MODAL / BOTTOM SHEET */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-dolce-marrom/40 backdrop-blur-sm transition-opacity" />
          <Dialog.Content 
            className="fixed z-50 bg-white p-5 md:p-6 shadow-2xl transition-transform animate-in
                       /* Mobile: Bottom Sheet */
                       bottom-0 left-0 right-0 w-full rounded-t-3xl max-h-[90vh] overflow-y-auto slide-in-from-bottom
                       /* Desktop: Modal Centralizado */
                       md:bottom-auto md:top-[50%] md:left-[50%] md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:rounded-2xl md:zoom-in-95"
          >
            {/* Grabber visual para mobile */}
            <div className="md:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-bold text-dolce-marrom">
                {editingInsumo ? 'Editar Insumo' : 'Novo Insumo'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 text-dolce-marrom/50 hover:bg-dolce-rosa-claro hover:text-dolce-marrom rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <InsumoForm 
              initialData={editingInsumo || undefined} 
              onSubmit={handleSubmit} 
              onCancel={() => setIsFormOpen(false)} 
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL DE COMPRA */}
      {buyingInsumo && (
        <RegistrarCompraModal 
          insumo={buyingInsumo} 
          onClose={() => setBuyingInsumo(null)} 
        />
      )}

      {/* LISTAGEM (CARDS MOBILE / GRID DESKTOP) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 md:pb-0">
        {filteredInsumos.map(insumo => {
          const isCritical = insumo.quantidadeDisponivel <= insumo.quantidadeMinima;
          const custoUnidade = insumo.precoCompra / insumo.pesoVolumeTotal;

          return (
            <div key={insumo.id} className="bg-white rounded-2xl shadow-sm border border-dolce-rosa-claro/50 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-5 pb-3 border-b border-gray-50 flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <h4 className="font-bold text-lg text-dolce-marrom line-clamp-1">{insumo.nome}</h4>
                  <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-wider text-dolce-marrom/50 bg-dolce-creme px-2 py-0.5 rounded-md">
                    {insumo.categoria}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl">
                  <span className="text-sm font-medium text-dolce-marrom/70">Estoque Atual</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${isCritical ? 'text-rose-600' : 'text-dolce-marrom'}`}>
                      {insumo.quantidadeDisponivel} {insumo.unidadeMedida}
                    </span>
                    {isCritical && (
                      <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-dolce-marrom/70">Último Preço</span>
                  <span className="text-sm font-bold text-dolce-marrom">
                    R$ {insumo.precoCompra.toFixed(2)} <span className="text-xs text-dolce-marrom/50 font-medium">/ {insumo.pesoVolumeTotal}{insumo.unidadeMedida}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-dolce-marrom/70">Custo Base</span>
                  <span className="text-sm font-bold text-emerald-600">
                    R$ {custoUnidade.toFixed(4)} <span className="text-xs text-emerald-600/70 font-medium">/ {insumo.unidadeMedida}</span>
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-2 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center gap-1">
                <button 
                  onClick={() => setBuyingInsumo(insumo)} 
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Comprar
                </button>
                <button 
                  onClick={() => { setEditingInsumo(insumo); setIsFormOpen(true) }} 
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  aria-label="Editar"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button 
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: 'Remover Insumo',
                      message: 'Tem certeza que deseja remover este insumo?',
                      confirmText: 'Remover',
                      variant: 'danger'
                    })
                    if (confirmed) {
                      try {
                        await remove.mutateAsync(insumo.id)
                        toast.success('Insumo removido.')
                      } catch (error: any) {
                        toast.error('Erro ao remover: ' + error.message)
                      }
                    }
                  }} 
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  aria-label="Remover"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
        
        {insumos?.length === 0 && !searchTerm && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-dolce-rosa-claro text-dolce-marrom/50">
            <PackageOpen className="w-16 h-16 mb-4 opacity-30" />
            <h3 className="text-lg font-bold mb-1">Nenhum insumo encontrado</h3>
            <p className="text-sm font-medium text-center px-4">Cadastre seu primeiro insumo clicando no botão abaixo ou no botão (+).</p>
            <button 
              onClick={handleOpenNew} 
              className="mt-6 flex items-center gap-2 bg-dolce-rosa text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Insumo
            </button>
          </div>
        )}

        {insumos?.length !== 0 && filteredInsumos.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-dolce-marrom/50">
            <Search className="w-16 h-16 mb-4 opacity-30" />
            <h3 className="text-lg font-bold mb-1">Nenhum resultado</h3>
            <p className="text-sm font-medium text-center px-4">Não encontramos insumos para "{searchTerm}".</p>
          </div>
        )}
      </div>

      {/* FAB (Floating Action Button) MOBILE */}
      <button
        onClick={handleOpenNew}
        className="md:hidden fixed bottom-24 right-5 z-40 bg-dolce-rosa text-white p-4 rounded-2xl shadow-[0_4px_14px_rgba(201,107,122,0.4)] hover:scale-105 active:scale-95 transition-transform"
        aria-label="Novo Insumo"
      >
        <Plus className="w-7 h-7" />
      </button>

    </div>
  )
}
