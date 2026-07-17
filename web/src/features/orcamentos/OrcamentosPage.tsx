import { useState } from 'react'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { Search, Plus, FileText, CheckCircle, X, DollarSign, Calendar, MessageCircle, Ban } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { OrcamentoForm, OrcamentoFormData } from './OrcamentoForm'
import { useBaixaEstoque } from '@/features/pedidos/useBaixaEstoque'
import { PedidoFormData } from '@/features/pedidos/PedidoForm'

export function OrcamentosPage() {
  const { data: orcamentos, isLoading } = useFirestoreCollection<any>('orcamentos')
  const { add, update } = useFirestoreMutation<any>('orcamentos')
  
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

  const sendWhatsApp = (orc: any) => {
    let msg = `*Orçamento - ${nomeNegocio}*\n\n`
    msg += `Olá ${orc.clienteNome},\nSegue o seu orçamento para o dia ${new Date(orc.dataEntrega).toLocaleDateString()}:\n\n`
    msg += `*Itens:*\n`
    orc.itens.forEach((i: any) => {
      msg += `- ${i.quantidade}x ${i.produtoNome}\n`
    })
    msg += `\n*Valor Total Sugerido:* R$ ${orc.valorTotal.toFixed(2)}\n\n`
    msg += `Fico à disposição para dúvidas ou ajustes!`
    
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const filtered = (orcamentos || []).filter(o => 
    o.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.dataEntrega).getTime() - new Date(a.dataEntrega).getTime())

  if (isLoading) return <div className="p-8 text-center text-dolce-marrom/50">Carregando orçamentos...</div>

  return (
    <div className="flex flex-col gap-6 md:gap-8 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-dolce-marrom tracking-tight">Orçamentos</h2>
          <p className="text-sm text-dolce-marrom/60 mt-1">Simule custos e envie cotações antes de fechar a venda.</p>
        </div>
        <button 
          onClick={handleOpenNew} 
          className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
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
          className="block w-full pl-11 pr-4 py-3 bg-white/70 border border-gray-200 rounded-2xl text-dolce-marrom placeholder-dolce-marrom/40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm font-medium"
          placeholder="Buscar por cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-dolce-marrom/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed z-50 bg-white p-5 md:p-6 shadow-2xl transition-transform animate-in bottom-0 left-0 right-0 w-full rounded-t-3xl h-[92vh] flex flex-col md:bottom-auto md:top-[50%] md:left-[50%] md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-4xl md:w-full md:rounded-2xl md:h-[90vh]">
            <div className="md:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0"></div>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <Dialog.Title className="text-xl font-bold text-dolce-marrom">
                {editingOrcamento ? 'Editar Orçamento' : 'Novo Orçamento'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 text-dolce-marrom/50 hover:bg-gray-100 rounded-xl transition-colors">
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

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[40vh]">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-500 opacity-80" />
          </div>
          <h3 className="text-lg font-bold text-dolce-marrom mb-2">Nenhum orçamento encontrado</h3>
          <p className="text-dolce-marrom/60 max-w-sm mx-auto mb-6">
            Crie cotações para seus clientes com preços dinâmicos baseados nas fichas técnicas.
          </p>
          <button 
            onClick={handleOpenNew}
            className="md:hidden flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-md"
          >
            <Plus className="w-5 h-5" />
            Criar Orçamento
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(orc => (
            <div key={orc.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-dolce-marrom">{orc.clienteNome}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-dolce-marrom/60 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Evento: {new Date(orc.dataEntrega).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  orc.status === 'Aprovado' ? 'bg-green-100 text-green-700' :
                  orc.status === 'Rejeitado' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {orc.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 text-sm">
                <div className="font-medium text-dolce-marrom/80">
                  {orc.itens?.length || 0} produto(s)
                </div>
                <div className="flex justify-between items-center font-bold text-dolce-marrom text-base border-t border-gray-200/60 pt-2 mt-1">
                  <span>Valor Final:</span>
                  <span className="text-blue-600">R$ {orc.valorTotal?.toFixed(2)}</span>
                </div>
              </div>

              {orc.status === 'Aberto' && (
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <button 
                    onClick={() => handleAprovar(orc)}
                    className="flex items-center justify-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-xl font-bold transition-colors text-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Aprovar
                  </button>
                  <button 
                    onClick={() => handleRejeitar(orc)}
                    className="flex items-center justify-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl font-bold transition-colors text-sm"
                  >
                    <Ban className="w-4 h-4" /> Rejeitar
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingOrcamento(orc); setIsFormOpen(true) }}
                  className="flex-1 bg-gray-100 text-dolce-marrom hover:bg-gray-200 py-2 rounded-xl font-bold transition-colors text-sm"
                >
                  Ver Detalhes
                </button>
                <button
                  onClick={() => sendWhatsApp(orc)}
                  className="flex items-center justify-center w-10 bg-green-500 text-white hover:bg-green-600 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB Mobile */}
      <button 
        onClick={handleOpenNew}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-30"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
