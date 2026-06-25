import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, writeBatch, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface CompraData {
  insumoId: string
  insumoNome: string
  quantidadeComprada: number // Em gramas, un, etc
  valorPago: number // Valor que altera o preço base
  quantidadeEstoqueAtual: number
}

export function useRegistrarCompraInsumo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CompraData) => {
      const batch = writeBatch(db)

      // 1. Atualizar Insumo
      const insumoRef = doc(db, 'insumos', data.insumoId)
      // O novo preço de compra passa a ser o valor pago agora, 
      // ou podemos fazer media. O requisito diz: "último preço pago dita o custo".
      batch.update(insumoRef, {
        quantidadeDisponivel: data.quantidadeEstoqueAtual + data.quantidadeComprada,
        precoCompra: data.valorPago,
        // O peso total da embalagem (referencia) pode mudar? 
        // Normalmente a Ficha Técnica compra "Lata 395g por 10,00". 
        // Se pagou 10,00, a compra foi de 395g. Vamos atualizar o pesoVoumeTotal também 
        // para que Custo/Unidade seja valorPago / quantidadeComprada.
        pesoVolumeTotal: data.quantidadeComprada,
      })

      // 2. Criar Despesa
      const despesasRef = doc(collection(db, 'despesas'))
      batch.set(despesasRef, {
        descricao: `Compra de Insumo: ${data.insumoNome}`,
        valor: data.valorPago,
        categoria: 'Insumos',
        status: 'Pago',
        dataVencimento: new Date().toISOString(),
        dataPagamento: new Date().toISOString(),
      })

      await batch.commit()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      queryClient.invalidateQueries({ queryKey: ['despesas'] })
    }
  })
}
