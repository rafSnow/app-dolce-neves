import { useMemo } from 'react'
import { PedidoFormData } from '../pedidos/PedidoForm'
import { DespesaFormData } from '../financeiro/DespesaForm'

interface DashboardData {
  pedidos: (PedidoFormData & { id: string })[]
  despesas: (DespesaFormData & { id: string })[]
  referenceDate?: Date
}

export function useDashboardMetrics({ pedidos = [], despesas = [], referenceDate = new Date() }: DashboardData) {
  return useMemo(() => {
    const currentMonth = referenceDate.getMonth()
    const currentYear = referenceDate.getFullYear()

    const isThisMonth = (dateStr: string) => {
      if (!dateStr) return false
      const d = new Date(dateStr)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }

    // --- RENDIMENTOS (Através dos Pedidos) ---
    let totalRecebidoMes = 0
    let totalFaturadoMes = 0

    // Pedidos a entregar (ordenados pelos mais próximos)
    const proximosPedidos = pedidos
      .filter(p => {
        const d = new Date(p.dataEntrega)
        // A entregar do dia de hoje para frente
        return d.getTime() >= referenceDate.getTime()
      })
      .sort((a, b) => new Date(a.dataEntrega).getTime() - new Date(b.dataEntrega).getTime())
      .slice(0, 5)

    pedidos.forEach(p => {
      // O faturamento ocorre na data do pedido
      if (isThisMonth(p.dataPedido)) {
        totalFaturadoMes += p.valorTotal

        // Recebimentos isolados
        const sinal = p.pagamentos?.sinal
        if (sinal?.status === 'Recebido') {
           // Se não tem data especifica, assume a data do pedido
           totalRecebidoMes += sinal.valor
        }

        const restante = p.pagamentos?.restante
        if (restante?.status === 'Recebido') {
           totalRecebidoMes += restante.valor
        }
      }
    })

    // --- DESPESAS ---
    let despesasPagasMes = 0
    let despesasPendentesMes = 0
    const despesasAtrasadas: (DespesaFormData & {id: string})[] = []

    despesas.forEach(d => {
      // Classifica se pertence ao mes baseando-se no vencimento ou no pagamento (se pago)
      const dateToCheck = d.status === 'Pago' ? (d.dataPagamento || d.dataVencimento) : d.dataVencimento
      
      if (isThisMonth(dateToCheck)) {
        if (d.status === 'Pago') {
          despesasPagasMes += d.valor
        } else {
          despesasPendentesMes += d.valor
        }
      }

      if (d.status === 'Pendente') {
        const venc = new Date(d.dataVencimento).getTime()
        // zera hora
        const hoje = new Date(referenceDate.toISOString().split('T')[0]).getTime()
        if (venc < hoje) {
          despesasAtrasadas.push(d)
        }
      }
    })

    const lucroLiquidoReal = totalRecebidoMes - despesasPagasMes
    const lucroLiquidoPrevisto = totalFaturadoMes - (despesasPagasMes + despesasPendentesMes)

    return {
      totalRecebidoMes,
      totalFaturadoMes,
      despesasPagasMes,
      despesasPendentesMes,
      lucroLiquidoReal,
      lucroLiquidoPrevisto,
      proximosPedidos,
      despesasAtrasadas: despesasAtrasadas.sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())
    }
  }, [pedidos, despesas, referenceDate])
}
