# CLAUDE.md

## Projeto
Este repositório é o site do Centro de Umbanda Zé do Laço.

## Objetivo
Manter o projeto funcional, seguro, organizado e pronto para deploy. Trabalhe sempre sobre o estado atual do GitHub e preserve funcionalidades existentes.

## Regra de colaboração ChatGPT + Claude
- O GitHub é a fonte central de verdade do código.
- Antes de alterar código, leia `PROJECT_STATUS.md` e investigue os arquivos relevantes.
- Nunca assuma que um arquivo está igual a uma versão antiga enviada por ZIP.
- Faça alterações pequenas e verificáveis.
- Depois de alterações relevantes, atualize `PROJECT_STATUS.md` com: data, tarefa, arquivos alterados, resultado dos testes/build e próximos passos.
- Não sobrescreva trabalho recente sem verificar `git log`/estado atual.
- Evite criar abstrações ou refatorações que não sejam necessárias para a tarefa.
- Nunca remova funcionalidades existentes apenas para fazer o build passar.
- Não coloque segredos, chaves de API, tokens ou credenciais no repositório.

## Fluxo de trabalho
1. Ler `PROJECT_STATUS.md`.
2. Inspecionar o código relacionado à tarefa.
3. Implementar a alteração.
4. Rodar `npm run build` sempre que possível.
5. Corrigir erros reais encontrados.
6. Atualizar `PROJECT_STATUS.md`.
7. Fazer commit descritivo.
8. Se a alteração for grande ou arriscada, usar uma branch e Pull Request.

## Stack atual
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Lucide React
- Supabase poderá ser integrado posteriormente para autenticação/banco/backend.

## Critérios de qualidade
- TypeScript sem erros.
- Build do Vite funcionando.
- Não introduzir imports/variáveis não utilizados.
- Responsividade desktop/mobile.
- Preservar acessibilidade e navegação.
- Preferir soluções simples e compatíveis com a arquitetura existente.
