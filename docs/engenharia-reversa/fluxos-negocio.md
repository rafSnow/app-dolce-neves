# Fluxos de Negócio (AS-IS)

O sistema foi modelado para refletir o dia a dia operacional de uma confeitaria. Os fluxos de navegação são compostos em etapas sequenciais conectadas através dos eventos emitidos no barramento interno.

## 1. Fluxo de Abastecimento (Insumos e Estoque)
**Objetivo**: Cadastrar matérias-primas e registrar reposição.
1. Usuário acessa o painel de **Insumos**.
2. Usuário preenche o formulário para um novo ingrediente (ex: Leite Condensado), estabelecendo o Peso/Volume pago pela lata e o Preço total.
3. (Opcional) Define um alerta de estoque mínimo.
4. Quando a confeiteira vai ao mercado repor o estoque, ela clica com botão direito sobre o Insumo no grid e seleciona **Lançar Compra**.
5. O sistema registra a soma da `quantidade_disponivel`, gera uma nova **Despesa** vinculada na tela do Financeiro e cria uma entrada em **Histórico de Preços** caso o valor da lata tenha mudado.

## 2. Fluxo de Criação de Ficha Técnica (Produtos)
**Objetivo**: Definir um produto do cardápio e estabelecer o custo de fabricação.
1. Usuário acessa o painel de **Produtos**.
2. Preenche o Nome (ex: Bolo de Cenoura) e o Rendimento (ex: Rende 1 bolo).
3. Adiciona os **Insumos** da receita um por um (ex: 200g farinha, 50g açúcar, 100ml leite).
4. O sistema processa o custo proporcional de cada ingrediente, fracionando o custo dinamicamente a partir dos preços de compra cadastrados no fluxo 1.
5. O sistema soma os custos e divide pelo rendimento para dar o **Custo Unitário**.
6. O usuário imputa a **Comissão de Venda (%)** desejada (Markup), e o sistema propõe o Preço de Venda ideal para não haver prejuízo.

## 3. Fluxo de Pedido de Venda
**Objetivo**: Emitir uma comanda de venda para um cliente, garantindo rastreabilidade financeira e dedução de estoque.
1. Usuário clica em **Pedidos** -> Novo Pedido.
2. Seleciona um **Cliente** da lista (cadastrado previamente na aba Clientes).
3. Insere a Data do Pedido e a Data de Entrega prevista.
4. Anexa um ou mais **Produtos** (do fluxo 2) na listagem do pedido e insere a Quantidade.
5. Em **Pagamento Inicial (Sinal)**, define o valor pago adiantado (ex: 50% via PIX), marcando como "Recebido".
6. Em **Pagamento Final (Entrega)**, lança os outros 50% como "Pendente".
7. Salva o pedido. 
8. O sistema automaticamente abaixa o equivalente em gramas/ml das farinhas/leites (Fluxo 1) baseados na Ficha Técnica (Fluxo 2) do produto. O saldo remanescente a pagar é injetado na aba **Rendimentos** do Financeiro.

## 4. Fluxo de Conciliação e Acompanhamento
**Objetivo**: Obter panorama da saúde do negócio.
1. Usuário abre a tela **Financeiro**. Confere contas a pagar e marca o Pagamento Final do bolo (fluxo 3) de "Pendente" para "Recebido".
2. Usuário abre o **Dashboard**. O sistema exibe no painel principal o Saldo Atual em caixa, as projeções (Previsto) e as métricas de Varejo (Ticket Médio, Lucro Real vs Custos de Matéria Prima) calculadas agregando todos os 3 fluxos anteriores do período vigente.
