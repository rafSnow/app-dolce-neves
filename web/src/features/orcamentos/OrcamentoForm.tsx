import { z } from 'zod'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useMemo } from 'react'
import { useFirestoreCollection } from '@/hooks/useFirestore'
import { useProdutosDinamicos } from '@/hooks/useProdutosDinamicos'
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
  lucroInsumosExtrasPercentual: z.number().min(0).optional(),
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
  const [step, setStep] = useState<1 | 2>(1)
  const [isChangingStep, setIsChangingStep] = useState(false)
  
  const handleNextStep = () => {
    setIsChangingStep(true)
    setStep(2)
    setTimeout(() => setIsChangingStep(false), 500)
  }
  
  const { data: clientesDB } = useFirestoreCollection<any>('clientes')
  const { data: produtosDB } = useProdutosDinamicos()
  const { data: insumosDB } = useFirestoreCollection<any>('insumos')

  const { register, handleSubmit, control, watch, setValue, getValues, formState: { errors } } = useForm<OrcamentoFormData>({
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
      lucroInsumosExtrasPercentual: 0,
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
    if (!produtosDB || !insumosDB) return []
    const editados = watch('insumosAgrupadosEditados') || []
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
             if (existingIdx >= 0) {
               arr[existingIdx].quantidadeParaBaixar += qty
               arr[existingIdx].quantidadeOriginal += qty
             } else {
               let custoUnidade = insumoDoc?.custoPorUnidadeMedida
               if (custoUnidade === undefined && insumoDoc) {
                 custoUnidade = insumoDoc.pesoVolumeTotal > 0 ? (insumoDoc.precoCompra / insumoDoc.pesoVolumeTotal) : 0
               }
               
               arr.push({
                 insumoId: ins.insumoId,
                 insumoNome: insumoDoc?.nome || '',
                 quantidadeParaBaixar: qty,
                 quantidadeOriginal: qty,
                 custoUnidade: custoUnidade || 0,
                 unidade: insumoDoc?.unidadeMedida || '',
                 custoProporcionalAtual: custoUnidade ? (custoUnidade * qty) : 0
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
            let custoUnidade = insumoDoc.custoPorUnidadeMedida
            if (custoUnidade === undefined && insumoDoc) {
              custoUnidade = insumoDoc.pesoVolumeTotal > 0 ? (insumoDoc.precoCompra / insumoDoc.pesoVolumeTotal) : 0
            }
            
            arrGeral.push({
             insumoId: id,
             insumoNome: insumoDoc.nome,
             quantidadeParaBaixar: qty,
             quantidadeOriginal: qty,
             custoUnidade: custoUnidade || 0,
             unidade: insumoDoc.unidadeMedida,
             custoProporcionalAtual: custoUnidade ? (custoUnidade * qty) : 0
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
    
    // Mescla com as edições do usuário (se houver)
    if (editados.length > 0) {
      arr.forEach(grupo => {
        const editadoGrupo = editados.find((g: any) => g.titulo === grupo.titulo)
        if (editadoGrupo) {
          grupo.itens.forEach((item: any) => {
            const editadoItem = editadoGrupo.itens.find((i: any) => i.insumoId === item.insumoId)
            if (editadoItem && editadoItem.quantidadeParaBaixar !== undefined) {
              item.quantidadeParaBaixar = editadoItem.quantidadeParaBaixar
            }
          })
        }
      })
    }
    
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
      if (dbIns) {
        let custoUnidade = dbIns.custoPorUnidadeMedida
        if (custoUnidade === undefined) {
          custoUnidade = dbIns.pesoVolumeTotal > 0 ? (dbIns.precoCompra / dbIns.pesoVolumeTotal) : 0
        }
        if (custoUnidade) {
          p.custoProporcionalAtual = p.quantidadeParaBaixar * custoUnidade
        }
      }
    })

    setValue('insumosCustomizados', planos)
  }, [gruposInsumos, insumosDB])

  // LÓGICA DE PRECIFICAÇÃO (Igual a PedidoForm)
  useEffect(() => {
    let total = 0
    let tempoTotal = 0

    // 1. Soma dos produtos originais
    watchedItens.forEach(item => {
      total += (item.valorItem || 0)
      if (produtosDB) {
        const prod = produtosDB.find(p => p.id === item.produtoId)
        if (prod && prod.tempoEstimadoMinutos) {
          tempoTotal += prod.tempoEstimadoMinutos * (item.quantidade || 1)
        }
      }
    })

    // 2. Soma das Embalagens Extras
    if (insumosDB) {
      watchedEmbalagens.forEach(emb => {
        if (emb.insumoId && emb.quantidade) {
          const insumoDoc = insumosDB.find((i: any) => i.id === emb.insumoId)
          if (insumoDoc) {
            const custoUnidade = insumoDoc.custoPorUnidadeMedida ?? (insumoDoc.pesoVolumeTotal > 0 ? (insumoDoc.precoCompra / insumoDoc.pesoVolumeTotal) : 0)
            total += custoUnidade * emb.quantidade
          }
        }
      })
    }
    
    // 3. Acrescenta custo e lucro de Insumos Extras
    let custoInsumosExtras = 0
    const lucroPercentualExtras = watch('lucroInsumosExtrasPercentual') || 0
    
    gruposInsumos.forEach(grupo => {
      grupo.itens.forEach(item => {
        const diff = (item.quantidadeParaBaixar || 0) - (item.quantidadeOriginal || 0)
        // Somente extra, nunca a menos (se pediu pra tirar, nao desconta)
        if (diff > 0) {
          custoInsumosExtras += diff * (item.custoUnidade || 0)
        }
      })
    })

    if (custoInsumosExtras > 0) {
      total += custoInsumosExtras * (1 + lucroPercentualExtras / 100)
    }

    // 4. Calcula o Custo Total da Produção do Orçamento
    let sumInsumos = custoInsumosExtras
    // Soma o custo dos insumos já em gruposInsumos
    gruposInsumos.forEach(grupo => {
      grupo.itens.forEach(item => {
        // quantidadeOriginal já representa a receita base
        sumInsumos += (item.quantidadeOriginal || 0) * (item.custoUnidade || 0)
      })
    })
    
    // Soma o custo das embalagens extras
    if (insumosDB) {
      watchedEmbalagens.forEach(emb => {
        if (emb.insumoId && emb.quantidade) {
          const insumoDoc = insumosDB.find((i: any) => i.id === emb.insumoId)
          if (insumoDoc) {
            const custoUnidade = insumoDoc.custoPorUnidadeMedida ?? (insumoDoc.pesoVolumeTotal > 0 ? (insumoDoc.precoCompra / insumoDoc.pesoVolumeTotal) : 0)
            sumInsumos += custoUnidade * emb.quantidade
          }
        }
      })
    }

    const valorTrabalhoCalculado = (tempoTotal / 60) * valorHoraTrabalhada
    const lucroFinal = total - (sumInsumos + valorTrabalhoCalculado)

    setValue('valorTotal', total)
    setValue('tempoEstimadoTotal', Math.round(tempoTotal))
    
    // Agora preenchemos corretamente os custos para que a Precificação Mágica do Orçamento funcione
    setValue('valorTotalSugerido', total)
    setValue('custoInsumosTotal', sumInsumos)
    setValue('custoMaoDeObraTotal', valorTrabalhoCalculado)
    setValue('lucroEstimado', lucroFinal)
  }, [JSON.stringify(watchedItens), JSON.stringify(watchedEmbalagens), produtosDB, insumosDB, configs, setValue, watch('lucroInsumosExtrasPercentual')])

  const handleUpdateQty = (gIndex: number, iIndex: number, newVal: number) => {
    // Usa getValues para ter o estado mais atual sem depender de closure stale
    const currentEditados = getValues('insumosAgrupadosEditados')
    const editados = currentEditados && currentEditados.length > 0 ? [...currentEditados] : [...gruposInsumos]
    if (!editados[gIndex]) return

    // Deep clone para evitar mutação direta
    editados[gIndex] = {
      ...editados[gIndex],
      itens: [...editados[gIndex].itens]
    }
    editados[gIndex].itens[iIndex] = {
      ...editados[gIndex].itens[iIndex],
      quantidadeParaBaixar: newVal
    }

    setValue('insumosAgrupadosEditados', editados)
  }

  // Clientes Formatados
  const clientesOptions = clientesDB?.map(c => ({ value: c.id, label: c.nome })) || []
  const produtosOptions = produtosDB?.map(p => ({ value: p.id, label: p.nome })) || []
  const insumosOptions = insumosDB?.map(i => ({ value: i.id, label: i.nome })) || []
  const embalagensOptions = insumosDB?.filter(i => i.categoria === 'Embalagem').map(i => ({ value: i.id, label: i.nome })) || []

  const onFormSubmit = (data: OrcamentoFormData) => {
    // Garante que a versão final do cálculo de insumos (incluindo edições) seja salva
    const currentEditados = getValues('insumosAgrupadosEditados')
    const finalInsumos = currentEditados && currentEditados.length > 0 ? currentEditados : gruposInsumos
    data.insumosAgrupadosEditados = finalInsumos
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col h-full bg-white relative">
      
      {/* TABS HEADER */}
      <div className="flex bg-gray-50 p-2 rounded-xl mb-6 shadow-inner border border-gray-100">
        <button type="button" onClick={() => setStep(1)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${step === 1 ? 'bg-white text-dolce-rosa shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
          <ShoppingBag className="w-4 h-4" /> 1. Itens
        </button>
        <button type="button" onClick={() => setStep(2)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${step === 2 ? 'bg-white text-dolce-rosa shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
          <Package className="w-4 h-4" /> 2. Insumos
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
                              // Lógica do Pedido: pega o preço de venda da receita inteira
                              const precoReceitaInteira = p.precoVendaCalculado * (p.rendimentoReceita || 1)
                              setValue(`itens.${index}.precoUnitarioSnapshot`, precoReceitaInteira)
                              const qtd = watch(`itens.${index}.quantidade`) || 1
                              setValue(`itens.${index}.valorItem`, precoReceitaInteira * qtd)
                            }
                          }}
                          placeholder="Selecione um produto..."
                        />
                      )}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="w-24">
                      <input 
                        type="number" min="1" 
                        {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} 
                        onChange={(e) => {
                          const qty = parseFloat(e.target.value) || 0
                          setValue(`itens.${index}.quantidade`, qty)
                          const precoSnap = watch(`itens.${index}.precoUnitarioSnapshot`) || 0
                          setValue(`itens.${index}.valorItem`, precoSnap * qty)
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-dolce-marrom focus:ring-2 focus:ring-dolce-rosa font-bold" 
                      />
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
              <p>Aqui você pode alterar a quantidade de insumos que serão efetivamente usados neste pedido. Adições de insumos aumentarão o valor final baseadas na margem definida abaixo. Reduções não alteram o valor.</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-dolce-marrom">Lucro sobre Insumos Extras (%)</h4>
                <p className="text-xs text-gray-500">Quanto aplicar de margem em cima dos ingredientes adicionais.</p>
              </div>
              <input 
                type="number" 
                min="0"
                {...register('lucroInsumosExtrasPercentual', { valueAsNumber: true })} 
                className="w-24 bg-gray-50 border border-gray-300 rounded-lg p-2 text-right font-bold text-dolce-marrom focus:ring-2 focus:ring-dolce-rosa"
              />
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

      </div>

      {/* RENDERIZA O TOTAL DO ORÇAMENTO IGUAL AO PEDIDO */}
      <div className="mb-4 bg-dolce-rosa-claro/20 p-5 rounded-2xl border border-dolce-rosa-claro/50 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-dolce-marrom/70 uppercase">Total do Orçamento</span>
          <span className="text-xs text-dolce-marrom/50 mt-1">Este valor será utilizado se o pedido for aprovado.</span>
        </div>
        <h3 className="text-3xl font-black text-dolce-rosa">R$ {(watch('valorTotal') || 0).toFixed(2)}</h3>
      </div>

      {/* FOOTER ACTIONS FIXAS */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {step > 1 && (
          <button type="button" onClick={() => setStep(s => (s - 1) as any)} className="px-5 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">
            Voltar
          </button>
        )}
        
        {step < 2 ? (
          <button type="button" onClick={handleNextStep} className="flex-1 flex items-center justify-center gap-2 bg-dolce-rosa text-white font-bold py-3 rounded-xl hover:bg-dolce-rosa/90 transition-colors shadow-sm">
            Próximo Passo <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button type="submit" disabled={isChangingStep} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Save className="w-5 h-5" /> Salvar Orçamento
          </button>
        )}
      </div>
    </form>
  )
}
