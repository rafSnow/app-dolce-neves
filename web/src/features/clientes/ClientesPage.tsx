import { useState } from 'react'
import { useFirestoreCollection, useFirestoreMutation } from '@/hooks/useFirestore'
import { ClienteForm, ClienteFormData } from './ClienteForm'
import { Plus, Users, X, MessageCircle, Pencil, Trash2, Calendar } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

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

  const getWhatsAppLink = (phone: string) => {
    if (!phone) return '#'
    const numbersOnly = phone.replace(/\D/g, '')
    if (numbersOnly.length < 10) return '#'
    // Assume Brazil code (55) if not provided implicitly
    return `https://wa.me/55${numbersOnly}`
  }

  if (isLoading) return <div className="flex justify-center p-8 text-dolce-marrom/50">Carregando Clientes...</div>

  return (
    <div className="flex flex-col gap-6 w-full relative min-h-full">
      {/* HEADER E BOTÃO DESKTOP */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-dolce-rosa-claro p-3 rounded-2xl hidden sm:block">
            <Users className="w-7 h-7 text-dolce-rosa" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-dolce-marrom tracking-tight">Clientes</h2>
            <p className="text-sm text-dolce-marrom/60 mt-1">Sua carteira de clientes fiéis.</p>
          </div>
        </div>
        
        {/* Botão Desktop */}
        <button 
          onClick={handleOpenNew} 
          className="hidden md:flex items-center gap-2 bg-dolce-rosa hover:bg-dolce-rosa/90 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      {/* MODAL / BOTTOM SHEET DO FORMULÁRIO */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-dolce-marrom/40 backdrop-blur-sm transition-opacity" />
          <Dialog.Content 
            className="fixed z-50 bg-white p-5 md:p-6 shadow-2xl transition-transform animate-in
                       /* Mobile: Bottom Sheet */
                       bottom-0 left-0 right-0 w-full rounded-t-3xl slide-in-from-bottom flex flex-col
                       /* Desktop: Modal Centralizado */
                       md:bottom-auto md:top-[50%] md:left-[50%] md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full md:rounded-2xl md:zoom-in-95"
          >
            {/* Grabber visual para mobile */}
            <div className="md:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0"></div>
            
            <div className="flex justify-between items-center mb-4 shrink-0">
              <Dialog.Title className="text-xl font-bold text-dolce-marrom flex items-center gap-2">
                <Users className="w-6 h-6 text-dolce-rosa" />
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 text-dolce-marrom/50 hover:bg-dolce-rosa-claro hover:text-dolce-marrom rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 pb-6 md:pb-0">
              <ClienteForm 
                initialData={editingCliente || undefined} 
                onSubmit={handleSubmit} 
                onCancel={() => setIsFormOpen(false)} 
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* LISTAGEM (CARDS MOBILE / GRID DESKTOP) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 md:pb-0">
        {clientes?.filter(c => c.ativo !== false).map(cliente => (
          <div key={cliente.id} className="bg-white rounded-2xl shadow-sm border border-dolce-rosa-claro/50 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
            
            <div className="p-5 flex flex-col gap-1">
              <div className="flex items-start justify-between">
                <h4 className="font-bold text-lg text-dolce-marrom line-clamp-1 flex-1 pr-2">{cliente.nome}</h4>
                
                {cliente.contato && cliente.contato.replace(/\D/g, '').length >= 10 && (
                  <a 
                    href={getWhatsAppLink(cliente.contato)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-full transition-colors flex-shrink-0"
                    title="Chamar no WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                {cliente.contato ? (
                  <span className="font-medium">{cliente.contato}</span>
                ) : (
                  <span className="italic text-gray-400">Sem contato</span>
                )}
              </div>

              {cliente.dataCadastro && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  Desde {new Date(cliente.dataCadastro).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="p-2 border-t border-gray-50 flex justify-end gap-1 bg-gray-50/30">
              <button 
                onClick={() => { setEditingCliente(cliente); setIsFormOpen(true) }} 
                className="flex-1 py-2 px-3 flex justify-center items-center gap-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <Pencil className="w-4 h-4" /> Editar
              </button>
              <div className="w-px bg-gray-200 my-2"></div>
              <button 
                onClick={() => {
                  if (window.confirm(`Tem certeza que deseja remover ${cliente.nome}?`)) {
                    remove.mutateAsync(cliente.id)
                  }
                }} 
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                aria-label="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {clientes?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-dolce-rosa-claro text-dolce-marrom/50">
            <Users className="w-16 h-16 mb-4 opacity-30 text-dolce-rosa" />
            <h3 className="text-lg font-bold mb-1 text-dolce-marrom">Nenhum Cliente</h3>
            <p className="text-sm font-medium text-center px-4 max-w-sm">
              Comece a montar sua carteira de clientes. O contato rápido ajuda muito na fidelização!
            </p>
            <button 
              onClick={handleOpenNew} 
              className="mt-6 flex items-center gap-2 bg-dolce-rosa text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Cliente
            </button>
          </div>
        )}
      </div>

      {/* FAB (Floating Action Button) MOBILE */}
      <button
        onClick={handleOpenNew}
        className="md:hidden fixed bottom-24 right-5 z-40 bg-dolce-rosa text-white p-4 rounded-2xl shadow-[0_4px_14px_rgba(201,107,122,0.4)] hover:scale-105 active:scale-95 transition-transform"
        aria-label="Novo Cliente"
      >
        <Plus className="w-7 h-7" />
      </button>

    </div>
  )
}
