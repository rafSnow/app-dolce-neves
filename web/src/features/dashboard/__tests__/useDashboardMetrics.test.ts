import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDashboardMetrics } from '../useDashboardMetrics'
import { PedidoFormData } from '@/features/pedidos/PedidoForm'
import { DespesaFormData } from '@/features/financeiro/DespesaForm'

describe('useDashboardMetrics', () => {
  it('deve calcular corretamente lucro e separar pedidos e despesas pelo mes', () => {
    // Usaremos uma data fixa: 15 de Agosto de 2026 (Mês Atual)
    const refDate = new Date('2026-08-15T12:00:00Z')

    const mockPedidos: any[] = [
      {
        id: 'p1',
        clienteId: '1', clienteNome: 'A',
        dataPedido: '2026-08-10T10:00:00Z',
        dataEntrega: '2026-08-16T10:00:00Z', // amanha
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
        dataPedido: '2026-07-10T10:00:00Z',
        dataEntrega: '2026-07-16T10:00:00Z', 
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
        valor: 30, dataVencimento: '2026-08-10T12:00:00Z', dataPagamento: '2026-08-09T12:00:00Z'
      },
      { // Pendente e Atrasada
        id: 'd2', descricao: 'Agua', categoria: 'Outros', status: 'Pendente',
        valor: 20, dataVencimento: '2026-08-01T12:00:00Z' // Atrasada
      }
    ] as (DespesaFormData & {id: string})[]

    const { result } = renderHook(() => useDashboardMetrics({ 
      pedidos: mockPedidos, 
      despesas: mockDespesas, 
      referenceDate: refDate 
    }))

    const m = result.current

    // No mes 04, temos apenas 1 pedido (100 reais). O sinal foi de 50 no mes 04. 
    // O restante de 50 cai no mes 04 pois a entrega é dia 16/04.
    // Portanto, o Faturamento deste mes é 100
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
