import { useState, useMemo } from 'react'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { useBaixaEstoque } from '../pedidos/useBaixaEstoque'
import { ChefHat, CheckCircle, Clock, Flame, Info, CheckSquare, PackageOpen, Calendar, Search, Play, ChevronDown, Pencil } from 'lucide-react'
import { FocusModal } from './components/FocusModal'
import { EditarInsumosModal } from './components/EditarInsumosModal'
import { useProdutosDinamicos } from '@/hooks/useProdutosDinamicos'

export interface InsumoAgrupado {
  insumoId: string;
  insumoNome: string;
  quantidadeParaBaixar: number;
  unidade: string;
}

export interface GrupoInsumos {
  titulo: string;
  itens: InsumoAgrupado[];
}
export function ProducaoPage() {
  const { data: lotes, isLoading: isLoadingLotes } = useFirestoreCollection<any>('producao')
  const { data: produtos } = useProdutosDinamicos()
  const { data: insumos } = useFirestoreCollection<any>('insumos')
  const { update } = useFirestoreMutation<any>('producao')
  const { update: updatePedido } = useFirestoreMutation<any>('pedidos')
  
  const { executarBaixaLote } = useBaixaEstoque()
  const [searchTerm, setSearchTerm] = useState('')
  const [focoLote, setFocoLote] = useState<any>(null)
  const [editingInsumosLote, setEditingInsumosLote] = useState<any>(null)

  const handleConcluir = async (lote: any) => {
    try {
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

  const filteredLotes = useMemo(() => {
    if (!lotes) return []
    const base = lotes
      .filter(l => l.ativo !== false)
      .filter(l => l.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()))

    // Agrupamento dinâmico
    return base.map(lote => {
      // Se já foi editado manualmente, usamos a versão salva
      if (lote.insumosAgrupadosEditados) {
        return { ...lote, insumosAgrupados: lote.insumosAgrupadosEditados }
      }

      if (!produtos || !insumos || !lote.insumosNecessarios) return { ...lote, insumosAgrupados: [] }
      
      const gruposMap = new Map<string, InsumoAgrupado[]>()
      const mapGeral = new Map<string, number>()
      
      if (lote.produtos) {
        lote.produtos.forEach((pLote: any) => {
          const pDB = produtos.find((p: any) => p.nome === pLote.nome)
          if (pDB && pDB.insumos) {
            pDB.insumos.forEach((insReceita: any) => {
              const insumoDoc = insumos.find((i: any) => i.id === insReceita.insumoId)
              if (!insumoDoc) return
              
              const tipoEscala = insumoDoc.tipoEscala || (insumoDoc.escalaComQuantidade === false ? 'por_produto' : 'proporcional')
              
              if (tipoEscala === 'por_pedido') {
                const atual = mapGeral.get(insumoDoc.id) || 0
                mapGeral.set(insumoDoc.id, Math.max(atual, insReceita.quantidadeUsadaReceita))
              } else {
                const qty = tipoEscala === 'proporcional' 
                  ? insReceita.quantidadeUsadaReceita * pLote.quantidade 
                  : insReceita.quantidadeUsadaReceita;
                  
                const arr = gruposMap.get(pLote.nome) || []
                const existing = arr.find(a => a.insumoId === insumoDoc.id)
                if (existing) {
                   existing.quantidadeParaBaixar += qty
                } else {
                   arr.push({
                     insumoId: insumoDoc.id,
                     insumoNome: insumoDoc.nome,
                     quantidadeParaBaixar: qty,
                     unidade: insumoDoc.unidadeMedida
                   })
                }
                gruposMap.set(pLote.nome, arr)
              }
            })
          }
        })
      }
      
      if (lote.embalagensExtras) {
        lote.embalagensExtras.forEach((emb: any) => {
          const atual = mapGeral.get(emb.insumoId) || 0
          mapGeral.set(emb.insumoId, atual + emb.quantidade)
        })
      }
      
      if (mapGeral.size > 0) {
        const arrGeral: InsumoAgrupado[] = []
        mapGeral.forEach((qty, id) => {
          const insumoDoc = insumos.find((i: any) => i.id === id)
          if (insumoDoc) {
             arrGeral.push({
               insumoId: id,
               insumoNome: insumoDoc.nome,
               quantidadeParaBaixar: qty,
               unidade: insumoDoc.unidadeMedida
             })
          }
        })
        gruposMap.set('Geral (Para todo o pedido)', arrGeral)
      }

      const insumosAgrupados: GrupoInsumos[] = Array.from(gruposMap.entries()).map(([titulo, itens]) => ({
        titulo,
        itens
      }))
      
      // Ordena para que Geral fique primeiro
      insumosAgrupados.sort((a, b) => {
        if (a.titulo.includes('Geral')) return -1
        if (b.titulo.includes('Geral')) return 1
        return a.titulo.localeCompare(b.titulo)
      })

      return { ...lote, insumosAgrupados }
    })
  }, [lotes, searchTerm, produtos, insumos])

  if (isLoadingLotes) return <div className="flex justify-center p-8 text-dolce-marrom/50">Carregando Cozinha...</div>

  const pendentes = filteredLotes.filter(l => l.status === 'Pendente' || l.status === 'Em Andamento')
  const concluidos = filteredLotes.filter(l => l.status === 'Concluído')

  return (
    <div className="flex flex-col gap-6 w-full pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-3 rounded-2xl hidden sm:block">
            <ChefHat className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-dolce-marrom tracking-tight">Cozinha / Produção</h2>
            <p className="text-sm text-dolce-marrom/60 mt-1">Ordens de preparo geradas automaticamente pelas vendas.</p>
          </div>
        </div>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-dolce-marrom/40" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-3 bg-white/70 border border-orange-200/60 rounded-2xl text-dolce-marrom placeholder-dolce-marrom/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm font-medium"
          placeholder="Buscar ordem de produção pelo nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* A PRODUZIR */}
      <div className="mt-2">
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
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${lote.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                  <Clock className="w-3 h-3" /> {lote.status === 'Em Andamento' ? 'Em Andamento' : 'Pendente'}
                </span>
              </div>
              
              <div className="p-4 flex-1 flex flex-col gap-5">
                {/* O QUE FAZER (Com Insumos Colapsáveis) */}
                <div>
                  <strong className="text-sm text-dolce-marrom/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <PackageOpen className="w-4 h-4" /> Preparar
                  </strong>
                  <div className="space-y-2">
                    {lote.produtos.map((p: any, i: number) => {
                      const grupoInsumos = lote.insumosAgrupados?.find((g: GrupoInsumos) => g.titulo === p.nome)
                      return (
                        <details key={i} className="group bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                          <summary className="flex justify-between items-center cursor-pointer p-3 outline-none hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-lg text-sm">
                                {p.quantidade}x
                              </span>
                              <span className="font-bold text-dolce-marrom">{p.nome}</span>
                            </div>
                            {grupoInsumos && grupoInsumos.itens.length > 0 && (
                              <ChevronDown className="w-5 h-5 text-gray-400 group-open:-rotate-180 transition-transform" />
                            )}
                          </summary>
                          
                          {grupoInsumos && grupoInsumos.itens.length > 0 && (
                            <div className="px-4 pb-4 pt-1">
                              <ul className="text-sm text-dolce-marrom/70 leading-relaxed list-disc list-inside space-y-1">
                                {grupoInsumos.itens.map((ins: any, idx: number) => (
                                  <li key={idx}>
                                    <span className="font-bold">{ins.quantidadeParaBaixar.toFixed(2)} {ins.unidade}</span> de {ins.insumoNome}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </details>
                      )
                    })}
                  </div>
                </div>

                {/* INSUMOS GERAIS (Embalagens Extras, etc) */}
                {lote.insumosAgrupados?.find((g: GrupoInsumos) => g.titulo.includes('Geral')) && (
                  <div>
                    <strong className="text-xs text-dolce-marrom/50 uppercase tracking-wider mb-1 block">
                      Itens Gerais
                    </strong>
                    <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100/50">
                      <ul className="text-sm text-dolce-marrom/70 leading-relaxed list-disc list-inside space-y-1">
                        {lote.insumosAgrupados.find((g: GrupoInsumos) => g.titulo.includes('Geral')).itens.map((ins: any, i: number) => (
                          <li key={i}>
                            <span className="font-bold">{ins.quantidadeParaBaixar.toFixed(2)} {ins.unidade}</span> de {ins.insumoNome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Fallback para pedidos antigos sem agrupamento de receita */}
                {(!lote.insumosAgrupados || lote.insumosAgrupados.length === 0) && lote.insumosNecessarios && lote.insumosNecessarios.length > 0 && (
                  <div>
                    <strong className="text-xs text-dolce-marrom/50 uppercase tracking-wider mb-1 block">
                      Insumos Necessários
                    </strong>
                    <ul className="text-sm text-dolce-marrom/70 bg-orange-50/50 p-3 rounded-lg border border-orange-100/50 leading-relaxed list-disc list-inside space-y-1">
                      {lote.insumosNecessarios.map((ins: any, i: number) => (
                        <li key={i}>
                          <span className="font-bold">{ins.quantidadeParaBaixar.toFixed(2)} {ins.unidade}</span> de {ins.insumoNome}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

              {/* ACTION BUTTONS */}
              <div className="p-4 pt-0 flex flex-col gap-2">
                <button 
                  onClick={() => setEditingInsumosLote(lote)}
                  className="w-full flex justify-center items-center gap-2 font-bold py-2.5 px-4 rounded-xl text-orange-600 bg-orange-100 hover:bg-orange-200 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Editar insumos
                </button>
                <button 
                  onClick={() => {
                    if (!lote.focoInicioAt) {
                      update.mutateAsync({ id: lote.id, data: { status: 'Em Andamento', focoInicioAt: Date.now() } })
                    }
                    setFocoLote(lote)
                  }}
                  className={`w-full flex justify-center items-center gap-2 font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] text-white ${lote.status === 'Em Andamento' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'}`}
                >
                  <Play className="w-5 h-5" />
                  {lote.status === 'Em Andamento' ? 'Continuar Produção' : 'Iniciar Produção'}
                </button>
              </div>
            </div>
          ))}
          
          {lotes?.filter(l => l.ativo !== false && l.status === 'Pendente').length === 0 && !searchTerm && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 text-dolce-marrom/40">
              <ChefHat className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhuma ordem de produção pendente.</p>
            </div>
          )}

          {lotes?.filter(l => l.ativo !== false && l.status === 'Pendente').length !== 0 && pendentes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 text-dolce-marrom/40">
              <Search className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhuma ordem de produção pendente encontrada para "{searchTerm}".</p>
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
          {concluidos.length === 0 && searchTerm && (
            <div className="col-span-full flex justify-center py-6">
              <p className="text-sm font-medium text-dolce-marrom/40">Nenhum concluído encontrado para "{searchTerm}".</p>
            </div>
          )}
        </div>
      </div>

      {focoLote && (
        <FocusModal 
          lote={filteredLotes.find((l: any) => l.id === focoLote.id) || focoLote}
          onClose={() => setFocoLote(null)}
          onUpdateState={async (data) => {
            await update.mutateAsync({ id: focoLote.id, data })
          }}
          onConcluir={async () => {
            await handleConcluir(focoLote)
          }}
        />
      )}

      {/* MODAL DE EDIÇÃO DE INSUMOS */}
      {editingInsumosLote && (
        <EditarInsumosModal
          lote={editingInsumosLote}
          onClose={() => setEditingInsumosLote(null)}
        />
      )}
    </div>
  )
}
