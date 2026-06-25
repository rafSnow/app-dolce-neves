# Arquitetura do Novo Sistema (Web/Cloud)

A arquitetura moderna proposta transforma o sistema "Doce Neves" de uma aplicação Desktop (Single-User/SQLite) para uma **Web App Cloud-Native (Multi-User/Firebase)**, escalável e responsiva, mantendo a rica interatividade da interface através de SPAs (Single Page Applications).

## 1. Visão Geral da Stack

### 1.1 Frontend (Client-Side)
- **Framework**: React 18+ com Vite para HMR super rápido e build otimizado.
- **Linguagem**: TypeScript para segurança de tipos e melhor intellisense.
- **Roteamento**: React Router DOM v6 para navegação client-side.
- **State Management & Data Fetching**: TanStack React Query. Responsável por cache, retries automáticos e sincronização de dados vindos do Firebase, substituindo o estado global complexo.
- **Estilização**: Tailwind CSS combinado com `tailwind-merge` e `clsx` para criação de componentes altamente customizáveis sem colisão de classes.
- **UI Library / Componentes**: Radix UI (headless components) estendidos através de um Design System inspirado no padrão `shadcn/ui`. Fornece acessibilidade (WAI-ARIA) mantendo controle total do CSS.
- **Formulários e Validação**: React Hook Form acoplado ao Zod (`@hookform/resolvers/zod`). Previne renders desnecessários e garante validação de schemas rígidos antes do envio ao Firestore.
- **Animações**: Framer Motion para transições de página e micro-interações fluidas (como `Accordion`, modais).

### 1.2 Backend (BaaS)
- **Plataforma**: Firebase.
- **Autenticação**: Firebase Auth. Suporte a e-mail/senha e logins sociais. Permite a transição para um sistema Multi-User seguro.
- **Banco de Dados**: Cloud Firestore (NoSQL). Estrutura orientada a documentos e coleções com suporte a listeners em tempo real (`onSnapshot`).
- **Segurança**: Firebase Security Rules. Como não há servidor Node.js intermediário, todas as validações de autorização (quem pode deletar/ler pedidos) são feitas diretamente no Firestore Security Rules.
- **Hospedagem**: Firebase Hosting. Hospedará o bundle gerado pelo Vite com cache CDN otimizado globalmente.

## 2. Paradigmas de Arquitetura

### 2.1 Event-Driven no Frontend
O sistema antigo usava um `event_bus` local. No React, essa lógica é dissolvida de três formas:
1. **Mutations do React Query**: Ações como "Salvar Pedido" usam `useMutation`. No `onSuccess`, o React Query invalida a query de `estoque` (disparando refetch automático) e atualiza o UI instantaneamente.
2. **Cloud Functions (Opcional p/ Lógica Pesada)**: Para replicar o "Abatimento Atômico de Estoque" (Zero-Floor) de forma 100% segura sem depender do navegador do cliente, uma Firebase Cloud Function (Trigger: `onCreate` na coleção `pedidos`) pode realizar a dedução em lote no Firestore usando Transações atômicas (Batched Writes).

### 2.2 Offline First e Caching
O Firestore SDK nativo para Web e o React Query oferecem persistência offline e cache-first. O confeiteiro pode adicionar itens ao pedido com a rede oscilando; o Firebase garante a sincronização silenciosa no background.

## 3. Topologia de Interação

```mermaid
flowchart TD
    subgraph Client [Browser / Frontend]
        UI[React Components (Radix UI)]
        Forms[React Hook Form + Zod]
        Hooks[Custom Hooks]
        Cache[TanStack React Query]
    end

    subgraph Firebase [Backend Cloud]
        Auth[Firebase Auth]
        DB[(Cloud Firestore)]
        Rules[Security Rules]
        Functions[Cloud Functions]
    end

    UI --> Forms
    Forms --> Hooks
    Hooks <--> Cache
    Cache -- Ler/Escrever --> Auth
    Cache -- Ler/Escrever --> DB
    DB --> Rules
    DB -. Gatilhos de Banco .-> Functions
    Functions -- Atualiza Saldo --> DB
```
