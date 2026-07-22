import { useState } from 'react'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { Search, Plus, FileText, CheckCircle, X, DollarSign, Calendar, MessageCircle, Ban, Pencil, PackageOpen, ChevronDown, Download, Trash2 } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { pdf } from '@react-pdf/renderer'
import { ComprovantePDF } from '@/features/pedidos/ComprovantePDF'
import { OrcamentoForm, OrcamentoFormData } from './OrcamentoForm'
import { useBaixaEstoque } from '@/features/pedidos/useBaixaEstoque'
import { PedidoFormData } from '@/features/pedidos/PedidoForm'

export function OrcamentosPage() {
  const { data: orcamentos, isLoading } = useFirestoreCollection<any>('orcamentos')
  const { add, update, remove } = useFirestoreMutation<any>('orcamentos')
  
  const { add: addPedido } = useFirestoreMutation<PedidoFormData & {id: string}>('pedidos')
  const { add: addLote } = useFirestoreMutation<any>('producao')
  const { prepararBaixaEstoque } = useBaixaEstoque()

  const { data: configs } = useFirestoreCollection<any>('configuracoes')
  const configDoc = configs?.find(c => c.id === 'global') || configs?.[0]
  const nomeNegocio = configDoc?.nomeNegocio || 'Confeiteira'

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrcamento, setEditingOrcamento] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleOpenNew = () => {
    setEditingOrcamento(null)
    setIsFormOpen(true)
  }

  const handleSubmit = async (data: OrcamentoFormData) => {
    try {
      if (editingOrcamento) {
        await update.mutateAsync({ id: editingOrcamento.id, data })
      } else {
        await add.mutateAsync({ ...data, dataCriacao: new Date().toISOString() })
      }
      setIsFormOpen(false)
    } catch (error: any) {
      alert('Erro ao salvar orçamento: ' + error.message)
    }
  }

  const handleAprovar = async (orc: any) => {
    if (!window.confirm('Aprovar este orçamento e gerar o Pedido?')) return

    try {
      // Cria o Pedido
      const novoPedido = {
        clienteId: orc.clienteId,
        clienteNome: orc.clienteNome,
        dataPedido: orc.dataPedido || new Date().toISOString(),
        dataEntrega: orc.dataEntrega,
        valorTotal: orc.valorTotal,
        estoqueBaixado: false,
        status: 'Aberto',
        ativo: true,
        pagamentos: {
          sinal: { valor: 0, status: 'Pendente', forma: '' },
          restante: { valor: orc.valorTotal, status: 'Pendente', forma: '' }
        },
        itens: orc.itens,
        embalagensExtras: orc.embalagensExtras || [],
        orcamentoOrigemId: orc.id
      }
      
      const pedidoCriado = await addPedido.mutateAsync(novoPedido as any)

      // Calcula os Insumos com base no Orçamento
      // Se houver insumos customizados, criamos a baixa de estoque com eles,
      // senão, usamos o fluxo normal da ficha técnica.
      let insumosSeparacao: any[] = []
      if (orc.insumosCustomizados && orc.insumosCustomizados.length > 0) {
        insumosSeparacao = orc.insumosCustomizados
      } else {
        insumosSeparacao = prepararBaixaEstoque(novoPedido)
      }

      if (insumosSeparacao.length > 0) {
        await addLote.mutateAsync({
          pedidoId: pedidoCriado.id,
          clienteNome: novoPedido.clienteNome,
          dataEntrega: novoPedido.dataEntrega,
          produtos: novoPedido.itens.map((i: any) => ({ nome: i.produtoNome, quantidade: i.quantidade })),
          insumosNecessarios: insumosSeparacao,
          embalagensExtras: novoPedido.embalagensExtras || [],
          // Se tiver edição estruturada (os grupos), salvamos pra Producao exibir certinho!
          insumosAgrupadosEditados: orc.insumosAgrupadosEditados || null,
          status: 'Pendente',
          ativo: true
        })
      }

      // Atualiza o Orçamento para Aprovado
      await update.mutateAsync({ id: orc.id, data: { status: 'Aprovado' } })

      alert('Orçamento aprovado e Pedido criado com sucesso!')
    } catch (err: any) {
      alert('Erro ao aprovar orçamento: ' + err.message)
    }
  }

  const handleRejeitar = async (orc: any) => {
    if (window.confirm('Marcar orçamento como rejeitado?')) {
      await update.mutateAsync({ id: orc.id, data: { status: 'Rejeitado' } })
    }
  }

  const sendWhatsApp = (orcamento: OrcamentoFormData) => {
    let text = `Olá ${orcamento.clienteNome}!\nAqui está o seu orçamento:\n\n`
    orcamento.itens.forEach(item => {
      text += `• ${item.quantidade}x ${item.produtoNome} - R$ ${item.valorItem?.toFixed(2) || '0.00'}\n`
    })
    text += `\n*Valor Total Sugerido: R$ ${orcamento.valorTotal?.toFixed(2) || '0.00'}*`
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleGerarPDF = async (orc: OrcamentoFormData & {id: string}) => {
    try {
      const blob = await pdf(<ComprovantePDF pedido={orc} nomeNegocio={nomeNegocio} isOrcamento={true} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Orcamento-${orc.clienteNome}-${orc.id.slice(-4)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao gerar PDF', error)
      alert('Não foi possível gerar o PDF.')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      try {
        await remove.mutateAsync(id)
      } catch (error) {
        console.error('Erro ao excluir orçamento:', error)
        alert('Erro ao excluir orçamento.')
      }
    }
  }

  const filtered = (orcamentos || []).filter(o => 
    o.ativo !== false &&
    (o.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => new Date(b.dataEntrega).getTime() - new Date(a.dataEntrega).getTime())

  if (isLoading) return <div className="p-8 text-center text-dolce-marrom/50">Carregando orçamentos...</div>

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-24 md:pb-0 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-dolce-marrom tracking-tight">Orçamentos</h2>
          <p className="text-sm text-dolce-marrom/60 mt-1">Simule custos e envie cotações antes de fechar a venda.</p>
        </div>
        <button 
          onClick={handleOpenNew} 
          className="hidden md:flex items-center gap-2 bg-dolce-rosa hover:bg-dolce-rosa/90 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Orçamento
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-dolce-marrom/40" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-3 bg-white/70 border border-gray-200 rounded-2xl text-dolce-marrom placeholder-dolce-marrom/40 focus:outline-none focus:ring-2 focus:ring-dolce-rosa focus:border-transparent transition-all shadow-sm font-medium"
          placeholder="Buscar por cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-dolce-marrom/40 backdrop-blur-sm transition-opacity" />
          <Dialog.Content 
            className="fixed z-50 bg-white p-5 md:p-6 shadow-2xl transition-transform animate-in
                       /* Mobile: Bottom Sheet */
                       bottom-0 left-0 right-0 w-full rounded-t-3xl h-[92vh] overflow-hidden slide-in-from-bottom flex flex-col
                       /* Desktop: Modal Centralizado */
                       md:bottom-auto md:top-[50%] md:left-[50%] md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-4xl md:w-full md:rounded-2xl md:h-[85vh] md:zoom-in-95"
          >
            <div className="md:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0"></div>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <Dialog.Title className="text-xl font-bold text-dolce-marrom">
                {editingOrcamento ? 'Editar Orçamento' : 'Novo Orçamento'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 text-dolce-marrom/50 hover:bg-dolce-rosa-claro hover:text-dolce-marrom rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto pb-6 pr-1 custom-scrollbar">
              {isFormOpen && (
                <OrcamentoForm 
                  initialData={editingOrcamento} 
                  onSubmit={handleSubmit} 
                  onCancel={() => setIsFormOpen(false)}
                />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {orcamentos?.length === 0 && !searchTerm && (
        <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-dolce-rosa-claro text-dolce-marrom/50">
          <FileText className="w-16 h-16 mb-4 opacity-30" />
          <h3 className="text-lg font-bold mb-1">Nenhum orçamento encontrado</h3>
          <p className="text-sm font-medium text-center px-4">
            Crie cotações para seus clientes com preços dinâmicos baseados nas fichas técnicas.
          </p>
          <button 
            onClick={handleOpenNew}
            className="mt-6 flex items-center gap-2 bg-dolce-rosa text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Orçamento
          </button>
        </div>
      )}

      {orcamentos?.length !== 0 && filtered.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-dolce-marrom/50">
          <Search className="w-16 h-16 mb-4 opacity-30" />
          <h3 className="text-lg font-bold mb-1">Nenhum resultado</h3>
          <p className="text-sm font-medium text-center px-4">Não encontramos orçamentos para "{searchTerm}".</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 md:pb-0">
          {filtered.map(orc => (
            <div key={orc.id} className="bg-white rounded-2xl shadow-sm border border-dolce-rosa-claro/50 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 pb-3 border-b border-gray-50 flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-lg text-dolce-marrom line-clamp-1">{orc.clienteNome}</h4>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-dolce-marrom/60">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Evento: {new Date(orc.dataEntrega).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md whitespace-nowrap ${
                  orc.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' :
                  orc.status === 'Rejeitado' ? 'bg-rose-100 text-rose-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {orc.status}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col gap-5">
                {/* O QUE FAZER (Com Insumos Colapsáveis) */}
                <div>
                  <strong className="text-sm text-dolce-marrom/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <PackageOpen className="w-4 h-4" /> Preparar
                  </strong>
                  <div className="space-y-2">
                    {orc.itens?.map((p: any, i: number) => {
                      const grupoInsumos = orc.insumosAgrupadosEditados?.find((g: any) => g.titulo === p.produtoNome)
                      return (
                        <details key={i} className="group bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                          <summary className="flex justify-between items-center cursor-pointer p-3 outline-none hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="font-black text-dolce-rosa bg-dolce-rosa-claro/30 px-2 py-0.5 rounded-lg text-sm">
                                {p.quantidade}x
                              </span>
                              <span className="font-bold text-dolce-marrom">{p.produtoNome}</span>
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
                                    <span className="font-bold">{(ins.quantidadeParaBaixar || 0).toFixed(2)} {ins.unidade}</span> de {ins.insumoNome}
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
                {orc.insumosAgrupadosEditados?.find((g: any) => g.titulo.includes('Geral')) && (
                  <div>
                    <strong className="text-xs text-dolce-marrom/50 uppercase tracking-wider mb-1 block">
                      Itens Gerais
                    </strong>
                    <div className="bg-dolce-rosa-claro/20 p-3 rounded-lg border border-dolce-rosa-claro/50">
                      <ul className="text-sm text-dolce-marrom/70 leading-relaxed list-disc list-inside space-y-1">
                        {orc.insumosAgrupadosEditados.find((g: any) => g.titulo.includes('Geral')).itens.map((ins: any, i: number) => (
                          <li key={i}>
                            <span className="font-bold">{(ins.quantidadeParaBaixar || 0).toFixed(2)} {ins.unidade}</span> de {ins.insumoNome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* PRECIFICAÇÃO MÁGICA DO ORÇAMENTO (VISUAL IDÊNTICO À FT) */}
                <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 mt-2">
                  <h4 className="font-bold text-xl text-dolce-marrom mb-5">Precificação Mágica</h4>
                  
                  {/* Top Indicators */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 relative group cursor-help">
                      <div className="text-[10px] sm:text-xs font-bold text-rose-600/70 uppercase tracking-wider mb-1">Custo Total de Produção</div>
                      <div className="text-xl sm:text-2xl font-black text-rose-600">R$ {((orc.custoInsumosTotal || 0) + (orc.custoMaoDeObraTotal || 0)).toFixed(2)}</div>
                      
                      {/* Tooltip Hover for breakdown */}
                      <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 w-48 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl z-50">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Insumos (Total):</span>
                          <span className="font-bold">R$ {(orc.custoInsumosTotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Mão de Obra:</span>
                          <span className="font-bold">R$ {(orc.custoMaoDeObraTotal || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-200 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                      <div className="text-[10px] sm:text-xs font-bold text-blue-600/70 uppercase tracking-wider mb-1">Qtd Itens Cotados</div>
                      <div className="text-xl sm:text-2xl font-black text-blue-700 relative z-10">{orc.itens?.length || 0} produtos</div>
                    </div>
                  </div>

                  {/* Final Price Block */}
                  <div className="bg-emerald-600 p-5 rounded-2xl shadow-[0_8px_30px_rgba(5,150,105,0.3)] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-3">
                      <div>
                        <div className="text-emerald-100 font-medium text-sm mb-1">Valor Final Sugerido</div>
                        <div className="text-3xl sm:text-4xl font-black tracking-tight">R$ {(orc.valorTotal || 0).toFixed(2)}</div>
                      </div>
                      <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 text-center sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
                        <div className="text-[10px] text-emerald-100 uppercase tracking-widest font-bold mb-0.5">Lucro Bruto</div>
                        <div className="text-xl font-bold">R$ {(orc.lucroEstimado || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {orc.status === 'Aberto' && (
                <div className="px-5 pb-3 grid grid-cols-2 gap-2 mt-auto">
                  <button 
                    onClick={() => handleAprovar(orc)}
                    className="flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 py-2 rounded-xl font-bold transition-colors text-sm shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Aprovar
                  </button>
                  <button 
                    onClick={() => handleRejeitar(orc)}
                    className="flex items-center justify-center gap-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 py-2 rounded-xl font-bold transition-colors text-sm shadow-sm"
                  >
                    <Ban className="w-4 h-4" /> Rejeitar
                  </button>
                </div>
              )}

              <div className="p-3 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center gap-2 flex-wrap">
                <div className="flex gap-2">
                  <button
                    onClick={() => sendWhatsApp(orc)}
                    className="p-2.5 flex items-center justify-center text-sm font-semibold text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors bg-emerald-50 shadow-sm"
                    title="Enviar por WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleGerarPDF(orc)}
                    className="p-2.5 flex items-center justify-center text-sm font-semibold text-blue-600 hover:bg-blue-100 rounded-xl transition-colors bg-blue-50 shadow-sm"
                    title="Baixar PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-1 justify-end gap-2">
                  <button
                    onClick={() => { setEditingOrcamento(orc); setIsFormOpen(true) }}
                    className="py-2.5 px-4 flex items-center gap-2 text-sm font-semibold text-dolce-rosa hover:bg-dolce-rosa-claro/50 rounded-xl transition-colors bg-dolce-rosa-claro/30 shadow-sm"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(orc.id)}
                    className="py-2.5 px-3 flex items-center gap-2 text-sm font-semibold text-red-600 hover:bg-red-100 rounded-xl transition-colors bg-red-50 shadow-sm"
                    title="Excluir Orçamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB Mobile */}
      <button 
        onClick={handleOpenNew}
        className="md:hidden fixed bottom-24 right-5 z-40 bg-dolce-rosa text-white p-4 rounded-2xl shadow-[0_4px_14px_rgba(201,107,122,0.4)] hover:scale-105 active:scale-95 transition-transform"
        aria-label="Novo Orçamento"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  )
}
