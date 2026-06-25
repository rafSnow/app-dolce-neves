# MVP (Minimum Viable Product) Web

A primeira versão de lançamento (Release v1.0) do "Doce Neves Web" visa realizar a paridade de funcionalidades ("Feature Parity") com a versão Desktop existente, adicionando a mobilidade de acesso via nuvem. 

## O que ENTRA no MVP (Escopo Fechado)
1. **Autenticação Firebase**: Tela de login restrita. Não haverá tela de "Criar Conta" pública (Self-Registration). A proprietária criará usuários através do console ou via convite fechado.
2. **Dashboard Visual**: Gráficos de barras em Recharts e Cards resumidos iguais à v1.0 Desktop.
3. **Módulos Core Refeitos em React**: 
   - CRUD de Insumos (com aba de Histórico acoplada e Modal Calculadora de Gás)
   - CRUD de Ficha Técnica (Produtos) com gatilhos mágicos reativos.
   - Painel de Vendas (Pedidos) com bloqueio e desconto de estoque.
4. **Exportação de Relatórios**: Capacidade de gerar PDF (Cardápio / Pedido) usando `jsPDF` e baixar relatórios CSV simples que não dependam da thread UI principal do browser.
5. **Mobile First UI (Responsividade)**: Como a principal promessa de valor Web é usar longe do PC, 100% da interface desenhada em Tailwind será "Mobile-First" (flex/grid quebrando perfeitamente em telas pequenas).

## O que NÃO ENTRA no MVP (Backlog Futuro)
- **Multi-Tenant (SaaS Comercial)**: Vender o aplicativo para outras padarias exigiria isolamento de dados massivo em Security Rules, cobranças com Stripe e onboarding.
- **Diferenciação de Papéis (RBAC avançado)**: Níveis rígidos de acesso (Ex: Vendedor vs Administrador) serão postergados. Todos autenticados terão visão Admin plena.
- **Notificações Push via PWA**: Embora alertas locais (Toasts) na UI entrem usando a stack `sonner`, receber notificações nativas no OS celular ("Alerta de Estoque via Push") exigiria Service Workers avançados que extrapolam o cronograma de MVP.

## Cronograma de Transição de Dados
1. Criação do Front-End React Vite conectado a um Firebase Sandbox Vazio.
2. Homologação das regras de negócio atômicas (como Baixa de Estoque Não-Negativa e Update em Cadeia do Preço).
3. Script de Importação única do SQLite original (.db) lendo e mapeando as entidades para as Coleções Desnormalizadas do Firestore em Produção.
4. Go Live Oficial e arquivamento (depreciação) do software Desktop.
