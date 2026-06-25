import { useState } from 'react'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { ClienteForm, ClienteFormData } from './ClienteForm'

export function ClientesPage() {
  const { data: clientes, isLoading } = useFirestoreCollection<ClienteFormData & {id: string}>('clientes')
  const { add, update, remove } = useFirestoreMutation<ClienteFormData & {id: string}>('clientes')
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<(ClienteFormData & {id: string}) | null>(null)

  const handleOpenNew = () => {
    setEditingCliente(null)
    setIsFormOpen(true)
  }

  const handleSubmit = async (data: ClienteFormData) => {
    if (editingCliente) {
      await update.mutateAsync({ id: editingCliente.id, data })
    } else {
      await add.mutateAsync({ ...data, dataCadastro: new Date().toISOString() })
    }
    setIsFormOpen(false)
  }

  if (isLoading) return <div>Carregando Clientes...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-sm text-gray-500">Gerencie a sua carteira de clientes.</p>
        </div>
        <button onClick={handleOpenNew} className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow hover:bg-primary/90">
          Novo Cliente
        </button>
      </div>

      {isFormOpen && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</h3>
          <ClienteForm 
            initialData={editingCliente || undefined} 
            onSubmit={handleSubmit} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </div>
      )}

      <div className="border rounded-md bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium">Contato</th>
              <th className="p-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes?.filter(c => c.ativo !== false).map(cliente => (
              <tr key={cliente.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{cliente.nome}</td>
                <td className="p-4 text-gray-600">{cliente.contato || '-'}</td>
                <td className="p-4 space-x-3">
                  <button onClick={() => { setEditingCliente(cliente); setIsFormOpen(true) }} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => remove.mutateAsync(cliente.id)} className="text-red-600 hover:underline">Remover</button>
                </td>
              </tr>
            ))}
            {clientes?.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
