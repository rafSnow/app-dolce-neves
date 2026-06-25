# Estrutura de Pastas (Frontend)

O projeto adotará a arquitetura focada em Features (Feature-Sliced Design simplificado), agrupando código por domínio de negócio ao invés de separar por "tipos de arquivos". Isso facilita a escala e manutenção do ecossistema React.

## Diretório Raiz: `/src`

```text
src/
├── assets/                  # Imagens estáticas, SVGs, ícones customizados não-lucide
├── components/              
│   ├── ui/                  # Componentes base Radix/Shadcn (Botões, Dialogs, Inputs, Tooltips)
│   ├── layout/              # Sidebar, Header, PageContainer (Componentes estruturais globais)
│   └── shared/              # Componentes de UI agnósticos de domínio (ex: DataTables, EmptyStates)
├── config/                  # Constantes, rotas base e configurações de bibliotecas (ex: z-index map)
├── features/                # Agrupamento de domínio de negócio (Coração do App)
│   ├── auth/                # Lógica de Login, Signup, Firebase Auth listeners
│   ├── dashboard/           # KPIs, Gráficos (Recharts), Resumos financeiros
│   ├── insumos/             # Hooks, views e componentes específicos de matérias-primas
│   ├── produtos/            # Fichas técnicas, cálculo de comissão
│   ├── pedidos/             # Fluxo de vendas, seleção de cliente
│   ├── financeiro/          # Contas a pagar (despesas), contas a receber (rendimentos)
│   └── clientes/            # Cadastro e histórico de clientes
├── hooks/                   # Hooks genéricos globais (ex: useDebounce, useMediaQuery, useLocalStorage)
├── lib/                     
│   ├── firebase/            # Inicialização do Firebase (app, db, auth, storage)
│   ├── utils.ts             # Funções utilitárias (cn/clsx para tailwind, conversores de medidas)
│   └── formatters.ts        # Formatadores globais de Moeda (Intl.NumberFormat) e Datas (date-fns)
├── pages/                   # Rotas de página nível superior (importam das Features)
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Insumos.tsx
│   ├── Produtos.tsx
│   ├── Pedidos.tsx
│   └── Financeiro.tsx
├── providers/               # Context Providers globais (QueryClientProvider, ThemeProvider, AuthProvider)
├── styles/                  # Arquivo css global (index.css), variáveis do Tailwind (colors, borders)
├── types/                   # Interfaces e Tipagens globais do TypeScript
├── App.tsx                  # Ponto de entrada das rotas (React Router)
└── main.tsx                 # Bootstrapping do React e Providers
```

## Dissecando uma Feature (Exemplo: `/features/insumos/`)

Para evitar arquivos gigantes, cada pasta dentro de `features` concentra sua lógica:

```text
features/insumos/
├── api/                     # Consultas e mutações do React Query (ex: useInsumos.ts, useUpdateInsumo.ts)
├── components/              # Componentes de UI restritos a este domínio
│   ├── InsumoForm.tsx       # O formulário com React Hook Form + Zod
│   ├── InsumoTable.tsx      # A tabela com estado de sorting
│   └── GasCalculator.tsx    # O modal da calculadora de gás migrado
├── schemas/                 # Validações Zod (ex: insumoSchema.ts)
└── types/                   # Tipagens restritas a Insumos (Interface Insumo, Historico)
```

**Vantagens da Estrutura**:
1. **Modularidade**: Se a confeiteira não vender mais "Insumos" e se tornar uma Loja Virtual genérica, basta apagar a pasta da feature sem quebrar dependências espalhadas pelo sistema todo.
2. **Reuso Limpo**: A pasta `components/ui/` mantém botões e modais burros (dummy components), sem lógicas de banco acopladas.
