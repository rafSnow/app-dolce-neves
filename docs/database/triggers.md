# Triggers e Gatilhos (AS-IS)

Triggers (Gatilhos) em banco de dados são códigos ativados automaticamente em resposta a um evento (INSERT, UPDATE ou DELETE) para proteger dados ou encadear lógicas.

No atual schema de banco de dados (`app/db/schema.py`) do sistema "Doce Neves", **NÃO há triggers sintáticas de banco de dados (`CREATE TRIGGER`)**. Todo o arcabouço de monitoramento de eventos não está amarrado dentro do SQLite, mas simulado com Arquitetura de Software orientada a eventos no Python.

## Os "Triggers Virtuais" da Aplicação
A aplicação utiliza um pattern de barramento pub/sub local (`app.core.event_bus`) que funciona como os Gatilhos de Banco, encadeando funções quando um banco é alterado pela UI. Tais gatilhos estão centralizados no arquivo **`app/erp_handlers.py`**.

O fluxo atua assim:
1. Um usuário clica em "Salvar Pedido" (UI).
2. O banco de dados recebe a instrução `INSERT INTO pedido ...` (Camada SQL).
3. O Service intercepta a query que deu certo e emite: `event_bus.emit('pedido.salvo')` (Camada Lógica).
4. O `erp_handlers.py` escuta o sinal e roda a sua série de lógicas pesadas (deduzir estoque, inserir parcela no fluxo financeiro, etc).

### Deleção em Cascata (O Único Gatilho Real de Banco)
Apesar da não existência de `CREATE TRIGGER`, existe **um comportamento de disparo nativo** em vigor: a restrição `ON DELETE CASCADE`.

Se algum usuário da aplicação invocar (via query direta) um hard-delete de um pai, o próprio SQLite se encarrega de deletar os filhos órfãos antes, nos seguintes cenários:
- Remoção de `pedido` ➞ Deleta em cascata as fileiras ligadas dele em `pedido_item`.
- Remoção de `pedido` ➞ Deleta em cascata lançamentos provisionados na aba `rendimento`.
- Remoção de `insumo` ➞ Deleta em cascata histórico estatístico do preço em `historico_preco_insumo`.
- Remoção de `produto` ➞ Quebra suas respectivas amarrações de ingredientes em `produto_insumo`.
