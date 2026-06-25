import { useState } from 'react'
import { useFirestoreMutation } from '@/hooks/useFirestore'
import { useProdutosDinamicos } from '@/hooks/useProdutosDinamicos'
import { ProdutoForm, ProdutoFormData } from './ProdutoForm'
import { Plus, Pencil, Trash2, BookOpen, Calculator, X, CakeSlice } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

export function ProdutosPage() {
  const { data: produtos, isLoading } = useProdutosDinamicos()
  const { add, update, remove } = useFirestoreMutation<ProdutoFormData & {id: string}>('produtos')
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<(ProdutoFormData & {id: string}) | null>(null)

  const handleOpenNew = () => {
    setEditingProduto(null)
    setIsFormOpen(true)
  }

  const handleSubmit = async (data: ProdutoFormData) => {
    if (editingProduto) {
      await update.mutateAsync({ id: editingProduto.id, data })
    } else {
      await add.mutateAsync(data)
    }
    setIsFormOpen(false)
  }

  if (isLoading) return <div className="flex justify-center p-8 text-dolce-marrom/50">Carregando Fichas Técnicas...</div>

  return (
    <div className="flex flex-col gap-6 w-full relative min-h-full">
      {/* HEADER E BOTÃO DESKTOP */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-dolce-rosa-claro p-3 rounded-2xl hidden sm:block">
            <BookOpen className="w-7 h-7 text-dolce-rosa" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-dolce-marrom tracking-tight">Fichas Técnicas</h2>
            <p className="text-sm text-dolce-marrom/60 mt-1">Crie receitas, defina rendimentos e ajuste os preços.</p>
          </div>
        </div>
        
        {/* Botão Desktop */}
        <button 
          onClick={handleOpenNew} 
          className="hidden md:flex items-center gap-2 bg-dolce-rosa hover:bg-dolce-rosa/90 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </div>

      {/* MODAL / BOTTOM SHEET DO FORMULÁRIO */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-dolce-marrom/40 backdrop-blur-sm transition-opacity" />
          <Dialog.Content 
            className="fixed z-50 bg-white p-5 md:p-6 shadow-2xl transition-transform animate-in
                       /* Mobile: Bottom Sheet */
                       bottom-0 left-0 right-0 w-full rounded-t-3xl h-[92vh] overflow-hidden slide-in-from-bottom flex flex-col
                       /* Desktop: Modal Centralizado */
                       md:bottom-auto md:top-[50%] md:left-[50%] md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-3xl md:w-full md:rounded-2xl md:h-[85vh] md:zoom-in-95"
          >
            {/* Grabber visual para mobile */}
            <div className="md:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0"></div>
            
            <div className="flex justify-between items-center mb-4 shrink-0">
              <Dialog.Title className="text-xl font-bold text-dolce-marrom flex items-center gap-2">
                <Calculator className="w-6 h-6 text-dolce-rosa" />
                {editingProduto ? 'Editar Ficha Técnica' : 'Nova Ficha Técnica'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 text-dolce-marrom/50 hover:bg-dolce-rosa-claro hover:text-dolce-marrom rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto pb-6 pr-1 custom-scrollbar">
              <ProdutoForm 
                initialData={editingProduto || undefined} 
                onSubmit={handleSubmit} 
                onCancel={() => setIsFormOpen(false)} 
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* LISTAGEM (CARDS MOBILE / GRID DESKTOP) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 md:pb-0">
        {produtos?.filter(p => p.ativo !== false).map(produto => (
          <div key={produto.id} className="bg-white rounded-2xl shadow-sm border border-dolce-rosa-claro/50 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
            
            {/* Card Header */}
            <div className="p-5 pb-3 border-b border-gray-50">
              <h4 className="font-bold text-lg text-dolce-marrom line-clamp-1">{produto.nome}</h4>
              <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold text-dolce-marrom/60">
                <CakeSlice className="w-4 h-4 text-dolce-rosa/70" />
                Rendimento: {produto.rendimentoReceita} un.
              </div>
            </div>

            {/* Card Body (Custos) */}
            <div className="p-5 flex flex-col gap-3 flex-1 bg-gray-50/30">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                <span className="text-sm font-semibold text-dolce-marrom/70">Custo (un.)</span>
                <span className="font-bold text-rose-600">
                  R$ {produto.custoUnitario?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                <span className="text-sm font-semibold text-emerald-800">Venda Sugerida</span>
                <span className="font-black text-lg text-emerald-700">
                  R$ {produto.precoVendaCalculado?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-2 border-t border-gray-50 flex justify-end gap-1">
              <button 
                onClick={() => { setEditingProduto(produto); setIsFormOpen(true) }} 
                className="flex-1 py-2 px-3 flex justify-center items-center gap-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <Pencil className="w-4 h-4" /> Editar
              </button>
              <div className="w-px bg-gray-200 my-2"></div>
              <button 
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja remover este produto?')) {
                    remove.mutateAsync(produto.id)
                  }
                }} 
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                aria-label="Remover"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        
        {produtos?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-dolce-rosa-claro text-dolce-marrom/50">
            <BookOpen className="w-16 h-16 mb-4 opacity-30 text-dolce-rosa" />
            <h3 className="text-lg font-bold mb-1 text-dolce-marrom">Nenhuma Ficha Técnica</h3>
            <p className="text-sm font-medium text-center px-4 max-w-sm">
              Comece cadastrando suas receitas para ter o controle exato dos seus custos e preços de venda.
            </p>
            <button 
              onClick={handleOpenNew} 
              className="mt-6 flex items-center gap-2 bg-dolce-rosa text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Produto
            </button>
          </div>
        )}
      </div>

      {/* FAB (Floating Action Button) MOBILE */}
      <button
        onClick={handleOpenNew}
        className="md:hidden fixed bottom-24 right-5 z-40 bg-dolce-rosa text-white p-4 rounded-2xl shadow-[0_4px_14px_rgba(201,107,122,0.4)] hover:scale-105 active:scale-95 transition-transform"
        aria-label="Nova Ficha Técnica"
      >
        <Plus className="w-7 h-7" />
      </button>

    </div>
  )
}
