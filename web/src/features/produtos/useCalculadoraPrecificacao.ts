export interface InsumoFichaTecnica {
  insumoId: string
  nomeInsumo: string
  unidade: string
  quantidadeUsadaReceita: number
  custoProporcionalAtual: number
}

export function useCalculadoraPrecificacao() {
  const calcularCustoTotalReceita = (insumos: InsumoFichaTecnica[]) => {
    return insumos.reduce((total, insumo) => total + (insumo.custoProporcionalAtual || 0), 0)
  }

  const calcularCustoUnitario = (custoTotal: number, rendimento: number) => {
    if (rendimento <= 0) return 0
    return custoTotal / rendimento
  }

  const calcularPrecoVendaSugerido = (custoUnitario: number, markupPercentual: number, comissaoPercentual: number) => {
    // PV = Custo / (1 - (Markup + Comissão) / 100)
    // Usando uma margem simples por baixo (Custo + Margem% + Comissao%) para facilitar confeitaria caseira
    const valorComissao = custoUnitario * (comissaoPercentual / 100)
    const valorLucro = custoUnitario * (markupPercentual / 100)
    return custoUnitario + valorComissao + valorLucro
  }

  const verificarAlertaMargem = (precoVenda: number, custoUnitario: number, comissaoPercentual: number) => {
    const valorComissao = precoVenda * (comissaoPercentual / 100)
    const lucroReal = precoVenda - custoUnitario - valorComissao
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
