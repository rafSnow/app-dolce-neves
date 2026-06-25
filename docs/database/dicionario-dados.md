# Dicionário de Dados

Este dicionário descreve os detalhes das colunas (Chaves Primárias, Estrangeiras, Restrições e Índices) de todas as 11 tabelas do banco de dados SQLite.

## 1. `insumo`
Armazena os ingredientes, embalagens e opções de gás.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | INTEGER | PK, AUTOINCREMENT | Identificador único. |
| `nome` | TEXT | NOT NULL | Nome do insumo (ex: Leite Condensado). |
| `categoria` | TEXT | NOT NULL, CHECK(IN ('Ingrediente','Embalagem','Gás')) | Agrupamento lógico. |
| `peso_volume_total` | REAL | NOT NULL | Quantidade bruta da embalagem comprada. |
| `unidade_medida` | TEXT | NOT NULL, CHECK(IN ('g','ml','un','m','cm')) | Unidade de medida associada ao peso/volume. |
| `preco_compra` | REAL | NOT NULL | Valor monetário pago na embalagem. |
| `quantidade_disponivel` | REAL | NOT NULL, DEFAULT 0 | Saldo atual em estoque (na unidade de medida base). |
| `quantidade_minima` | REAL | NOT NULL, DEFAULT 0 | Ponto de pedido para alertas (estoque crítico). |
| `data_compra` | TEXT | Opcional | Data da última aquisição (YYYY-MM-DD). |
| `ativo` | INTEGER | NOT NULL, DEFAULT 1 | Flag de Soft Delete (0 = excluído, 1 = ativo). |

**Índices:**
- `idx_insumo_nome_unique`: UNIQUE (LOWER(TRIM(nome))) WHERE ativo = 1

## 2. `produto`
Receitas elaboradas e prontas para venda.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | INTEGER | PK, AUTOINCREMENT | Identificador único. |
| `nome` | TEXT | NOT NULL | Nome da receita/produto. |
| `rendimento_receita` | INTEGER | NOT NULL | Quantidade de unidades produzidas por lote. |
| `comissao_perc` | REAL | NOT NULL, DEFAULT 0 | Margem de Lucro / Markup pretendida em %. |
| `custo_unitario` | REAL | NOT NULL, DEFAULT 0 | Custo base computado dinamicamente (Soma Custo Insumos / Rendimento). |
| `preco_venda_unitario` | REAL | NOT NULL, DEFAULT 0 | Valor sugerido para o consumidor final (Custo * Markup). |
| `ativo` | INTEGER | NOT NULL, DEFAULT 1 | Flag de Soft Delete. |

**Índices:**
- `idx_produto_nome`: (nome)

## 3. `produto_insumo`
Tabela associativa para a Ficha Técnica.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `produto_id` | INTEGER | PK, FK -> produto(id) ON DELETE CASCADE | Produto a qual a receita pertence. |
| `insumo_id` | INTEGER | PK, FK -> insumo(id) | Ingrediente pertencente a receita. |
| `quantidade_usada_receita` | REAL | NOT NULL | Medida (em g, ml, etc) utilizada do ingrediente. |
| `custo_proporcional` | REAL | NOT NULL | Parcela do custo financeiro representada na receita atual. |

**Índices:**
- `idx_produto_insumo_insumo_id`: (insumo_id)

## 4. `cliente`
Cadastro de clientes.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | INTEGER | PK, AUTOINCREMENT | Identificador único. |
| `nome` | TEXT | NOT NULL | Nome / Razão Social do cliente. |
| `contato` | TEXT | Opcional | Telefone / E-mail de contato. |

**Índices:**
- `idx_cliente_nome`: (nome)

## 5. `pedido`
Controle de vendas de produtos (Comandas).

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | INTEGER | PK, AUTOINCREMENT | Identificador do Pedido. |
| `cliente_id` | INTEGER | FK -> cliente(id) | Cliente vinculador. |
| `cliente_nome` | TEXT | Opcional | Campo desnormalizado para preservação de histórico. |
| `data_pedido` | TEXT | NOT NULL | Data de emissão (YYYY-MM-DD). |
| `data_entrega` | TEXT | Opcional | Data limite da entrega. |
| `valor_total` | REAL | NOT NULL, DEFAULT 0 | Somatório financeiro dos itens. |
| `pag_inicial_valor` | REAL | DEFAULT 0 | Valor de adiantamento (Sinal). |
| `pag_inicial_data` | TEXT | Opcional | Data de pagamento do sinal. |
| `pag_inicial_forma` | TEXT | Opcional | Forma de pagamento (PIX, Crédito, etc). |
| `pag_inicial_status` | TEXT | DEFAULT 'Pendente' | Pendente ou Recebido. |
| `pag_final_valor` | REAL | DEFAULT 0 | Valor pendente para a entrega. |
| `pag_final_data` | TEXT | Opcional | Data do fechamento final. |
| `pag_final_forma` | TEXT | Opcional | Forma de pagamento. |
| `pag_final_status` | TEXT | DEFAULT 'Pendente' | Pendente ou Recebido. |
| `responsavel` | TEXT | Opcional | Pessoa que efetuou a venda. |
| `estoque_baixado` | INTEGER | NOT NULL, DEFAULT 0 | Flag atômica de segurança (1 = Estoque deduzido, 0 = Faltante). |

**Índices:**
- `idx_pedido_cliente_id`: (cliente_id)
- `idx_pedido_cliente_nome`: (cliente_nome)
- `idx_pedido_data_pedido_id`: (data_pedido DESC, id DESC)
- `idx_pedido_status_pag`: (pag_inicial_status, pag_final_status)

## 6. `pedido_item`
Item a Item dentro do Pedido.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | INTEGER | PK, AUTOINCREMENT | ID da linha do item. |
| `pedido_id` | INTEGER | NOT NULL, FK -> pedido(id) ON DELETE CASCADE | Pedido Pai. |
| `produto_id` | INTEGER | NOT NULL, FK -> produto(id) | Produto Consumido. |
| `quantidade` | INTEGER | NOT NULL | Unidades vendidas. |
| `preco_unitario_snapshot` | REAL | NOT NULL | Preço congelado no ato da venda. |
| `data_snapshot` | TEXT | Opcional | Data que o snapshot foi capturado. |
| `valor_item` | REAL | NOT NULL | (Quantidade * Snapshot). |

**Índices:**
- `idx_pedido_item_pedido_id`: (pedido_id)
- `idx_pedido_item_produto_id`: (produto_id)

## 7. `despesa`
Gestão de custos e saídas do negócio.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | INTEGER | PK, AUTOINCREMENT | Identificador. |
| `data` | TEXT | NOT NULL | Data de lançamento. |
| `valor` | REAL | NOT NULL | Valor da despesa. |
| `descricao` | TEXT | Opcional | Finalidade / Justificativa. |
| `categoria` | TEXT | CHECK(IN ('Insumos','Investimentos','Outros')) | Segmentação financeira. |
| `responsavel` | TEXT | Opcional | Autor do lançamento. |
| `status` | TEXT | DEFAULT 'Pendente', CHECK(IN ('Pendente','Pago')) | Estado de liquidação. |
| `forma_pagamento` | TEXT | Opcional | PIX, Débito, etc. |
| `data_pagamento_final` | TEXT | Opcional | Liquidação efetiva (Data). |
| `origem` | TEXT | Opcional | Metadado de sistema originador (ex: 'insumo'). |
| `origem_id` | INTEGER | Opcional | ID chave do sistema originador. |

**Índices:**
- `idx_despesa_data_id`: (data DESC, id DESC)
- `idx_despesa_categoria_status`: (categoria, status)

## 8. `rendimento`
Rastreamento financeiro espelhado dos pedidos (Entradas).

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | INTEGER | PK, AUTOINCREMENT | ID do ganho. |
| `cliente_id` | INTEGER | FK -> cliente(id) | Pagador associado. |
| `pag_inicial_valor` | REAL | DEFAULT 0 | 1ª Parcela. |
| `pag_inicial_data` | TEXT | Opcional | Data Prevista 1. |
| `pag_inicial_forma` | TEXT | Opcional | PIX, Crédito 1. |
| `pag_inicial_status` | TEXT | DEFAULT 'Pendente' | Quitação 1. |
| `pag_final_valor` | REAL | DEFAULT 0 | 2ª Parcela. |
| `pag_final_data` | TEXT | Opcional | Data Prevista 2. |
| `pag_final_forma` | TEXT | Opcional | Dinheiro, PIX 2. |
| `pag_final_status` | TEXT | DEFAULT 'Pendente' | Quitação 2. |
| `responsavel` | TEXT | Opcional | Operador. |
| `pedido_id` | INTEGER | FK -> pedido(id) ON DELETE CASCADE | Venda atrelada. |

**Índices:**
- `idx_rendimento_pag_inicial_data`: (pag_inicial_data)
- `idx_rendimento_pag_final_data`: (pag_final_data)
- `idx_rendimento_status_pag`: (pag_inicial_status, pag_final_status)

## 9. `historico_preco_insumo`
Série temporal de oscilação de valores de mercadoria.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | INTEGER | PK, AUTOINCREMENT | Identificador de evento. |
| `insumo_id` | INTEGER | NOT NULL, FK -> insumo(id) ON DELETE CASCADE | Mercadoria alvo. |
| `preco_anterior` | REAL | NOT NULL | R$ Velho. |
| `preco_novo` | REAL | NOT NULL | R$ Atual. |
| `peso_anterior` | REAL | Opcional | Gramatura Antiga. |
| `peso_novo` | REAL | Opcional | Gramatura Nova (reduflação). |
| `data_alteracao` | TEXT | NOT NULL | Momento exato da flutuação. |
| `observacao` | TEXT | Opcional | Comentário adicional. |

**Índices:**
- `idx_hist_preco_insumo_insumo_data`: (insumo_id, data_alteracao DESC)
- `idx_hist_preco_insumo_data`: (data_alteracao DESC)

## 10. `configuracao`
Tabela utilitária Key-Value global.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `chave` | TEXT | PK | Key identificadora. |
| `valor` | TEXT | Opcional | Valor serializado do parâmetro. |

## 11. `auditoria`
Logs imutáveis de consistência (Tracking de Exclusões e Estoque).

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | INTEGER | PK, AUTOINCREMENT | Evento ID. |
| `entidade` | TEXT | NOT NULL | Tabela afetada (ex: insumo). |
| `entidade_id` | INTEGER | Opcional | ID da Entidade alvo. |
| `acao` | TEXT | NOT NULL | UPDATE, DELETE ou ação funcional. |
| `detalhes` | TEXT | Opcional | Payload em formato Texto. |
| `criado_em` | TEXT | NOT NULL | Timestamp exato da ocorrência. |

**Índices:**
- `idx_auditoria_entidade_id`: (entidade, entidade_id)
- `idx_auditoria_criado_em`: (criado_em DESC)
