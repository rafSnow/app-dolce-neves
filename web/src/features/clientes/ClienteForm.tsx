import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'

export const clienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  contato: z.string().optional(),
  ativo: z.boolean(),
  dataCadastro: z.string().optional()
})

export type ClienteFormData = z.infer<typeof clienteSchema>

interface Props {
  initialData?: ClienteFormData
  onSubmit: (data: ClienteFormData) => void
  onCancel: () => void
}

export function ClienteForm({ initialData, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: initialData || {
      nome: '',
      contato: '',
      ativo: true
    }
  })

  useEffect(() => {
    if (initialData) reset(initialData)
  }, [initialData, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-4">
      <div>
        <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Nome do Cliente</label>
        <input 
          {...register('nome')} 
          className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
          placeholder="Ex: João Silva" 
        />
        {errors.nome && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.nome.message}</span>}
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Contato (WhatsApp)</label>
        <input 
          {...register('contato')} 
          onChange={(e) => {
            let v = e.target.value.replace(/\D/g, '')
            if (v.length <= 10) {
              v = v.replace(/^(\d{2})(\d)/g, '($1) $2')
              v = v.replace(/(\d{4})(\d)/, '$1-$2')
            } else {
              v = v.replace(/^(\d{2})(\d)/g, '($1) $2')
              v = v.replace(/(\d{5})(\d)/, '$1-$2')
            }
            e.target.value = v.substring(0, 15)
            register('contato').onChange(e)
          }}
          className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all" 
          placeholder="(11) 99999-9999" 
        />
      </div>

      <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
        <button 
          type="button" 
          onClick={onCancel} 
          className="w-full md:w-auto px-6 py-3 md:py-2.5 font-medium text-dolce-marrom bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="w-full md:w-auto px-8 py-3 md:py-2.5 font-bold text-white bg-dolce-rosa hover:bg-dolce-rosa/90 rounded-xl shadow-[0_4px_14px_rgba(201,107,122,0.4)] transition-all active:scale-[0.98]"
        >
          Salvar Cliente
        </button>
      </div>
    </form>
  )
}
