# Regras de Negócio (AS-IS)

O sistema centraliza diversas lógicas operacionais e financeiras de uma confeitaria para evitar erros de cálculo manual. Abaixo estão as principais regras documentadas do código fonte:

## 1. Gestão de Estoque e Insumos
- **RN-IN-01 (Custo Proporcional Dinâmico)**: O custo do insumo (`custo_por_unidade`) não é um valor absoluto fixado, mas calculado dinamicamente em tempo de leitura dividindo-se o `preco_compra` pelo `peso_volume_total`. 
- **RN-IN-02 (Conversão de Unidades)**: Todos os cálculos matemáticos para produtos baseiam-se em uma unidade base padrão da confeitaria (Gramas para Sólidos, ML para líquidos). A "Calculadora de Gás" é uma abstração para ratear o preço do botijão em horas de cozimento.
- **RN-IN-03 (Alerta de Estoque)**: Sempre que a `quantidade_disponivel` de um insumo cair abaixo da `quantidade_minima`, ele é tido como em estado de "Alerta". Se chegar a 0, é estado "Crítico".
- **RN-IN-04 (Soft Delete)**: Insumos (e Produtos) nunca são apagados definitivamente (`DELETE FROM`) para proteger o histórico de relatórios passados e fichas técnicas já emitidas. Em vez disso, recebem o status de inativo (`ativo = 0`), ficando invisíveis nas listagens principais.

## 2. Precificação de Produtos (Ficha Técnica)
- **RN-PR-01 (Custo da Receita)**: O custo total de um produto equivale ao somatório da proporção da `quantidade_usada_receita` versus o `custo_por_unidade` atual de cada insumo presente. Se o preço do açúcar subir, o custo de todas as receitas atreladas a ele sobe automaticamente.
- **RN-PR-02 (Custo Unitário)**: O Custo Total da Receita é sempre dividido pelo `rendimento_receita` (quantas porções/unidades aquela fornada gera).
- **RN-PR-03 (Preço de Venda e Margem)**: O `preco_venda_unitario` é sugerido pelo sistema com base no `comissao_perc` (Markup) aplicado sobre o custo unitário. Se o usuário fixar ou os insumos encarecerem a ponto da Margem de Lucro ficar negativa (Preço de Venda < Custo Unitário), o sistema alerta em vermelho que o produto opera no prejuízo ("Abaixo do Custo").

## 3. Lançamento e Baixa de Pedidos
- **RN-PE-01 (Congelamento de Preço)**: Ao fechar um pedido, o `preco_venda` de cada item no momento da venda é "congelado" (Snapshot) na tabela `pedido_item`. Assim, se o produto sofrer reajustes no futuro, relatórios de lucro de meses passados permanecem corretos com o valor do dia da venda.
- **RN-PE-02 (Baixa de Estoque Controlada)**: Um pedido salvo fará a baixa do estoque (subtração das frações de insumo da Ficha Técnica). Essa ação é atômica e gravada no banco com a flag `estoque_baixado = 1` na tabela `pedido`. O sistema tem uma trava que impede a segunda baixa do mesmo pedido se o usuário re-salvar a tela.
- **RN-PE-03 (Estoque Negativo)**: Caso a confeitaria venda um pedido para o qual o sistema acuse falta de estoque, o saldo do insumo fica negativo, e um log é gravado na tabela `auditoria` indicando a inconsistência do inventário real versus virtual.

## 4. Financeiro e Integração
- **RN-FI-01 (Espelhamento ERP)**: Ao criar um Pedido com um "Sinal Inicial" e um "Pagamento Final" (ex: 50% antecipado, 50% na entrega), o sistema automaticamente reproduz essas transações na tabela `rendimento` sem intervenção extra do usuário.
- **RN-FI-02 (Integração de Compras)**: "Lançar Compra" na aba de Insumos injeta um registro direto na tabela `despesa`, sob a categoria "Insumos", impactando o fluxo de caixa do Dashboard.
- **RN-FI-03 (Cálculo de Margem do Dashboard)**: A "Margem de Lucro (%)" do painel inicial é o resultado de `(Lucro Total Vendas / Total Recebido * 100)`. O lucro das vendas leva em conta o Custo *Ideal/Atual* da ficha técnica contra o valor de venda faturado *no dia*.
