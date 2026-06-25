import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { useBaixaEstoque } from '../pedidos/useBaixaEstoque'

export function ProducaoPage() {
  const { data: lotes, isLoading } = useFirestoreCollection<any>('producao')
  const { update } = useFirestoreMutation<any>('producao')
  const { update: updatePedido } = useFirestoreMutation<any>('pedidos')
  
  const { executarBaixaLote } = useBaixaEstoque()

  const handleConcluir = async (lote: any) => {
    try {
      if (!confirm('Confirmar conclusão desta produção e dar baixa no estoque?')) return

      // 1. Baixar Estoque
      await executarBaixaLote(lote.insumosNecessarios)
      
      // 2. Atualizar status do lote
      await update.mutateAsync({ id: lote.id, data: { status: 'Concluído' } })
      
      // 3. Atualizar flag do pedido (opcional, para visualização na tela de pedidos)
      await updatePedido.mutateAsync({ id: lote.pedidoId, data: { estoqueBaixado: true } })

      alert('Produção concluída e estoque atualizado!')
    } catch (error: any) {
      alert('Erro ao concluir produção: ' + error.message)
    }
  }

  if (isLoading) return <div>Carregando Módulo de Produção...</div>

  const pendentes = lotes?.filter(l => l.ativo !== false && l.status === 'Pendente') || []
  const concluidos = lotes?.filter(l => l.ativo !== false && l.status === 'Concluído') || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Cozinha / Produção</h2>
        <p className="text-sm text-gray-500">Lotes de produção gerados pelos pedidos de venda.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <h3 className="font-bold text-xl border-b pb-2 text-orange-700">A Produzir ({pendentes.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendentes.map(lote => (
            <div key={lote.id} className="bg-white border rounded-lg shadow-sm p-4 border-l-4 border-l-orange-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-lg">{lote.clienteNome}</h4>
                  <p className="text-xs text-gray-500">Para: {new Date(lote.dataEntrega).toLocaleString('pt-BR')}</p>
                </div>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold">Pendente</span>
              </div>
              
              <div className="my-3">
                <strong className="text-sm text-gray-700 block mb-1">O que fazer:</strong>
                <ul className="list-disc pl-5 text-sm">
                  {lote.produtos.map((p: any, i: number) => (
                    <li key={i}>{p.quantidade}x {p.nome}</li>
                  ))}
                </ul>
              </div>

              <div className="my-3 bg-gray-50 p-2 rounded border">
                <strong className="text-xs text-gray-700 block mb-1">Insumos (Separação):</strong>
                <ul className="list-disc pl-5 text-xs text-gray-600">
                  {lote.insumosNecessarios.map((ins: any, i: number) => (
                    <li key={i}>{ins.quantidadeParaBaixar.toFixed(2)} {ins.unidade} de {ins.insumoNome}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={() => handleConcluir(lote)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow">
                  Concluir Produção
                </button>
              </div>
            </div>
          ))}
          {pendentes.length === 0 && (
            <div className="text-gray-500 p-4">Nenhuma ordem de produção pendente no momento.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-8">
        <h3 className="font-bold text-xl border-b pb-2 text-green-700">Produzidos Recentemente</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-75">
          {concluidos.slice(0, 6).map(lote => (
            <div key={lote.id} className="bg-white border rounded-lg p-3 border-l-4 border-l-green-500">
              <div className="flex justify-between">
                <h4 className="font-bold text-sm">{lote.clienteNome}</h4>
                <span className="text-green-600 text-xs">✓ Concluído</span>
              </div>
              <p className="text-xs text-gray-500">Itens: {lote.produtos.map((p:any) => `${p.quantidade}x ${p.nome}`).join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
