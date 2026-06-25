# Cronograma e Sprints

Considerando as estimativas de esforço dos módulos documentados em `dependencias-modulos.md`, o desenvolvimento total tem uma previsão estipulada em ~10 semanas (aproximadamente 2.5 meses), divididas em 5 Sprints quinzenais.

> **Premissa**: A equipe é composta por pelo menos 1 a 2 desenvolvedores full-stack focados trabalhando simultaneamente.

## Sprint 1 (Semanas 1 e 2): Setup e Fundações
**Foco:** Estruturar repositório, CI/CD e Módulo de Insumos.
- `[Semana 1]` Inicializar Vite + React + TypeScript + Tailwind.
- `[Semana 1]` Setup do Firebase (Firestore, Auth) e TanStack Query.
- `[Semana 1]` Desenvolvimento do App Shell (Sidebar, Rotas Vazias) e Login.
- `[Semana 2]` Implementar Módulo de **Insumos** (CRUD de grid e formulário com React Hook Form + Zod).
- `[Semana 2]` Lógicas de regras RN-IN-03 (Alerta de Estoque visual).

## Sprint 2 (Semanas 3 e 4): O Motor de Precificação
**Foco:** Construir a interface complexa da Ficha Técnica.
- `[Semana 3]` Implementar base estrutural de **Produtos**.
- `[Semana 4]` UI Avançada no formulário (Field Arrays para listagem de insumos da receita).
- `[Semana 4]` Lógica computada de custos (RN-PR-01, 02, 03).
- **Marco (Fim da Sprint 2):** Release Beta liberada.

## Sprint 3 (Semanas 5 e 6): Clientes e Motor de Vendas
**Foco:** Garantir fluidez na criação do Pedido.
- `[Semana 5]` Módulo Rápido de **Clientes** (CRUD Simples).
- `[Semana 5]` Iniciando Tela de **Pedidos** (Seleção de Clientes, Inserção de Produtos no Carrinho).
- `[Semana 6]` Trabalhar regras de Snapshot de Preço (RN-PE-01).
- `[Semana 6]` Estruturar blocos visuais de Pagamento (Sinal, Restante).

## Sprint 4 (Semanas 7 e 8): Controle de Concorrência e Estoque (MVP)
**Foco:** Fechar a trava de baixa de inventário, desafio arquitetônico principal.
- `[Semana 7]` Implementar mecanismo de baixa de estoque. Escrita e testes de *Firebase Cloud Functions* (Node.js) ou Batched Writes para disparar abatimento de Insumos seguro.
- `[Semana 8]` Homologação pesada do ciclo de vida: Comprar Insumo -> Fazer Bolo -> Vender -> Conferir Baixa.
- **Marco (Fim da Sprint 4):** Lançamento Release RC (MVP).

## Sprint 5 (Semanas 9 e 10): Financeiro, Dashboard e Refinos
**Foco:** Visibilidade administrativa pós-MVP.
- `[Semana 9]` Tela do **Financeiro** (Duas Abas). Sincronizar via listeners os Pagamentos de pedidos com os Rendimentos e Mapear Despesas manuais.
- `[Semana 10]` Construção visual do **Dashboard** e queries de agregação.
- `[Semana 10]` Tarefas de debito técnico menores: Componentizar Exportação CSV/Excel, Polimento em animações Framer Motion.
- **Marco (Fim da Sprint 5):** Release 1.1 Concluída.
