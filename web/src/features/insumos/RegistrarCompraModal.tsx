import { useState } from 'react'
import { useRegistrarCompraInsumo } from './useRegistrarCompraInsumo'

interface Props {
  insumo: { id: string; nome: string; quantidadeDisponivel: number; unidadeMedida: string }
  onClose: () => void
}

export function RegistrarCompraModal({ insumo, onClose }: Props) {
  const { mutateAsync, isPending } = useRegistrarCompraInsumo()
  const [qtd, setQtd] = useState<number | ''>('')
  const [valor, setValor] = useState<number | ''>('')
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qtd || !valor || qtd <= 0 || valor <= 0) {
      setErro('Valores devem ser maiores que zero.')
      return
    }

    try {
      await mutateAsync({
        insumoId: insumo.id,
        insumoNome: insumo.nome,
        quantidadeComprada: Number(qtd),
        valorPago: Number(valor),
        quantidadeEstoqueAtual: insumo.quantidadeDisponivel
      })
      onClose()
    } catch (err: any) {
      setErro('Erro ao salvar: ' + err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-4">Registrar Compra</h3>
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded text-sm">
          <strong>Insumo:</strong> {insumo.nome} <br />
          <strong>Estoque Atual:</strong> {insumo.quantidadeDisponivel} {insumo.unidadeMedida}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Qtd. Comprada ({insumo.unidadeMedida})</label>
            <input 
              type="number" step="0.01" 
              value={qtd} onChange={e => setQtd(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full border rounded p-2" 
              placeholder="Ex: 1000" 
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">Este valor será somado ao estoque atual.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor Total Pago (R$)</label>
            <input 
              type="number" step="0.01" 
              value={valor} onChange={e => setValor(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full border rounded p-2" 
              placeholder="Ex: 25.50" 
            />
            <p className="text-xs text-gray-500 mt-1">Este valor definirá o novo custo da sua receita.</p>
          </div>

          {erro && <div className="text-red-500 text-sm">{erro}</div>}

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} disabled={isPending} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              {isPending ? 'Registrando...' : 'Confirmar Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
