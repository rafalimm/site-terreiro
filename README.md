# Site do Terreiro — Frontend + Backend

Este projeto agora tem duas partes:

```
/                → Frontend (React + Vite + Tailwind) — o site em si (público + painel admin)
/backend         → Backend (Node + Express + Prisma + PostgreSQL) — a API que guarda tudo de verdade
```

Antes, todos os dados (usuários, agenda, notícias, etc.) ficavam salvos só no `localStorage`
do navegador. Agora eles ficam num banco de dados PostgreSQL de verdade, acessado através de
uma API. Isso resolve dois problemas do modelo antigo:

1. **Dados compartilhados** — toda a equipe vê os mesmos dados, não um "mundo" por navegador.
2. **Pronto para produção** — dá para colocar em uma hospedagem de verdade, com domínio próprio,
   sem perder nada.

---

## 1. Como tudo se conecta

```
Navegador do visitante/admin
        │
        ▼
   Frontend (React)   ──── variável VITE_API_URL ────▶   Backend (Express)
   hospedado em ex:                                       hospedado em ex:
   Vercel/Netlify                                          Railway/Render
                                                                  │
                                                                  ▼
                                                          PostgreSQL (banco de dados)
```

O frontend nunca fala direto com o banco — ele sempre passa pela API. E a API só aceita
pedidos de origens (domínios) que você autorizar explicitamente (variável `FRONTEND_URL`).

Isso é o que te dá liberdade de escolher a hospedagem e o domínio **depois**, sem mexer no
código: tudo que muda entre "rodando no meu computador" e "no ar, no meu domínio" são
variáveis de ambiente.

---

## 2. Rodando localmente (para testar/desenvolver)

### 2.1. Banco de dados

A forma mais simples é usar o Docker (se não tiver, dá pra usar um Postgres gratuito na nuvem,
como o do próprio Railway ou o [Neon](https://neon.tech), e pular esta etapa):

```bash
docker run --name terreiro-db -e POSTGRES_PASSWORD=senha -e POSTGRES_DB=terreiro -p 5432:5432 -d postgres:16
```

### 2.2. Backend

```bash
cd backend
cp .env.example .env
# Edite o .env se necessário (a DATABASE_URL do exemplo já combina com o comando do Docker acima)

npm install
npm run prisma:migrate   # cria as tabelas no banco
npm run seed             # cria o Super Administrador inicial
npm run dev              # sobe a API em http://localhost:3333
```

Ao rodar o `seed`, o terminal mostra o e-mail e a senha do Super Administrador criado
(por padrão `admin@zedolaco.com.br` / `admin123` — **troque essa senha depois de logar**).

### 2.3. Frontend

Em outro terminal, na raiz do projeto:

```bash
cp .env.example .env      # já vem apontando para http://localhost:3333
npm install
npm run dev                # sobe o site em http://localhost:5173
```

Pronto — abra `http://localhost:5173/entrar` e faça login com o Super Administrador.

### 2.4. Trazendo os dados que já existiam

Se você já estava usando o site antigo (com dados salvos no `localStorage`), abra o site
**no mesmo navegador** em que ele já era usado, faça login como Super Administrador, vá em
**Admin > Configurações** e use a seção **"Migração de Dados"** — ela detecta os dados antigos
automaticamente e manda tudo para o banco novo com um clique.

---

## 3. Colocando em produção (hospedagem + domínio próprio)

Como tudo é configurado por variável de ambiente, você pode escolher qualquer combinação de
hospedagens. Abaixo está o caminho mais simples, mas o processo é o mesmo em qualquer provedor
— o que muda é só onde você clica.

### 3.1. Backend + banco de dados (ex: Railway ou Render)

Ambos oferecem Node.js + PostgreSQL prontos, com plano gratuito/baixo custo para começar.

1. Crie um projeto novo e conecte o repositório (ou suba a pasta `backend/`).
2. Adicione um banco PostgreSQL — a plataforma já gera a `DATABASE_URL` sozinha.
3. Configure as variáveis de ambiente do serviço:
   - `DATABASE_URL` → preenchida automaticamente pela plataforma
   - `JWT_SECRET` → gere um valor aleatório (`openssl rand -base64 48`)
   - `JWT_EXPIRES_IN` → `7d`
   - `FRONTEND_URL` → o domínio do site (ver passo 3.2) — pode editar depois
4. Comando de build: `npm install && npm run prisma:deploy && npm run build`
5. Comando de start: `npm start`
6. Depois do primeiro deploy, rode uma vez (via terminal da própria plataforma) `npm run seed`
   para criar o Super Administrador.
7. Anote a URL pública que a plataforma te dá (algo como `https://sua-api.up.railway.app`).

### 3.2. Frontend (ex: Vercel ou Netlify)

1. Crie um projeto novo apontando para a raiz do repositório (não a pasta `backend/`).
2. Configure a variável de ambiente:
   - `VITE_API_URL` → a URL da API que você anotou no passo anterior
3. Comando de build: `npm run build` — pasta de saída: `dist`
4. Depois do deploy, você recebe uma URL temporária (ex: `https://seu-site.vercel.app`).
5. Volte no backend e atualize `FRONTEND_URL` para essa URL (e depois para o domínio final,
   quando estiver apontado — pode colocar os dois separados por vírgula durante a transição).

### 3.3. Apontando o seu domínio já pago

Isso é feito inteiramente pelo DNS do seu domínio (Registro.br ou onde ele foi comprado) e é
independente de como o backend foi construído — funciona com qualquer hospedagem:

1. No painel do seu domínio, vá em "Gerenciar DNS" / "Zona DNS".
2. Para o **frontend** (o site que as pessoas visitam, ex: `www.seusite.com.br`):
   - Vercel/Netlify mostram, na tela de "Add Domain" do projeto, exatamente qual registro
     criar (normalmente um `CNAME` apontando para algo como `cname.vercel-dns.com`).
3. Para a **API**, se quiser um domínio próprio para ela também (ex: `api.seusite.com.br`):
   - Railway/Render também mostram um registro `CNAME` para adicionar.
   - Se preferir, pode simplesmente continuar usando a URL que a hospedagem já fornece —
     o domínio bonito é mais importante no site do que na API, que ninguém acessa diretamente.
4. Depois que o domínio propagar (pode levar de minutos a algumas horas):
   - Atualize `VITE_API_URL` no frontend, se a URL da API mudou.
   - Atualize `FRONTEND_URL` no backend para o domínio final.

Nenhum desses passos exige mudar uma linha de código — é só configuração, exatamente como
planejado desde o início.

---

## 4. Segurança — o que já está pronto

- Senhas nunca são salvas em texto puro (usa hash com `bcrypt`).
- Login gera um token (JWT) que expira sozinho.
- Cada rota da API confere a permissão de verdade no servidor — mesmo que alguém tente burlar
  a tela do navegador, o backend recusa a ação.
- A API só aceita pedidos vindos dos domínios que você autorizar (`FRONTEND_URL`).

**Antes de divulgar o site publicamente:**
- Troque a senha do Super Administrador criada pelo `seed`.
- Gere um `JWT_SECRET` novo e aleatório em produção (nunca reaproveite o de desenvolvimento).
- Nunca suba os arquivos `.env` (backend e frontend) para o Git — eles já estão no `.gitignore`.

---

## 5. Próximos passos possíveis (não feitos ainda)

- Hoje, imagens (galeria, notícias, hero) continuam sendo salvas como link/texto no banco.
  Para um site com muitas fotos, vale migrar para um serviço de armazenamento de arquivos
  (ex: Cloudflare R2, AWS S3) em vez de guardar tudo como texto.
- Recuperação de senha por e-mail (hoje não existe — se esquecer, é preciso redefinir direto
  no banco ou criar um novo Super Administrador via `seed`).
