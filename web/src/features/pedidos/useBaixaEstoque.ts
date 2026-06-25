import { db } from '@/lib/firebase'
import { doc, writeBatch } from 'firebase/firestore'
import { useAuth } from '@/providers/AuthProvider'
import { useQueryClient } from '@tanstack/react-query'

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

  return { executarBaixaLote }
}
