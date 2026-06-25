# Débitos Técnicos (AS-IS)

Este documento elenca os débitos técnicos e pontos de melhoria estrutural identificados na arquitetura atual do sistema "Doce Neves".

## 1. Banco de Dados e Migrações
- **Migrações Hardcoded no Schema**: Atualmente, o arquivo `app/db/schema.py` concentra instruções de `CREATE TABLE IF NOT EXISTS` seguidas de vários `ALTER TABLE` e scripts pesados de `Backfill` de dados e renomeação de colunas. Isso faz com que toda vez que a aplicação inicie, o banco execute verificações condicionais de metadados (`PRAGMA table_info`), aumentando o tempo de boot e o risco de colisões. 
  - **Sugerido**: Adotar uma ferramenta formal de migração de schema (ex: **Alembic** ou um runner de scripts SQL versionados).

## 2. Padrão de Arquitetura e Injeção de Dependências
- **Acoplamento no Service Layer**: A maioria dos serviços (ex: `DashboardService`, `ProdutoService`) importa e instancia a conexão do banco de dados (ou usa `get_connection()`) diretamente dentro de seus métodos. Isso prejudica fortemente a testabilidade (exigindo `monkeypatch` intrusivos em bibliotecas de testes).
  - **Sugerido**: Passar a conexão via Injeção de Dependência (`__init__(self, db_conn)`).

## 3. Débito de Refatoração de UI (Stubs)
- Arquivos como `app/views/produtos_view.py` e `app/views/insumos_view.py` são mantidos apenas como **Stubs** para garantir retrocompatibilidade após a fragmentação de views monolíticas em pacotes (`app/views/produtos/main_view.py`).
  - **Sugerido**: Limpar essas cascas legadas e refatorar os imports nos pontos de origem assim que a estabilidade do módulo fragmentado for assegurada a longo prazo.

## 4. Concorrência e Escalabilidade
- A aplicação utiliza **SQLite** no modelo Single-User. Se a confeitaria crescer e desejar instalar o sistema em mais de um computador compartilhando o mesmo arquivo de rede (`.db` num drive Mapeado), o sistema inevitavelmente sofrerá corrupção ou travamentos por "Database Is Locked".
  - **Sugerido**: Migrar o back-end para um banco transacional como PostgreSQL rodando em um mini-servidor, ou reescrever a arquitetura para um sistema Web se o negócio demandar operação em múltiplos caixas.

## 5. Performance
- **Complexidade Ciclomática (N+1)**: Alguns relatórios ou recálculos em cadeia ainda podem iterar via laços `for` realizando comandos `SELECT` unitários ao invés de usar cláusulas agregadas (`IN`, `JOIN`). Embora mitigações recentes no `InsumoService` tenham sido feitas, uma revisão de queries em outras entidades (como no Dashboard) é recomendada.
- **Tkinter MainThread**: Cálculos grandes e exportação de planilhas pesadas rodam na thread principal da interface. Se o banco de dados inchar, a UI começará a "congelar" brevemente (App Not Responding) durante cliques de relatórios.
  - **Sugerido**: Deslocar operações de I/O pesado ou recálculos para Threads em background ou processos assíncronos (`asyncio`), embora isso exija contornar as limitações do Tkinter com variáveis StringVar.
