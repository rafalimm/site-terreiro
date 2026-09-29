# PROJECT_STATUS

Última atualização: 2026-09-26

## Repositório
- GitHub: rafalimm/site-terreiro
- Branch principal: main
- Stack: React + TypeScript + Vite + Tailwind CSS
- Repositório atualmente acessível pelo ChatGPT.

## Objetivo do projeto
Site completo e interativo do Centro de Umbanda Zé do Laço, incluindo área pública para consulentes e estrutura para futura administração, autenticação e dados persistentes.

## Estado atual conhecido
- O projeto está no GitHub.
- `package.json` possui script `npm run build` executando `tsc -b && vite build`.
- O componente `src/components/Footer.tsx` atualmente usa `siteConfig` obtido por `useApp()` para WhatsApp.
- Um erro anterior de TypeScript mencionava `siteConfig` declarado e não utilizado em Footer.tsx e WhatsAppButton.tsx. O Footer atual consultado já utiliza `siteConfig`; antes de corrigir esse erro em outros arquivos, sempre leia a versão atual do arquivo no GitHub.

## Regra de continuidade
ChatGPT e Claude devem tratar este arquivo como um resumo operacional compartilhado. Depois de cada tarefa significativa, atualizar o status com:
- O que foi feito
- Arquivos alterados
- Build/testes executados
- Erros restantes
- Próximo passo recomendado

## Última implementação — Mensalidades
- 2026-09-27: implementado sistema inicial de mensalidades para cargos Filho e superiores.
- Usuários com cargo Consulente não recebem acesso à mensalidade.
- Minha Conta agora mostra valor, vencimento, referência, status e histórico; também permite solicitar instruções de pagamento.
- Painel administrativo ganhou a seção Mensalidades para configurar valor/dia, ativar/desativar cobrança, acompanhar pagos/pendentes/atrasados e registrar pagamento manual.
- Backend recebeu modelos Prisma, migração PostgreSQL e API protegida por permissão.
- A estrutura foi preparada para futura integração com PIX/gateway; nenhum dado de pagamento foi inventado.
- Build/produção ainda precisam ser validados no ambiente de deploy após a publicação das alterações.

## Última implementação — Recebimento das mensalidades
- 2026-09-27: adicionada configuração administrativa de recebimento em Administração → Mensalidades.
- O administrador pode cadastrar forma de recebimento, nome do recebedor, cidade, chave PIX, tipo de chave, banco/titular, dados bancários e instruções.
- Os dados ficam persistidos no PostgreSQL em `payment_config` e só são expostos a usuários com acesso à mensalidade.
- Em Minha Conta, membros Filho ou superiores podem copiar a chave PIX e gerar um código PIX "copia e cola" com o valor exato da mensalidade.
- Não existe integração automática com banco/gateway nesta etapa: o pagamento ainda precisa ser conferido/confirmado pela administração.
- Criada migração `20260927170000_add_payment_config` e utilitário `src/utils/pix.ts` para geração do payload PIX com CRC.
- Build/produção ainda precisam ser validados no ambiente de deploy.

## Última implementação — Integração Asaas
- 2026-09-27: integrada a opção de Asaas ao sistema de mensalidades, usando cobrança PIX convencional (não Pix Automático recorrente).
- Administração → Mensalidades ganhou status da integração, teste de conexão, ativação/desativação e configuração do webhook.
- Minha Conta ganhou geração de PIX dinâmico do Asaas com QR Code e código copia e cola.
- O backend cria/atualiza o cliente no Asaas, cria a cobrança mensal e grava o ID da cobrança em MembershipPayment.transactionId.
- Webhook público /api/webhooks/asaas valida asaas-access-token, aplica idempotência e atualiza automaticamente a mensalidade em PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_DELETED e PAYMENT_REFUNDED.
- API Key e token do webhook ficam somente nas variáveis secretas do Railway; não são armazenados no GitHub ou frontend.
- Adicionados campos de CPF/CNPJ no usuário e ID do cliente Asaas na mensalidade.
- Variáveis necessárias no Railway: ASAAS_API_KEY, ASAAS_ENVIRONMENT (sandbox ou production), ASAAS_WEBHOOK_TOKEN (32+ caracteres), BACKEND_PUBLIC_URL e ASAAS_WEBHOOK_EMAIL.
- A migração 20260927190000_add_asaas_integration deve ser aplicada pelo prisma migrate deploy no start do backend.
- Build final ainda precisa ser validado no ambiente de deploy.

## Nova implementação — Lista de Compras do Terreiro
- 2026-09-29: implementado o módulo administrativo de compras.
- Criado o cargo `compras`, com permissão exclusiva para administrar a lista; `admin` e `super_admin` também possuem acesso.
- A lista é persistida no PostgreSQL em `purchase_items`.
- Cada item possui nome, quantidade, unidade, categoria, prioridade, observação, responsável pela inclusão e dados de confirmação da compra.
- O responsável pode adicionar, editar, excluir e marcar/desmarcar um item como comprado.
- A confirmação registra quem comprou e a data/hora; as ações também passam pelo log de atividades.
- Painel inclui busca, filtro de comprados e indicadores de pendentes, comprados, total e urgentes.
- O módulo não altera o fluxo de mensalidades, giras ou confirmações de presença.
- Build final ainda precisa ser validado no ambiente de deploy.

## Próximas prioridades
1. Garantir build limpo.
2. Corrigir erros TypeScript restantes sem remover funcionalidades.
3. Revisar estrutura de administração.
4. Preparar integração segura com Supabase.
5. Configurar deploy pela Vercel.
6. Manter documentação mínima para continuidade entre ChatGPT e Claude.

## Histórico de tarefas
- 2026-09-26: corrigido o deslocamento de datas da Agenda/Giras causado por `new Date('YYYY-MM-DD')` interpretar a data como UTC. Criado `src/utils/date.ts` para tratar datas de gira como datas civis locais; atualizado calendário público e painel administrativo. O build local não pôde ser executado neste ambiente porque o acesso de rede ao GitHub está indisponível; a validação final deve ser feita com `npm run build` no ambiente do projeto.
- 2026-09-26: configurado protocolo de colaboração entre ChatGPT e Claude através do GitHub; adicionados CLAUDE.md e PROJECT_STATUS.md.
