# Arquitetura de Implementação (Front-End & Reuso)

Ao analisarmos o plano de implementação anterior e as dependências entre módulos, é possível otimizar a ordem de desenvolvimento para uma mentalidade de **componentização progressiva**. Em aplicações React, construir a base reutilizável de UI, Hooks e Contextos antes de avançar para lógicas complexas diminui drasticamente a necessidade de refatorações futuras.

## 1. Ordem Recomendada (Otimizada)

A ordem ideal para minimizar retrabalhos constrói dos elementos mais independentes ("Folhas") para os mais dependentes ("Nós raiz").

1. **Camada Core (Shared)**: Setup do React (Vite), Design System Base, Layouts, Context Providers e Utilitários Genéricos (Firebase Service Functions).
2. **Autenticação & Configurações**: Validação das proteções de rotas (`AuthGuard`) e da conexão com Firebase.
3. **Gestão de Clientes**: É o "Hello World" perfeito de CRUD para testar os componentes genéricos recém-criados de Tabelas (Grids) e Formulários (Inputs textuais).
4. **Gestão de Insumos**: Introduz complexidade numérica (Pesos, Custos, Alertas) e usa Modais (Calculadora/Conversor), aproveitando o Grid e Form testados nos Clientes.
5. **Gestão de Produtos (Fichas Técnicas)**: Reutiliza Insumos. Adiciona a complexidade de *Field Arrays* no UI (formulários aninhados) e hooks dinâmicos de cálculo.
6. **Vendas e Pedidos**: O ápice da complexidade. Amarra Clientes (Select de clientes) e Produtos (Select de carrinho), introduzindo a lida transacional (Cloud Functions).
7. **Financeiro (Despesas e Rendimentos)**: Reaproveita a infraestrutura de tabelas e captura eventos secundários dos módulos passados.
8. **Dashboard e Relatórios**: Por fim, agrega os dados, aproveitando que todos os serviços e hooks de leitura já estarão prontos e testados.

### 1.1 Justificativa Técnica
Se começássemos diretamente por *Pedidos*, seríamos obrigados a refatorar constantemente a interface toda vez que um componente novo de seleção ou validação global fosse descoberto durante a integração com o *Insumo*. Ao isolarmos os "Compartilhados" primeiro, e testando-os num CRUD simples (*Clientes*), evitamos dependências circulares de UI e garantimos homogeneidade visual. O reuso de um hook genérico de Firestore reduz o Boilerplate em 60%.

---

## 2. Componentes Compartilhados (UI Components)

Para maximizar a reutilização, utilizaremos o padrão **Atomic Design** ou agrupamentos lógicos de bibliotecas Headless (como Radix UI via `shadcn/ui`).

- `DataTable`: Um componente genérico de listagem (pode usar TanStack Table). Receberá colunas, dados, e lógicas genéricas de paginação/ordenação. Será reutilizado em Clientes, Insumos, Produtos, Pedidos e Financeiro.
- `FormElements` (Input, Select, CurrencyInput, DatePicker): Embrulhados diretamente para conversar de forma nativa com `react-hook-form`.
- `ConfirmDialog` / `AlertDialog`: Modais de ações destrutivas globais (Ex: "Tem certeza que deseja excluir o insumo X?").
- `StatusBadge`: Tags coloridas reutilizáveis (Ex: Insumos: "Crítico", Pedidos: "Pago"/"Pendente").
- `SectionCard` / `PageHeader`: Estruturas visuais padrão de bordas e cabeçalhos para unificar a identidade das páginas.

---

## 3. Hooks Compartilhados (React Custom Hooks)

Manter o acesso de dados desacoplado da visualização.

- `useFirestoreCollection<T>(collectionName, queries?)`: Um wrapper com React Query (`useQuery`) para listar coleções. Recebe filtros opcionais e cuida de estados de "Loading", "Error" e mapeia os resultados cacheáveis. Reutilizado por 100% das listagens do sistema.
- `useFirestoreDocument<T>(collectionName, docId)`: Busca de documento individual por ID, com cache e real-time updates opcional via `onSnapshot`.
- `useFirestoreMutation(collectionName)`: Um wrapper global com `useMutation` para inserção, atualização e `soft-delete` de dados, já injetando o contexto do `tenantId` (Inquilino) e disparando toasts de sucesso globalmente.
- `useMathMetrics()`: Hook para cálculos centralizados usados no Dashboard e em relatórios, evitando vazamento de regras de negócios para os componentes visuais.
- `useAuth()`: Fornece fácil acesso ao usuário logado, roles, e status do login.

---

## 4. Providers Compartilhados (Context API)

Fornecem estado global apenas para propriedades de infraestrutura.

- `AuthProvider`: Escuta alterações na sessão (Firebase Auth state listener) e propaga para toda a árvore. Evita flickering de login/logout.
- `QueryClientProvider` (TanStack Query): Injeta as políticas de *stale time* e *cache time* globais que dão à SPA a capacidade "offline-first".
- `ThemeProvider`: Controle de Dark Mode/Light Mode.
- `ToastProvider`: Fila e exibição de notificações não intrusivas do sistema (Avisos de erro de formulário, Sucesso de gravação).

---

## 5. Layouts Compartilhados

- `AppShell` / `MainLayout`: Contém a `Sidebar` fixa lateral e a área principal flexível de renderização das páginas (o `<Outlet />` do React Router). Reutilizável por todo fluxo pós-login.
- `AuthLayout`: Layout de tela cheia, minimalista, exclusivo para fluxos de autenticação, recuperação de senha ou onboarding.

---

## 6. Estratégia de Autenticação e Permissões

### Autenticação (Authentication)
A autenticação será mediada estritamente pelo **Firebase Authentication**.
- **Provedores Suportados**: E-mail e Senha (primário) podendo ser escalado para Logins via Google.
- **Ciclo de Vida**: No arquivo de inicialização do React, ouviremos o evento `onAuthStateChanged()`. Enquanto ele retornar nulo, o usuário será direcionado ao `AuthLayout`. Uma vez validado o token JWT, será roteado ao `MainLayout`. O token de acesso cuida sozinho de validar a legitimidade das conexões.

### Permissões (Authorization) & Isolamento de Dados
O documento anterior de engenharia reversa indicava a aplicação Single-User operando de forma offline e arriscada. Para migrar com segurança e minimizar dependências cruzadas entre lojas se o app escalar para um SaaS:

- **Isolamento de Tenant (Loja)**: Todos os documentos base deverão ter uma key raiz ou um campo indexado `tenantId` que corresponde ao `uid` do usuário que o criou, ou a um Custom Claim inserido no Auth.
- **Firebase Security Rules**: Centralizar as validações e permissões no "Backend". Regra base genérica e super-reutilizável:
  ```javascript
  match /databases/{database}/documents {
    // Função auxiliar genérica para verificar se está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Função auxiliar para garantir o Tenant Isolation
    function isOwner(resourceTenantId) {
      return isAuthenticated() && request.auth.uid == resourceTenantId;
    }

    // Regras Genéricas Aplicadas
    match /insumos/{insumo} {
      allow read, write: if isOwner(resource.data.tenantId) || isOwner(request.resource.data.tenantId);
    }
    match /pedidos/{pedido} {
       allow read, write: if isOwner(resource.data.tenantId) || isOwner(request.resource.data.tenantId);
    }
  }
  ```
- Este padrão elimina a necessidade de checar autorizações em cada componente Front-End separadamente. O Firebase simplesmente rejeitará escritas/leituras ilegítimas gerando um erro de "Missing Permissions", que o nosso `useFirestoreCollection` compartilhará com o `ToastProvider` em formato amigável.
