import { ErroApi, pedirApi } from "./api";

const CHAVE_TOKEN_ADMINISTRADOR = "convite-token-administrador";

function buscarTokenAdministrador() {
  return sessionStorage.getItem(CHAVE_TOKEN_ADMINISTRADOR) ?? "";
}

function salvarTokenAdministrador(token: string) {
  sessionStorage.setItem(CHAVE_TOKEN_ADMINISTRADOR, token);
}

function limparTokenAdministrador() {
  sessionStorage.removeItem(CHAVE_TOKEN_ADMINISTRADOR);
}

function pedirTokenAdministrador() {
  const tokenAtual = buscarTokenAdministrador();
  if (tokenAtual) return tokenAtual;

  const tokenDigitado = window.prompt("Digite o token de administrador:");
  const token = tokenDigitado?.trim() ?? "";

  if (token) salvarTokenAdministrador(token);
  return token;
}

function juntarCabecalhos(
  cabecalhosOriginais: HeadersInit | undefined,
  token: string,
) {
  const cabecalhos = new Headers(cabecalhosOriginais);
  cabecalhos.set("x-admin-token", token);
  return cabecalhos;
}

export async function pedirApiAdministrativa<T>(
  caminho: string,
  opcoes?: RequestInit,
): Promise<T> {
  const token = pedirTokenAdministrador();

  if (!token) {
    throw new Error("Token de administrador não informado.");
  }

  try {
    return await pedirApi<T>(caminho, {
      ...opcoes,
      headers: juntarCabecalhos(opcoes?.headers, token),
    });
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 401) {
      limparTokenAdministrador();
    }

    throw erro;
  }
}
