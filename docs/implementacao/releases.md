# Estratégia de Releases

Baseando-se no Roadmap e na priorização de módulos, a implantação do novo sistema web foi segmentada em versões lógicas para entrega contínua.

## Release 1 (Alpha) - Fundações e Estoque
**Meta:** Entregar a base da aplicação na nuvem, permitindo ao usuário popular seu banco de dados com seus materiais.
- Configuração de Hospedagem (Firebase Hosting) e App Shell.
- Implementação do Firebase Auth (Login).
- Módulo **Insumos**: CRUD, controle de estoque básico, limites de alerta.
- *Entregável*: O usuário já consegue migrar o cadastro de suas matérias-primas e visualizar o painel na nuvem.

## Release 2 (Beta) - Motor de Precificação
**Meta:** Prover a ferramenta de Custos, coração financeiro da confeitaria.
- Módulo **Produtos (Ficha Técnica)**: Vínculo dinâmico com insumos do banco de dados (UI com Arrays).
- Implementação de reatividade: se o insumo subir, o produto avisa "Abaixo do custo".
- CRUD Simples de **Clientes**.
- *Entregável*: O usuário consegue brincar com receitas, precificar doces de páscoa/natal e identificar prejuízos.

## Release 3 (RC - MVP) - Operação de Venda
**Meta:** O Sistema "ganha vida" recebendo vendas de ponta a ponta. Atingimos o **MVP**.
- Módulo **Pedidos**: Criação de comandas, adição de múltiplos produtos.
- Regra RN-PE-01: Snapshot imutável de valores do produto.
- Registro de pagamentos (Sinal e Pagamento Final).
- Sincronização e Baixa de Estoque. Implementação da Cloud Function que reduz gramas/ml do Firestore nos Insumos.
- *Entregável*: A confeitaria abandona o sistema Desktop antigo e passa a rodar suas operações de balcão/encomenda oficialmente na Web.

## Release 4 (V1.1) - Visão Financeira Completa
**Meta:** Recuperar recursos de relatórios administrativos do AS-IS.
- Módulo **Financeiro**: Desenvolvimento das Abas "Despesas" e "Rendimentos".
- Sincronização automática Event-Driven: "Lançou Compra em Insumo" -> "Cria Despesa"; "Fechou Venda" -> "Cria Rendimento".
- Módulo **Dashboard**: Queries de agregação no Firestore para Ticket Médio, Previsões, Total de Despesas x Vendas.

## Release 5 (V1.2) - Polimento e Ferramentas Secundárias
**Meta:** Features extras de produtividade (Nice-to-Haves).
- Modal Específico "Calculadora de Gás" acoplado na tela de Insumos.
- Botões de **Exportação para Excel** usando bibliotecas como `xlsx`.
- Tratamento de performance e virtualização de listas em grids grandes, se necessário.
