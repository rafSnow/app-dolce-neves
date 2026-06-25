import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useFirestoreCollection } from '@/hooks/useFirestore'
import { useProdutosDinamicos } from '@/hooks/useProdutosDinamicos'

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
  })).min(1, 'Adicione pelo menos um item')
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
      pagamentos: {
        sinal: { valor: 0, status: 'Pendente', forma: 'Pix' },
        restante: { valor: 0, status: 'Pendente', forma: 'Pix' }
      },
      itens: []
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  const itens = watch('itens') || []
  const sinalDigitado = watch('pagamentos.sinal.valor') || 0
  
  // Calcula o total do pedido observando os itens profundamente
  useEffect(() => {
    const total = itens.reduce((acc, item) => acc + ((item.valorItem) || 0), 0)
    setValue('valorTotal', total)
    // Se não tiver sinal digitado ainda, sugere o valor total para o restante
    setValue('pagamentos.restante.valor', Math.max(0, total - sinalDigitado))
  }, [JSON.stringify(itens), sinalDigitado, setValue])

  const faltantes = useMemo(() => {
    if (!produtosDB || !insumosDB || !itens || itens.length === 0) return []
    const mapa = new Map<string, number>()
    
    itens.forEach(item => {
      const prod = produtosDB.find(p => p.id === item.produtoId)
      if (prod && prod.insumos) {
        prod.insumos.forEach(insReceita => {
          const rend = prod.rendimentoReceita || 1
          const qtdTotal = (insReceita.quantidadeUsadaReceita / rend) * (item.quantidade || 1)
          const atual = mapa.get(insReceita.insumoId) || 0
          mapa.set(insReceita.insumoId, atual + qtdTotal)
        })
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
  }, [itens, produtosDB, insumosDB])

  const handleClienteSelect = (id: string) => {
    const cli = clientesDB?.find(c => c.id === id)
    if (cli) setValue('clienteNome', cli.nome)
  }

  const handleProdutoSelect = (index: number, id: string) => {
    const prod = produtosDB?.find(p => p.id === id)
    if (prod) {
      setValue(`itens.${index}.produtoNome`, prod.nome)
      // Tira o snapshot do preço de venda MÁGICO (calculado em tempo real com base no custo de hoje)
      setValue(`itens.${index}.precoUnitarioSnapshot`, prod.precoVendaCalculado)
      const qtd = watch(`itens.${index}.quantidade`) || 1
      setValue(`itens.${index}.valorItem`, prod.precoVendaCalculado * qtd)
    }
  }

  const handleQtdChange = (index: number, qtd: number) => {
    const precoSnap = watch(`itens.${index}.precoUnitarioSnapshot`) || 0
    setValue(`itens.${index}.valorItem`, precoSnap * qtd)
  }

  const valorTotal = watch('valorTotal')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 border rounded-lg shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cliente</label>
          <select {...register('clienteId')} onChange={(e) => {
            register('clienteId').onChange(e)
            handleClienteSelect(e.target.value)
          }} className="w-full border rounded p-2">
            <option value="">Selecione...</option>
            {clientesDB?.filter(c => c.ativo !== false).map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {errors.clienteId && <span className="text-red-500 text-sm">{errors.clienteId.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data de Entrega</label>
          <input type="datetime-local" {...register('dataEntrega')} className="w-full border rounded p-2" />
          {errors.dataEntrega && <span className="text-red-500 text-sm">{errors.dataEntrega.message}</span>}
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-4">Itens do Pedido</h4>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-4 items-end mb-2">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Produto</label>
              <select {...register(`itens.${index}.produtoId`)} onChange={(e) => {
                register(`itens.${index}.produtoId`).onChange(e)
                handleProdutoSelect(index, e.target.value)
              }} className="w-full border rounded p-2 text-sm">
                <option value="">Selecione...</option>
                {produtosDB?.filter(p => p.ativo !== false).map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium mb-1">Qtd</label>
              <input type="number" min="1" {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} 
                onChange={(e) => {
                  register(`itens.${index}.quantidade`).onChange(e)
                  handleQtdChange(index, parseInt(e.target.value) || 1)
                }}
                className="w-full border rounded p-2 text-sm" />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium mb-1">Preço Unid. (R$)</label>
              <input readOnly {...register(`itens.${index}.precoUnitarioSnapshot`)} className="w-full bg-gray-50 border rounded p-2 text-sm text-gray-500" />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium mb-1">Subtotal (R$)</label>
              <input readOnly {...register(`itens.${index}.valorItem`)} className="w-full bg-gray-50 border rounded p-2 text-sm text-gray-800 font-bold" />
            </div>
            <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">X</button>
          </div>
        ))}
        <button type="button" onClick={() => append({ produtoId: '', produtoNome: '', quantidade: 1, precoUnitarioSnapshot: 0, valorItem: 0 })} className="mt-2 text-sm text-blue-600 hover:underline">
          + Adicionar Produto
        </button>
        {errors.itens && <div className="text-red-500 text-sm mt-1">{errors.itens.message}</div>}
      </div>

      <div className="border-t pt-4 bg-gray-50 -mx-6 px-6 pb-6">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-semibold text-lg">Financeiro</h4>
          <div className="text-right">
            <div className="text-sm text-gray-500">Valor Total</div>
            <div className="text-2xl font-bold text-green-700">R$ {valorTotal?.toFixed(2) || '0.00'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* SINAL */}
          <div className="space-y-3">
            <h5 className="font-medium text-sm text-blue-800 bg-blue-100 p-2 rounded">Pagamento Inicial (Sinal)</h5>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1">Valor (R$)</label>
                <input type="number" step="0.01" {...register('pagamentos.sinal.valor', { valueAsNumber: true })} className="w-full border rounded p-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1">Status</label>
                <select {...register('pagamentos.sinal.status')} className="w-full border rounded p-2 text-sm">
                  <option value="Pendente">Pendente</option>
                  <option value="Recebido">Recebido</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1">Forma de Pagamento</label>
              <select {...register('pagamentos.sinal.forma')} className="w-full border rounded p-2 text-sm">
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
              </select>
            </div>
          </div>

          {/* RESTANTE */}
          <div className="space-y-3">
            <h5 className="font-medium text-sm text-orange-800 bg-orange-100 p-2 rounded">Restante (No ato da Entrega)</h5>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1">Valor Restante (R$)</label>
                <input readOnly type="number" step="0.01" {...register('pagamentos.restante.valor', { valueAsNumber: true })} className="w-full bg-gray-100 border rounded p-2 text-sm text-gray-600 font-bold" />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1">Status</label>
                <select {...register('pagamentos.restante.status')} className="w-full border rounded p-2 text-sm">
                  <option value="Pendente">Pendente</option>
                  <option value="Recebido">Recebido</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1">Forma Prevista</label>
              <select {...register('pagamentos.restante.forma')} className="w-full border rounded p-2 text-sm">
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {faltantes.length > 0 && (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-300 text-sm">
          <strong className="text-base">⚠ Estoque insuficiente para produzir este pedido.</strong>
          <p className="mt-1 mb-2">Faltam:</p>
          <ul className="list-disc pl-5">
            {faltantes.map((f, i) => (
              <li key={i}>{f.qtdFalta.toFixed(2)} {f.unidade} de {f.nome}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs opacity-80">Você pode salvar o pedido, mas precisará comprar estes itens antes de iniciar a produção.</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 shadow">Salvar Pedido</button>
      </div>
    </form>
  )
}
