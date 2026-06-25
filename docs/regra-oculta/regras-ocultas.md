# Regras de Negócio Ocultas (AS-IS)

Durante a auditoria da base de código da aplicação "Doce Neves", foram identificadas diversas lógicas implícitas incorporadas aos Services e Handlers de ERP que afetam a integridade dos dados, cálculos de precificação e o comportamento silencioso da interface. 

Abaixo estão listadas as regras classificadas de acordo com seu nível de impacto.

---

## 🔴 Críticas
*Acesso ao núcleo financeiro, consistência de estoque ou algoritmos geradores de custo.*

### 1. Atualização em Cadeia de Precificação Automática
- **Arquivo**: `app/services/produto_service.py`
- **Método**: `recalcular_por_insumo(insumo_id)`
- **Regra Encontrada**: Quando um ingrediente sofre alteração no preço de compra, o sistema dispara um recalculo global. Todos os produtos (fichas técnicas) que contêm aquele ingrediente têm o `custo_unitario` e o `preco_venda_unitario` alterados magicamente no banco de dados sem aviso explícito ou necessidade do usuário abrir a receita.
- **Impacto**: Mantém a margem de lucro perfeita e atualizada, mas pode causar surpresa em cardápios impressos se a confeiteira não for notificada do novo preço sugerido.

### 2. Piso Zero (Zero-Floor) na Baixa de Estoque
- **Arquivo**: `app/erp_handlers.py`
- **Método**: `_on_pedido_salvo`
- **Regra Encontrada**: O código contém um limitador matemático para baixas de estoque: `max(0.0, insumo.quantidade_disponivel - consumo)`. Isso significa que o saldo no banco nunca entra no negativo. 
- **Impacto**: Caso se venda mais bolos do que a farinha existente no sistema (falha de inventário), a farinha simplesmente irá zerar (0.0). Isso "mascara" a falta real do insumo nos relatórios puramente quantitativos, embora grave o evento na tabela de auditoria.

### 3. Custeio da Última Compra (LIFO cego)
- **Arquivo**: `app/services/insumo_service.py`
- **Método**: `registrar_compra`
- **Regra Encontrada**: Lançar uma compra substitui inteiramente o campo base `preco_compra` pelo quociente da nova compra (`valor_total / qtd_compra`). O sistema **não** faz Custo Médio Ponderado. 
- **Impacto**: Produtos no estoque remanescente que foram pagos mais caros ou mais baratos adotarão imediatamente a precificação do novo lote.

---

## 🟡 Importantes
*Gatilhos silenciosos (side-effects), UX automations e fallbacks.*

### 4. Criação Silenciosa (Auto-Cadastro) de Clientes
- **Arquivo**: `app/services/pedido_service.py`
- **Método**: `salvar`
- **Regra Encontrada**: Se a confeiteira inserir o nome de um Cliente na tela do Pedido que não conste do banco de dados, o sistema delega para o `ClienteService.obter_ou_criar_por_nome` e cria a ficha "fantasma" automaticamente para manter integridade.
- **Impacto**: UX fluido (reduz cliques), mas pode inchar o banco de dados se houver erros de digitação recorrentes (ex: "Maria", "Mariia", "Marya").

### 5. Auto-Sincronização no Dashboard de Despesas
- **Arquivo**: `app/erp_handlers.py`
- **Método**: `_on_insumo_comprado`
- **Regra Encontrada**: Ações de abastecimento emitem o evento pub/sub de compra, gerando um registro invisível na tabela genérica de `despesa`.
- **Impacto**: Mantém o Saldo do caixa correto no Dashboard central, aliviando a operadora de duplicar o trabalho de lançar a saída do dinheiro no Financeiro.

### 6. Custo Base Ignorado em Produtos Excluídos (Left Join Trap)
- **Arquivo**: `app/services/dashboard_service.py`
- **Método**: `get_resumo`
- **Regra Encontrada**: No Dashboard, ao somar o lucro de pedidos passados, o algoritmo faz um `LEFT JOIN` com `produto`. Se um produto foi excluído da aplicação, ele cai no tratador `float(item["custo_unitario"] or 0.0)`.
- **Impacto**: Pedidos antigos de produtos agora deletados terão Custo Unitário avaliado como zero; logo, **100%** do valor da venda deles passará a ser exibido erroneamente como Lucro Líquido no resumo global do mês.

### 7. Proteção contra Preço Zerado (Fallback de Snapshot)
- **Arquivo**: `app/services/pedido_service.py`
- **Método**: `salvar`
- **Regra Encontrada**: Se um Pedido for enviado com item tendo Snapshot de `preco_unitario <= 0`, o sistema força a captura do `preco_venda_unitario` cadastrado no produto naquele milissegundo.
- **Impacto**: Evita fraude na interface ou bugs transitórios de lançarem itens a R$ 0,00 no faturamento.

---

## 🟢 Opcionais
*Regras de métricas exclusivas, conveniência do nicho ou peculiaridades da UI.*

### 8. Sobrevivência à Divisão por Zero
- **Arquivo**: `app/services/produto_service.py`
- **Método**: `_calcular_valores`
- **Regra Encontrada**: Caso a confeiteira esqueça de informar o `rendimento_receita` (ou defina como 0), o Custo Unitário não acusa Erro (Crash de div/0), mas desativa o rateio forçando `custo_unitario = 0.0`.
- **Impacto**: Manter o programa vivo sob input falho.

### 9. Calculadora de Gás Variável
- **Arquivo**: `app/views/insumos/dialogs.py`
- **Método**: `GasCalculatorDialog._calcular`
- **Regra Encontrada**: O cálculo de cozimento assume empiricamente a matriz de `3.75g/min` para fogo Médio e `4.17g/min` para fogo Alto baseada nas constantes embutidas, multiplicadas pelo valor do gás P13 global no `ConfiguracaoService`.
- **Impacto**: Fornece um repasse exato de custos ocultos (gás) à ficha técnica dos bolos para assecurar margem bruta positiva.

### 10. Paginação Oculta em Filtros Sem Data
- **Arquivo**: `app/services/dashboard_service.py`
- **Método**: `get_faturamento_vs_despesas_mensal`
- **Regra Encontrada**: Na ausência do input de intervalo de datas nos relatórios financeiros em tela, a regra oculta estabelece que serão puxados os dados apenas dos **últimos 6 meses contados para trás a partir do dia atual**.
- **Impacto**: Previne travamento ao longo dos anos mantendo uma janela deslizante (sliding window) leve pro gráfico.
