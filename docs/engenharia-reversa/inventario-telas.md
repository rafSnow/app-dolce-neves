# Inventário de Telas e Fluxos de Navegação (AS-IS)

O sistema possui uma janela principal (`MainWindow`) que atua como um contêiner (App Shell) para diversas visualizações (Views) selecionáveis via menu lateral (Sidebar). A aplicação segue o paradigma de Single-Page-App (SPA) adaptado para Desktop, trocando de "tela" sem abrir novas janelas na maioria dos casos (exceto popups/modais).

## 1. Janela Principal (Main Window)
- **Objetivo**: Fornecer a estrutura base de navegação e exibição centralizada de badges/alertas.
- **Componentes**: 
  - Sidebar lateral esquerda contendo o logo e o nome do estabelecimento.
  - Botões de navegação: Dashboard, Insumos, Clientes, Produtos, Pedidos, Financeiro e Configurações.
  - O botão de "Insumos" possui um badge de notificação flutuante indicando quantos insumos estão com estoque crítico ou em alerta (integrado via evento `estoque.atualizado`).
- **Navegação**: Ao clicar em um botão da sidebar, a view correspondente é injetada no `content_frame` à direita.

---

## 2. Dashboard
- **Objetivo**: Apresentar os principais KPIs do negócio e resumos financeiros do mês vigente.
- **Campos e Indicadores**:
  - Saldo Atual
  - Previsão Mensal (Saldo Previsto)
  - Despesas a Pagar
  - Vendas a Receber
  - Investido em Insumos
  - Lucro de Vendas
  - Ticket Médio
  - Margem de Lucro Global
- **Botões**:
  - Seletores de mês e ano para filtragem dos dados.

---

## 3. Insumos
- **Objetivo**: Gestão de ingredientes, embalagens e gás, bem como controle de estoque e auditoria de variação de preços.
- **Campos (Grid)**: ID, Nome, Categoria, Peso/Vol, Preço de Compra, Custo/Un, Qtd Disponível.
- **Campos (Formulário)**: Nome, Categoria, Peso, Unidade de Medida, Preço Pago, Estoque Atual, Alerta Mínimo.
- **Botões**: `Novo`, `Salvar`, `Excluir`, `Limpar`, `Buscar`, `Exportar Excel`.
- **Ações de Contexto (Botão Direito)**: `Editar`, `Lançar Compra`, `Excluir`.
- **Regras/Validações**:
  - Insumos em estado crítico (estoque abaixo do mínimo) ganham tag colorida vermelha/laranja no grid.
  - Botão especial "Calculadora de Gás" que abre um modal (`GasCalculatorDialog`) para deduzir o custo proporcional do gás (ex: P13) baseado em dias/horas de uso.
  - Conversor de medidas embutido (`MeasureConverterDialog`).

---

## 4. Produtos (Ficha Técnica)
- **Objetivo**: Criar produtos comercializáveis compostos por insumos, definindo custo, margem de lucro e preço de venda.
- **Campos (Formulário)**: Nome, Rendimento (unidades), Comissão de Venda (%).
- **Listagem de Insumos da Receita**: Adição dinâmica de ingredientes.
- **Campos (Grid)**: ID, Nome, Custo Receita, Custo Unitário, Preço Venda, Margem.
- **Botões**: `Novo`, `Salvar`, `Adicionar Insumo`, `Exportar Excel`.
- **Regras/Validações**:
  - Se o Preço de Venda do produto for inferior ao seu Custo Unitário, uma tag de aviso visual (`(ABAIXO DO CUSTO!)`) é sinalizada.
  - O cálculo do custo dos produtos é derivado dinamicamente das atualizações de preço dos insumos da sua receita.

---

## 5. Clientes
- **Objetivo**: Cadastro simplificado de contatos para vínculo em pedidos e contas a receber.
- **Campos**: Nome, Contato (Telefone/Email).
- **Botões**: `Salvar`, `Editar`, `Excluir`.
- **Fluxo**: CRUD básico.

---

## 6. Pedidos
- **Objetivo**: Realizar vendas, vincular produtos a clientes, registrar pagamentos e disparar baixa de estoque.
- **Campos**: Cliente, Data Pedido, Data Entrega, Responsável.
- **Itens do Pedido**: Seleção de Produto e Quantidade.
- **Pagamento**: Subtotal, Pagamento Inicial (Sinal), Status Inicial, Data e Forma Inicial. Pagamento Final, Status Final, Data e Forma Final.
- **Regras/Validações**:
  - Salvar um pedido dispara a lógica de sincronização financeira (lançamento na tabela `rendimento`).
  - Dispara a baixa automática do estoque (`estoque_baixado`). O sistema trava a edição da "receita" do pedido após a baixa para evitar duplicidade de dedução, a não ser que cancelado.
- **Botões**: `Salvar Pedido`, `Finalizar Venda`, `Lançar Pagamento`.

---

## 7. Financeiro
- **Objetivo**: Controlar Contas a Pagar (Despesas) e Contas a Receber (Rendimentos).
- **Comportamento**: A tela possui abas internas (Tabs) `[Despesas]` e `[Rendimentos]`.
- **Despesas (Campos)**: Data, Descrição, Valor, Categoria (Insumos, Investimentos, Outros), Status (Pago/Pendente).
- **Rendimentos (Campos)**: (Somente Leitura) Exibe parcelas de pagamentos vinculados a pedidos.
- **Botões**: Exportação de Excel e Marcação de pagamento.

---

## 8. Configurações
- **Objetivo**: Definir nome da confeitaria, e preferências visuais.
- **Campos**: Nome do Estabelecimento.
- **Fluxo**: Ao salvar, altera a variável global e o título da janela em tempo real via callback `on_nome_alterado`.
