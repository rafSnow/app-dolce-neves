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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-4">
      <div>
        <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Descrição</label>
        <input 
          {...register('descricao')} 
          className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
          placeholder="Ex: Compra de Embalagens" 
        />
        {errors.descricao && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.descricao.message}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <div>
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Valor (R$)</label>
          <input 
            type="number" step="0.01" 
            {...register('valor', { valueAsNumber: true })} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
          />
          {errors.valor && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.valor.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Categoria</label>
          <select 
            {...register('categoria')} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all appearance-none"
          >
            <option value="Insumos">Insumos (Ingredientes/Embalagens)</option>
            <option value="Investimentos">Investimentos (Equipamentos)</option>
            <option value="Outros">Outros (Luz, Água, Marketing)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 border-t border-gray-100 pt-5 mt-2">
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-dolce-marrom mb-1.5">Status da Conta</label>
          <select 
            id="status" 
            {...register('status')} 
            className={`w-full border rounded-xl p-3 focus:outline-none focus:ring-2 transition-all font-semibold appearance-none
              ${statusAtual === 'Pago' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 focus:ring-emerald-500/50' 
                : 'bg-amber-50 border-amber-200 text-amber-800 focus:ring-amber-500/50'
              }`}
          >
            <option value="Pendente">A Pagar (Pendente)</option>
            <option value="Pago">Pago</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Vencimento Previsto</label>
          <input 
            type="date" 
            {...register('dataVencimento')} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 transition-all" 
          />
          {errors.dataVencimento && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.dataVencimento.message}</span>}
        </div>
      </div>

      {statusAtual === 'Pago' && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <label className="block text-sm font-bold text-emerald-700 mb-1.5">Data do Pagamento Efetivado</label>
          <input 
            type="date" 
            {...register('dataPagamento')} 
            className="w-full bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
          />
        </div>
      )}

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
          className="w-full md:w-auto px-8 py-3 md:py-2.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-[0_4px_14px_rgba(225,29,72,0.4)] transition-all active:scale-[0.98]"
        >
          Salvar Despesa
        </button>
      </div>
    </form>
  )
}
