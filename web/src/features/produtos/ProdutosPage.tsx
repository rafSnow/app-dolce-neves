import { useState } from 'react'
import { useFirestoreMutation } from '@/hooks/useFirestore'
import { useProdutosDinamicos } from '@/hooks/useProdutosDinamicos'
import { ProdutoForm, ProdutoFormData } from './ProdutoForm'

export function ProdutosPage() {
  const { data: produtos, isLoading } = useProdutosDinamicos()
  const { add, update, remove } = useFirestoreMutation<ProdutoFormData & {id: string}>('produtos')
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<(ProdutoFormData & {id: string}) | null>(null)

  const handleOpenNew = () => {
    setEditingProduto(null)
    setIsFormOpen(true)
  }

  const handleSubmit = async (data: ProdutoFormData) => {
    if (editingProduto) {
      await update.mutateAsync({ id: editingProduto.id, data })
    } else {
      await add.mutateAsync(data)
    }
    setIsFormOpen(false)
  }

  if (isLoading) return <div>Carregando...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fichas Técnicas e Produtos</h2>
          <p className="text-sm text-gray-500">Crie suas receitas, defina rendimentos e ajuste a precificação.</p>
        </div>
        <button onClick={handleOpenNew} className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow hover:bg-primary/90">
          Novo Produto
        </button>
      </div>

      {isFormOpen && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">{editingProduto ? 'Editar Produto' : 'Novo Produto'}</h3>
          <ProdutoForm 
            initialData={editingProduto || undefined} 
            onSubmit={handleSubmit} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </div>
      )}

      <div className="border rounded-md bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium">Produto</th>
              <th className="p-4 font-medium">Rendimento</th>
              <th className="p-4 font-medium">Custo Unitário</th>
              <th className="p-4 font-medium">Venda Sugerida</th>
              <th className="p-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos?.filter(p => p.ativo !== false).map(produto => (
              <tr key={produto.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{produto.nome}</td>
                <td className="p-4 text-gray-600">{produto.rendimentoReceita} un.</td>
                <td className="p-4 text-red-600">R$ {produto.custoUnitario?.toFixed(2) || '0.00'}</td>
                <td className="p-4 text-green-600 font-bold">R$ {produto.precoVendaCalculado?.toFixed(2) || '0.00'}</td>
                <td className="p-4 space-x-3">
                  <button onClick={() => { setEditingProduto(produto); setIsFormOpen(true) }} className="text-blue-600 hover:underline">Ficha Técnica</button>
                  <button onClick={() => remove.mutateAsync(produto.id)} className="text-red-600 hover:underline">Remover</button>
                </td>
              </tr>
            ))}
            {produtos?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Nenhum produto cadastrado. Comece criando sua primeira Ficha Técnica.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
