# Histórias de Usuário (Novo Sistema Web)

As histórias de usuário do sistema antigo foram expandidas para abranger a nova arquitetura Web (Multi-User) com Autenticação e Cloud.

## Épico 1: Segurança e Acessibilidade (Novo)

- **US-01**: Como proprietária, quero fazer login usando meu E-mail/Senha (ou Conta Google), para que os dados financeiros da minha confeitaria não fiquem expostos a qualquer pessoa que usar o computador.
- **US-02**: Como proprietária, quero conseguir acessar o sistema do meu Celular ou Tablet através do navegador, para que eu possa lançar um pedido enquanto converso com o cliente no WhatsApp, sem precisar ir até o computador.
- **US-03**: Como proprietária, quero ter certeza de que meus dados estão salvos na nuvem automaticamente (Firebase), para não perder meu histórico se meu computador local queimar.

## Épico 2: Gestão de Insumos e Estoque Dinâmico

- **US-04**: Como confeiteira, quero cadastrar, pesquisar e atualizar meus ingredientes (g, ml, cm, un) de forma rápida, para gerenciar meu estoque base.
- **US-05**: Como confeiteira, quero que, ao registrar uma compra de insumo, o sistema deduza a proporção do custo do botijão de gás da minha "Calculadora de Gás" embutida na UI do modal.
- **US-06**: Como confeiteira, quero receber notificações "Toast" na tela quando a quantidade de um insumo cair abaixo do limite de alerta, para não ser pega de surpresa sem material no final de semana.

## Épico 3: Receitas e Fichas Técnicas Integradas

- **US-07**: Como confeiteira, quero arrastar e soltar (Drag and Drop) insumos do menu lateral para dentro da Ficha Técnica do Produto, para montar receitas de forma mais interativa e visual.
- **US-08**: Como confeiteira, quero ver o Custo Unitário do Produto se recalcular imediatamente na tela quando os preços dos ingredientes sobem no banco de dados.
- **US-09**: Como proprietária, quero que o sistema me avise (Cor/Alerta) se eu estiver vendendo o produto com Margem de Lucro Negativa, para que eu possa ajustar o Markup.

## Épico 4: Comandas e Pedidos de Venda

- **US-10**: Como vendedora, quero selecionar produtos em um "Carrinho de Compras" ao montar um pedido para o cliente, emitindo o valor total a ser pago.
- **US-11**: Como vendedora, quero poder separar o pagamento em "Sinal" e "Na Entrega" marcando os devidos status (Recebido/Pendente) em uma interface unificada.
- **US-12**: Como confeiteira, quero que, ao salvar a comanda, as gramas de farinha, leite, etc., sejam abatidas automaticamente do inventário central, blindando o estoque abaixo de zero (Zero-Floor constraint).

## Épico 5: Controle Financeiro e Dashboard Visual

- **US-13**: Como proprietária, quero analisar gráficos de linha e barras (Recharts) comparando Faturamento vs Despesas dos últimos 6 meses, para identificar a sazonalidade do meu faturamento.
- **US-14**: Como proprietária, quero ver meu Saldo de Caixa, Contas a Pagar e Contas a Receber consolidados em Cards no Dashboard inicial.
- **US-15**: Como proprietária, quero poder exportar o cardápio ou faturamento do mês num formato PDF bem diagramado (html2canvas/jsPDF) para contabilidade.
