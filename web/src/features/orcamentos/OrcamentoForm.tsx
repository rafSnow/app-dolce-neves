import { z } from 'zod'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useMemo } from 'react'
import { useFirestoreCollection } from '@/hooks/useFirestore'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useCalculadoraPrecificacao } from '@/features/produtos/useCalculadoraPrecificacao'
import { ShoppingBag, ChevronRight, Package, Calculator, Save, AlertCircle, Plus, X } from 'lucide-react'

const orcamentoSchema = z.object({
  clienteId: z.string().min(1, 'Cliente obrigatório'),
  clienteNome: z.string(),
  dataEntrega: z.string().min(1, 'Data do evento/entrega obrigatória'),
  status: z.enum(['Aberto', 'Aprovado', 'Rejeitado']).optional(),
  itens: z.array(z.object({
    produtoId: z.string().min(1, 'Selecione um produto'),
    produtoNome: z.string(),
    quantidade: z.number().min(1, 'Mínimo 1'),
    precoUnitarioSnapshot: z.number().min(0),
    valorItem: z.number().min(0)
  })).min(1, 'Adicione pelo menos um item'),
  embalagensExtras: z.array(z.object({
    insumoId: z.string(),
    insumoNome: z.string(),
    quantidade: z.number().min(1)
  })).optional(),
  insumosCustomizados: z.any().optional(),
  insumosAgrupadosEditados: z.any().optional(),
  markupPercentual: z.number().min(0),
  comissaoPercentual: z.number().min(0),
  valorHoraTrabalhada: z.number().min(0),
  tempoEstimadoTotal: z.number().min(0),
  custoInsumosTotal: z.number().min(0),
  custoMaoDeObraTotal: z.number().min(0),
  lucroEstimado: z.number(),
  valorTotalSugerido: z.number().min(0),
  valorTotal: z.number().min(0) // Valor final aplicado
})

export type OrcamentoFormData = z.infer<typeof orcamentoSchema>

interface Props {
  initialData?: any
  onSubmit: (data: OrcamentoFormData) => void
  onCancel: () => void
}

export function OrcamentoForm({ initialData, onSubmit, onCancel }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  const { data: clientesDB } = useFirestoreCollection<any>('clientes')
  const { data: produtosDB } = useFirestoreCollection<any>('produtos')
  const { data: insumosDB } = useFirestoreCollection<any>('insumos')
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<OrcamentoFormData>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: initialData || {
      status: 'Aberto',
      itens: [],
      embalagensExtras: [],
      insumosCustomizados: [],
      insumosAgrupadosEditados: [],
      markupPercentual: 0,
      comissaoPercentual: 0,
      valorHoraTrabalhada: 0,
      tempoEstimadoTotal: 0,
      custoInsumosTotal: 0,
      custoMaoDeObraTotal: 0,
      lucroEstimado: 0,
      valorTotalSugerido: 0,
      valorTotal: 0,
      dataEntrega: new Date().toISOString().split('T')[0]
    }
  })

  const { fields: itensFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: 'itens' })
  const { fields: embalagemFields, append: appendEmb, remove: removeEmb } = useFieldArray({ control, name: 'embalagensExtras' })

  const watchedItens = watch('itens') || []
  const watchedEmbalagens = watch('embalagensExtras') || []
  const watchedInsumosCustomizados = watch('insumosCustomizados') || []
  const editados = watch('insumosAgrupadosEditados') || []
  
  const valorTotalAplicado = watch('valorTotal')
  
  const { data: configs } = useFirestoreCollection<any>('configuracoes')
  const configDoc = configs?.find(c => c.id === 'global') || configs?.[0]
  const valorHoraTrabalhada = configDoc?.valorHoraTrabalhada || 0
  
  const { calcularCustoTotalReceita, calcularPrecoVendaSugerido, verificarAlertaMargem } = useCalculadoraPrecificacao()

  // STEP 2: Lógica de Agrupamento Dinâmico de Insumos (igual Produção)
  const gruposInsumos = useMemo(() => {
    // Se já existem editados, usamos eles
    const editados = watch('insumosAgrupadosEditados')
    if (editados && editados.length > 0) return editados

    if (!produtosDB || !insumosDB) return []
    const gruposMap = new Map<string, any[]>()
    const mapGeral = new Map<string, number>()

    watchedItens.forEach(item => {
      const prod = produtosDB.find(p => p.id === item.produtoId)
      if (prod && prod.insumos) {
        let arr = gruposMap.get(item.produtoNome) || []
        
        prod.insumos.forEach((ins: any) => {
          const insumoDoc = insumosDB.find(i => i.id === ins.insumoId)
          const tipoEscala = insumoDoc?.tipoEscala || (insumoDoc?.escalaComQuantidade === false ? 'por_produto' : 'proporcional')
          
          let qty = 0
          if (tipoEscala === 'por_pedido') qty = ins.quantidadeUsadaReceita
          else if (tipoEscala === 'por_produto') qty = ins.quantidadeUsadaReceita
          else qty = ins.quantidadeUsadaReceita * item.quantidade

          if (tipoEscala === 'por_pedido') {
            const atual = mapGeral.get(ins.insumoId) || 0
            mapGeral.set(ins.insumoId, Math.max(atual, qty))
          } else {
             const existingIdx = arr.findIndex(x => x.insumoId === ins.insumoId)
             if (existingIdx >= 0) arr[existingIdx].quantidadeParaBaixar += qty
             else {
               arr.push({
                 insumoId: ins.insumoId,
                 insumoNome: insumoDoc?.nome || '',
                 quantidadeParaBaixar: qty,
                 unidade: insumoDoc?.unidadeMedida || '',
                 custoProporcionalAtual: insumoDoc?.custoPorUnidadeMedida ? (insumoDoc.custoPorUnidadeMedida * qty) : 0
               })
             }
          }
        })
        if (arr.length > 0) gruposMap.set(item.produtoNome, arr)
      }
    })

    if (watchedEmbalagens) {
      watchedEmbalagens.forEach((emb: any) => {
        const atual = mapGeral.get(emb.insumoId) || 0
        mapGeral.set(emb.insumoId, atual + emb.quantidade)
      })
    }

    if (mapGeral.size > 0) {
      const arrGeral: any[] = []
      mapGeral.forEach((qty, id) => {
        const insumoDoc = insumosDB.find(i => i.id === id)
        if (insumoDoc) {
           arrGeral.push({
             insumoId: id,
             insumoNome: insumoDoc.nome,
             quantidadeParaBaixar: qty,
             unidade: insumoDoc.unidadeMedida,
             custoProporcionalAtual: insumoDoc.custoPorUnidadeMedida ? (insumoDoc.custoPorUnidadeMedida * qty) : 0
           })
        }
      })
      gruposMap.set('Geral (Para todo o pedido)', arrGeral)
    }

    const arr = Array.from(gruposMap.entries()).map(([titulo, itens]) => ({ titulo, itens }))
    arr.sort((a, b) => {
      if (a.titulo.includes('Geral')) return -1
      if (b.titulo.includes('Geral')) return 1
      return a.titulo.localeCompare(b.titulo)
    })
    
    return arr
  }, [watchedItens, watchedEmbalagens, produtosDB, insumosDB, watch('insumosAgrupadosEditados')])

  // Reconstrói a lista plana de insumosNecessarios baseada nos grupos editados (Para a Baixa de Estoque e Cálculo de Custo)
  useEffect(() => {
    const planos: any[] = []
    gruposInsumos.forEach((g: any) => {
      g.itens.forEach((i: any) => {
        const index = planos.findIndex(p => p.insumoId === i.insumoId)
        if (index >= 0) planos[index].quantidadeParaBaixar += i.quantidadeParaBaixar
        else planos.push({...i})
      })
    })
    
    // Recalcula custos dos insumos planos
    planos.forEach(p => {
      const dbIns = insumosDB?.find(i => i.id === p.insumoId)
      if (dbIns && dbIns.custoPorUnidadeMedida) {
        p.custoProporcionalAtual = p.quantidadeParaBaixar * dbIns.custoPorUnidadeMedida
      }
    })

    setValue('insumosCustomizados', planos)
  }, [gruposInsumos, insumosDB])

  // STEP 3: Cálculos de Precificação Automáticos
  useEffect(() => {
    console.log('--- INICIO CALCULO PRECIFICAÇÃO ---')
    console.log('produtosDB:', produtosDB)
    console.log('insumosDB:', insumosDB)
    console.log('gruposInsumos:', gruposInsumos)
    console.log('watchedItens:', watchedItens)

    if (!produtosDB) {
      console.log('Abortado: produtosDB não carregado.')
      return
    }
    
    // Calcula tempo total
    let tempoTotal = 0
    let totalSugeridoCalculado = 0
    let somaComissaoSugerida = 0

    try {
      watchedItens.forEach(item => {
        const prod = produtosDB.find(p => p.id === item.produtoId)
        console.log('Processando item:', item.produtoNome, 'Prod encontrado:', !!prod)
        if (prod) {
          // Tempo do item
          const rendimento = prod.rendimento || 1
          const tempoPorUnidade = (prod.tempoPreparoMinutos || 0) / rendimento
          const tempoItem = tempoPorUnidade * item.quantidade
          tempoTotal += tempoItem
          console.log(`Tempo item ${item.produtoNome}: rendimento=${rendimento}, tempoPreparoMinutos=${prod.tempoPreparoMinutos}, tempoItem=${tempoItem}`)

          // Procura se tem grupo editado específico para este produto
          const grupoEditado = gruposInsumos.find((g: any) => g.titulo === item.produtoNome)
          console.log(`Grupo editado para ${item.produtoNome}:`, !!grupoEditado)
          
          let custoInsumosDesteItem = 0
          if (grupoEditado) {
            console.log(`Itens no grupo ${item.produtoNome}:`, grupoEditado.itens)
            custoInsumosDesteItem = grupoEditado.itens.reduce((acc: number, i: any) => {
              const dbIns = insumosDB?.find(x => x.id === i.insumoId)
              const custoIns = i.quantidadeParaBaixar * (dbIns?.custoPorUnidadeMedida || 0)
              console.log(`Insumo: ${i.insumoNome} | QtdBaixar: ${i.quantidadeParaBaixar} | CustoUnit: ${dbIns?.custoPorUnidadeMedida} | CustoIns: ${custoIns}`)
              return acc + custoIns
            }, 0)
          }
          console.log(`Custo Insumos ${item.produtoNome}:`, custoInsumosDesteItem)

          const custoMaoDeObraItem = tempoItem * (valorHoraTrabalhada / 60)
          const custoTotalItem = custoInsumosDesteItem + custoMaoDeObraItem
          
          const sugeridoItem = calcularPrecoVendaSugerido(custoTotalItem, prod.margemLucro || 0, prod.comissaoPerc || 0)
          console.log(`Sugerido item ${item.produtoNome}:`, sugeridoItem)
          totalSugeridoCalculado += sugeridoItem
          somaComissaoSugerida += sugeridoItem * ((prod.comissaoPerc || 0) / 100)
        }
      })
      
      // Soma o custo do grupo "Geral" (Embalagens, etc)
      const grupoGeral = gruposInsumos.find((g: any) => g.titulo?.includes('Geral'))
      console.log('Grupo Geral encontrado:', !!grupoGeral)
      if (grupoGeral) {
        const custoGeral = grupoGeral.itens.reduce((acc: number, i: any) => {
           const dbIns = insumosDB?.find(x => x.id === i.insumoId)
           return acc + (i.quantidadeParaBaixar * (dbIns?.custoPorUnidadeMedida || 0))
        }, 0)
        console.log('Custo Geral (Embalagens):', custoGeral)
        totalSugeridoCalculado += custoGeral
      }

      console.log('Tempo Estimado Total:', tempoTotal)
      setValue('tempoEstimadoTotal', tempoTotal)

      // Custo Total Geral (Insumos + Mão de obra global)
      const custoInsumosGeral = watchedInsumosCustomizados.reduce((acc: number, item: any) => acc + (item.custoProporcionalAtual || 0), 0)
      console.log('Custo Insumos Geral:', custoInsumosGeral)
      setValue('custoInsumosTotal', custoInsumosGeral)

      const custosGlobais = calcularCustoTotalReceita(watchedInsumosCustomizados, tempoTotal, valorHoraTrabalhada)
      console.log('Custo Mão de Obra Total:', custosGlobais.custoMaoDeObra)
      setValue('custoMaoDeObraTotal', custosGlobais.custoMaoDeObra)
      
      console.log('Valor Total Sugerido:', totalSugeridoCalculado)
      setValue('valorTotalSugerido', totalSugeridoCalculado)

      // Lucro e alertas com base no valorTotal Aplicado
      if (valorTotalAplicado > 0) {
        const comissaoMediaPerc = totalSugeridoCalculado > 0 ? (somaComissaoSugerida / totalSugeridoCalculado) * 100 : 0
        const info = verificarAlertaMargem(valorTotalAplicado, custosGlobais.custoTotal, comissaoMediaPerc)
        console.log('Lucro Real Estimado:', info.lucroReal)
        setValue('lucroEstimado', info.lucroReal)
      } else {
        setValue('lucroEstimado', 0)
      }
    } catch (e) {
      console.error('ERRO NO CALCULO DE PRECIFICACAO:', e)
    }
  }, [watchedInsumosCustomizados, watchedItens, gruposInsumos, valorHoraTrabalhada, valorTotalAplicado, produtosDB, insumosDB])

  const handleUpdateQty = (gIndex: number, iIndex: number, newVal: number) => {
    const editados = [...(watch('insumosAgrupadosEditados') || gruposInsumos)]
    editados[gIndex].itens[iIndex].quantidadeParaBaixar = newVal
    setValue('insumosAgrupadosEditados', editados)
  }

  // Clientes Formatados
  const clientesOptions = clientesDB?.map(c => ({ value: c.id, label: c.nome })) || []
  const produtosOptions = produtosDB?.map(p => ({ value: p.id, label: p.nome })) || []
  const insumosOptions = insumosDB?.map(i => ({ value: i.id, label: i.nome })) || []
  const embalagensOptions = insumosDB?.filter(i => i.categoria === 'Embalagem').map(i => ({ value: i.id, label: i.nome })) || []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full bg-white relative">
      
      {/* TABS HEADER */}
      <div className="flex bg-gray-50 p-2 rounded-xl mb-6 shadow-inner border border-gray-100">
        <button type="button" onClick={() => setStep(1)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${step === 1 ? 'bg-white text-dolce-rosa shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
          <ShoppingBag className="w-4 h-4" /> 1. Itens
        </button>
        <button type="button" onClick={() => setStep(2)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${step === 2 ? 'bg-white text-dolce-rosa shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
          <Package className="w-4 h-4" /> 2. Insumos
        </button>
        <button type="button" onClick={() => setStep(3)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${step === 3 ? 'bg-white text-dolce-rosa shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
          <Calculator className="w-4 h-4" /> 3. Precificação
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        
        {/* STEP 1: DADOS BÁSICOS E ITENS */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
              <h3 className="font-bold text-dolce-marrom border-b border-gray-200 pb-2">Dados do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-dolce-marrom mb-1.5">Cliente</label>
                  <Controller
                    control={control}
                    name="clienteId"
                    render={({ field }) => (
                      <SearchableSelect
                        options={clientesOptions}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val)
                          const cli = clientesDB?.find(c => c.id === val)
                          if (cli) setValue('clienteNome', cli.nome)
                        }}
                        placeholder="Selecione o cliente"
                      />
                    )}
                  />
                  {errors.clienteId && <p className="text-red-500 text-xs mt-1 font-medium">{errors.clienteId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-dolce-marrom mb-1.5">Data do Evento</label>
                  <input type="date" {...register('dataEntrega')} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-dolce-marrom focus:ring-2 focus:ring-dolce-rosa focus:border-transparent font-medium" />
                  {errors.dataEntrega && <p className="text-red-500 text-xs mt-1 font-medium">{errors.dataEntrega.message}</p>}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
              <h3 className="font-bold text-dolce-marrom border-b border-gray-200 pb-2">Produtos (Receitas)</h3>
              {itensFields.map((field, index) => (
                <div key={field.id} className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-3 relative group shadow-sm">
                  <div className="flex-1">
                    <Controller
                      control={control}
                      name={`itens.${index}.produtoId`}
                      render={({ field: f }) => (
                        <SearchableSelect
                          options={produtosOptions}
                          value={f.value}
                          onChange={(val) => {
                            f.onChange(val)
                            const p = produtosDB?.find(x => x.id === val)
                            if (p) {
                              setValue(`itens.${index}.produtoNome`, p.nome)
                            }
                          }}
                          placeholder="Selecione um produto..."
                        />
                      )}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="w-24">
                      <input type="number" min="1" {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-dolce-marrom focus:ring-2 focus:ring-dolce-rosa font-bold" />
                    </div>
                    <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => appendItem({ produtoId: '', produtoNome: '', quantidade: 1, precoUnitarioSnapshot: 0, valorItem: 0 })} className="w-full py-3 bg-white border border-dashed border-dolce-rosa-claro text-dolce-rosa font-bold hover:bg-dolce-rosa/5 hover:border-dolce-rosa/50 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Adicionar Produto
              </button>
              {errors.itens && <p className="text-red-500 text-xs mt-1 font-medium text-center">{errors.itens.message}</p>}
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
              <h3 className="font-bold text-dolce-marrom border-b border-gray-200 pb-2">Embalagens</h3>
              {embalagemFields.map((field, index) => (
                <div key={field.id} className="bg-white p-3 rounded-xl border border-gray-200 flex gap-3 relative group shadow-sm">
                  <div className="flex-1">
                    <Controller
                      control={control}
                      name={`embalagensExtras.${index}.insumoId`}
                      render={({ field: f }) => (
                        <SearchableSelect
                          options={embalagensOptions}
                          value={f.value || ''}
                          onChange={(val) => {
                            f.onChange(val)
                            const ins = insumosDB?.find(x => x.id === val)
                            if (ins) setValue(`embalagensExtras.${index}.insumoNome`, ins.nome)
                          }}
                          placeholder="Selecione uma embalagem..."
                        />
                      )}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-20">
                      <input type="number" min="1" {...register(`embalagensExtras.${index}.quantidade`, { valueAsNumber: true })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-dolce-marrom focus:ring-2 focus:ring-dolce-rosa font-bold" />
                    </div>
                    <button type="button" onClick={() => removeEmb(index)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => appendEmb({ insumoId: '', insumoNome: '', quantidade: 1 })} className="w-full py-2 bg-white border border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Adicionar Embalagem Manualmente
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: INSUMOS (EDICAO) */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-dolce-rosa-claro/20 p-4 rounded-xl border border-dolce-rosa-claro/50 flex items-start gap-3 text-dolce-marrom/80 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-dolce-rosa" />
              <p>Aqui você pode alterar a quantidade de insumos que serão efetivamente usados neste pedido. A precificação será recalculada baseada nesses novos pesos.</p>
            </div>
            
            {gruposInsumos.map((grupo: any, gIndex: number) => (
              <div key={gIndex} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="bg-gray-100 px-4 py-2 font-bold text-sm text-dolce-marrom uppercase border-b border-gray-200">
                  {grupo.titulo}
                </div>
                <div className="p-3 space-y-2">
                  {grupo.itens.map((item: any, iIndex: number) => (
                    <div key={iIndex} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-dolce-marrom">{item.insumoNome}</span>
                        <span className="text-xs text-gray-500">Unidade: {item.unidade}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-bold">Qtd:</span>
                        <input 
                          type="number" min="0" step="0.01" 
                          value={item.quantidadeParaBaixar} 
                          onChange={(e) => handleUpdateQty(gIndex, iIndex, parseFloat(e.target.value) || 0)}
                          className="w-24 bg-white border border-gray-300 rounded-lg p-1.5 text-right font-bold text-dolce-marrom focus:ring-2 focus:ring-dolce-rosa" 
                        />
                      </div>
                    </div>
                  ))}
                  {grupo.itens.length === 0 && (
                    <div className="text-xs text-center text-gray-400 p-2">Sem insumos associados</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: PRECIFICACAO MAGICA */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <h3 className="font-bold text-dolce-marrom border-b border-gray-200 pb-2">Custos Base</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
                  <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Total Insumos</span>
                  <span className="block text-lg font-black text-rose-600">R$ {(watch('custoInsumosTotal') || 0).toFixed(2)}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
                  <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Mão de Obra</span>
                  <span className="block text-lg font-black text-rose-600">R$ {(watch('custoMaoDeObraTotal') || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <h3 className="font-bold text-dolce-marrom border-b border-gray-200 pb-2">Informações de Margem</h3>
              <p className="text-sm text-gray-500">
                O cálculo de precificação está utilizando automaticamente o <strong>Valor da Hora Trabalhada (R$ {valorHoraTrabalhada.toFixed(2)})</strong> configurado globalmente, além da <strong>Margem de Lucro</strong> e <strong>Comissão</strong> configuradas individualmente em cada Produto selecionado no Passo 1.
              </p>
            </div>

            <div className="bg-dolce-rosa-claro/20 p-5 rounded-2xl border border-dolce-rosa-claro/50 space-y-4 shadow-sm">
              <h3 className="font-bold text-dolce-marrom border-b border-dolce-rosa-claro/50 pb-2">Valor de Venda</h3>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <span className="block text-xs text-dolce-marrom/70 uppercase font-bold mb-1">Sugerido (Com Margem)</span>
                  <span className="block text-2xl font-black text-dolce-rosa">R$ {(watch('valorTotalSugerido') || 0).toFixed(2)}</span>
                </div>
                
                <div className="w-full md:w-48">
                  <label className="block text-xs font-bold text-dolce-marrom mb-1.5">Valor Final Aplicado</label>
                  <input type="number" step="0.01" {...register('valorTotal', { valueAsNumber: true })} className="w-full border-2 border-dolce-rosa bg-white rounded-xl p-3 font-black text-xl text-dolce-rosa shadow-inner focus:outline-none focus:ring-4 focus:ring-dolce-rosa-claro" />
                  {errors.valorTotal && <p className="text-red-500 text-xs mt-1 font-medium">{errors.valorTotal.message}</p>}
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-dolce-rosa-claro/50 flex justify-between items-center mt-4">
                <span className="text-sm font-bold text-gray-600">Lucro Real Estimado:</span>
                <span className={`font-black ${watch('lucroEstimado') >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  R$ {(watch('lucroEstimado') || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER ACTIONS FIXAS */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {step > 1 && (
          <button type="button" onClick={() => setStep(s => (s - 1) as any)} className="px-5 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">
            Voltar
          </button>
        )}
        
        {step < 3 ? (
          <button type="button" onClick={() => setStep(s => (s + 1) as any)} className="flex-1 flex items-center justify-center gap-2 bg-dolce-rosa text-white font-bold py-3 rounded-xl hover:bg-dolce-rosa/90 transition-colors shadow-sm">
            Próximo Passo <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm">
            <Save className="w-5 h-5" /> Salvar Orçamento
          </button>
        )}
      </div>
    </form>
  )
}
