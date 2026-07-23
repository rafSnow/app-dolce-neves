import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDashboardMetrics } from '../useDashboardMetrics'
import { PedidoFormData } from '@/features/pedidos/PedidoForm'
import { DespesaFormData } from '@/features/financeiro/DespesaForm'

describe('useDashboardMetrics', () => {
  it('deve calcular corretamente lucro e separar pedidos e despesas pelo mes', () => {
    // Usaremos uma data fixa: 15 de Abril de 2024
    const refDate = new Date('2024-04-15T12:00:00Z')

    const mockPedidos: any[] = [
      {
        id: 'p1',
        clienteId: '1', clienteNome: 'A',
        dataPedido: '2024-04-10T10:00:00Z',
        dataEntrega: '2024-04-16T10:00:00Z', // amanha
        valorTotal: 100,
        estoqueBaixado: true,
        pagamentos: {
          sinal: { valor: 50, status: 'Recebido', forma: 'Pix' },
          restante: { valor: 50, status: 'Pendente', forma: 'Pix' }
        },
        margemLucro: 100,
        itens: []
      },
      { // Fora do mes
        id: 'p2',
        clienteId: '1', clienteNome: 'B',
        dataPedido: '2024-03-10T10:00:00Z',
        dataEntrega: '2024-03-16T10:00:00Z', 
        valorTotal: 500,
        estoqueBaixado: true,
        pagamentos: {
          sinal: { valor: 250, status: 'Recebido', forma: 'Pix' },
          restante: { valor: 250, status: 'Recebido', forma: 'Pix' }
        },
        margemLucro: 100,
        itens: []
      }
    ] as (PedidoFormData & {id: string})[]

    const mockDespesas = [
      { // Paga no mes
        id: 'd1', descricao: 'Luz', categoria: 'Outros', status: 'Pago',
        valor: 30, dataVencimento: '2024-04-10', dataPagamento: '2024-04-09'
      },
      { // Pendente e Atrasada (Venceu dia 10, hoje é 15)
        id: 'd2', descricao: 'Agua', categoria: 'Outros', status: 'Pendente',
        valor: 20, dataVencimento: '2024-04-10'
      }
    ] as (DespesaFormData & {id: string})[]

    const { result } = renderHook(() => useDashboardMetrics({ 
      pedidos: mockPedidos, 
      despesas: mockDespesas, 
      referenceDate: refDate 
    }))

    const m = result.current

    // No mes 04, temos apenas 1 pedido (100 reais), que pagou 50 de sinal
    expect(m.totalFaturadoMes).toBe(100)
    expect(m.totalRecebidoMes).toBe(50)

    // Despesas no mes = 30 pago + 20 pendente
    expect(m.despesasPagasMes).toBe(30)
    expect(m.despesasPendentesMes).toBe(20)

    // Lucro Real = 50 recebido - 30 despesas pagas = 20
    expect(m.lucroLiquidoReal).toBe(20)

    // Lucro Previsto = 100 faturado - 50 despesas = 50
    expect(m.lucroLiquidoPrevisto).toBe(50)

    // Conta atrasada
    expect(m.despesasAtrasadas.length).toBe(1)
    expect(m.despesasAtrasadas[0].id).toBe('d2')

    // Proxima entrega
    expect(m.proximosPedidos.length).toBe(1)
    expect(m.proximosPedidos[0].id).toBe('p1')
  })
})
