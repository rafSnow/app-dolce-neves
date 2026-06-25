import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'

export function ConfiguracoesPage() {
  const { user } = useAuth()
  const { data: configs, isLoading } = useFirestoreCollection<any>('configuracoes')
  const { add, update } = useFirestoreMutation<any>('configuracoes')

  const configDoc = configs?.find(c => c.id === 'global') || configs?.[0]
  const [nomeNegocio, setNomeNegocio] = useState(configDoc?.nomeNegocio || '')

  const handleSave = async () => {
    if (configDoc) {
      await update.mutateAsync({ id: configDoc.id, data: { nomeNegocio } })
    } else {
      await add.mutateAsync({ id: 'global', nomeNegocio })
    }
    alert('Configurações salvas!')
  }

  if (isLoading) return <div>Carregando...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Configurações do Negócio</h2>
      
      <div className="bg-white p-6 border rounded shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome do Estabelecimento</label>
          <input 
            type="text" 
            className="w-full border p-2 rounded" 
            value={nomeNegocio}
            onChange={e => setNomeNegocio(e.target.value)}
            placeholder="Ex: Doce Neves"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Perfil Autenticado</label>
          <input 
            type="text" 
            disabled 
            className="w-full border p-2 rounded bg-gray-50 text-gray-500" 
            value={user?.email || ''}
          />
        </div>

        <button 
          onClick={handleSave}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Salvar
        </button>
      </div>
    </div>
  )
}
