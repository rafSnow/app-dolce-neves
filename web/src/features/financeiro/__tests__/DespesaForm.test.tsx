import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DespesaForm } from '../DespesaForm'

describe('DespesaForm', () => {
  it('deve validar descricao e renderizar dataPagamento se pago', async () => {
    render(<DespesaForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    
    // Nao tem dataPagamento
    expect(screen.queryByText('Data do Pagamento Efetivado')).not.toBeInTheDocument()

    // Muda status para Pago
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Pago' } })
    expect(screen.getByText('Data do Pagamento Efetivado')).toBeInTheDocument()

    // Tenta salvar vazio
    fireEvent.click(screen.getByText('Salvar Despesa'))
    
    const errors = await screen.findAllByText('Descrição é obrigatória')
    expect(errors.length).toBeGreaterThan(0)
  })
})
