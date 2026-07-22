import { useState, useMemo } from 'react'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { DespesaForm, DespesaFormData } from './DespesaForm'
import { Plus, X, Receipt, Calendar, CheckCircle2, AlertCircle, Pencil, Trash2, Search } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { useConfirm } from '@/contexts/ConfirmContext'
import { toast } from 'sonner'

export function DespesasPage() {
  const { data: despesas, isLoading } = useFirestoreCollection<DespesaFormData & {id: string}>('despesas')
  const { add, update, remove } = useFirestoreMutation<DespesaFormData & {id: string}>('despesas')
  const confirm = useConfirm()
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDespesa, setEditingDespesa] = useState<(DespesaFormData & {id: string}) | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleOpenNew = () => {
    setEditingDespesa(null)
    setIsFormOpen(true)
  }

  const handleSubmit = async (data: DespesaFormData) => {
    try {
      if (editingDespesa) {
        await update.mutateAsync({ id: editingDespesa.id, data })
        toast.success('Despesa atualizada com sucesso!')
      } else {
        await add.mutateAsync(data)
        toast.success('Despesa registrada com sucesso!')
      }
      setIsFormOpen(false)
    } catch (error: any) {
      toast.error('Erro ao salvar despesa: ' + error.message)
    }
  }

  const isOverdue = (vencimento: string, status: string) => {
    if (status === 'Pago') return false
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataVenc = new Date(vencimento)
    // As dates from input type="date" come as YYYY-MM-DD
    // Setting timezone to avoid offset issues
    const venc = new Date(dataVenc.getTime() + dataVenc.getTimezoneOffset() * 60000)
    venc.setHours(0, 0, 0, 0)
    return venc < hoje
  }

  // Ordenar e Filtrar: Vencidas primeiro, depois pendentes por data (mais próximas), depois pagas.
  const sortedAndFilteredDespesas = useMemo(() => {
    if (!despesas) return []
    return [...despesas]
      .filter(d => d.ativo !== false)
      .filter(d => 
        d.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'Pendente' ? -1 : 1
        return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
      })
  }, [despesas, searchTerm])

  if (isLoading) return <div className="flex justify-center p-8 text-dolce-marrom/50">Carregando Despesas...</div>

  return (
    <div className="flex flex-col gap-6 w-full relative min-h-full">
      {/* HEADER E BOTÃO DESKTOP */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-dolce-rosa-claro p-3 rounded-2xl hidden sm:block">
            <Receipt className="w-7 h-7 text-dolce-rosa" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-dolce-marrom tracking-tight">Despesas</h2>
            <p className="text-sm text-dolce-marrom/60 mt-1">Controle de contas a pagar e pagas.</p>
          </div>
        </div>
        
        <button 
          onClick={handleOpenNew} 
          className="hidden md:flex items-center gap-2 bg-dolce-rosa hover:bg-dolce-rosa/90 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Despesa
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
          placeholder="Buscar por descrição ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* MODAL / BOTTOM SHEET DO FORMULÁRIO */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-dolce-marrom/40 backdrop-blur-sm transition-opacity" />
          <Dialog.Content 
            className="fixed z-50 bg-white p-5 md:p-6 shadow-2xl transition-transform animate-in
                       /* Mobile: Bottom Sheet */
                       bottom-0 left-0 right-0 w-full rounded-t-3xl slide-in-from-bottom flex flex-col
                       /* Desktop: Modal Centralizado */
                       md:bottom-auto md:top-[50%] md:left-[50%] md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-xl md:w-full md:rounded-2xl md:zoom-in-95"
          >
            {/* Grabber visual para mobile */}
            <div className="md:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0"></div>
            
            <div className="flex justify-between items-center mb-4 shrink-0">
              <Dialog.Title className="text-xl font-bold text-dolce-marrom flex items-center gap-2">
                <Receipt className="w-6 h-6 text-dolce-rosa" />
                {editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 text-dolce-marrom/50 hover:bg-dolce-rosa-claro hover:text-dolce-marrom rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 pb-6 md:pb-0 overflow-y-auto">
              <DespesaForm 
                initialData={editingDespesa || undefined} 
                onSubmit={handleSubmit} 
                onCancel={() => setIsFormOpen(false)} 
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* LISTAGEM (CARDS MOBILE / GRID DESKTOP) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 md:pb-0">
        {sortedAndFilteredDespesas.map(despesa => {
          const vencido = isOverdue(despesa.dataVencimento, despesa.status)
          
          return (
            <div key={despesa.id} className={`bg-white rounded-2xl shadow-sm border flex flex-col overflow-hidden hover:shadow-md transition-shadow relative ${vencido ? 'border-rose-300' : 'border-gray-100'}`}>
              
              <div className="p-5 flex flex-col gap-3">
                {/* Header do Card */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 mb-2">
                      {despesa.categoria}
                    </span>
                    <h4 className="font-bold text-base text-dolce-marrom line-clamp-2 leading-tight">
                      {despesa.descricao}
                    </h4>
                  </div>

                  {vencido ? (
                    <div className="flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-1 rounded-lg text-xs font-bold animate-pulse shadow-sm border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      VENCIDO
                    </div>
                  ) : despesa.status === 'Pago' ? (
                    <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold shadow-sm border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PAGO
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold shadow-sm border border-amber-200">
                      <Calendar className="w-3.5 h-3.5" />
                      A PAGAR
                    </div>
                  )}
                </div>

                {/* Valores e Datas */}
                <div className="flex items-end justify-between mt-1">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Valor</div>
                    <div className="font-black text-xl text-rose-600">
                      R$ {despesa.valor.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-400 mb-0.5">Vencimento</div>
                    <div className={`text-sm font-semibold ${vencido ? 'text-rose-600' : 'text-dolce-marrom/80'}`}>
                      {new Date(despesa.dataVencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="p-2 border-t border-gray-50 flex justify-end gap-1 bg-gray-50/30 mt-auto">
                <button 
                  onClick={() => { setEditingDespesa(despesa); setIsFormOpen(true) }} 
                  className="flex-1 py-2 px-3 flex justify-center items-center gap-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Editar
                </button>
                <div className="w-px bg-gray-200 my-2"></div>
                <button 
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: 'Remover Despesa',
                      message: `Tem certeza que deseja remover a despesa "${despesa.descricao}"?`,
                      confirmText: 'Remover',
                      variant: 'danger'
                    })
                    if (confirmed) {
                      try {
                        await remove.mutateAsync(despesa.id)
                        toast.success('Despesa removida.')
                      } catch (error: any) {
                        toast.error('Erro ao remover: ' + error.message)
                      }
                    }
                  }} 
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  aria-label="Remover"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )
        })}
        
        {despesas?.length === 0 && !searchTerm && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-dolce-rosa-claro text-dolce-marrom/50">
            <Receipt className="w-16 h-16 mb-4 opacity-30 text-dolce-rosa" />
            <h3 className="text-lg font-bold mb-1 text-dolce-marrom">Nenhuma Despesa</h3>
            <p className="text-sm font-medium text-center px-4 max-w-sm">
              Registre seus custos fixos e compras para saber se a confeitaria está dando lucro no final do mês.
            </p>
            <button 
              onClick={handleOpenNew} 
              className="mt-6 flex items-center gap-2 bg-dolce-rosa text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nova Despesa
            </button>
          </div>
        )}

        {despesas?.length !== 0 && sortedAndFilteredDespesas.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-dolce-marrom/50">
            <Search className="w-16 h-16 mb-4 opacity-30" />
            <h3 className="text-lg font-bold mb-1">Nenhum resultado</h3>
            <p className="text-sm font-medium text-center px-4">Não encontramos despesas para "{searchTerm}".</p>
          </div>
        )}
      </div>

      {/* FAB (Floating Action Button) MOBILE */}
      <button
        onClick={handleOpenNew}
        className="md:hidden fixed bottom-24 right-5 z-40 bg-rose-600 text-white p-4 rounded-2xl shadow-[0_4px_14px_rgba(225,29,72,0.4)] hover:scale-105 active:scale-95 transition-transform"
        aria-label="Nova Despesa"
      >
        <Plus className="w-7 h-7" />
      </button>

    </div>
  )
}
