# Modelo de Dados (AS-IS)

Este documento descreve o estado atual do banco de dados relacional SQLite do sistema.

## Tabelas Principais

### `insumo`
Armazena ingredientes, embalagens e gás.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `nome`: TEXT NOT NULL
- `categoria`: TEXT NOT NULL (Ingrediente, Embalagem, Gás)
- `peso_volume_total`: REAL NOT NULL
- `unidade_medida`: TEXT NOT NULL (g, ml, un, m, cm)
- `preco_compra`: REAL NOT NULL
- `quantidade_disponivel`: REAL NOT NULL DEFAULT 0 (Estoque)
- `quantidade_minima`: REAL NOT NULL DEFAULT 0 (Alerta de Estoque)
- `data_compra`: TEXT (ISO-8601: YYYY-MM-DD)
- `ativo`: INTEGER NOT NULL DEFAULT 1 (Soft Delete)

### `produto`
Armazena os produtos e suas informações agregadas (fichas técnicas).
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `nome`: TEXT NOT NULL
- `rendimento_receita`: INTEGER NOT NULL
- `comissao_perc`: REAL NOT NULL DEFAULT 0
- `custo_unitario`: REAL NOT NULL DEFAULT 0 (Valor calculado com base nos insumos)
- `preco_venda_unitario`: REAL NOT NULL DEFAULT 0 (Calculado com base na comissão)
- `ativo`: INTEGER NOT NULL DEFAULT 1 (Soft Delete)

### `produto_insumo`
Relação N:N entre Produto e Insumo, formando a Ficha Técnica.
- `produto_id`: INTEGER (FK -> produto(id) ON DELETE CASCADE)
- `insumo_id`: INTEGER (FK -> insumo(id))
- `quantidade_usada_receita`: REAL NOT NULL
- `custo_proporcional`: REAL NOT NULL (Calculado e persistido)
- **PK**: `(produto_id, insumo_id)`

### `cliente`
Cadastro de clientes.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `nome`: TEXT NOT NULL
- `contato`: TEXT

### `pedido`
Controle de vendas de produtos para clientes.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `cliente_id`: INTEGER (FK -> cliente(id))
- `cliente_nome`: TEXT (Desnormalização de cliente para histórico)
- `data_pedido`: TEXT NOT NULL (ISO-8601)
- `data_entrega`: TEXT (ISO-8601)
- `valor_total`: REAL NOT NULL DEFAULT 0
- `pag_inicial_valor`: REAL DEFAULT 0
- `pag_inicial_data`: TEXT (ISO-8601)
- `pag_inicial_forma`: TEXT
- `pag_inicial_status`: TEXT DEFAULT 'Pendente' (Pendente, Recebido)
- `pag_final_valor`: REAL DEFAULT 0
- `pag_final_data`: TEXT (ISO-8601)
- `pag_final_forma`: TEXT
- `pag_final_status`: TEXT DEFAULT 'Pendente' (Pendente, Recebido)
- `responsavel`: TEXT
- `estoque_baixado`: INTEGER NOT NULL DEFAULT 0 (Flag que indica se o estoque dos insumos foi descontado)

### `pedido_item`
Itens associados a um pedido.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `pedido_id`: INTEGER NOT NULL (FK -> pedido(id) ON DELETE CASCADE)
- `produto_id`: INTEGER NOT NULL (FK -> produto(id))
- `quantidade`: INTEGER NOT NULL
- `preco_unitario_snapshot`: REAL NOT NULL (Preço no momento do pedido)
- `data_snapshot`: TEXT (Data do snapshot do pedido)
- `valor_item`: REAL NOT NULL

### `despesa`
Gestão de custos indiretos e compras avulsas.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `data`: TEXT NOT NULL
- `valor`: REAL NOT NULL
- `descricao`: TEXT
- `categoria`: TEXT (Insumos, Investimentos, Outros)
- `responsavel`: TEXT
- `status`: TEXT DEFAULT 'Pendente' (Pendente, Pago)
- `forma_pagamento`: TEXT
- `data_pagamento_final`: TEXT
- `origem`: TEXT (Vínculo sistêmico com outras entidades)
- `origem_id`: INTEGER

### `rendimento`
Controle financeiro de recebimentos originários ou não de Pedidos (usado no Dashboard ERP).
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `cliente_id`: INTEGER (FK -> cliente(id))
- `pag_inicial_valor`: REAL DEFAULT 0
- `pag_inicial_data`: TEXT
- `pag_inicial_forma`: TEXT
- `pag_inicial_status`: TEXT DEFAULT 'Pendente'
- `pag_final_valor`: REAL DEFAULT 0
- `pag_final_data`: TEXT
- `pag_final_forma`: TEXT
- `pag_final_status`: TEXT DEFAULT 'Pendente'
- `responsavel`: TEXT
- `pedido_id`: INTEGER (FK -> pedido(id) ON DELETE CASCADE)

### `historico_preco_insumo`
Guarda flutuações de custos de insumos no decorrer do tempo.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `insumo_id`: INTEGER NOT NULL (FK -> insumo(id) ON DELETE CASCADE)
- `preco_anterior`: REAL NOT NULL
- `preco_novo`: REAL NOT NULL
- `peso_anterior`: REAL
- `peso_novo`: REAL
- `data_alteracao`: TEXT NOT NULL
- `observacao`: TEXT

### `configuracao`
Configurações sistêmicas chaves-valor globais.
- `chave`: TEXT PRIMARY KEY
- `valor`: TEXT

### `auditoria`
Logs de ações destrutivas ou críticas.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `entidade`: TEXT NOT NULL
- `entidade_id`: INTEGER
- `acao`: TEXT NOT NULL
- `detalhes`: TEXT
- `criado_em`: TEXT NOT NULL

## Índices (Performance)
- `idx_insumo_nome_unique` (insumo.nome, LOWER/TRIM UNIQUE, ativo=1)
- `idx_produto_nome` (produto.nome)
- `idx_pedido_cliente_id` (pedido.cliente_id)
- `idx_pedido_cliente_nome` (pedido.cliente_nome)
- `idx_pedido_data_pedido_id` (pedido.data_pedido DESC, id DESC)
- `idx_pedido_status_pag` (pedido.pag_inicial_status, pag_final_status)
- `idx_pedido_item_pedido_id` (pedido_item.pedido_id)
- `idx_pedido_item_produto_id` (pedido_item.produto_id)
- `idx_produto_insumo_insumo_id` (produto_insumo.insumo_id)
- `idx_despesa_data_id` (despesa.data DESC, id DESC)
- `idx_despesa_categoria_status` (despesa.categoria, status)
- `idx_rendimento_pag_inicial_data` (rendimento.pag_inicial_data)
- `idx_rendimento_pag_final_data` (rendimento.pag_final_data)
- `idx_rendimento_status_pag` (rendimento.pag_inicial_status, pag_final_status)
- `idx_hist_preco_insumo_insumo_data` (historico_preco_insumo.insumo_id, data_alteracao DESC)
- `idx_hist_preco_insumo_data` (historico_preco_insumo.data_alteracao DESC)
- `idx_auditoria_entidade_id` (auditoria.entidade, entidade_id)
- `idx_auditoria_criado_em` (auditoria.criado_em DESC)
