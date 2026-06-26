import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'

export const insumoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.enum(['Ingrediente', 'Embalagem', 'Gás']),
  pesoVolumeTotal: z.number().min(0, 'Deve ser maior ou igual a zero'),
  unidadeMedida: z.enum(['g', 'ml', 'un', 'm', 'cm']),
  precoCompra: z.number().min(0, 'Preço inválido'),
  quantidadeDisponivel: z.number().min(0, 'Deve ser maior ou igual a zero'),
  quantidadeMinima: z.number().min(0, 'Deve ser maior ou igual a zero'),
  ativo: z.boolean(),
  escalaComQuantidade: z.boolean().optional(),
})

export type InsumoFormData = z.infer<typeof insumoSchema>

interface Props {
  initialData?: InsumoFormData
  onSubmit: (data: InsumoFormData) => void
  onCancel: () => void
}

export function InsumoForm({ initialData, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<InsumoFormData>({
    resolver: zodResolver(insumoSchema),
    defaultValues: initialData || {
      nome: '',
      categoria: 'Ingrediente',
      pesoVolumeTotal: 0,
      unidadeMedida: 'g',
      precoCompra: 0,
      quantidadeDisponivel: 0,
      quantidadeMinima: 0,
      ativo: true,
      escalaComQuantidade: true
    }
  })

  useEffect(() => {
    if (initialData) reset(initialData)
  }, [initialData, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      
      {/* Nome */}
      <div>
        <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Nome do Insumo</label>
        <input 
          {...register('nome')} 
          placeholder="Ex: Açúcar Refinado, Embalagem de Papel..."
          className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
        />
        {errors.nome && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.nome.message}</span>}
      </div>

      {/* Categoria e Unidade */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Categoria</label>
          <select 
            {...register('categoria')} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all appearance-none"
          >
            <option value="Ingrediente">Ingrediente</option>
            <option value="Embalagem">Embalagem</option>
            <option value="Gás">Gás</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Unidade de Medida</label>
          <select 
            {...register('unidadeMedida')} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all appearance-none"
          >
            <option value="g">Gramas (g)</option>
            <option value="ml">Mililitros (ml)</option>
            <option value="un">Unidade (un)</option>
            <option value="cm">Centímetros (cm)</option>
          </select>
        </div>
      </div>

      {/* Preço e Peso Total */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Preço Total Pago (R$)</label>
          <input 
            type="number" 
            step="0.01" 
            placeholder="0.00"
            {...register('precoCompra', { valueAsNumber: true })} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
          />
          {errors.precoCompra && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.precoCompra.message}</span>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Peso/Vol Total do Pacote</label>
          <input 
            type="number" 
            placeholder="Ex: 1000 (se comprou 1kg em gramas)"
            {...register('pesoVolumeTotal', { valueAsNumber: true })} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
          />
          {errors.pesoVolumeTotal && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.pesoVolumeTotal.message}</span>}
        </div>
      </div>

      {/* Estoque */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Estoque Atual (Embalagem Fechada)</label>
          <input 
            type="number" 
            placeholder="Ex: 5"
            {...register('quantidadeDisponivel', { valueAsNumber: true })} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
          />
          {errors.quantidadeDisponivel && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.quantidadeDisponivel.message}</span>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Alerta Mínimo</label>
          <input 
            type="number" 
            placeholder="Ex: 2"
            {...register('quantidadeMinima', { valueAsNumber: true })} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
          />
          {errors.quantidadeMinima && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.quantidadeMinima.message}</span>}
        </div>
      </div>

      {/* Flag de Custo Fixo/Escala */}
      <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
        <div className="pt-1">
          <input 
            type="checkbox" 
            id="escalaComQuantidade"
            {...register('escalaComQuantidade')}
            className="w-5 h-5 text-dolce-rosa rounded border-gray-300 focus:ring-dolce-rosa" 
          />
        </div>
        <div>
          <label htmlFor="escalaComQuantidade" className="block text-sm font-bold text-dolce-marrom mb-1 cursor-pointer">
            Multiplicar proporcionalmente?
          </label>
          <p className="text-xs text-dolce-marrom/70">
            Deixe marcado para ingredientes (Farinha, Açúcar). Desmarque para custos de uso único por fornada/pedido (Touca, Luva), assim o sistema gastará exatamente a quantidade da receita independente de quantas unidades o cliente pedir.
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
        <button 
          type="button" 
          onClick={onCancel} 
          className="w-full md:w-auto px-6 py-3 md:py-2.5 font-medium text-dolce-marrom bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="w-full md:w-auto px-6 py-3 md:py-2.5 font-medium text-white bg-dolce-rosa hover:bg-dolce-rosa/90 rounded-xl shadow-[0_4px_14px_rgba(201,107,122,0.3)] transition-all active:scale-[0.98]"
        >
          Salvar Insumo
        </button>
      </div>
    </form>
  )
}
