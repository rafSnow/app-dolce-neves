import { useState } from 'react'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { DespesaForm, DespesaFormData } from './DespesaForm'

export function DespesasPage() {
  const { data: despesas, isLoading } = useFirestoreCollection<DespesaFormData & {id: string}>('despesas')
  const { add, update, remove } = useFirestoreMutation<DespesaFormData & {id: string}>('despesas')
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDespesa, setEditingDespesa] = useState<(DespesaFormData & {id: string}) | null>(null)

  const handleOpenNew = () => {
    setEditingDespesa(null)
    setIsFormOpen(true)
  }

  const handleSubmit = async (data: DespesaFormData) => {
    if (editingDespesa) {
      await update.mutateAsync({ id: editingDespesa.id, data })
    } else {
      await add.mutateAsync(data)
    }
    setIsFormOpen(false)
  }

  if (isLoading) return <div>Carregando Despesas...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Despesas (Contas a Pagar)</h2>
          <p className="text-sm text-gray-500">Registre seus gastos para calcular o lucro real.</p>
        </div>
        <button onClick={handleOpenNew} className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow hover:bg-primary/90">
          Nova Despesa
        </button>
      </div>

      {isFormOpen && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">{editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}</h3>
          <DespesaForm 
            initialData={editingDespesa || undefined} 
            onSubmit={handleSubmit} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </div>
      )}

      <div className="border rounded-md bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium">Descrição</th>
              <th className="p-4 font-medium">Categoria</th>
              <th className="p-4 font-medium">Vencimento</th>
              <th className="p-4 font-medium">Valor</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {despesas?.filter(d => d.ativo !== false).map(despesa => (
              <tr key={despesa.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{despesa.descricao}</td>
                <td className="p-4 text-gray-600">{despesa.categoria}</td>
                <td className="p-4 text-gray-600">{new Date(despesa.dataVencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td className="p-4 font-bold text-red-600">R$ {despesa.valor.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${despesa.status === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {despesa.status}
                  </span>
                </td>
                <td className="p-4 space-x-3">
                  <button onClick={() => { setEditingDespesa(despesa); setIsFormOpen(true) }} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => remove.mutateAsync(despesa.id)} className="text-red-600 hover:underline">Remover</button>
                </td>
              </tr>
            ))}
            {despesas?.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Nenhuma despesa cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
