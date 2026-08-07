const ENDERECO_API_CONFIGURADO = import.meta.env.VITE_API_URL?.trim();
const ENDERECO_API = (ENDERECO_API_CONFIGURADO || "/api").replace(/\/$/, "");

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
  let resposta: Response;

  try {
    resposta = await fetch(`${ENDERECO_API}${caminho}`, {
      credentials: "include",
      ...opcoes,
    });
  } catch {
    throw new ErroApi(
      "Não foi possível comunicar com a API. Verifique se o backend está em execução.",
      0,
    );
  }

  const conteudo = await resposta.text();
  let dados = {} as T & ErroDaApi;

  if (conteudo.trim()) {
    try {
      dados = JSON.parse(conteudo) as T & ErroDaApi;
    } catch {
      dados = {} as T & ErroDaApi;
    }
  }

  if (!resposta.ok) {
    throw new ErroApi(
      dados.mensagem ??
        `Não foi possível comunicar com a API. (status ${resposta.status})`,
      resposta.status,
    );
  }

  return dados;
}
