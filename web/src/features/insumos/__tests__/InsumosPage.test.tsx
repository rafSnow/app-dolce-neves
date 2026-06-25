import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { InsumosPage } from '../InsumosPage'

// Mocking the hooks
vi.mock('@/hooks/useFirestore', () => ({
  useFirestoreCollection: vi.fn(() => ({
    data: [
      { id: '1', nome: 'Farinha de Trigo', categoria: 'Ingrediente', quantidadeDisponivel: 5000, quantidadeMinima: 1000, unidadeMedida: 'g', precoCompra: 20 },
      { id: '2', nome: 'Leite Condensado', categoria: 'Ingrediente', quantidadeDisponivel: 10, quantidadeMinima: 20, unidadeMedida: 'un', precoCompra: 5 },
    ],
    isLoading: false,
  })),
  useFirestoreMutation: vi.fn(() => ({
    add: { mutateAsync: vi.fn() },
    update: { mutateAsync: vi.fn() },
    remove: { mutateAsync: vi.fn() },
  }))
}))

describe('InsumosPage', () => {
  it('deve renderizar o título da página', () => {
    render(<InsumosPage />)
    expect(screen.getByText('Gestão de Insumos')).toBeInTheDocument()
  })

  it('deve exibir os insumos listados na tabela', () => {
    render(<InsumosPage />)
    expect(screen.getByText('Farinha de Trigo')).toBeInTheDocument()
    expect(screen.getByText('Leite Condensado')).toBeInTheDocument()
  })

  it('deve exibir alerta crítico quando estoque é menor que o mínimo', () => {
    render(<InsumosPage />)
    // "Crítico" should be in the document since Leite Condensado has 10 / 20.
    expect(screen.getByText('Crítico')).toBeInTheDocument()
  })
})
