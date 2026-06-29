import { useFirestoreCollection } from './useFirestore'
import { useCalculadoraPrecificacao } from '@/features/produtos/useCalculadoraPrecificacao'
import type { ProdutoFormData } from '@/features/produtos/ProdutoForm'
import type { InsumoFormData } from '@/features/insumos/InsumoForm'

export type ProdutoDinamico = ProdutoFormData & { 
  id: string
  precoVendaCalculado: number
  custoTotalReceita: number
  custoUnitario: number
}

export function useProdutosDinamicos() {
  const { data: produtosDB, isLoading: isLoadingProd } = useFirestoreCollection<ProdutoFormData & {id: string}>('produtos')
  const { data: insumosDB, isLoading: isLoadingIns } = useFirestoreCollection<InsumoFormData & {id: string}>('insumos')
  const { data: configs, isLoading: isLoadingConfig } = useFirestoreCollection<any>('configuracoes')
  const { calcularCustoUnitario, calcularPrecoVendaSugerido } = useCalculadoraPrecificacao()

  const isLoading = isLoadingProd || isLoadingIns || isLoadingConfig

  let produtosDinamicos: ProdutoDinamico[] = []

  if (produtosDB && insumosDB && configs) {
    const configDoc = configs.find(c => c.id === 'global') || configs[0]
    const valorHoraTrabalhada = configDoc?.valorHoraTrabalhada || 0

    produtosDinamicos = produtosDB.map(produto => {
      // Recalcular o custo atual da receita baseado no preço dos insumos DE HOJE
      let custoTotalAtualizado = 0
      
      const insumosAtualizados = (produto.insumos || []).map(ingrediente => {
        const insumoBase = insumosDB.find(i => i.id === ingrediente.insumoId)
        let custoProporcional = ingrediente.custoProporcionalAtual // Fallback
        if (insumoBase) {
          custoProporcional = (insumoBase.precoCompra / insumoBase.pesoVolumeTotal) * ingrediente.quantidadeUsadaReceita
        }
        custoTotalAtualizado += custoProporcional
        return { ...ingrediente, custoProporcionalAtual: custoProporcional }
      })

      // Add labor cost
      const tempoEstimadoMinutos = produto.tempoEstimadoMinutos || 0
      const custoMaoDeObra = (tempoEstimadoMinutos / 60) * valorHoraTrabalhada
      custoTotalAtualizado += custoMaoDeObra

      const custoUnitario = calcularCustoUnitario(custoTotalAtualizado, produto.rendimentoReceita)
      const precoCalculado = calcularPrecoVendaSugerido(custoUnitario, produto.margemLucro || 0, produto.comissaoPerc || 0)

      return {
        ...produto,
        insumos: insumosAtualizados,
        custoTotalReceita: custoTotalAtualizado,
        custoUnitario,
        precoVendaCalculado: precoCalculado
      }
    })
  }

  return { data: produtosDinamicos, isLoading }
}
