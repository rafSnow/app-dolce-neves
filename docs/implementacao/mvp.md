# Definição do MVP (Minimum Viable Product)

A versão "MVP" (Minimum Viable Product) foca em entregar o valor mais crítico da aplicação primeiro, garantindo que a confeitaria consiga precificar corretamente seus doces e controlar suas saídas e vendas primárias. Funcionalidades menos essenciais como análises sofisticadas ou CRUDs periféricos são despriorizadas.

## O que ENTRA no MVP

O foco absoluto do MVP é a **Precificação Dinâmica e o Registro de Vendas com Deduzimento de Estoque**.

1. **Gestão de Insumos Essencial**: 
   - Criação, leitura, edição e "soft-delete" de insumos.
   - Aviso de estoque baixo.
   - Botão para lançar compra de insumo (Reposicionamento de estoque).
   - Conversor de Medidas.
2. **Produtos (Ficha Técnica)**:
   - Construção de receitas anexando insumos.
   - Cálculo automático do custo do produto e margem de lucro sugerida.
   - Alerta visual para lucro negativo.
3. **Gestão de Clientes (Minimalista)**:
   - Apenas o necessário para vincular um nome a um pedido.
4. **Vendas / Pedidos**:
   - Criação de pedido vinculando Produtos aos Clientes.
   - Registro de Pagamentos (Sinal Inicial e Entrega Final).
   - Snapshot de preço (congelamento) para garantir histórico.
   - **Gatilho Crítico**: Baixa imediata de estoque fracionado de insumos.

## O que FICA DE FORA do MVP

Estes itens serão construídos em releases subjacentes (v1.1+):

- **Dashboard Avançado**: Agregações complexas como Margem de Lucro Geral Mensal e Projeções Financeiras.
- **Tela Financeira Completa**: Fluxo detalhado isolado de Despesas Extraordinárias (água, luz, investimentos). O lojista fará esse acompanhamento básico através das informações do pedido.
- **Exportação de Excel**: Funcionalidade secundária que toma esforço UI/UX.
- **Calculadora de Gás Independente**: No MVP, o gás pode ser embutido como um insumo genérico (ex: Custo fixo por hora de forno). A modelagem UI de frações da calculadora pode atrasar o release.
- **Cloud Functions para "Agregadores"**: No MVP, cálculos do dashboard (se tiver algum resumo) serão feitos Client-Side iterando os documentos do mês.

## Justificativa

Conforme o arquivo de histórias de usuários e os débitos técnicos:
A maior dor (US-03, US-04) reside em entender a margem de lucro e o impacto da mudança do preço do mercado na ficha técnica de um bolo. Isso deve estar impecável no MVP.
O Dashboard e o painel de Despesas (US-09, US-10) demandam maior complexidade de queries em NoSQL (Firestore) e, inicialmente, a saúde da empresa será monitorada no dia a dia conferindo se as fichas técnicas operam no verde e os pedidos estão pagos.
