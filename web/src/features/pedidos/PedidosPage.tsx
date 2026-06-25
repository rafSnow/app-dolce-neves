import { useState } from 'react'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { PedidoForm, PedidoFormData } from './PedidoForm'
import { useBaixaEstoque, ItemBaixaEstoque } from './useBaixaEstoque'
import { Pencil, Trash2, Plus, ShoppingBag, Calendar, DollarSign, X, CheckCircle, Clock, PackageOpen } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

export function PedidosPage() {
  const { data: pedidos, isLoading } = useFirestoreCollection<PedidoFormData & {id: string}>('pedidos')
  const { data: produtos } = useFirestoreCollection<any>('produtos')
  const { data: insumos } = useFirestoreCollection<any>('insumos')
  
  const { add, update, remove } = useFirestoreMutation<PedidoFormData & {id: string}>('pedidos')
  const { executarBaixaLote } = useBaixaEstoque()
  
  const { add: addLote } = useFirestoreMutation<any>('producao')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPedido, setEditingPedido] = useState<(PedidoFormData & {id: string}) | null>(null)

  const handleOpenNew = () => {
    setEditingPedido(null)
    setIsFormOpen(true)
  }

  const prepararBaixaEstoque = (pedidoData: PedidoFormData): ItemBaixaEstoque[] => {
    const mapaInsumos = new Map<string, number>()
    
    pedidoData.itens.forEach(item => {
      const prod = produtos?.find(p => p.id === item.produtoId)
      if (prod && prod.insumos) {
        prod.insumos.forEach((insumoReceita: any) => {
          const rendimento = prod.rendimentoReceita || 1
          const qtdTotalUsada = (insumoReceita.quantidadeUsadaReceita / rendimento) * item.quantidade
          const atual = mapaInsumos.get(insumoReceita.insumoId) || 0
          mapaInsumos.set(insumoReceita.insumoId, atual + qtdTotalUsada)
        })
      }
    })

    const lotesParaBaixar: ItemBaixaEstoque[] = []
    mapaInsumos.forEach((qtdNecessaria, insId) => {
      const insumoDoc = insumos?.find(i => i.id === insId)
      if (insumoDoc) {
        lotesParaBaixar.push({
          insumoId: insId,
          insumoNome: insumoDoc.nome,
          unidade: insumoDoc.unidadeMedida,
          estoqueAtual: insumoDoc.quantidadeDisponivel,
          quantidadeParaBaixar: qtdNecessaria
        })
      }
    })

    return lotesParaBaixar
  }

  const handleSubmit = async (data: PedidoFormData) => {
    try {
      if (editingPedido) {
        await update.mutateAsync({ id: editingPedido.id, data })
      } else {
        let novoPedido = { ...data, estoqueBaixado: false }
        const pedidoCriado = await add.mutateAsync(novoPedido)

        if (produtos && insumos) {
          const insumosSeparacao = prepararBaixaEstoque(novoPedido)
          if (insumosSeparacao.length > 0) {
            await addLote.mutateAsync({
              pedidoId: pedidoCriado.id,
              clienteNome: novoPedido.clienteNome,
              dataEntrega: novoPedido.dataEntrega,
              produtos: novoPedido.itens.map(i => ({ nome: i.produtoNome, quantidade: i.quantidade })),
              insumosNecessarios: insumosSeparacao,
              status: 'Pendente',
              ativo: true
            })
          }
        }
      }
      setIsFormOpen(false)
    } catch (error: any) {
      alert('Erro ao salvar pedido: ' + error.message)
    }
  }

  if (isLoading) return <div className="flex justify-center p-8 text-dolce-marrom/50">Carregando Pedidos...</div>

  return (
    <div className="flex flex-col gap-6 w-full relative min-h-full">
      {/* HEADER DE TÍTULO E BOTÃO DESKTOP */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-dolce-marrom tracking-tight">Pedidos (Vendas)</h2>
          <p className="text-sm text-dolce-marrom/60 mt-1">Registre vendas e controle os recebimentos.</p>
        </div>
        
        {/* Botão Desktop */}
        <button 
          onClick={handleOpenNew} 
          className="hidden md:flex items-center gap-2 bg-dolce-rosa hover:bg-dolce-rosa/90 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Pedido
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
              <Dialog.Title className="text-xl font-bold text-dolce-marrom">
                {editingPedido ? 'Editar Pedido' : 'Novo Pedido'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 text-dolce-marrom/50 hover:bg-dolce-rosa-claro hover:text-dolce-marrom rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto pb-6 pr-1 custom-scrollbar">
              <PedidoForm 
                initialData={editingPedido || undefined} 
                onSubmit={handleSubmit} 
                onCancel={() => setIsFormOpen(false)} 
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* LISTAGEM (CARDS MOBILE / GRID DESKTOP) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 md:pb-0">
        {pedidos?.filter(p => p.ativo !== false).map(pedido => {
          const sinalStatus = pedido.pagamentos.sinal.status;
          
          return (
            <div key={pedido.id} className="bg-white rounded-2xl shadow-sm border border-dolce-rosa-claro/50 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-5 pb-3 border-b border-gray-50 flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <h4 className="font-bold text-lg text-dolce-marrom line-clamp-1 flex items-center gap-2">
                    {pedido.clienteNome}
                  </h4>
                  <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-dolce-marrom/60">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Entrega: {new Date(pedido.dataEntrega).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl">
                  <span className="text-sm font-medium text-dolce-marrom/70 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Valor Total
                  </span>
                  <span className="font-bold text-lg text-emerald-700">
                    R$ {pedido.valorTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-medium text-dolce-marrom/70">Sinal</span>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                    sinalStatus === 'Recebido' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {sinalStatus === 'Recebido' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {sinalStatus}
                  </span>
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-medium text-dolce-marrom/70">Estoque / Produção</span>
                  {pedido.estoqueBaixado ? (
                    <span className="text-emerald-600 text-xs font-bold px-2.5 py-1 bg-emerald-50 rounded-md">Baixado</span>
                  ) : (
                    <span className="text-orange-600 text-xs font-bold px-2.5 py-1 bg-orange-50 rounded-md">Pendente</span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-2 border-t border-gray-50 bg-gray-50/30 flex justify-end gap-1">
                <button 
                  onClick={() => { setEditingPedido(pedido); setIsFormOpen(true) }} 
                  className="flex-1 py-2 px-3 flex justify-center items-center gap-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Editar
                </button>
                <div className="w-px bg-gray-200 my-2"></div>
                <button 
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja remover este pedido?')) {
                      remove.mutateAsync(pedido.id)
                    }
                  }} 
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  aria-label="Remover"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
        
        {pedidos?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-dolce-rosa-claro text-dolce-marrom/50">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
            <h3 className="text-lg font-bold mb-1">Nenhum pedido encontrado</h3>
            <p className="text-sm font-medium text-center px-4">Registre sua primeira venda clicando no botão abaixo ou no botão (+).</p>
            <button 
              onClick={handleOpenNew} 
              className="mt-6 flex items-center gap-2 bg-dolce-rosa text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Pedido
            </button>
          </div>
        )}
      </div>

      {/* FAB (Floating Action Button) MOBILE */}
      <button
        onClick={handleOpenNew}
        className="md:hidden fixed bottom-24 right-5 z-40 bg-dolce-rosa text-white p-4 rounded-2xl shadow-[0_4px_14px_rgba(201,107,122,0.4)] hover:scale-105 active:scale-95 transition-transform"
        aria-label="Novo Pedido"
      >
        <Plus className="w-7 h-7" />
      </button>

    </div>
  )
}
