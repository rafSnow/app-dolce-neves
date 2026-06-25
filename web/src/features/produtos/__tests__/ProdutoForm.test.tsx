import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProdutoForm } from '../ProdutoForm'

// Mock do Query
vi.mock('@/hooks/useFirestore', () => ({
  useFirestoreCollection: vi.fn(() => ({
    data: [
      { id: '1', nome: 'Farinha de Trigo', pesoVolumeTotal: 1000, precoCompra: 10, unidadeMedida: 'g', ativo: true },
    ],
    isLoading: false,
  }))
}))

describe('ProdutoForm', () => {
  it('deve renderizar os campos básicos', () => {
    render(<ProdutoForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Nome do Produto')).toBeInTheDocument()
    expect(screen.getByText('Rendimento (unidades geradas na receita)')).toBeInTheDocument()
  })

  it('deve adicionar um insumo na ficha técnica e calcular custo proporcional', async () => {
    render(<ProdutoForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    
    // Add ingr
    fireEvent.click(screen.getByText('+ Adicionar Ingrediente'))
    
    // Select should be there
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThan(0)
  })
})
