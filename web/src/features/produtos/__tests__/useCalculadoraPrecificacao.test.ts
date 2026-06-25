import { describe, it, expect } from 'vitest'
import { useCalculadoraPrecificacao } from '../useCalculadoraPrecificacao'

describe('useCalculadoraPrecificacao', () => {
  const { calcularCustoTotalReceita, calcularCustoUnitario, verificarAlertaMargem } = useCalculadoraPrecificacao()

  it('deve calcular corretamente o custo total da receita baseado no array de insumos', () => {
    const insumos = [
      { insumoId: '1', nomeInsumo: 'A', unidade: 'g', quantidadeUsadaReceita: 100, custoProporcionalAtual: 5.50 },
      { insumoId: '2', nomeInsumo: 'B', unidade: 'un', quantidadeUsadaReceita: 2, custoProporcionalAtual: 2.00 },
    ]
    expect(calcularCustoTotalReceita(insumos)).toBe(7.50)
  })

  it('deve calcular o custo unitário corretamente', () => {
    expect(calcularCustoUnitario(10.00, 2)).toBe(5.00)
    expect(calcularCustoUnitario(10.00, 0)).toBe(0) // Safe fail
  })

  it('deve alertar prejuízo se preço de venda não cobre os custos e comissão', () => {
    // Preço venda = 10. Custo = 8. Comissao = 30% (3 reais). Lucro = -1 (Prejuízo)
    const alerta = verificarAlertaMargem(10, 8, 30)
    expect(alerta.isPrejuizo).toBe(true)
    expect(alerta.lucroReal).toBe(-1)
  })

  it('deve alertar margem baixa (< 20%)', () => {
    // Preço = 10, Custo = 7, Comissao = 20% (2). Lucro = 1 (10%).
    const alerta = verificarAlertaMargem(10, 7, 20)
    expect(alerta.isPrejuizo).toBe(false)
    expect(alerta.isMargemBaixa).toBe(true)
    expect(alerta.margemReal).toBe(10)
  })
})
