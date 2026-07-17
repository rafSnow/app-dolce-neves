import { db } from '@/lib/firebase'
import { doc, writeBatch } from 'firebase/firestore'
import { useAuth } from '@/providers/AuthProvider'
import { useQueryClient } from '@tanstack/react-query'
import { useFirestoreCollection } from '@/hooks/useFirestore'

export interface ItemBaixaEstoque {
  insumoId: string
  insumoNome?: string
  unidade?: string
  quantidadeParaBaixar: number
  estoqueAtual: number
}

export function useBaixaEstoque() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: produtos } = useFirestoreCollection<any>('produtos')
  const { data: insumos } = useFirestoreCollection<any>('insumos')

  const prepararBaixaEstoque = (pedidoData: any): ItemBaixaEstoque[] => {
    const mapaInsumos = new Map<string, number>()
    
    pedidoData.itens.forEach((item: any) => {
      const prod = produtos?.find(p => p.id === item.produtoId)
      if (prod && prod.insumos) {
        prod.insumos.forEach((insumoReceita: any) => {
          const insumoDoc = insumos?.find(i => i.id === insumoReceita.insumoId)
          const tipoEscala = insumoDoc?.tipoEscala || (insumoDoc?.escalaComQuantidade === false ? 'por_produto' : 'proporcional')
          const atual = mapaInsumos.get(insumoReceita.insumoId) || 0

          if (tipoEscala === 'por_pedido') {
            mapaInsumos.set(insumoReceita.insumoId, Math.max(atual, insumoReceita.quantidadeUsadaReceita))
          } else if (tipoEscala === 'por_produto') {
            mapaInsumos.set(insumoReceita.insumoId, atual + insumoReceita.quantidadeUsadaReceita)
          } else {
            // proporcional
            mapaInsumos.set(insumoReceita.insumoId, atual + (insumoReceita.quantidadeUsadaReceita * item.quantidade))
          }
        })
      }
    })

    if (pedidoData.embalagensExtras) {
      pedidoData.embalagensExtras.forEach((emb: any) => {
        const atual = mapaInsumos.get(emb.insumoId) || 0
        mapaInsumos.set(emb.insumoId, atual + emb.quantidade)
      })
    }

    const lotesParaBaixar: ItemBaixaEstoque[] = []
    mapaInsumos.forEach((qtdNecessaria, insId) => {
      const insumoDoc = insumos?.find(i => i.id === insId)
      if (insumoDoc) {
        lotesParaBaixar.push({
          insumoId: insId,
          insumoNome: insumoDoc.nome,
          unidade: insumoDoc.unidadeMedida,
          estoqueAtual: insumoDoc.quantidadeDisponivel,
          quantidadeParaBaixar: qtdNecessaria
        })
      }
    })

    return lotesParaBaixar
  }

  const executarBaixaLote = async (itensParaBaixar: ItemBaixaEstoque[]) => {
    if (!user) throw new Error('Não autenticado')
    
    // Inicia um lote transacional do Firestore
    const batch = writeBatch(db)

    itensParaBaixar.forEach(item => {
      const novoEstoque = item.estoqueAtual - item.quantidadeParaBaixar
      // Evitar que o estoque fique negativo no banco, travando em 0
      const estoqueFinalSeguro = novoEstoque < 0 ? 0 : novoEstoque
      
      const insumoRef = doc(db, 'insumos', item.insumoId)
      batch.update(insumoRef, { quantidadeDisponivel: estoqueFinalSeguro })
    })

    // Submete o lote inteiro de uma vez (ou falha tudo ou grava tudo)
    await batch.commit()
    
    queryClient.invalidateQueries({ queryKey: ['insumos'] })
  }

  return { executarBaixaLote, prepararBaixaEstoque }
}
