# Convite de Aniversario

Projeto de convite online com confirmacao de presenca, lista publica de
presentes e area administrativa protegida.

## Tecnologias

- Frontend: React, TypeScript e Vite
- Backend: Node.js, Express, Prisma e PostgreSQL

## Como Rodar

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:migrate
npm run dev
```

Preencha `backend/.env` com os valores reais apenas no seu ambiente local ou no
provedor de deploy.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Preencha `frontend/.env` com a URL da API quando ela nao estiver no mesmo dominio.

## Paginas

- `/` - convite e confirmacao de presenca
- `/presencaconfirmada` - presenca confirmada
- `/presencanaoconfirmada` - presenca nao confirmada
- `/presentes` - lista publica de presentes
- `/login` - login administrativo
- `/cadastropresente` - cadastro administrativo de presentes
- `/relatorio` - relatorio administrativo de confirmacoes

## Segurança

- Nao commite arquivos `.env`.
- Senhas de administradores devem ser armazenadas somente com hash bcrypt.
- Rotas administrativas sao protegidas no backend por sessao httpOnly e CSRF.
- Configure `FRONTEND_URL` apenas com os dominios autorizados.
- Configure `ADMIN_SESSION_SECRET` com pelo menos 32 caracteres aleatorios.
- Configure os limites `LOGIN_RATE_LIMIT_*`, `PUBLIC_RATE_LIMIT_*` e
  `ADMIN_RATE_LIMIT_*` conforme o trafego esperado.
- URLs de fotos de presentes devem usar HTTPS.
- Aplique as migrations antes do deploy para manter constraints e indices do banco.

## Scripts Uteis

Frontend:

```bash
npm run dev
npm run build
npm run lint
```

Backend:

```bash
npm run dev
npm run build
npm run prisma:migrate
npm run prisma:studio
```
