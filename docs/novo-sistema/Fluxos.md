# Fluxos (Novo Sistema Web)

Abaixo estão detalhados os fluxos de trabalho (Workflows) sob o novo paradigma React e Firebase.

## 1. Fluxo de Reatividade do Catálogo (O Efeito Dominó do Insumo)
No Firebase, atualizar relacionamentos não é gratuito (NoSQL vs SQL). O fluxo desenhado visa lidar com desnormalização:
1. **Trigger**: O preço do ingrediente "Açúcar" sobe e o usuário salva a alteração (`insumos/ID`).
2. **Web Client (Frontend)**: O React Query envia a mutação para a coleção `insumos`.
3. **Cloud Function (`onUpdate`)**: Uma função serveless capta a mudança. Ela procura em todas as fichas técnicas (`produtos/{id}/insumos`) onde o ingrediente "Açúcar" aparece.
4. **Propagação**: A função recalcula o Custo Proporcional de cada receita e realiza um *Batch Update* em todas as Fichas Técnicas impactadas, atualizando os campos `custoUnitario` e `precoVendaUnitario`.
5. **Reatividade UI**: Como o Frontend possui listeners (`onSnapshot`) atrelados aos Produtos (via Query subscription), as telas abertas nos navegadores atualizam os preços dos bolos automaticamente sem *refresh* de página.

## 2. Fluxo de Baixa de Estoque Seguro (Transações)
1. O usuário submete um Pedido preenchido (Array de produtos + quantidades).
2. Em vez do browser subtrair e salvar o saldo de estoque cegamente (o que gera "Race Conditions" se dois dispositivos venderem ao mesmo tempo), a Web App invoca o Firestore através de uma **Transação**.
3. **Passos Atômicos**:
   - O Firestore bloqueia os documentos de Insumo (Read).
   - O Frontend deduz as frações das Receitas. Se houver divergência (`max(0.0)` block rule), o valor é retificado.
   - O Firestore salva (Write) os novos saldos do Insumo e adiciona o documento do Pedido no mesmo lote.
4. **Feedback UI**: Em caso de sucesso, biblioteca Sonner joga um `Toast` verde na tela. A função de "Confetti" (Canvas Confetti) anima a tela para reforçar a psicologia de "Venda Realizada".

## 3. Fluxo de Autenticação e Guards
1. Aplicação é envelopada em um `AuthRoute` (HOC do React Router).
2. O usuário não logado tenta acessar a `/pedidos`.
3. O `AuthRoute` suspende o acesso e roteia para `/login`.
4. Usuário faz login com o Firebase Auth (`signInWithEmailAndPassword`).
5. O `UserContext` detecta a mudança de estado via `onAuthStateChanged`.
6. Permissão concedida; O Firebase Security Rules emite os pacotes que outrora estavam com `permission_denied`.
