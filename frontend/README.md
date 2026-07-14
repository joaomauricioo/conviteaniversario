# Frontend do Convite

Aplicacao React + TypeScript + Vite para o convite de aniversario.

## Comandos

```bash
npm install
npm run dev
npm run build
```

## Paginas

- `/` - pagina inicial do convite, com o formulario para confirmar presenca.
- `/presencaconfirmada` - pagina exibida depois que a presenca e confirmada.
- `/presencanaoconfirmada` - pagina exibida para quem respondeu que nao podera ir.
- `/presentes` - pagina publica com sugestoes de presentes.
- `/cadastropresente` - pagina administrativa para cadastrar e editar presentes.
- `/relatorio` - pagina de relatorio com as respostas recebidas.

## Fluxo

Ao enviar o formulario da pagina inicial, a resposta e salva no navegador.
Respostas `sim` levam para `/presencaconfirmada`; respostas `nao` levam para
`/presencanaoconfirmada`. Depois de responder, a pagina inicial mostra a tela
correspondente e nao exibe o formulario novamente.
