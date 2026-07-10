# Convite de Aniversário

Projeto de convite online com confirmação de presença, lista de presentes e relatório administrativo.

## Tecnologias

- Frontend: React, TypeScript e Vite
- Backend: Node.js, Express, Prisma e PostgreSQL

## Como Rodar

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:migrate
npm run dev
```

No arquivo `backend/.env`, configure:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/convite
PORT=3000
FRONTEND_URL=http://localhost:5173
```

A API roda em:

```text
http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

O site roda em:

```text
http://localhost:5173
```

## Páginas

- `http://localhost:5173/` - convite e confirmação de presença
- `http://localhost:5173/presencaconfirmada` - presença confirmada
- `http://localhost:5173/presencanaoconfirmada` - presença não confirmada
- `http://localhost:5173/presentes` - lista pública de presentes
- `http://localhost:5173/cadastropresente` - cadastro administrativo de presentes
- `http://localhost:5173/relatorio` - relatório administrativo de confirmações


## Scripts Úteis

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

## Funcionalidades

- Confirmação de presença com nome e celular
- Atualização de resposta pelo mesmo celular
- Lista pública de sugestões de presentes
- Cadastro, edição e exclusão de presentes
- Relatório com totais e exportação em Excel/PDF
