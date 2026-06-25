import { useState } from 'react'
import type { InsumoFormData } from '../../insumos/InsumoForm'

interface Props {
  insumosGás: (InsumoFormData & { id: string })[]
  onConfirm: (data: { insumoId: string; nomeInsumo: string; unidade: string; gramasCalculadas: number }) => void
  onCancel: () => void
}

const TAXAS = {
  medio: 3.75, // g/min
  alto: 4.17   // g/min
}

export function GasCalculatorModal({ insumosGás, onConfirm, onCancel }: Props) {
  const [selectedInsumoId, setSelectedInsumoId] = useState(insumosGás[0]?.id || '')
  const [minutos, setMinutos] = useState<number>(0)
  const [intensidade, setIntensidade] = useState<'medio' | 'alto'>('medio')

  const gramasCalculadas = minutos * TAXAS[intensidade]

  const handleConfirm = () => {
    if (!selectedInsumoId) return
    const insumo = insumosGás.find(i => i.id === selectedInsumoId)
    if (!insumo) return

    onConfirm({
      insumoId: insumo.id,
      nomeInsumo: insumo.nome,
      unidade: 'g', // Gás é sempre computado em gramas na ficha técnica
      gramasCalculadas: Number(gramasCalculadas.toFixed(2))
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-orange-500">🔥</span> Calculadora de Gás
        </h2>
        
        {insumosGás.length === 0 ? (
          <div className="text-amber-600 bg-amber-50 p-3 rounded text-sm mb-4">
            Você não possui nenhum insumo da categoria "Gás" cadastrado.
            Cadastre um Botijão de Gás primeiro na aba de Insumos.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Insumo de Gás</label>
              <select 
                className="w-full border rounded p-2"
                value={selectedInsumoId}
                onChange={e => setSelectedInsumoId(e.target.value)}
              >
                {insumosGás.map(g => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium">Tempo de Forno (Minutos)</label>
              <input 
                type="number" 
                min="0"
                className="w-full border rounded p-2" 
                value={minutos}
                onChange={e => setMinutos(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Intensidade da Chama</label>
              <select 
                className="w-full border rounded p-2"
                value={intensidade}
                onChange={e => setIntensidade(e.target.value as 'medio' | 'alto')}
              >
                <option value="medio">Fogo Médio (3.75 g/min)</option>
                <option value="alto">Fogo Alto (4.17 g/min)</option>
              </select>
            </div>

            <div className="bg-gray-50 p-3 rounded text-center border">
              <span className="text-sm text-gray-500 block">Consumo Estimado:</span>
              <span className="text-xl font-bold text-orange-600">{gramasCalculadas.toFixed(2)} g</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">
            Cancelar
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={insumosGás.length === 0 || minutos <= 0}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50"
          >
            Adicionar à Receita
          </button>
        </div>
      </div>
    </div>
  )
}
