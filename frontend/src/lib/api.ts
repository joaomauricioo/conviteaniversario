const ENDERECO_API = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

type ErroDaApi = {
  mensagem?: string;
};

export class ErroApi extends Error {
  status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}

export async function pedirApi<T>(
  caminho: string,
  opcoes?: RequestInit,
): Promise<T> {
  const resposta = await fetch(`${ENDERECO_API}${caminho}`, opcoes);
  const dados = (await resposta.json().catch(() => ({}))) as T & ErroDaApi;

  if (!resposta.ok) {
    throw new ErroApi(
      dados.mensagem ?? "Não foi possível comunicar com a API.",
      resposta.status,
    );
  }

  return dados;
}
