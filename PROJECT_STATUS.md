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
