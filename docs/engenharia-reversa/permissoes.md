# Permissões e Segurança (AS-IS)

## Arquitetura de Acesso
O sistema atual "Doce Neves" é uma aplicação de desktop **Single-User** (monousuário). 
Por design, ele roda diretamente na máquina do usuário e acessa um arquivo de banco de dados SQLite local.

- **Autenticação**: Inexistente. Não há tela de login nem validação de senha.
- **Autorização (RBAC)**: Inexistente. Não existem perfis de acesso (Admin, Vendedor, Visualizador). 
- **Concorrência**: O banco de dados local não suporta acesso simultâneo na rede de forma nativa e robusta por vários usuários sem corrupção potencial ou bloqueios (Database Is Locked).

## Auditoria
Embora não haja usuários no sistema, a aplicação mantém uma tabela `auditoria` no banco de dados para rastrear ações críticas e alterações irreversíveis. Contudo, todos os registros não possuem vínculo com um "Usuário" operante, uma vez que a aplicação confia na máquina local.

## Restrições
- Qualquer pessoa com acesso físico ao computador possui plenos privilégios (Administrador) dentro do ERP para apagar clientes, alterar histórico financeiro ou remover pedidos.
