# Convite de Aniversário

Aplicação web para convite com confirmação de presença e painel administrativo.

## Rotas

- `/` - confirmação de presença
- `/login` - login administrativo
- `/admin` - painel administrativo

## Instalação

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:migrate

cd ..\frontend
npm install
copy .env.example .env
```

Configure as variáveis de ambiente antes de subir em produção.

## Execução

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Build

```bash
cd backend
npm run build

cd ..\frontend
npm run build
```

## Observações

- O frontend usa `VITE_API_URL` apenas quando a API não está no mesmo domínio.
- O backend exige `DATABASE_URL`, `ADMIN_SESSION_SECRET` e `FRONTEND_URL` configurados.
- As confirmações e o painel dependem das migrations do Prisma aplicadas no banco.
