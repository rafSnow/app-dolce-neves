import { useFirestoreCollection } from '@/hooks/useFirestore'
import { useDashboardMetrics } from './useDashboardMetrics'
import { PedidoFormData } from '../pedidos/PedidoForm'
import { DespesaFormData } from '../financeiro/DespesaForm'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Sparkles, Plus, ShoppingBag, Receipt, Users, ArrowRight, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

export function DashboardPage() {
  const { data: pedidos, isLoading: loadingPedidos } = useFirestoreCollection<PedidoFormData & {id: string}>('pedidos')
  const { data: despesas, isLoading: loadingDespesas } = useFirestoreCollection<DespesaFormData & {id: string}>('despesas')
  const { data: configs } = useFirestoreCollection<any>('configuracoes')

  const configDoc = configs?.find(c => c.id === 'global') || configs?.[0]
  const nomeNegocio = configDoc?.nomeNegocio || 'Confeiteira'

  const [selectedDate, setSelectedDate] = useState(new Date())

  const metrics = useDashboardMetrics({ 
    pedidos: (pedidos || []).filter((p: any) => p.ativo !== false), 
    despesas: (despesas || []).filter((d: any) => d.ativo !== false),
    referenceDate: selectedDate
  })

  if (loadingPedidos || loadingDespesas) {
    return <div className="flex justify-center p-8 text-dolce-marrom/50">Carregando métricas...</div>
  }

  const { 
    totalRecebidoMes, totalFaturadoMes, despesasPagasMes, despesasPendentesMes, 
    lucroLiquidoReal, lucroLiquidoPrevisto, proximosPedidos, despesasAtrasadas 
  } = metrics

  // Saudação Dinâmica
  const horaAtual = new Date().getHours()
  let saudacao = 'Boa noite'
  if (horaAtual >= 5 && horaAtual < 12) saudacao = 'Bom dia'
  else if (horaAtual >= 12 && horaAtual < 18) saudacao = 'Boa tarde'

  // Controle de Meses
  const handlePrevMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  const handleCurrentMonth = () => setSelectedDate(new Date())

  const isCurrentMonth = selectedDate.getMonth() === new Date().getMonth() && selectedDate.getFullYear() === new Date().getFullYear()

  const mesFormatado = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const mesCapitalizado = mesFormatado.charAt(0).toUpperCase() + mesFormatado.slice(1)

  return (
    <div className="flex flex-col gap-6 md:gap-8 min-h-screen pb-20 md:pb-8">
      
      {/* HEADER DINÂMICO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-dolce-marrom tracking-tight mb-1">
            {saudacao}, <span className="text-dolce-rosa">{nomeNegocio}</span>!
          </h2>
          <p className="text-dolce-marrom/60 font-medium">Aqui está o resumo financeiro da sua doceria.</p>
        </div>
        
        {/* SELETOR DE MÊS */}
        <div className="flex flex-col w-full md:w-1/3 gap-2 mt-2 md:mt-0">
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-full shadow-sm p-1 w-full">
            <button 
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors text-dolce-marrom"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-2 flex flex-col items-center flex-1 text-center">
              <span className="text-sm font-bold text-dolce-marrom capitalize">{mesCapitalizado}</span>
            </div>
            <button 
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors text-dolce-marrom"
              title="Mês Seguinte"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {!isCurrentMonth && (
            <button 
              onClick={handleCurrentMonth}
              className="text-xs font-semibold text-dolce-rosa hover:text-dolce-rosa/80 flex items-center justify-center gap-1 transition-colors w-full"
            >
              <CalendarIcon className="w-3 h-3" />
              Voltar para o mês atual
            </button>
          )}
        </div>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* Faturamento */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="bg-emerald-50 p-2.5 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Entradas</span>
          </div>
          <div>
            <h3 className="text-dolce-marrom/60 text-sm font-bold mb-1">Faturamento Mês</h3>
            <div className="text-3xl font-extrabold text-dolce-marrom tracking-tight">
              R$ {totalFaturadoMes.toFixed(2)}
            </div>
          </div>
          <div className="text-sm font-semibold text-emerald-600 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50 mt-1">
            Dinheiro no Caixa: R$ {totalRecebidoMes.toFixed(2)}
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="bg-rose-50 p-2.5 rounded-2xl">
              <TrendingDown className="w-6 h-6 text-rose-600" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Saídas</span>
          </div>
          <div>
            <h3 className="text-dolce-marrom/60 text-sm font-bold mb-1">Despesas Mês</h3>
            <div className="text-3xl font-extrabold text-dolce-marrom tracking-tight">
              R$ {(despesasPagasMes + despesasPendentesMes).toFixed(2)}
            </div>
          </div>
          <div className="text-sm font-semibold text-rose-600 bg-rose-50/50 p-2 rounded-xl border border-rose-100/50 mt-1">
            Falta Pagar: R$ {despesasPendentesMes.toFixed(2)}
          </div>
        </div>

        {/* Lucro (Premium Card) */}
        <div className="bg-gradient-to-br from-dolce-marrom to-gray-900 p-6 rounded-3xl shadow-lg flex flex-col gap-3 relative overflow-hidden group hover:shadow-xl transition-shadow border border-gray-800">
          {/* Brilho decorativo no fundo */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-dolce-rosa rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-dolce-creme" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-dolce-creme/50">Resultado</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-dolce-creme/70 text-sm font-bold mb-1">Lucro Líquido</h3>
            <div className={`text-3xl font-extrabold tracking-tight ${lucroLiquidoReal >= 0 ? 'text-white' : 'text-rose-400'}`}>
              R$ {lucroLiquidoReal.toFixed(2)}
            </div>
          </div>
          <div className="text-sm font-medium text-dolce-creme/80 bg-black/20 p-2 rounded-xl border border-white/10 mt-1 relative z-10">
            Previsto (Mês Fechado): R$ {lucroLiquidoPrevisto.toFixed(2)}
          </div>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS (ATALHOS) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-wrap md:flex-nowrap gap-3 items-center">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-2 w-full md:w-auto">Ações Rápidas:</span>
        <Link to="/pedidos" className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-gray-50 hover:bg-dolce-rosa/10 text-dolce-marrom hover:text-dolce-rosa font-bold py-3 rounded-2xl transition-colors border border-gray-200 hover:border-dolce-rosa/30">
          <Plus className="w-4 h-4" /> <ShoppingBag className="w-4 h-4" /> Pedido
        </Link>
        <Link to="/despesas" className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-gray-50 hover:bg-rose-50 text-dolce-marrom hover:text-rose-600 font-bold py-3 rounded-2xl transition-colors border border-gray-200 hover:border-rose-200">
          <Plus className="w-4 h-4" /> <Receipt className="w-4 h-4" /> Despesa
        </Link>
        <Link to="/clientes" className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-gray-50 hover:bg-blue-50 text-dolce-marrom hover:text-blue-600 font-bold py-3 rounded-2xl transition-colors border border-gray-200 hover:border-blue-200">
          <Plus className="w-4 h-4" /> <Users className="w-4 h-4" /> Cliente
        </Link>
      </div>

      {/* LISTAS E ALERTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        
        {/* Próximas Entregas */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-dolce-marrom flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-dolce-rosa" />
              Próximas Entregas
            </h3>
            <Link to="/pedidos" className="text-xs font-bold text-dolce-rosa hover:text-white transition-colors bg-dolce-rosa-claro hover:bg-dolce-rosa px-3 py-1.5 rounded-xl flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          {proximosPedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
              <ShoppingBag className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-semibold">Nenhum pedido pendente</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {proximosPedidos.map(p => (
                <div key={p.id} className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-dolce-rosa/30 hover:shadow-sm transition-all">
                  <div className="flex flex-col">
                    <span className="font-bold text-dolce-marrom group-hover:text-dolce-rosa transition-colors">{p.clienteNome}</span>
                    <span className="text-xs font-semibold text-gray-500 mt-1">{new Date(p.dataEntrega).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-sm text-dolce-marrom">R$ {p.valorTotal.toFixed(2)}</span>
                    {p.pagamentos.restante.valor > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg mt-1.5">
                        Falta R$ {p.pagamentos.restante.valor.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contas Atrasadas */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-rose-600 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
              Contas Atrasadas
            </h3>
            <Link to="/despesas" className="text-xs font-bold text-rose-600 hover:text-white transition-colors bg-rose-50 hover:bg-rose-500 px-3 py-1.5 rounded-xl flex items-center gap-1 border border-rose-100 hover:border-rose-500">
              Resolver <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          {despesasAtrasadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-emerald-50 rounded-2xl border border-dashed border-emerald-200 text-emerald-600">
              <Sparkles className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-sm font-bold">Tudo em dia! Parabéns.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {despesasAtrasadas.map(d => (
                <div key={d.id} className="flex items-center justify-between p-4 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-rose-900">{d.descricao}</span>
                    <span className="text-xs font-semibold text-rose-600 mt-1">Venceu em: {new Date(d.dataVencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                  </div>
                  <div className="font-black text-sm text-rose-700 bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-sm">
                    R$ {d.valor.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
