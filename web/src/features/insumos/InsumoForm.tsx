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
      ativo: true
    }
  })

  useEffect(() => {
    if (initialData) reset(initialData)
  }, [initialData, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-4 border rounded">
      <div>
        <label className="block text-sm font-medium">Nome</label>
        <input {...register('nome')} className="w-full border rounded p-2" />
        {errors.nome && <span className="text-red-500 text-sm">{errors.nome.message}</span>}
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium">Categoria</label>
          <select {...register('categoria')} className="w-full border rounded p-2">
            <option value="Ingrediente">Ingrediente</option>
            <option value="Embalagem">Embalagem</option>
            <option value="Gás">Gás</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium">Unidade de Medida</label>
          <select {...register('unidadeMedida')} className="w-full border rounded p-2">
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="un">un</option>
            <option value="cm">cm</option>
          </select>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium">Preço de Compra</label>
          <input type="number" step="0.01" {...register('precoCompra', { valueAsNumber: true })} className="w-full border rounded p-2" />
          {errors.precoCompra && <span className="text-red-500 text-sm">{errors.precoCompra.message}</span>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium">Peso/Vol Total Pago</label>
          <input type="number" {...register('pesoVolumeTotal', { valueAsNumber: true })} className="w-full border rounded p-2" />
          {errors.pesoVolumeTotal && <span className="text-red-500 text-sm">{errors.pesoVolumeTotal.message}</span>}
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium">Estoque Disponível</label>
          <input type="number" {...register('quantidadeDisponivel', { valueAsNumber: true })} className="w-full border rounded p-2" />
          {errors.quantidadeDisponivel && <span className="text-red-500 text-sm">{errors.quantidadeDisponivel.message}</span>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium">Alerta Mínimo</label>
          <input type="number" {...register('quantidadeMinima', { valueAsNumber: true })} className="w-full border rounded p-2" />
          {errors.quantidadeMinima && <span className="text-red-500 text-sm">{errors.quantidadeMinima.message}</span>}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Salvar</button>
      </div>
    </form>
  )
}
