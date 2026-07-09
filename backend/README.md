# Backend do Convite

API Express com TypeScript, Prisma e PostgreSQL para registrar respostas de
presenca do convite.

## Configuracao

1. Crie um banco PostgreSQL vazio.
2. Copie `.env.example` para `.env`.
3. Preencha `DATABASE_URL`, por exemplo:

   ```env
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/convite
   ```

4. Instale as dependencias, execute as migrations e inicie a API:

   ```bash
   npm install
   npx prisma migrate dev
   npm run dev
   ```

A API ficara disponivel em `http://localhost:3000`.

## Endpoints

- `POST /confirmar-presenca`: recebe `nome`, `celular` e `presenca` booleano.
- `GET /relatorio`: retorna totais e lista com `nome`, `celular`, `presenca`, `createdAt` e `updatedAt`.
- `GET /presentes`: lista presentes.
- `POST /presentes`: cadastra presente.
- `PUT /presentes/:id`: atualiza presente.
- `DELETE /presentes/:id`: remove presente.

## Teste Manual

1. Rode `npx prisma migrate dev` para aplicar a migration do campo `celular`.
2. Envie uma confirmacao com celular no formato `(27) 99999-9999`.
3. Envie novamente usando o mesmo celular com outro nome ou outra presenca; a API deve atualizar o mesmo registro.
4. A resposta de atualizacao deve retornar `Sua confirmacao de presenca foi atualizada com sucesso.`
5. Acesse `/relatorio` no frontend e confira nome, celular, presenca mais recente e data de atualizacao.
