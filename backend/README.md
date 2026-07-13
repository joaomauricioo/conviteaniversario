# Backend do Convite

API Express com TypeScript, Prisma e PostgreSQL para registrar respostas de
presenca, gerenciar presentes e proteger rotas administrativas.

## Configuracao

1. Crie um banco PostgreSQL vazio.
2. Copie `.env.example` para `.env`.
3. Preencha as variaveis no `.env` sem commitar esse arquivo.
4. Instale as dependencias, execute as migrations e inicie a API:

```bash
npm install
npm run prisma:migrate
npm run dev
```

## Variaveis

```env
DATABASE_URL=
PORT=
FRONTEND_URL=
ADMIN_SESSION_SECRET=
ADMIN_SESSION_TTL_HOURS=
LOGIN_RATE_LIMIT_WINDOW_MS=
LOGIN_RATE_LIMIT_MAX=
```

`ADMIN_SESSION_SECRET` deve ter pelo menos 32 caracteres.

## Endpoints

- `POST /confirmar-presenca`: publico; recebe `nome`, `celular` e `presenca`.
- `GET /presentes`: publico; lista presentes.
- `POST /admin/login`: autentica o administrador.
- `GET /admin/sessao`: verifica a sessao administrativa.
- `POST /admin/logout`: encerra a sessao administrativa.
- `GET /relatorio`: administrativo; retorna totais e convidados.
- `POST /presentes`: administrativo; cadastra presente.
- `PUT /presentes/:id`: administrativo; atualiza presente.
- `DELETE /presentes/:id`: administrativo; remove presente.

## Administrador

Gere o hash bcrypt da senha:

```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash(process.argv[1], 12).then(console.log)" "SUA_SENHA_FORTE"
```

Insira manualmente no banco, preenchendo os valores reais no seu cliente SQL:

```sql
INSERT INTO administradores ("id", "usuario", "email", "senhaHash", "updatedAt")
VALUES (gen_random_uuid(), 'USUARIO_ADMIN', 'EMAIL_ADMIN', 'HASH_BCRYPT', NOW());
```

Nao salve a senha em texto puro.
