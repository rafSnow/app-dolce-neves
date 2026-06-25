# Casos de Uso (Novo Sistema Web)

Este documento descreve as interações diretas (atores e sistema) previstas para o MVP Web através de diagramas lógicos.

## Atores do Sistema
No MVP, o sistema assume o uso concentrado na **Proprietária/Confeiteira** que assume todos os chapéus (Administração, Produção, Vendas). Contudo, a modelagem Cloud permite que futuramente os papéis sejam segmentados.
- **Ator Primário**: Admin (Confeiteira)
- **Ator Secundário**: Sistema (Firebase Firestore / Cloud Functions)

---

## 1. UC-01: Autenticação Segura
**Ator:** Admin
**Fluxo Principal:**
1. Admin acessa a URL da aplicação Web.
2. Sistema redireciona para tela de login por falta de sessão.
3. Admin insere e-mail e senha.
4. Sistema valida credenciais contra o Firebase Auth.
5. Sistema armazena o token seguro e redireciona para o Dashboard.

---

## 2. UC-02: Gerenciar Ficha Técnica de Produto
**Ator:** Admin
**Pré-condições:** Estar logado; Ter insumos cadastrados.
**Fluxo Principal:**
1. Admin navega até "Produtos" e clica em "Nova Ficha".
2. Insere Nome, Rendimento e Margem de Lucro.
3. Seleciona ingredientes em um componente de Autocomplete/Dropdown.
4. Define a quantidade de gramas/ml exigida para aquela receita.
5. Sistema calcula os custos dinâmicos por ingrediente (React Hook) baseando-se no preço de compra.
6. Admin clica em Salvar.
7. Sistema (Firebase) persiste a Ficha Técnica.

---

## 3. UC-03: Efetivar Pedido de Venda
**Ator:** Admin
**Fluxo Principal:**
1. Admin navega para "Pedidos" e inicia nova venda.
2. Seleciona o Cliente ou digita um nome novo.
3. Adiciona "Bolo de Cenoura" (Qtd 2).
4. Informa que o cliente pagou um Sinal de 50% em PIX.
5. Sistema sugere salvar o pedido.
6. Sistema (Firebase) persiste a venda e efetua as "Baixas em Cascata":
   - Desconta 500g de farinha do inventário do Insumo (Zero-floor limit aplicado).
   - Registra no Financeiro as parcelas (Rendimentos).
   - Congela o preço de venda daquele dia em um Snapshot.
   - Atualiza o Dashboard.

---

## 4. UC-04: Cadastrar Compra (Despesa) de Insumos
**Ator:** Admin
**Fluxo Principal:**
1. Admin clica com botão direito (Context Menu) sobre um insumo cadastrado e aciona "Lançar Compra".
2. Informa o valor pago no mercado e a quantidade física (Peso).
3. Sistema sobrepõe o preço de custo anterior com o preço atual.
4. Sistema emite uma Despesa vinculada na tabela de Financeiro.
5. Sistema (Firebase) adiciona uma fileira de "Auditoria/Histórico" para registrar a inflação da matéria-prima com a data de hoje.
6. Sistema aciona um webhook interno que repassa a alteração do custo para todas as receitas (Fichas Técnicas) que possuem este insumo.

---

## 5. UC-05: Monitoramento Analítico
**Ator:** Admin
**Fluxo Principal:**
1. Admin acessa o Dashboard da aplicação.
2. O Sistema (React Query) faz o fetch otimizado de dados do Firestore.
3. Sistema renderiza os Cards superiores usando Radix UI.
4. Admin altera o DatePicker para o mês anterior.
5. Os gráficos do Recharts sofrem re-render com animação transitória para refletir os lucros comparados aos custos.
