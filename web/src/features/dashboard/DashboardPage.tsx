import { useFirestoreCollection } from '@/hooks/useFirestore'
import { useDashboardMetrics } from './useDashboardMetrics'
import { PedidoFormData } from '../pedidos/PedidoForm'
import { DespesaFormData } from '../financeiro/DespesaForm'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { data: pedidos, isLoading: loadingPedidos } = useFirestoreCollection<PedidoFormData & {id: string}>('pedidos')
  const { data: despesas, isLoading: loadingDespesas } = useFirestoreCollection<DespesaFormData & {id: string}>('despesas')

  const metrics = useDashboardMetrics({ 
    pedidos: (pedidos || []).filter((p: any) => p.ativo !== false), 
    despesas: (despesas || []).filter((d: any) => d.ativo !== false) 
  })

  if (loadingPedidos || loadingDespesas) {
    return <div className="p-8">Carregando métricas...</div>
  }

  const { 
    totalRecebidoMes, totalFaturadoMes, despesasPagasMes, despesasPendentesMes, 
    lucroLiquidoReal, lucroLiquidoPrevisto, proximosPedidos, despesasAtrasadas 
  } = metrics

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Visão Geral (Mês Atual)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm border-l-4 border-l-blue-500">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Vendas Totais (Faturado)</h3>
          <div className="text-3xl font-bold text-gray-900">R$ {totalFaturadoMes.toFixed(2)}</div>
          <div className="text-sm text-green-600 mt-2">Recebido em Caixa: R$ {totalRecebidoMes.toFixed(2)}</div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm border-l-4 border-l-red-500">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Despesas do Mês</h3>
          <div className="text-3xl font-bold text-gray-900">R$ {(despesasPagasMes + despesasPendentesMes).toFixed(2)}</div>
          <div className="text-sm text-red-600 mt-2">A Pagar: R$ {despesasPendentesMes.toFixed(2)}</div>
        </div>

        <div className={`bg-white p-6 rounded-lg border shadow-sm border-l-4 ${lucroLiquidoReal >= 0 ? 'border-l-green-500' : 'border-l-orange-500'}`}>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Lucro Líquido (Real)</h3>
          <div className={`text-3xl font-bold ${lucroLiquidoReal >= 0 ? 'text-green-700' : 'text-orange-600'}`}>
            R$ {lucroLiquidoReal.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-2">Lucro Previsto: R$ {lucroLiquidoPrevisto.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Próximas Entregas</h3>
            <Link to="/pedidos" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
          </div>
          {proximosPedidos.length === 0 ? (
            <div className="text-gray-500 text-sm p-4 text-center">Nenhum pedido pendente.</div>
          ) : (
            <div className="space-y-3">
              {proximosPedidos.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-sm">{p.clienteNome}</div>
                    <div className="text-xs text-gray-500">{new Date(p.dataEntrega).toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-green-700">R$ {p.valorTotal.toFixed(2)}</div>
                    <div className="text-xs text-orange-600">Restante: R$ {p.pagamentos.restante.valor.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-red-600">Contas Atrasadas</h3>
            <Link to="/despesas" className="text-sm text-blue-600 hover:underline">Ir para Despesas</Link>
          </div>
          {despesasAtrasadas.length === 0 ? (
            <div className="text-gray-500 text-sm p-4 text-center">Nenhuma conta atrasada! 🎉</div>
          ) : (
            <div className="space-y-3">
              {despesasAtrasadas.map(d => (
                <div key={d.id} className="flex justify-between items-center p-3 border border-red-100 bg-red-50 rounded">
                  <div>
                    <div className="font-medium text-sm text-red-800">{d.descricao}</div>
                    <div className="text-xs text-red-600">Venceu em: {new Date(d.dataVencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
                  </div>
                  <div className="font-bold text-sm text-red-700">
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
