# Dependências e Módulos do Sistema

Com base nos documentos de engenharia reversa e arquitetura propostos, foram identificados os módulos do novo sistema web.

## Resumo dos Módulos

Os módulos estão apresentados em ordem de dependência (base para o topo).

### 1. Módulo de Autenticação e Configurações Globais
- **Objetivo**: Garantir segurança e controle de acesso, estabelecendo o ambiente inicial e o nome do estabelecimento (Multi-Tenant ou Single-Tenant isolado).
- **Dependências**: Nenhuma
- **Complexidade**: Baixa
- **Prioridade**: P1
- **Estimativa de Esforço**: 1 semana
- **Telas Envolvidas**: Login, Configurações
- **Coleções Firebase**: `users` (para gerenciamento Auth, não documentada explicitamente mas implícita no Auth)
- **APIs Envolvidas**: Firebase Auth
- **Regras de Negócio**: Acesso seguro (via Auth) para proteger as rotas da SPA; Definição do nome global do app (US-12).

### 2. Módulo de Gestão de Insumos e Estoque
- **Objetivo**: Cadastrar matérias-primas e embalagens, com controle de estoque e reposição.
- **Dependências**: Autenticação (Setup base)
- **Complexidade**: Média
- **Prioridade**: P1
- **Estimativa de Esforço**: 1.5 semanas
- **Telas Envolvidas**: Insumos (Grid/Tabela), Insumos (Formulário), Modal de Calculadora de Gás, Modal de Conversão.
- **Coleções Firebase**: `/insumos`, `/historico_precos`, `/despesas` (parcialmente, gerada na compra)
- **APIs Envolvidas**: Nenhuma (Comunicação via TanStack React Query + Firestore)
- **Regras de Negócio**: RN-IN-01 (Custo Proporcional Dinâmico), RN-IN-02 (Conversão de Unidades), RN-IN-03 (Alerta de Estoque), RN-IN-04 (Soft Delete de Insumos).

### 3. Módulo de Ficha Técnica (Produtos)
- **Objetivo**: Criar produtos comercializáveis compostos por múltiplos insumos e estipular margem de lucro sugerida baseada no custo dinâmico.
- **Dependências**: Módulo de Gestão de Insumos
- **Complexidade**: Alta
- **Prioridade**: P1
- **Estimativa de Esforço**: 2 semanas
- **Telas Envolvidas**: Produtos (Grid/Tabela), Produtos (Formulário complexo com adição dinâmica de ingredientes)
- **Coleções Firebase**: `/produtos` (com array interno `insumos`)
- **APIs Envolvidas**: Nenhuma
- **Regras de Negócio**: RN-PR-01 (Custo da Receita Dinâmico), RN-PR-02 (Custo Unitário), RN-PR-03 (Preço de Venda e Alerta de Margem Negativa).

### 4. Módulo de Gestão de Clientes
- **Objetivo**: Cadastro simplificado de pessoas para vínculo e rastreabilidade em pedidos e no módulo financeiro.
- **Dependências**: Autenticação
- **Complexidade**: Baixa
- **Prioridade**: P2
- **Estimativa de Esforço**: 0.5 semanas
- **Telas Envolvidas**: Clientes (Grid), Clientes (Formulário simplificado)
- **Coleções Firebase**: `/clientes`
- **APIs Envolvidas**: Nenhuma
- **Regras de Negócio**: CRUD Básico (Soft delete recomendado para não quebrar histórico visual de pedidos passados).

### 5. Módulo de Vendas e Pedidos
- **Objetivo**: Emitir pedidos de venda (comandas), lidar com subprodutos e pagamentos parciais (Sinal/Restante) e deduzir automaticamente insumos usados.
- **Dependências**: Ficha Técnica (Produtos), Gestão de Clientes, Autenticação
- **Complexidade**: Alta
- **Prioridade**: P1
- **Estimativa de Esforço**: 2.5 semanas
- **Telas Envolvidas**: Pedidos (Grid), Novo Pedido (Formulário com seleção de Cliente, Produtos, Qtd, Valores e Pagamentos Inicial/Final).
- **Coleções Firebase**: `/pedidos` (com array interno `itens` e objeto `pagamentos`), `/rendimentos` (geração secundária), `/insumos` (Baixa)
- **APIs Envolvidas**: Firebase Cloud Functions (Recomendado para "Zero-Floor Baixa de Estoque Atômica")
- **Regras de Negócio**: RN-PE-01 (Congelamento de Preço via Snapshot no momento da venda), RN-PE-02 (Baixa de Estoque Controlada/Atômica), RN-PE-03 (Estoque Negativo e Auditoria).

### 6. Módulo Financeiro
- **Objetivo**: Conciliação do fluxo de caixa através do controle de Contas a Pagar e Contas a Receber.
- **Dependências**: Insumos (para despesas automáticas de compras) e Pedidos (para rendimentos gerados de vendas).
- **Complexidade**: Média
- **Prioridade**: P2
- **Estimativa de Esforço**: 1.5 semanas
- **Telas Envolvidas**: Financeiro (Tabs Despesas e Rendimentos)
- **Coleções Firebase**: `/despesas`, `/rendimentos`
- **APIs Envolvidas**: Nenhuma
- **Regras de Negócio**: RN-FI-01 (Espelhamento ERP entre Pagamento do Pedido e Tabela Rendimento), RN-FI-02 (Integração de Lançamento de Compra p/ Despesa).

### 7. Módulo de Dashboard e Relatórios
- **Objetivo**: Visão executiva da saúde financeira da confeitaria contendo agregados e KPIs.
- **Dependências**: Módulo Financeiro e Pedidos
- **Complexidade**: Média
- **Prioridade**: P3
- **Estimativa de Esforço**: 1 semana
- **Telas Envolvidas**: Dashboard Principal
- **Coleções Firebase**: Leituras agregadas em `/pedidos`, `/despesas` e `/rendimentos` (Ou agregadores por Cloud Function)
- **APIs Envolvidas**: Nenhuma (Firestore queries combinadas)
- **Regras de Negócio**: RN-FI-03 (Cálculo de Margem Global e Ticket Médio).

---

## Módulos Críticos Identificados

1. **Ficha Técnica (Produtos)**: O cálculo on-the-fly do custo unitário baseado no array mutável de insumos é o "coração" da proposta de valor (precificação segura).
2. **Vendas e Pedidos (Baixa de Estoque)**: Lidar com concorrência na baixa de estoque fracionado num ambiente Multi-User é o maior desafio técnico da migração para cloud.
