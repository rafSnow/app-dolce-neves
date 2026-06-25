# Modelo de Dados Firebase (NoSQL)

A arquitetura do Firebase Cloud Firestore dita que consultas complexas (JOINs) não existem nativamente. Portanto, os dados devem ser moderadamente **desnormalizados** para que as telas carreguem rápido e com poucas leituras (Read Operations), que são faturadas pelo Google.

## Raízes de Coleção (Collections)

Todas as coleções terão o ID do Tenant (usuário da loja/proprietário) embutido de forma hierárquica ou com campo `tenantId` para garantir isolamento na Security Rule. Se for Single-Tenant na nuvem, fica na raiz.

```text
/insumos/{insumoId}
  - nome: string
  - categoria: string ["Ingrediente", "Embalagem", "Gás"]
  - pesoVolumeTotal: number
  - unidadeMedida: string ["g", "ml", "un", "m", "cm"]
  - precoCompra: number
  - quantidadeDisponivel: number
  - quantidadeMinima: number
  - ativo: boolean
  - dataAtualizacao: timestamp

/historico_precos/{historicoId}  (Substitui 'historico_preco_insumo')
  - insumoId: string (referência)
  - precoAnterior: number
  - precoNovo: number
  - dataAlteracao: timestamp

/produtos/{produtoId}
  - nome: string
  - rendimentoReceita: number
  - comissaoPerc: number
  - custoUnitario: number
  - precoVendaUnitario: number
  - ativo: boolean
  - insumos: Array<Object> (Desnormalização de 'produto_insumo' -> Para evitar leituras extras por receita)
      [
        {
          insumoId: string,
          nomeInsumo: string, (Copiado para leitura rápida)
          unidade: string,
          quantidadeUsadaReceita: number,
          custoProporcionalAtual: number
        }
      ]

/clientes/{clienteId}
  - nome: string
  - contato: string
  - dataCadastro: timestamp

/pedidos/{pedidoId}
  - clienteId: string (Opcional, ou ID dinâmico)
  - clienteNome: string (Copiado para histórico imutável)
  - dataPedido: timestamp
  - dataEntrega: timestamp
  - valorTotal: number
  - estoqueBaixado: boolean
  - pagamentos: Object (Merge de pag_inicial e pag_final)
      {
        sinal: { valor: number, status: string, forma: string, data: timestamp },
        restante: { valor: number, status: string, forma: string, data: timestamp }
      }
  - itens: Array<Object> (Substitui 'pedido_item', salva leituras)
      [
        {
           produtoId: string,
           produtoNome: string,
           quantidade: number,
           precoUnitarioSnapshot: number,
           valorItem: number
        }
      ]

/despesas/{despesaId}
  - data: timestamp
  - valor: number
  - descricao: string
  - categoria: string ["Insumos", "Investimentos", "Outros"]
  - status: string ["Pendente", "Pago"]
  - origem: string
  - origemId: string

/rendimentos/{rendimentoId}
  - pedidoId: string
  - clienteNome: string
  - dataVencimento: timestamp
  - valor: number
  - status: string ["Pendente", "Recebido"]
  - tipoPagamento: string ["sinal", "final"]
  (Nota: Ao invés de uma fileira gorda com pag_inicial e pag_final, dividimos os eventos em documentos menores e independentes para alimentar gráficos de Despesa x Rendimento facilmente).
```

### Otimizações NoSQL (Diferenças vs SQLite)
1. **Subcoleções abolidas em Fichas e Pedidos**: Em vez de ter uma tabela pivô (`produto_insumo`), o Firebase salva um Array de Mapas (objetos json) diretamente dentro do Documento do Produto. Uma leitura no Produto trás todos os seus ingredientes imediatamente de forma barata. O mesmo ocorre no carrinho de itens do Pedido.
2. **Duplicação de Nomes (Denormalization)**: `clienteNome` e `produtoNome` são duplicados em recibos intencionalmente. Em bancos NoSQL, espaço em disco é banal; o custo reside em "leituras" e em não possuir Foreign Keys restritas que travam os documentos base.
