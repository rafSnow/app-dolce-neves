import { z } from 'zod'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useFirestoreCollection } from '@/hooks/useFirestore'
import { PlusCircle, Flame, Droplet, PackagePlus, Clock } from 'lucide-react'
import { useCalculadoraPrecificacao } from './useCalculadoraPrecificacao'
import type { InsumoFormData } from '../insumos/InsumoForm'
import { GasCalculatorModal } from './components/GasCalculatorModal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  rendimentoReceita: z.number().min(1, 'Mínimo de 1'),
  tempoEstimadoMinutos: z.number().min(0, 'Mínimo de 0').optional(),
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
      tempoEstimadoMinutos: 0,
      comissaoPerc: 0,
      margemLucro: 100, // Margem padrão
      ativo: true,
      insumos: []
    }
  })

  const [isGasModalOpen, setIsGasModalOpen] = useState(false)
  const insumosGas = insumosDB?.filter(i => i.categoria === 'Gás') || []

  const { fields, append, remove } = useFieldArray({ control, name: 'insumos' })

  const { data: configs } = useFirestoreCollection<any>('configuracoes')
  const configDoc = configs?.find(c => c.id === 'global') || configs?.[0]
  const valorHoraTrabalhada = configDoc?.valorHoraTrabalhada || 0

  // Watchers para recálculo real-time
  const insumosUsados = watch('insumos') || []
  const rendimento = watch('rendimentoReceita') || 1
  const margem = watch('margemLucro') || 0
  const comissao = watch('comissaoPerc') || 0
  const tempoEstimadoMinutos = watch('tempoEstimadoMinutos') || 0

  const { custoTotal, custoInsumos, custoMaoDeObra } = calcularCustoTotalReceita(insumosUsados, tempoEstimadoMinutos, valorHoraTrabalhada)
  const custoUnitario = calcularCustoUnitario(custoTotal, rendimento)
  const precoVendaCalculado = calcularPrecoVendaSugerido(custoUnitario, margem, comissao)
  const alerta = verificarAlertaMargem(precoVendaCalculado, custoUnitario, comissao)
  
  const precoVendaReceitaTotal = precoVendaCalculado * rendimento
  const lucroReceitaTotal = alerta.lucroReal * rendimento

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
    <form onSubmit={handleSubmit(handleCustomSubmit)} className="space-y-8 pb-4">
      
      {/* NOME E RENDIMENTO */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5">
        <div className="flex-[2]">
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Nome da Receita/Produto</label>
          <input 
            {...register('nome')} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
            placeholder="Ex: Bolo de Cenoura (Fatia)" 
          />
          {errors.nome && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.nome.message}</span>}
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Rendimento da Receita</label>
          <input 
            type="number" step="1" 
            {...register('rendimentoReceita', { valueAsNumber: true })} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom font-medium rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50" 
          />
          {errors.rendimentoReceita && <p className="text-red-500 text-xs mt-1">{errors.rendimentoReceita.message}</p>}
        </div>

        <div className="flex-[1.5]">
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5 flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-400" />
            Tempo Estimado (min)
          </label>
          <input 
            type="number" step="1" 
            {...register('tempoEstimadoMinutos', { valueAsNumber: true })} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom font-medium rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50" 
            placeholder="Ex: 120"
          />
          <p className="text-xs text-gray-400 mt-1">Tempo total para fazer 1 receita inteira.</p>
        </div>
      </div>

      {/* FICHA TÉCNICA (INGREDIENTES) */}
      <div>
        <h4 className="font-bold text-lg text-dolce-marrom mb-3">Ficha Técnica (Ingredientes)</h4>
        
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="relative bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3">
              <button 
                type="button" 
                onClick={() => remove(index)} 
                className="absolute top-2 right-2 p-2 text-rose-500 bg-white hover:bg-rose-50 rounded-lg shadow-sm border border-rose-100 transition-colors"
                aria-label="Remover ingrediente"
              >
                X
              </button>
              
              <div className="pr-10">
                <label className="block text-xs font-semibold text-dolce-marrom mb-1">Insumo</label>
                <Controller
                  name={`insumos.${index}.insumoId`}
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={(insumosDB || []).filter(i => i.ativo).map(i => ({ value: i.id, label: i.nome }))}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val)
                        handleInsumoSelect(index, val)
                      }}
                      placeholder="Selecione..."
                      error={!!errors.insumos?.[index]?.insumoId}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex gap-2">
                  <div className="flex-[2]">
                    <label className="block text-xs font-semibold text-dolce-marrom mb-1">Qtd na Receita</label>
                    <input 
                      type="number" step="0.01" 
                      {...register(`insumos.${index}.quantidadeUsadaReceita`, { valueAsNumber: true })}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        const insumoRef = insumosDB?.find(i => i.id === watch(`insumos.${index}.insumoId`))
                        recalcCustoLinha(index, insumoRef, val)
                      }}
                      className="w-full bg-white border border-gray-200 text-dolce-marrom rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-dolce-marrom/60 mb-1">Unid.</label>
                    <input readOnly {...register(`insumos.${index}.unidade`)} className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-dolce-marrom/60 mb-1">Por Unid.</label>
                    <input readOnly value={ ((watch(`insumos.${index}.quantidadeUsadaReceita`) || 0) / (rendimento || 1)).toFixed(2) } className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-rose-700 mb-1">Custo</label>
                    <input readOnly value={watch(`insumos.${index}.custoProporcionalAtual`)?.toFixed(2) || '0.00'} className="w-full bg-rose-50 border border-rose-100 text-rose-800 font-bold rounded-lg p-2.5 text-sm outline-none" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button 
            type="button" 
            onClick={() => append({ insumoId: '', nomeInsumo: '', unidade: '', quantidadeUsadaReceita: 0, custoProporcionalAtual: 0 })} 
            className="flex-1 py-3 px-4 border-2 border-dashed border-dolce-rosa-claro text-dolce-rosa font-semibold rounded-xl hover:bg-dolce-rosa/5 transition-colors flex justify-center items-center gap-2"
          >
            + Adicionar Ingrediente
          </button>
          <button 
            type="button" 
            onClick={() => setIsGasModalOpen(true)} 
            className="flex-1 py-3 px-4 bg-orange-50 text-orange-600 font-semibold rounded-xl hover:bg-orange-100 transition-colors flex justify-center items-center gap-2"
          >
            🔥 Adicionar Gás à Receita
          </button>
        </div>
        {errors.insumos && <div className="text-rose-500 text-sm mt-2 font-medium">{errors.insumos.message}</div>}
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

      {/* PRECIFICAÇÃO E DASHBOARD FINANCEIRO */}
      <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100">
        <h4 className="font-bold text-xl text-dolce-marrom mb-5">Precificação Mágica</h4>
        
        {/* Top Indicators */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 relative group cursor-help">
            <div className="text-xs font-bold text-rose-600/70 uppercase tracking-wider mb-1">Custo da Receita Inteira</div>
            <div className="text-2xl font-black text-rose-600">R$ {custoTotal.toFixed(2)}</div>
            
            {/* Tooltip Hover for breakdown */}
            <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 w-48 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl z-50">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">Insumos:</span>
                <span className="font-bold">R$ {custoInsumos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mão de Obra:</span>
                <span className="font-bold">R$ {custoMaoDeObra.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
            <div className="text-xs font-bold text-blue-600/70 uppercase tracking-wider mb-1">Custo por Unidade</div>
            <div className="text-2xl font-black text-blue-700 relative z-10">R$ {custoUnitario.toFixed(2)}</div>
          </div>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-emerald-800 mb-1.5 uppercase tracking-wide">Margem de Lucro Desejada (%)</label>
            <input 
              type="number" step="0.1" 
              {...register('margemLucro', { valueAsNumber: true })} 
              className="w-full bg-white border border-emerald-200 text-emerald-900 font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-lg" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-dolce-marrom/60 mb-1.5 uppercase tracking-wide">Taxas / Comissão de Venda (%)</label>
            <input 
              type="number" step="0.1" 
              {...register('comissaoPerc', { valueAsNumber: true })} 
              className="w-full bg-white border border-gray-200 text-dolce-marrom font-bold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-500/30 transition-all text-lg" 
            />
          </div>
        </div>

        {/* Final Price Block */}
        <div className="bg-emerald-600 p-5 rounded-2xl shadow-[0_8px_30px_rgba(5,150,105,0.3)] text-white mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-emerald-100 font-bold text-xs tracking-wide uppercase mb-1.5 cursor-pointer">Definir Preço de Venda Final (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100 font-black text-2xl">R$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  value={precoVendaCalculado.toFixed(2)}
                  onChange={(e) => {
                    const finalPrice = parseFloat(e.target.value)
                    if (!isNaN(finalPrice)) {
                      if (custoUnitario > 0) {
                        const baseComissao = custoUnitario * (comissao / 100)
                        let newMargin = ((finalPrice - custoUnitario - baseComissao) / custoUnitario) * 100
                        if (newMargin < 0) newMargin = 0 // Prevents negative margin in DB, although theoretically possible, typically business won't save negative margin here
                        setValue('margemLucro', newMargin)
                      } else {
                        setValue('margemLucro', 100)
                      }
                    }
                  }}
                  className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-black text-4xl tracking-tight rounded-2xl py-3 pl-14 pr-4 focus:outline-none focus:ring-4 focus:ring-emerald-400/50 transition-all placeholder-emerald-100/50"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="bg-white/20 px-5 py-4 rounded-2xl backdrop-blur-md border border-white/10 text-right min-w-[160px]">
              <div className="text-[10px] text-emerald-100 uppercase tracking-widest font-bold mb-1">Lucro Limpo (Unitário)</div>
              <div className="text-2xl font-black">R$ {alerta.lucroReal.toFixed(2)}</div>
              <div className="text-sm font-bold opacity-90 mt-0.5">({alerta.margemReal.toFixed(1)}%)</div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-500/50 flex flex-col sm:flex-row justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-300"></div>
              <span className="text-emerald-100 font-medium">Faturamento da Receita Inteira:</span>
              <strong className="font-bold">R$ {precoVendaReceitaTotal.toFixed(2)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-300"></div>
              <span className="text-emerald-100 font-medium">Lucro da Receita Inteira:</span>
              <strong className="font-bold">R$ {lucroReceitaTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* ALERTS */}
        {alerta.isPrejuizo && (
          <div className="p-4 bg-rose-100 text-rose-800 rounded-xl border border-rose-300 text-sm animate-in fade-in zoom-in-95 flex gap-3 shadow-sm">
            <svg className="w-6 h-6 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <strong className="block text-base mb-1">Atenção: Prejuízo Detectado!</strong>
              O preço de venda sugerido não cobre os custos da sua Ficha Técnica após o desconto das taxas (Cartão/Comissão). 
              Aumente a Margem de Lucro imediatamente.
            </div>
          </div>
        )}
        {!alerta.isPrejuizo && alerta.isMargemBaixa && (
          <div className="p-4 bg-orange-100 text-orange-800 rounded-xl border border-orange-300 text-sm animate-in fade-in zoom-in-95 flex gap-3 shadow-sm">
            <svg className="w-6 h-6 text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong className="block text-base mb-1">Aviso: Margem Baixa</strong>
              Sua margem de lucro real está abaixo de 20%. Isso deixa o negócio vulnerável a pequenas variações nos preços dos ingredientes.
            </div>
          </div>
        )}
      </div>

      {/* AÇÕES FINAIS */}
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
          className="w-full md:w-auto px-8 py-3 md:py-2.5 font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98]"
        >
          Salvar Ficha Técnica
        </button>
      </div>
    </form>
  )
}
