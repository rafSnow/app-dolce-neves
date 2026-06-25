import { useState } from 'react'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { PedidoForm, PedidoFormData } from './PedidoForm'
import { useBaixaEstoque, ItemBaixaEstoque } from './useBaixaEstoque'

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
    // 1. Agrupar necessidades de insumos por todos os itens do pedido
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

    // 2. Mapear para o formato do Batch
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
        // Pedido Novo
        let novoPedido = { ...data, estoqueBaixado: false }
        
        // 1. Grava o pedido
        const pedidoCriado = await add.mutateAsync(novoPedido)

        // 2. Cria o lote de produção na Cozinha
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

  if (isLoading) return <div>Carregando Pedidos...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pedidos (Vendas)</h2>
          <p className="text-sm text-gray-500">Registre vendas e controle os recebimentos.</p>
        </div>
        <button onClick={handleOpenNew} className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow hover:bg-primary/90">
          Novo Pedido
        </button>
      </div>

      {isFormOpen && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">{editingPedido ? 'Editar Pedido' : 'Novo Pedido'}</h3>
          <PedidoForm 
            initialData={editingPedido || undefined} 
            onSubmit={handleSubmit} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </div>
      )}

      <div className="border rounded-md bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Data Entrega</th>
              <th className="p-4 font-medium">Valor Total</th>
              <th className="p-4 font-medium">Sinal</th>
              <th className="p-4 font-medium">Estoque</th>
              <th className="p-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos?.filter(p => p.ativo !== false).map(pedido => (
              <tr key={pedido.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{pedido.clienteNome}</td>
                <td className="p-4 text-gray-600">{new Date(pedido.dataEntrega).toLocaleString('pt-BR')}</td>
                <td className="p-4 font-bold">R$ {pedido.valorTotal.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${pedido.pagamentos.sinal.status === 'Recebido' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {pedido.pagamentos.sinal.status}
                  </span>
                </td>
                <td className="p-4">
                  {pedido.estoqueBaixado ? (
                    <span className="text-green-600 text-xs font-bold">Baixado</span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="p-4 space-x-3">
                  <button onClick={() => { setEditingPedido(pedido); setIsFormOpen(true) }} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => remove.mutateAsync(pedido.id)} className="text-red-600 hover:underline">Remover</button>
                </td>
              </tr>
            ))}
            {pedidos?.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Nenhum pedido registrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
