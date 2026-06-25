# Roadmap de Implementação

O processo de construção do novo sistema web "Dolce Neves" seguirá uma ordem bottom-up guiada pelas dependências de dados. Primeiro, construir os alicerces estruturais e de cadastro, culminando nas funções complexas de vendas e na visualização agregada.

## Visão Macro

1. **Fase 1: Infraestrutura e Cadastros Base**
   O foco inicial é preparar o ambiente cloud (Firebase + React) e criar o esqueleto do controle de estoque, que sustenta todas as outras lógicas da confeitaria.
   - Configuração de Cloud e CI/CD.
   - Autenticação e Configurações (Nome do negócio, perfil).
   - Módulo de Gestão de Insumos (Cadastro, conversão de medidas, histórico de compras).

2. **Fase 2: Fichas Técnicas e Precificação**
   Utilizando os Insumos construídos na Fase 1, o sistema agora precisa calcular quanto custa criar cada doce.
   - Módulo de Produtos.
   - Lógica de cálculo proporcional das receitas (Custo dinâmico).
   - Definição de markup e preço sugerido (Alerta de margem abaixo do custo).

3. **Fase 3: Operação de Vendas (Pedidos)**
   Com produtos precificados, a confeitaria precisa registrar vendas aos clientes.
   - Módulo de Clientes (CRUD base).
   - Tela de Pedido de Venda.
   - Snapshot de preço, cálculo de totais, lançamentos de pagamentos em duas vias (Sinal + Restante).
   - Gatilho Atômico de Baixa de Estoque via Firebase Functions.

4. **Fase 4: Retaguarda Financeira e Análise**
   Garantir a visão consolidada da saúde financeira através dos fluxos gerados nas fases anteriores.
   - Módulo Financeiro (Despesas x Rendimentos).
   - Integrações entre "Insumo Comprado -> Despesa" e "Pedido Pago -> Rendimento".
   - Dashboard com KPIs (Lucratividade, Ticket Médio, Previsão Mensal).

## Ordem Ideal de Implementação
*Esta é a sequência exata de construção técnica sugerida aos desenvolvedores:*

1. Configuração do Projeto Vite + Firebase Config.
2. Layout Base App Shell (Sidebar, Rotas principais).
3. Auth Flow (Login, Proteção de Rotas).
4. CRUD Insumos (UI, Queries Firestore, Calculadora de Gás, Regra RN-IN).
5. CRUD Produtos (Receitas em Arrays Embutidos, Recálculo On-the-fly, Regra RN-PR).
6. CRUD Clientes.
7. Tela de Novo Pedido.
8. Integração de Pagamentos do Pedido (Sinal / Restante).
9. Lógica de Baixa de Estoque de Insumos (O ideal é criar uma Cloud Function disparada em `onCreate` no documento do Pedido).
10. Views Financeiras (Despesas isoladas e visualização de Rendimentos gerados por pedidos).
11. Extração de Agregados para popular o Dashboard.
12. Polimento final (Animações Framer Motion e Exportações para Excel).
