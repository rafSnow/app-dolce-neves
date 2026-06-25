# Análise de Riscos Técnicos e Mitigações

Migrar de um banco local offline para uma solução web cloud-native introduz novos desafios inerentes à distribuição e concorrência de dados. Baseado no levantamento de débitos técnicos (AS-IS) e na nova arquitetura (TO-BE), mapeamos os seguintes riscos.

## Risco 1: Concorrência e Baixa de Estoque (Race Condition)
**Contexto**: Diferente do ambiente Single-User anterior onde o SQLite ficava bloqueado para um só terminal, num ambiente web Multi-User, dois caixas podem vender o último "Bolo de Cenoura" no exato mesmo milissegundo. Se o frontend baixar a farinha do Firebase baseando-se apenas na quantidade exibida localmente no momento do clique, o saldo de farinha pode ficar negativo silenciosamente e quebrar a RN-PE-03.
**Probabilidade**: Média-Alta (Picos de Venda em feriados).
**Impacto**: Crítico (Furo financeiro e no inventário).
**Mitigação**: 
- Não confiar no frontend para abatimento matemático.
- Usar `Firebase Cloud Functions` com `Transaction` (Batched Writes) engatilhadas no `onCreate` do Pedido, assegurando atomicidade.
- Como alternativa direta pelo React, envelopar o update em `runTransaction` no client-side para garantir que o snapshot do insumo é válido antes de deduzir.

## Risco 2: Performance no Dashboard e Custo de Leituras (N+1 Queries)
**Contexto**: O Dashboard anterior rodava `SELECT SUM` com joins massivos iterando localmente. No Firebase (NoSQL), agregar centenas de pedidos, seus rendimentos fracionados e cruzar com despesas para tirar a margem real de cada mês pode consumir milhares de "Document Reads", o que escalaria o preço da fatura do Google Cloud e deixaria a tela lenta.
**Probabilidade**: Alta (Crescimento orgânico de histórico).
**Impacto**: Médio (Custo elevado e UI bloqueada).
**Mitigação**: 
- Adotar padrão de design de **Contadores Agregadores (Counters)**.
- Criar documentos de resumo (ex: `relatorios/2026-06`) onde Firebase Functions incrementam contadores (`FieldValue.increment(valor)`) sempre que uma Venda ou Despesa ocorre. O dashboard lê **1 único documento** e mostra todos os KPIs instantaneamente em vez de somar 5.000 pedidos on-the-fly.

## Risco 3: Dependência de Rede e Instabilidade (Offline Fallback)
**Contexto**: O sistema antigo operava offline na loja física, indiferente a quedas de internet. O novo sistema depende da nuvem. Se a rede oscilar durante o balcão, a confeiteira não pode parar de registrar.
**Probabilidade**: Média (Instabilidade provedores locais).
**Impacto**: Alto (Travamento de atendimento no balcão).
**Mitigação**: 
- Validar configuração e ativar explicitamente a Persistência de Dados Offline SDK do Firestore para Web. O Firebase irá enfileirar os relatórios localmente no IndexedDB e sincronizá-los em background, permitindo cadastros fluidos (Optimistic Updates) através do React Query, mascarando a latência de rede.

## Risco 4: Estrutura Complexa de Ficha Técnica Desnormalizada
**Contexto**: No Firestore, guardamos um Array com os insumos (e seus nomes) *dentro* do documento do Produto para otimizar leituras. O risco surge se o usuário alterar o **nome** de um "Açúcar X" para "Açúcar Y" lá na aba Insumos. As receitas que guardavam o texto "Açúcar X" no array ficarão com o nome desatualizado.
**Probabilidade**: Baixa.
**Impacto**: Baixo (Estético na hora de exibir a receita).
**Mitigação**:
- Assumir a desatualização de nomes como um trade-off aceitável pela economia de reads em arquiteturas NoSQL, desde que IDs permaneçam íntegros; ou:
- Criar uma Cloud Function simples que ouve eventos `onUpdate` em Insumos e faz varredura e update retroativo do texto nos produtos vinculados.
