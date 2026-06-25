import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PedidoForm } from '../PedidoForm'

// Mock de hooks para prover dados base
vi.mock('@/hooks/useFirestore', () => ({
  useFirestoreCollection: vi.fn((colName) => {
    if (colName === 'clientes') return { data: [{ id: 'cli1', nome: 'João Teste' }], isLoading: false }
    if (colName === 'produtos') return { data: [{ id: 'prod1', nome: 'Bolo', precoVendaUnitario: 50 }], isLoading: false }
    return { data: [], isLoading: false }
  })
}))

describe('PedidoForm', () => {
  it('deve renderizar e permitir adicionar itens', () => {
    render(<PedidoForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('Financeiro')).toBeInTheDocument()

    // Clica em adicionar
    fireEvent.click(screen.getByText('+ Adicionar Produto'))
    const selects = screen.getAllByRole('combobox')
    // Pelo menos o select do cliente e o do item recem adicionado (sinal e restante tb possuem selects)
    expect(selects.length).toBeGreaterThan(2)
  })
})
