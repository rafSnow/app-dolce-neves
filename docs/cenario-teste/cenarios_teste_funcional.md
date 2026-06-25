# Cenários de Testes Funcionais (QA Manual)

Siga os passos abaixo para testar a robustez e garantir que a integração entre a UI, os cálculos de matemática e o Firebase estejam funcionando perfeitamente em seu ambiente de testes local ou em nuvem.

## 📝 Módulo 1: Gestão de Insumos

| ID | Cenário | Passos para Reprodução | Resultado Esperado (Critério de Aceite) |
|---|---|---|---|
| **IN-01** | Criar um Insumo Básico | 1. Navegue até Insumos.<br>2. Clique em "Novo Insumo".<br>3. Preencha: Nome="Leite Moca", Preço=R$10.00, Peso Total=395g.<br>4. Salvar. | O modal fecha e a tabela é recarregada contendo o Leite Moça e o custo correto listado. |
| **IN-02** | Validação de Campos Obrigatórios | 1. Clique em "Novo Insumo".<br>2. Deixe o Nome vazio e coloque um Preço=-1 (negativo).<br>3. Tente salvar. | O formulário é impedido de salvar. Alertas vermelhos do Zod indicam "Nome é obrigatório" e "Deve ser maior ou igual a zero". |
| **IN-03** | Alerta de Estoque Crítico | 1. Edite um insumo.<br>2. Defina "Estoque Disponível" como `5` e "Alerta Mínimo" como `10`.<br>3. Salvar. | Na tabela principal, uma TAG visual avermelhada indicando **Crítico** deve aparecer ao lado da quantidade. |
| **IN-04** | Exclusão Lógica (Soft Delete) | 1. Em um Insumo da lista, clique em "Remover".<br>2. Aguarde a conclusão. | A linha desaparece imediatamente da tabela principal. Se olhar no Firestore de teste, o documento ainda existe mas com a flag `ativo: false`. |

---

## 🎂 Módulo 2: Produtos e Fichas Técnicas

| ID | Cenário | Passos para Reprodução | Resultado Esperado (Critério de Aceite) |
|---|---|---|---|
| **PR-01** | Teste da Proporção da Receita (Ao Vivo) | 1. Em "Produtos", clique em "Novo Produto".<br>2. Adicione Ingrediente.<br>3. Selecione o Leite Moça (Ex: R$ 10,00 por 395g).<br>4. Digite Quantidade Usada: `197.5`. | O campo de Custo (R$) na linha do insumo deve calcular magicamente e exibir **R$ 5,00** instantaneamente. |
| **PR-02** | Divisão pelo Rendimento | 1. Seguindo o teste PR-01, deixe o custo da Receita em R$ 5,00.<br>2. Altere o campo de "Rendimento" no topo para `5`. | O bloco azul "Custo Unitário" na área de precificação deve ser divido e exibir **R$ 1,00**. |
| **PR-03** | Alerta de Margem Baixa | 1. Em um produto cujo "Custo Unitário" ficou em R$ 1,00.<br>2. Configure "Taxas" para `0%`.<br>3. Configure Preço de Venda para `R$ 1,15`. | Como o lucro é R$ 0,15 (13%), a tela deve levantar um **aviso laranja** dizendo que a margem está abaixo de 20%. |
| **PR-04** | Alerta de Prejuízo (Venda abaixo do Custo) | 1. No mesmo cenário.<br>2. Altere "Taxas/Comissão" para `20%` e Preço de Venda para `R$ 1,00`. | O sistema emitirá um **alerta vermelho** de prejuízo, pois R$ 1,00 não cobre nem o custo real nem os 20% do Ifood/Cartão. |
| **PR-05** | Recálculo ao Remover Ingrediente | 1. Adicione dois ingredientes (Ex: Leite Moça [Custo: 5] + Farinha [Custo: 2]). Custo da Receita = 7.<br>2. Clique no 'X' vermelho para remover a Farinha. | O bloco "Custo da Receita" deve descer imediatamente para **R$ 5,00**. |

> [!TIP]
> **Dica para Testes na Prática**: Se você seguiu o *Setup do Firebase* descrito anteriormente e rodou `npm run dev`, basta acessar `http://localhost:5173/` e realizar exatamente as ações dessas tabelas. Nenhuma inserção manual no painel do Google Cloud precisará ser feita!
