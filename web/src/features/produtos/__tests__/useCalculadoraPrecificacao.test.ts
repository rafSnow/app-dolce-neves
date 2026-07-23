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

  it('deve alertar prejuízo se preço de venda não cobre os custos', () => {
    // Preço venda = 10. Custo = 12. Lucro = -2
    const { lucroReal, isPrejuizo } = verificarAlertaMargem(10, 12)
    expect(isPrejuizo).toBe(true)
    expect(lucroReal).toBe(-2)
  })

  it('deve alertar margem baixa (< 20%)', () => {
    // Preço = 10, Custo = 8.5. Lucro = 1.5. MargemReal = 15%.
    const { lucroReal, margemReal, isMargemBaixa } = verificarAlertaMargem(10, 8.5)
    expect(isMargemBaixa).toBe(true)
    expect(lucroReal).toBe(1.5)
    expect(margemReal).toBe(15)
  })
})
