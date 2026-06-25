import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { useBaixaEstoque } from '../pedidos/useBaixaEstoque'
import { ChefHat, CheckCircle, Clock, Flame, Info, CheckSquare, PackageOpen, Calendar } from 'lucide-react'

export function ProducaoPage() {
  const { data: lotes, isLoading } = useFirestoreCollection<any>('producao')
  const { update } = useFirestoreMutation<any>('producao')
  const { update: updatePedido } = useFirestoreMutation<any>('pedidos')
  
  const { executarBaixaLote } = useBaixaEstoque()

  const handleConcluir = async (lote: any) => {
    try {
      if (!window.confirm('Tem certeza que concluiu esta produção e deseja baixar os ingredientes do estoque principal?')) return

      // 1. Baixar Estoque
      await executarBaixaLote(lote.insumosNecessarios)
      
      // 2. Atualizar status do lote
      await update.mutateAsync({ id: lote.id, data: { status: 'Concluído' } })
      
      // 3. Atualizar flag do pedido
      await updatePedido.mutateAsync({ id: lote.pedidoId, data: { estoqueBaixado: true } })

      alert('Produção concluída com sucesso! Estoque atualizado.')
    } catch (error: any) {
      alert('Erro ao concluir produção: ' + error.message)
    }
  }

  if (isLoading) return <div className="flex justify-center p-8 text-dolce-marrom/50">Carregando Cozinha...</div>

  const pendentes = lotes?.filter(l => l.ativo !== false && l.status === 'Pendente') || []
  const concluidos = lotes?.filter(l => l.ativo !== false && l.status === 'Concluído') || []

  return (
    <div className="flex flex-col gap-6 w-full pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 p-3 rounded-2xl">
          <ChefHat className="w-8 h-8 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-dolce-marrom tracking-tight">Cozinha / Produção</h2>
          <p className="text-sm text-dolce-marrom/60 mt-1">Ordens de preparo geradas automaticamente pelas vendas.</p>
        </div>
      </div>

      {/* A PRODUZIR */}
      <div className="mt-4">
        <h3 className="font-bold text-xl text-dolce-marrom mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" /> A Produzir ({pendentes.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pendentes.map(lote => (
            <div key={lote.id} className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden flex flex-col">
              
              {/* Card Header */}
              <div className="bg-orange-50/50 p-4 border-b border-orange-100 flex justify-between items-start">
                <div className="pr-2">
                  <h4 className="font-bold text-lg text-dolce-marrom line-clamp-1">{lote.clienteNome}</h4>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-orange-700/80">
                    <Calendar className="w-3.5 h-3.5" />
                    Entrega: {new Date(lote.dataEntrega).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <span className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2.5 py-1 rounded-md text-xs font-bold shrink-0">
                  <Clock className="w-3 h-3" /> Pendente
                </span>
              </div>
              
              <div className="p-4 flex-1 flex flex-col gap-5">
                {/* O QUE FAZER */}
                <div>
                  <strong className="text-sm text-dolce-marrom/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <PackageOpen className="w-4 h-4" /> Preparar
                  </strong>
                  <ul className="space-y-1.5">
                    {lote.produtos.map((p: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-dolce-marrom font-medium bg-gray-50 p-2 rounded-lg">
                        <span className="font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-sm">{p.quantidade}x</span>
                        <span className="pt-0.5">{p.nome}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* INSUMOS (SEPARAÇÃO CHECKLIST) */}
                <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                  <strong className="text-xs font-bold text-dolce-marrom/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Checklist de Insumos
                  </strong>
                  <div className="space-y-1.5">
                    {lote.insumosNecessarios.map((ins: any, i: number) => (
                      <label key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" className="w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500 transition-all" />
                        <span className="text-sm text-dolce-marrom flex-1">
                          <span className="font-bold">{ins.quantidadeParaBaixar.toFixed(2)} {ins.unidade}</span> de {ins.insumoNome}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="p-4 pt-0">
                <button 
                  onClick={() => handleConcluir(lote)} 
                  className="w-full flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98]"
                >
                  <CheckCircle className="w-5 h-5" />
                  Concluir Produção
                </button>
              </div>
            </div>
          ))}
          
          {pendentes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 text-dolce-marrom/40">
              <ChefHat className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhuma ordem de produção pendente.</p>
            </div>
          )}
        </div>
      </div>

      {/* CONCLUÍDOS */}
      <div className="mt-8 pt-6 border-t border-gray-200/60">
        <h3 className="font-bold text-lg text-emerald-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> Produzidos Recentemente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 opacity-80">
          {concluidos.slice(0, 6).map(lote => (
            <div key={lote.id} className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-dolce-marrom">{lote.clienteNome}</h4>
                <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                  ✓ Ok
                </span>
              </div>
              <p className="text-xs text-dolce-marrom/60 line-clamp-2">
                {lote.produtos.map((p:any) => `${p.quantidade}x ${p.nome}`).join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
