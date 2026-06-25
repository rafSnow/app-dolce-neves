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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-4 border rounded shadow-sm">
      <div>
        <label className="block text-sm font-medium mb-1">Nome do Cliente</label>
        <input {...register('nome')} className="w-full border rounded p-2" placeholder="Ex: João Silva" />
        {errors.nome && <span className="text-red-500 text-sm">{errors.nome.message}</span>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Contato (Telefone/WhatsApp)</label>
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
          className="w-full border rounded p-2" 
          placeholder="(11) 99999-9999" 
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Salvar Cliente</button>
      </div>
    </form>
  )
}
