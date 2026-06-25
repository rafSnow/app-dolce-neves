import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFirestoreCollection } from '@/hooks/useFirestore'
import { useCalculadoraPrecificacao } from './useCalculadoraPrecificacao'
import type { InsumoFormData } from '../insumos/InsumoForm'
import { GasCalculatorModal } from './components/GasCalculatorModal'
import { useState } from 'react'

const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  rendimentoReceita: z.number().min(1, 'Mínimo de 1'),
  comissaoPerc: z.number().min(0).max(100),
  margemLucro: z.number().min(0, 'Inválido'),
  ativo: z.boolean(),
  insumos: z.array(z.object({
    insumoId: z.string().min(1, 'Selecione um insumo'),
    nomeInsumo: z.string(),
    unidade: z.string(),
    quantidadeUsadaReceita: z.number().min(0.01, 'Min 0.01'),
    custoProporcionalAtual: z.number()
  }))
})

export type ProdutoFormData = z.infer<typeof produtoSchema>

interface Props {
  initialData?: ProdutoFormData
  onSubmit: (data: ProdutoFormData & { custoUnitario: number }) => void
  onCancel: () => void
}

export function ProdutoForm({ initialData, onSubmit, onCancel }: Props) {
  const { data: insumosDB } = useFirestoreCollection<InsumoFormData & {id: string}>('insumos')
  const { calcularCustoTotalReceita, calcularCustoUnitario, verificarAlertaMargem, calcularPrecoVendaSugerido } = useCalculadoraPrecificacao()

  const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: initialData || {
      nome: '',
      rendimentoReceita: 1,
      comissaoPerc: 0,
      margemLucro: 100, // Margem padrão
      ativo: true,
      insumos: []
    }
  })

  const [isGasModalOpen, setIsGasModalOpen] = useState(false)
  const insumosGas = insumosDB?.filter(i => i.categoria === 'Gás') || []

  const { fields, append, remove } = useFieldArray({ control, name: 'insumos' })

  // Watchers para recálculo real-time
  const insumosUsados = watch('insumos') || []
  const rendimento = watch('rendimentoReceita') || 1
  const margem = watch('margemLucro') || 0
  const comissao = watch('comissaoPerc') || 0

  const custoTotal = calcularCustoTotalReceita(insumosUsados)
  const custoUnitario = calcularCustoUnitario(custoTotal, rendimento)
  const precoVendaCalculado = calcularPrecoVendaSugerido(custoUnitario, margem, comissao)
  const alerta = verificarAlertaMargem(precoVendaCalculado, custoUnitario, comissao)

  useEffect(() => {
    if (initialData) reset(initialData)
  }, [initialData, reset])

  const handleInsumoSelect = (index: number, insumoId: string) => {
    const insumoRef = insumosDB?.find(i => i.id === insumoId)
    if (insumoRef) {
      setValue(`insumos.${index}.nomeInsumo`, insumoRef.nome)
      setValue(`insumos.${index}.unidade`, insumoRef.unidadeMedida)
      recalcCustoLinha(index, insumoRef, watch(`insumos.${index}.quantidadeUsadaReceita`))
    }
  }

  const recalcCustoLinha = (index: number, insumoRef: any, qtdUsada: number) => {
    if (!insumoRef || !qtdUsada) return
    const custoProporcional = (insumoRef.precoCompra / insumoRef.pesoVolumeTotal) * qtdUsada
    setValue(`insumos.${index}.custoProporcionalAtual`, custoProporcional || 0)
  }

  const handleCustomSubmit = (data: ProdutoFormData) => {
    onSubmit({ ...data, custoUnitario })
  }

  return (
    <form onSubmit={handleSubmit(handleCustomSubmit)} className="space-y-6 bg-white p-6 border rounded-lg shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Nome do Produto</label>
          <input {...register('nome')} className="w-full border rounded p-2" placeholder="Ex: Bolo de Cenoura (Fatia)" />
          {errors.nome && <span className="text-red-500 text-sm">{errors.nome.message}</span>}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Rendimento (unidades geradas na receita)</label>
          <input type="number" {...register('rendimentoReceita', { valueAsNumber: true })} className="w-full border rounded p-2" />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-4">Ficha Técnica (Ingredientes)</h4>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-4 items-end mb-2">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Insumo</label>
              <select 
                {...register(`insumos.${index}.insumoId`)}
                onChange={(e) => handleInsumoSelect(index, e.target.value)}
                className="w-full border rounded p-2 text-sm"
              >
                <option value="">Selecione...</option>
                {insumosDB?.filter(i => i.ativo).map(i => (
                  <option key={i.id} value={i.id}>{i.nome}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium mb-1">Qtd</label>
              <input 
                type="number" step="0.01" 
                {...register(`insumos.${index}.quantidadeUsadaReceita`, { valueAsNumber: true })}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  const insumoRef = insumosDB?.find(i => i.id === watch(`insumos.${index}.insumoId`))
                  recalcCustoLinha(index, insumoRef, val)
                }}
                className="w-full border rounded p-2 text-sm" 
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium mb-1 text-gray-500">Unid.</label>
              <input readOnly {...register(`insumos.${index}.unidade`)} className="w-full bg-gray-50 border rounded p-2 text-sm text-gray-500" />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium mb-1 text-gray-500">Consumo/Unid</label>
              <input readOnly value={ ((watch(`insumos.${index}.quantidadeUsadaReceita`) || 0) / (rendimento || 1)).toFixed(2) } className="w-full bg-gray-50 border rounded p-2 text-sm text-gray-500" />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium mb-1 text-gray-500">Custo (R$)</label>
              <input readOnly value={watch(`insumos.${index}.custoProporcionalAtual`)?.toFixed(2) || '0.00'} className="w-full bg-gray-50 border rounded p-2 text-sm text-gray-500" />
            </div>
            <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
              X
            </button>
          </div>
        ))}
        <div className="flex gap-4 mt-2">
          <button type="button" onClick={() => append({ insumoId: '', nomeInsumo: '', unidade: '', quantidadeUsadaReceita: 0, custoProporcionalAtual: 0 })} className="text-sm text-blue-600 hover:underline">
            + Adicionar Ingrediente
          </button>
          <button type="button" onClick={() => setIsGasModalOpen(true)} className="text-sm text-orange-500 hover:underline flex items-center gap-1">
            🔥 Adicionar Gás à Receita
          </button>
        </div>
        {errors.insumos && <div className="text-red-500 text-sm mt-1">{errors.insumos.message}</div>}
      </div>

      {isGasModalOpen && (
        <GasCalculatorModal 
          insumosGás={insumosGas}
          onCancel={() => setIsGasModalOpen(false)}
          onConfirm={(data) => {
            const insumoRef = insumosDB?.find(i => i.id === data.insumoId)
            let custoProporcional = 0
            if (insumoRef && insumoRef.pesoVolumeTotal > 0) {
              custoProporcional = (insumoRef.precoCompra / insumoRef.pesoVolumeTotal) * data.gramasCalculadas
            }
            append({
              insumoId: data.insumoId,
              nomeInsumo: data.nomeInsumo,
              unidade: data.unidade,
              quantidadeUsadaReceita: data.gramasCalculadas,
              custoProporcionalAtual: custoProporcional
            })
            setIsGasModalOpen(false)
          }}
        />
      )}

      <div className="border-t pt-4 bg-gray-50 -mx-6 px-6 pb-6">
        <h4 className="font-semibold mb-4 pt-4">Precificação</h4>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-white border rounded shadow-sm">
            <div className="text-xs text-gray-500">Custo da Receita (Total)</div>
            <div className="text-lg font-bold text-gray-800">R$ {custoTotal.toFixed(2)}</div>
          </div>
          <div className="p-3 bg-white border rounded shadow-sm border-blue-200">
            <div className="text-xs text-blue-600 font-bold">Custo Unitário</div>
            <div className="text-xl font-bold text-blue-800">R$ {custoUnitario.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Lucro Desejado (%)</label>
            <input type="number" step="0.1" {...register('margemLucro', { valueAsNumber: true })} className="w-full border rounded p-2 border-green-300 bg-green-50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Taxas/Comissão (%)</label>
            <input type="number" step="0.1" {...register('comissaoPerc', { valueAsNumber: true })} className="w-full border rounded p-2" />
          </div>
          <div className="p-3 bg-white border rounded shadow-sm border-green-200">
            <div className="text-xs text-green-600 font-bold">Preço de Venda Final (Sugerido)</div>
            <div className="text-xl font-bold text-green-800">R$ {precoVendaCalculado.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 mt-2">
          <div>
            <div className="p-2">
              <div className="text-xs text-gray-500 mb-1">Margem Real:</div>
              <div className={`font-bold ${alerta.isPrejuizo ? 'text-red-600' : alerta.isMargemBaixa ? 'text-orange-500' : 'text-green-600'}`}>
                {alerta.margemReal.toFixed(1)}% (R$ {alerta.lucroReal.toFixed(2)})
              </div>
            </div>
          </div>
        </div>

        {alerta.isPrejuizo && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md text-sm border border-red-200">
            <strong>Atenção:</strong> Você está tendo prejuízo neste produto! O preço de venda não cobre os custos da ficha técnica + taxas.
          </div>
        )}
        {!alerta.isPrejuizo && alerta.isMargemBaixa && (
          <div className="mt-4 p-3 bg-orange-100 text-orange-800 rounded-md text-sm border border-orange-200">
            <strong>Aviso:</strong> A margem de lucro está abaixo de 20%.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 shadow">Salvar Produto</button>
      </div>
    </form>
  )
}
