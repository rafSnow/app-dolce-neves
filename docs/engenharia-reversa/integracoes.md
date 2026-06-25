# Integrações e Arquitetura (AS-IS)

O sistema "Doce Neves" é uma aplicação monolítica de desktop offline em Python (Tkinter + CustomTkinter), sem dependências externas de APIs ou serviços web para o seu funcionamento básico. A persistência é feita inteiramente em um banco de dados local SQLite.

## Integrações Internas (Event Bus)
Embora não haja integrações externas HTTP/REST, o sistema adota uma arquitetura orientada a eventos para o desacoplamento de seus módulos (módulo de ERP). As integrações ocorrem em memória através do `event_bus.py`, garantindo que ações em uma tela atualizem o estado de outras partes do sistema.

### Eventos Mapeados no `erp_handlers.py`:
- `insumo.salvo`: Dispara o recálculo automático das fichas técnicas de produtos (custeio) e atualiza views de tabelas.
- `pedido.salvo`: 
  1. Cria/Atualiza um registro correspondente na tabela de **Rendimento** (Sincronização Financeira ERP).
  2. Executa a **baixa automática de estoque** de todos os insumos vinculados aos produtos vendidos no pedido (usando controle de concorrência com a flag `estoque_baixado`).
  3. Atualiza os "badges" de alerta da interface gráfica.
- `pedido.excluido`: Remove o respectivo lançamento financeiro (Rendimento) gerado por este pedido.
- `insumo.comprado`: Dispara a criação automática de uma **Despesa** na categoria "Insumos" no módulo financeiro e emite o evento `estoque.atualizado`.
- `estoque.atualizado`: Capturado pela `MainWindow` para reavaliar os limites de estoque e atualizar os indicadores visuais (badge lateral).

## Exportações / Integrações de Arquivo
- **Excel/CSV**: Os grids do sistema (ex: Produtos, Insumos) possuem funcionalidade embutida nas views para exportar os dados exibidos para planilhas `.xlsx` usando as bibliotecas `pandas` e `openpyxl`. Nenhuma API de terceiros é utilizada para essa geração.

## Resumo
- **Status de APIs Externas**: Nenhuma configurada.
- **Banco de Dados**: Local (SQLite). Arquivo `database.db`.
- **Comunicação entre Módulos**: Via PUB/SUB (`event_bus`).
