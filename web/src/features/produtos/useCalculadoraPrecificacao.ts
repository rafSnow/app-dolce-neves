export interface InsumoFichaTecnica {
  insumoId: string
  nomeInsumo: string
  unidade: string
  quantidadeUsadaReceita: number
  custoProporcionalAtual: number
}

export function useCalculadoraPrecificacao() {
  const calcularCustoTotalReceita = (
    insumos: InsumoFichaTecnica[], 
    tempoEstimadoMinutos: number = 0, 
    valorHoraTrabalhada: number = 0
  ) => {
    const custoInsumos = insumos.reduce((total, insumo) => total + (insumo.custoProporcionalAtual || 0), 0)
    const custoMaoDeObra = (tempoEstimadoMinutos / 60) * valorHoraTrabalhada
    return {
      custoInsumos,
      custoMaoDeObra,
      custoTotal: custoInsumos + custoMaoDeObra
    }
  }

  const calcularCustoUnitario = (custoTotal: number, rendimento: number) => {
    if (rendimento <= 0) return 0
    return custoTotal / rendimento
  }

  const calcularPrecoVendaSugerido = (custoUnitario: number, markupPercentual: number) => {
    const valorLucro = custoUnitario * (markupPercentual / 100)
    return custoUnitario + valorLucro
  }

  const verificarAlertaMargem = (precoVenda: number, custoUnitario: number) => {
    const lucroReal = precoVenda - custoUnitario
    const margemReal = precoVenda > 0 ? (lucroReal / precoVenda) * 100 : 0
    
    return {
      lucroReal,
      margemReal,
      isPrejuizo: lucroReal < 0,
      isMargemBaixa: margemReal > 0 && margemReal < 20 // Alerta para margem abaixo de 20%
    }
  }

  return {
    calcularCustoTotalReceita,
    calcularCustoUnitario,
    calcularPrecoVendaSugerido,
    verificarAlertaMargem
  }
}
