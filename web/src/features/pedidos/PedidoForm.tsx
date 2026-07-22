import { z } from 'zod'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useFirestoreCollection } from '@/hooks/useFirestore'
import { useProdutosDinamicos } from '@/hooks/useProdutosDinamicos'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Clock } from 'lucide-react'
import { toast } from 'sonner'

const pagamentoSchema = z.object({
  valor: z.number().min(0),
  status: z.enum(['Pendente', 'Recebido']),
  forma: z.string(),
  data: z.string().optional()
})

const pedidoSchema = z.object({
  clienteId: z.string().min(1, 'Cliente obrigatório'),
  clienteNome: z.string(),
  dataPedido: z.string(),
  dataEntrega: z.string().min(1, 'Data de entrega obrigatória'),
  valorTotal: z.number().min(0),
  estoqueBaixado: z.boolean(),
  estimativaTotalMinutos: z.number().optional(),
  status: z.enum(['Aberto', 'Cancelado', 'Entregue']).optional(),
  ativo: z.boolean().optional(),
  pagamentos: z.object({
    sinal: pagamentoSchema,
    restante: pagamentoSchema
  }),
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
  })).optional()
})

export type PedidoFormData = z.infer<typeof pedidoSchema>

interface Props {
  initialData?: PedidoFormData
  onSubmit: (data: PedidoFormData) => void
  onCancel: () => void
}

export function PedidoForm({ initialData, onSubmit, onCancel }: Props) {
  const { data: clientesDB } = useFirestoreCollection<any>('clientes')
  const { data: produtosDB } = useProdutosDinamicos()
  const { data: insumosDB } = useFirestoreCollection<any>('insumos')

  const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm<PedidoFormData>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: initialData || {
      clienteId: '',
      clienteNome: '',
      dataPedido: new Date().toISOString(),
      dataEntrega: '',
      valorTotal: 0,
      estoqueBaixado: false,
      estimativaTotalMinutos: 0,
      status: 'Aberto',
      pagamentos: {
        sinal: { valor: 0, status: 'Pendente', forma: 'Pix' },
        restante: { valor: 0, status: 'Pendente', forma: 'Pix' }
      },
      itens: []
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })
  const { fields: embFields, append: embAppend, remove: embRemove, replace: embReplace } = useFieldArray({ control, name: 'embalagensExtras' })

  const itens = watch('itens') || []
  const embalagens = watch('embalagensExtras') || []
  const sinalDigitado = watch('pagamentos.sinal.valor') || 0
  
  // Calcula o total do pedido observando os itens e as embalagens extras
  useEffect(() => {
    let total = 0
    let totalMinutos = 0

    itens.forEach(item => {
      total += (item.valorItem || 0)
      if (produtosDB) {
        const prod = produtosDB.find(p => p.id === item.produtoId)
        if (prod && prod.tempoEstimadoMinutos) {
          totalMinutos += prod.tempoEstimadoMinutos * (item.quantidade || 1)
        }
      }
    })

    // Adiciona o custo das embalagens extras ao valor total do pedido
    if (insumosDB) {
      embalagens.forEach(emb => {
        if (emb.insumoId && emb.quantidade) {
          const insumoDoc = insumosDB.find((i: any) => i.id === emb.insumoId)
          if (insumoDoc && insumoDoc.precoCompra && insumoDoc.pesoVolumeTotal) {
            const custoPorUnidade = insumoDoc.precoCompra / insumoDoc.pesoVolumeTotal
            total += custoPorUnidade * emb.quantidade
          }
        }
      })
    }

    setValue('valorTotal', total)
    setValue('estimativaTotalMinutos', Math.round(totalMinutos))
    // Se não tiver sinal digitado ainda, sugere o valor total para o restante
    setValue('pagamentos.restante.valor', Math.max(0, total - sinalDigitado))
  }, [JSON.stringify(itens), JSON.stringify(embalagens), sinalDigitado, setValue, produtosDB, insumosDB])

  const handleSugestaoEmbalagens = () => {
    if (!insumosDB) return
    const embalagensDisponiveis = insumosDB.filter((i: any) => i.categoria === 'Embalagem' && i.capacidadeEmbalagem > 0)
    if (embalagensDisponiveis.length === 0) {
      toast.warning('Nenhuma embalagem com "Capacidade" definida foi encontrada no cadastro de Insumos.')
      return
    }

    const totalDoces = itens.reduce((sum, item) => sum + (item.quantidade || 0), 0)
    if (totalDoces <= 0) {
      toast.warning('Adicione itens ao pedido primeiro.')
      return
    }

    // Ordenar da maior capacidade para a menor
    embalagensDisponiveis.sort((a: any, b: any) => b.capacidadeEmbalagem - a.capacidadeEmbalagem)

    let remaining = totalDoces
    const sugestao: any[] = []

    for (const emb of embalagensDisponiveis) {
      if (remaining <= 0) break
      const qtd = Math.floor(remaining / emb.capacidadeEmbalagem)
      if (qtd > 0) {
        sugestao.push({ insumoId: emb.id, insumoNome: emb.nome, quantidade: qtd })
        remaining -= qtd * emb.capacidadeEmbalagem
      }
    }

    // Se sobrou algum doce (ex: faltou 10 e a menor caixa é de 25), pega uma caixa da menor disponível
    if (remaining > 0) {
      let bestFit = embalagensDisponiveis[embalagensDisponiveis.length - 1]
      for (let i = embalagensDisponiveis.length - 1; i >= 0; i--) {
        if (embalagensDisponiveis[i].capacidadeEmbalagem >= remaining) {
          bestFit = embalagensDisponiveis[i]
        } else {
          break
        }
      }
      
      const existing = sugestao.find(s => s.insumoId === bestFit.id)
      if (existing) {
        existing.quantidade += 1
      } else {
        sugestao.push({ insumoId: bestFit.id, insumoNome: bestFit.nome, quantidade: 1 })
      }
    }

    embReplace(sugestao)
  }

  const faltantes = useMemo(() => {
    if (!produtosDB || !insumosDB || (!itens?.length && !embalagens?.length)) return []
    const mapa = new Map<string, number>()
    
    itens.forEach(item => {
      const prod = produtosDB.find(p => p.id === item.produtoId)
      if (prod && prod.insumos) {
        prod.insumos.forEach(insReceita => {
          const insumoDoc = insumosDB.find((i: any) => i.id === insReceita.insumoId)
          
          // Lógica de fallback para legados que só tem escalaComQuantidade
          const tipoEscala = insumoDoc?.tipoEscala || (insumoDoc?.escalaComQuantidade === false ? 'por_produto' : 'proporcional')
          const atual = mapa.get(insReceita.insumoId) || 0

          if (tipoEscala === 'por_pedido') {
            mapa.set(insReceita.insumoId, Math.max(atual, insReceita.quantidadeUsadaReceita))
          } else if (tipoEscala === 'por_produto') {
            mapa.set(insReceita.insumoId, atual + insReceita.quantidadeUsadaReceita)
          } else {
            // proporcional
            mapa.set(insReceita.insumoId, atual + (insReceita.quantidadeUsadaReceita * (item.quantidade || 1)))
          }
        })
      }
    })
    
    embalagens.forEach(emb => {
      if (emb.insumoId) {
        const atual = mapa.get(emb.insumoId) || 0
        mapa.set(emb.insumoId, atual + (emb.quantidade || 1))
      }
    })

    const falta: { nome: string, qtdFalta: number, unidade: string }[] = []
    mapa.forEach((qtdNecessaria, insId) => {
      const insDoc = insumosDB.find((i: any) => i.id === insId)
      if (insDoc) {
        if (qtdNecessaria > insDoc.quantidadeDisponivel) {
          falta.push({
            nome: insDoc.nome,
            qtdFalta: qtdNecessaria - insDoc.quantidadeDisponivel,
            unidade: insDoc.unidadeMedida
          })
        }
      }
    })
    return falta
  }, [itens, embalagens, produtosDB, insumosDB])

  const handleClienteSelect = (id: string) => {
    const cli = clientesDB?.find(c => c.id === id)
    if (cli) setValue('clienteNome', cli.nome)
  }

  const handleProdutoSelect = (index: number, id: string) => {
    const prod = produtosDB?.find(p => p.id === id)
    if (prod) {
      setValue(`itens.${index}.produtoNome`, prod.nome)
      // O preço a ser cobrado agora é o da Receita Completa (Lote)
      const precoReceitaInteira = prod.precoVendaCalculado * (prod.rendimentoReceita || 1)
      setValue(`itens.${index}.precoUnitarioSnapshot`, precoReceitaInteira)
      const qtd = watch(`itens.${index}.quantidade`) || 1
      setValue(`itens.${index}.valorItem`, precoReceitaInteira * qtd)
    }
  }

  const handleQtdChange = (index: number, qtd: number) => {
    const precoSnap = watch(`itens.${index}.precoUnitarioSnapshot`) || 0
    setValue(`itens.${index}.valorItem`, precoSnap * qtd)
  }

  const valorTotal = watch('valorTotal')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-4">
      
      {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Cliente</label>
          <Controller
            name="clienteId"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={(clientesDB || []).filter(c => c.ativo !== false).map(c => ({ value: c.id, label: c.nome }))}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val)
                  handleClienteSelect(val)
                }}
                placeholder="Selecione..."
                error={!!errors.clienteId}
              />
            )}
          />
          {errors.clienteId && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.clienteId.message}</span>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-dolce-marrom mb-1.5">Data de Entrega</label>
          <input 
            type="datetime-local" 
            {...register('dataEntrega')} 
            className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
          />
          {errors.dataEntrega && <span className="text-rose-500 text-xs font-medium mt-1 inline-block">{errors.dataEntrega.message}</span>}
        </div>
      </div>

      {/* SEÇÃO 2: ITENS DO PEDIDO */}
      <div>
        <h4 className="font-bold text-lg text-dolce-marrom mb-3 flex items-center gap-2">
          Itens do Pedido
        </h4>
        
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="relative bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3">
              <button 
                type="button" 
                onClick={() => remove(index)} 
                className="absolute top-2 right-2 p-2 text-rose-500 bg-white hover:bg-rose-50 rounded-lg shadow-sm border border-rose-100 transition-colors"
                aria-label="Remover item"
              >
                X
              </button>
              
              <div className="pr-10">
                <label className="block text-xs font-semibold text-dolce-marrom mb-1">Produto</label>
                <Controller
                  name={`itens.${index}.produtoId`}
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={(produtosDB || []).filter(p => p.ativo !== false).map(p => ({ value: p.id, label: p.nome }))}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val)
                        handleProdutoSelect(index, val)
                      }}
                      placeholder="Selecione um produto..."
                      error={!!errors.itens?.[index]?.produtoId}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dolce-marrom mb-1">Qtd</label>
                  <input 
                    type="number" 
                    min="1" 
                    {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} 
                    onChange={(e) => {
                      register(`itens.${index}.quantidade`).onChange(e)
                      handleQtdChange(index, parseInt(e.target.value) || 1)
                    }}
                    className="w-full bg-white border border-gray-200 text-dolce-marrom rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 focus:border-dolce-rosa transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dolce-marrom mb-1">Preço (R$)</label>
                  <input 
                    readOnly 
                    {...register(`itens.${index}.precoUnitarioSnapshot`)} 
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-700 mb-1">Subtotal</label>
                  <input 
                    readOnly 
                    {...register(`itens.${index}.valorItem`)} 
                    className="w-full bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-sm text-emerald-800 font-bold outline-none" 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          type="button" 
          onClick={() => append({ produtoId: '', produtoNome: '', quantidade: 1, precoUnitarioSnapshot: 0, valorItem: 0 })} 
          className="mt-4 w-full md:w-auto py-3 px-4 border-2 border-dashed border-dolce-rosa-claro text-dolce-rosa font-semibold rounded-xl hover:bg-dolce-rosa/5 transition-colors flex justify-center items-center gap-2"
        >
          + Adicionar Produto
        </button>
        {errors.itens && <div className="text-rose-500 text-sm mt-2 font-medium">{errors.itens.message}</div>}
      </div>

      {/* SEÇÃO EXTRA: EMBALAGENS */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-lg text-dolce-marrom flex items-center gap-2">
            📦 Embalagens
          </h4>
          <button 
            type="button" 
            onClick={handleSugestaoEmbalagens}
            className="text-xs bg-dolce-rosa/10 text-dolce-rosa hover:bg-dolce-rosa/20 px-3 py-1.5 rounded-lg font-bold transition-colors"
          >
            Sugerir Caixas Automático
          </button>
        </div>
        
        <div className="space-y-3">
          {embFields.map((field, index) => (
            <div key={field.id} className="relative bg-orange-50/50 p-3 rounded-xl border border-orange-100 flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-dolce-marrom mb-1">Embalagem</label>
                <Controller
                  name={`embalagensExtras.${index}.insumoId`}
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={(insumosDB || [])
                        .filter(i => i.categoria === 'Embalagem' && i.ativo !== false)
                        .map(i => ({ value: i.id, label: i.nome }))}
                      value={field.value || ''}
                      onChange={(val) => {
                        field.onChange(val)
                        const ins = insumosDB?.find((i: any) => i.id === val)
                        if (ins) setValue(`embalagensExtras.${index}.insumoNome`, ins.nome)
                      }}
                      placeholder="Selecione..."
                    />
                  )}
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-semibold text-dolce-marrom mb-1">Qtd</label>
                <input 
                  type="number" 
                  min="1" 
                  {...register(`embalagensExtras.${index}.quantidade`, { valueAsNumber: true })} 
                  className="w-full bg-white border border-orange-200 text-dolce-marrom rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all" 
                />
              </div>
              <button 
                type="button" 
                onClick={() => embRemove(index)} 
                className="p-2.5 text-rose-500 bg-white hover:bg-rose-50 rounded-lg shadow-sm border border-rose-100 transition-colors h-[42px]"
              >
                X
              </button>
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={() => embAppend({ insumoId: '', insumoNome: '', quantidade: 1 })} 
            className="w-full py-2 px-4 border border-dashed border-gray-300 text-gray-500 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            + Adicionar Embalagem Manualmente
          </button>
        </div>
      </div>

      {/* SEÇÃO 3: ALERTA DE ESTOQUE */}
      {faltantes.length > 0 && (
        <div className="p-5 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <strong className="text-base text-rose-900">Atenção: Estoque insuficiente na Cozinha</strong>
          </div>
          <p className="mb-2 text-rose-700 font-medium">Faltam os seguintes insumos para produzir este pedido:</p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            {faltantes.map((f, i) => (
              <li key={i}><span className="font-bold">{f.qtdFalta.toFixed(2)} {f.unidade}</span> de {f.nome}</li>
            ))}
          </ul>
          <p className="text-xs bg-rose-100/50 p-2 rounded-lg text-rose-800 font-medium">
            Você pode salvar o pedido normalmente, mas precisará registrar a compra destes insumos antes de iniciar a produção (Baixa de Lote).
          </p>
        </div>
      )}

      {/* SEÇÃO 4: FINANCEIRO */}
      <div className="bg-dolce-rosa-claro/20 p-5 rounded-2xl border border-dolce-rosa-claro/50">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-bold text-lg text-dolce-marrom">Financeiro e Produção</h4>
          <div className="flex gap-3">
            <div className="bg-orange-50 px-4 py-2 rounded-xl shadow-sm border border-orange-100 text-right">
              <div className="text-xs font-semibold text-orange-600/70 uppercase tracking-wider flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                Tempo de Produção
              </div>
              <div className="text-xl font-black text-orange-600">
                {watch('estimativaTotalMinutos') ? `${Math.floor((watch('estimativaTotalMinutos') || 0) / 60)}h ${(watch('estimativaTotalMinutos') || 0) % 60}m` : '--'}
              </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-emerald-100 text-right">
              <div className="text-xs font-semibold text-dolce-marrom/60 uppercase tracking-wider">Valor Total</div>
              <div className="text-2xl font-black text-emerald-600">R$ {valorTotal?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SINAL */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h5 className="font-bold text-sm text-dolce-marrom flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Pagamento Inicial (Sinal)
            </h5>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-dolce-marrom/70 mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  {...register('pagamentos.sinal.valor', { valueAsNumber: true })} 
                  className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-dolce-marrom/70 mb-1">Status</label>
                <select 
                  {...register('pagamentos.sinal.status')} 
                  className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Recebido">Recebido</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dolce-marrom/70 mb-1">Forma de Pagamento</label>
              <select 
                {...register('pagamentos.sinal.forma')} 
                className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
              >
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
              </select>
            </div>
          </div>

          {/* RESTANTE */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h5 className="font-bold text-sm text-dolce-marrom flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> Restante (Na Entrega)
            </h5>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-dolce-marrom/70 mb-1">Valor (R$)</label>
                <input 
                  readOnly 
                  type="number" 
                  step="0.01" 
                  {...register('pagamentos.restante.valor', { valueAsNumber: true })} 
                  className="w-full bg-gray-100 border border-gray-200 text-gray-500 font-bold rounded-lg p-2.5 text-sm outline-none" 
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-dolce-marrom/70 mb-1">Status</label>
                <select 
                  {...register('pagamentos.restante.status')} 
                  className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none appearance-none"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Recebido">Recebido</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dolce-marrom/70 mb-1">Forma Prevista</label>
              <select 
                {...register('pagamentos.restante.forma')} 
                className="w-full bg-gray-50 border border-gray-200 text-dolce-marrom rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none appearance-none"
              >
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* AÇÕES FINAIS */}
      <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-6 mt-6">
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
          Salvar Pedido
        </button>
      </div>
    </form>
  )
}
