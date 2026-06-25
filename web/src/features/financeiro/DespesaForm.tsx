import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'

export const despesaSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.number().min(0.01, 'Valor inválido'),
  categoria: z.enum(['Insumos', 'Investimentos', 'Outros']),
  status: z.enum(['Pago', 'Pendente']),
  ativo: z.boolean().optional(),
  dataVencimento: z.string().min(1, 'Data obrigatória'),
  dataPagamento: z.string().optional()
})

export type DespesaFormData = z.infer<typeof despesaSchema>

interface Props {
  initialData?: DespesaFormData
  onSubmit: (data: DespesaFormData) => void
  onCancel: () => void
}

export function DespesaForm({ initialData, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: initialData || {
      descricao: '',
      valor: 0,
      categoria: 'Insumos',
      status: 'Pendente',
      dataVencimento: new Date().toISOString().split('T')[0],
      dataPagamento: ''
    }
  })

  useEffect(() => {
    if (initialData) reset(initialData)
  }, [initialData, reset])

  const statusAtual = watch('status')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-4 border rounded shadow-sm">
      <div>
        <label className="block text-sm font-medium mb-1">Descrição</label>
        <input {...register('descricao')} className="w-full border rounded p-2" placeholder="Ex: Compra de Embalagens" />
        {errors.descricao && <span className="text-red-500 text-sm">{errors.descricao.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Valor (R$)</label>
          <input type="number" step="0.01" {...register('valor', { valueAsNumber: true })} className="w-full border rounded p-2" />
          {errors.valor && <span className="text-red-500 text-sm">{errors.valor.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <select {...register('categoria')} className="w-full border rounded p-2">
            <option value="Insumos">Insumos (Ingredientes/Embalagens)</option>
            <option value="Investimentos">Investimentos (Equipamentos)</option>
            <option value="Outros">Outros (Luz, Água, Marketing)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
          <select id="status" {...register('status')} className="w-full border rounded p-2">
            <option value="Pendente">A Pagar (Pendente)</option>
            <option value="Pago">Pago</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vencimento Previsto</label>
          <input type="date" {...register('dataVencimento')} className="w-full border rounded p-2" />
          {errors.dataVencimento && <span className="text-red-500 text-sm">{errors.dataVencimento.message}</span>}
        </div>
      </div>

      {statusAtual === 'Pago' && (
        <div>
          <label className="block text-sm font-medium mb-1 text-green-700">Data do Pagamento Efetivado</label>
          <input type="date" {...register('dataPagamento')} className="w-full border rounded p-2 bg-green-50 border-green-200" />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Salvar Despesa</button>
      </div>
    </form>
  )
}
