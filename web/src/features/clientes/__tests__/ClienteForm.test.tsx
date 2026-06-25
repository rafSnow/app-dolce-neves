import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ClienteForm } from '../ClienteForm'

describe('ClienteForm', () => {
  it('deve renderizar e exigir o nome', async () => {
    const onSubmit = vi.fn()
    render(<ClienteForm onSubmit={onSubmit} onCancel={vi.fn()} />)
    
    expect(screen.getByText('Nome do Cliente')).toBeInTheDocument()
    
    // Tenta salvar vazio
    fireEvent.click(screen.getByText('Salvar Cliente'))
    
    const errors = await screen.findAllByText('Nome é obrigatório')
    expect(errors.length).toBeGreaterThan(0)
  })
})
