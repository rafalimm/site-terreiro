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

## Próximas prioridades
1. Garantir build limpo.
2. Corrigir erros TypeScript restantes sem remover funcionalidades.
3. Revisar estrutura de administração.
4. Preparar integração segura com Supabase.
5. Configurar deploy pela Vercel.
6. Manter documentação mínima para continuidade entre ChatGPT e Claude.

## Histórico de tarefas
- 2026-09-26: configurado protocolo de colaboração entre ChatGPT e Claude através do GitHub; adicionados CLAUDE.md e PROJECT_STATUS.md.
