import { useState } from 'react'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { InsumoForm, InsumoFormData } from './InsumoForm'
import { RegistrarCompraModal } from './RegistrarCompraModal'

export function InsumosPage() {
  const { data: insumos, isLoading } = useFirestoreCollection<InsumoFormData & {id: string}>('insumos')
  const { add, update, remove } = useFirestoreMutation<InsumoFormData & {id: string}>('insumos')
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<(InsumoFormData & {id: string}) | null>(null)
  const [buyingInsumo, setBuyingInsumo] = useState<any>(null)

  const handleOpenNew = () => {
    setEditingInsumo(null)
    setIsFormOpen(true)
  }

  const handleSubmit = async (data: InsumoFormData) => {
    if (editingInsumo) {
      await update.mutateAsync({ id: editingInsumo.id, data })
    } else {
      await add.mutateAsync(data)
    }
    setIsFormOpen(false)
  }

  if (isLoading) return <div>Carregando...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão de Insumos</h2>
        <button onClick={handleOpenNew} className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
          Novo Insumo
        </button>
      </div>

      {isFormOpen && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-2">{editingInsumo ? 'Editar Insumo' : 'Novo Insumo'}</h3>
          <InsumoForm 
            initialData={editingInsumo || undefined} 
            onSubmit={handleSubmit} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </div>
      )}

      {buyingInsumo && (
        <RegistrarCompraModal 
          insumo={buyingInsumo} 
          onClose={() => setBuyingInsumo(null)} 
        />
      )}

      <div className="border rounded-md bg-white overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium">Categoria</th>
              <th className="p-4 font-medium">Estoque</th>
              <th className="p-4 font-medium">Último Preço</th>
              <th className="p-4 font-medium">Custo/Unidade</th>
              <th className="p-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {insumos?.filter(i => i.ativo !== false).map(insumo => (
              <tr key={insumo.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4">{insumo.nome}</td>
                <td className="p-4">{insumo.categoria}</td>
                <td className="p-4">
                  {insumo.quantidadeDisponivel} {insumo.unidadeMedida}
                  {insumo.quantidadeDisponivel <= insumo.quantidadeMinima && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Crítico</span>
                  )}
                </td>
                <td className="p-4">R$ {insumo.precoCompra.toFixed(2)} <span className="text-gray-500 text-xs">/ {insumo.pesoVolumeTotal}{insumo.unidadeMedida}</span></td>
                <td className="p-4 text-blue-800 font-medium">
                  R$ {(insumo.precoCompra / insumo.pesoVolumeTotal).toFixed(4)} <span className="text-gray-500 text-xs">/ {insumo.unidadeMedida}</span>
                </td>
                <td className="p-4 space-x-2">
                  <button onClick={() => setBuyingInsumo(insumo)} className="text-green-600 font-medium hover:underline px-2 py-1 bg-green-50 rounded border border-green-200">+ Comprar</button>
                  <button onClick={() => { setEditingInsumo(insumo); setIsFormOpen(true) }} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => remove.mutateAsync(insumo.id)} className="text-red-600 hover:underline">Remover</button>
                </td>
              </tr>
            ))}
            {insumos?.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">Nenhum insumo cadastrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
