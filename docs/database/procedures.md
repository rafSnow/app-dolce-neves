# Procedures (AS-IS)

O sistema "Doce Neves" utiliza o banco de dados **SQLite**, e, em sua arquitetura atual (AS-IS), **não existem Stored Procedures (Procedimentos Armazenados)** ou rotinas empacotadas no lado do servidor do banco.

## Por que não existem?
1. **Limitações do SQLite**: Embora bancos de dados relacional parrudas (como PostgreSQL ou Oracle) recomendem Procedures para concentrar as regras de negócio de maneira performática no próprio banco, o SQLite é embutido na aplicação de escopo local. O SQLite nativo não oferece suporte complexo a blocos `PL/pgSQL` ou procedimentos independentes como os encontrados no SQL Server.
2. **Abstração em Python**: Todos os fluxos processuais e cálculos complexos de transações (ex: Backfills, "Cálculo de Preço Dinâmico do Insumo", "Baixa de Estoque") foram absorvidos pelos Services do código fonte Python (`app/services/`). A arquitetura confia nas regras de negócio escritas em POO (Programação Orientada a Objetos).

## Alternativa Utilizada
Em cenários onde uma Procedure seria útil (exemplo: Iniciar Venda e abater insumos como uma transação inteiriça), o sistema delega isso para o módulo **`app.db.transaction.transacao()`**, que provê um Context Manager (comandos executados em blocos lógicos isolados por comandos `BEGIN TRANSACTION`, `COMMIT` ou rolando `ROLLBACK` via Python em caso de falha).
