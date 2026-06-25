# Relacionamentos de Dados e Restrições (AS-IS)

O banco de dados SQLite garante o desacoplamento e a integridade de dados através da definição estrita de Foreign Keys (Chaves Estrangeiras) com gatilhos de deleção automática em cascata em algumas entidades.

## 1. Mapeamento de Chaves Estrangeiras

### 1.1 `produto_insumo`
Tabela pivô do relacionamento (Muitos para Muitos) N:N entre `produto` e `insumo`.
- **FK**: `produto_id` -> `produto(id)`
  - **ON DELETE CASCADE**: Verdadeiro. Se um produto for deletado fisicamente (hard delete, embora o padrão do sistema seja o soft-delete), as linhas relativas aos ingredientes que o formam são automaticamente varridas.
- **FK**: `insumo_id` -> `insumo(id)`
  - **ON DELETE**: Padrão (Restrict). Impede que um insumo seja apagado fisicamente caso esteja compondo a ficha técnica de um produto existente.

### 1.2 `pedido`
Associa-se a entidades centralizadoras mas copia as informações para garantir histórico.
- **FK**: `cliente_id` -> `cliente(id)`
  - **Relacionamento**: 1:N (Um cliente pode ter vários pedidos).
  - O `cliente_nome` existe de maneira redundante visando preservar os relatórios de pedidos passados caso o cliente seja removido fisicamente do banco de dados (o campo ID vai para Null, e o Nome permanece).

### 1.3 `pedido_item`
Tabela pivô que estende o pedido N:N com os produtos vendidos.
- **FK**: `pedido_id` -> `pedido(id)`
  - **ON DELETE CASCADE**: Se um pedido for descartado, as linhas de produtos comprados naquele cupom de venda serão perdidas também.
- **FK**: `produto_id` -> `produto(id)`
  - **ON DELETE**: Padrão (Restrict).

### 1.4 `rendimento`
Espelhamento financeiro.
- **FK**: `cliente_id` -> `cliente(id)`
- **FK**: `pedido_id` -> `pedido(id)`
  - **ON DELETE CASCADE**: Se um pedido for cancelado ou deletado fisicamente, as previsões de ganhos geradas lá no caixa (Dashboard) devem sumir do horizonte contábil.

### 1.5 `historico_preco_insumo`
Logs da evolução das compras passadas.
- **FK**: `insumo_id` -> `insumo(id)`
  - **ON DELETE CASCADE**: O fim da existência do insumo anula as previsões de tracking deste log específico.

## 2. Check Constraints e Validadores Internos
O Banco de Dados não permite a inserção acidental de status arbitrários através da cláusula nativa `CHECK(IN (...))`:
- **Categorias do Insumo**: `('Ingrediente', 'Embalagem', 'Gás')`
- **Unidades Físicas**: `('g', 'ml', 'un', 'm', 'cm')`
- **Categorias da Despesa**: `('Insumos', 'Investimentos', 'Outros')`
- **Status da Despesa**: `('Pendente', 'Pago')`

Nenhum ORM externo é forçado a gerir essas checagens. Estão solidificadas no `.db`.
