import { ErroApi, pedirApi } from "./api";

type AdminAutenticado = {
  id: string;
  usuario: string | null;
  email: string | null;
};

type RespostaSessaoAdmin = {
  admin: AdminAutenticado;
  csrfToken: string;
};

const CHAVE_CSRF_ADMIN = "convite-csrf-token-admin";

function lerTokenCsrfArmazenado() {
  if (typeof window === "undefined") return null;

  return window.sessionStorage.getItem(CHAVE_CSRF_ADMIN);
}

function salvarTokenCsrfArmazenado(token: string | null) {
  if (typeof window === "undefined") return;

  if (token) {
    window.sessionStorage.setItem(CHAVE_CSRF_ADMIN, token);
    return;
  }

  window.sessionStorage.removeItem(CHAVE_CSRF_ADMIN);
}

let csrfTokenAdmin: string | null = lerTokenCsrfArmazenado();

function salvarTokenCsrf(resposta: RespostaSessaoAdmin) {
  csrfTokenAdmin = resposta.csrfToken;
  salvarTokenCsrfArmazenado(resposta.csrfToken);
  return resposta;
}

function destinoLogin() {
  const caminhoAtual = `${window.location.pathname}${window.location.search}`;
  return `/login?redirect=${encodeURIComponent(caminhoAtual)}`;
}

export function redirecionarParaLogin() {
  window.location.replace(destinoLogin());
}

export async function entrarAdmin(usuarioOuEmail: string, senha: string) {
  return salvarTokenCsrf(
    await pedirApi<RespostaSessaoAdmin>("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioOuEmail, senha }),
    }),
  );
}

export async function obterSessaoAdmin() {
  return salvarTokenCsrf(await pedirApi<RespostaSessaoAdmin>("/admin/sessao"));
}

export async function sairAdmin() {
  await pedirApi<{ mensagem: string }>("/admin/logout", {
    method: "POST",
    headers: csrfTokenAdmin ? { "X-CSRF-Token": csrfTokenAdmin } : undefined,
  });
  csrfTokenAdmin = null;
  salvarTokenCsrfArmazenado(null);
}

export async function pedirApiAdmin<T>(caminho: string, opcoes?: RequestInit) {
  if (!csrfTokenAdmin) {
    csrfTokenAdmin = lerTokenCsrfArmazenado();
  }

  if (!csrfTokenAdmin) {
    await obterSessaoAdmin();
  }

  const headers = new Headers(opcoes?.headers);
  const metodo = opcoes?.method?.toUpperCase() ?? "GET";

  if (!["GET", "HEAD", "OPTIONS"].includes(metodo) && csrfTokenAdmin) {
    headers.set("X-CSRF-Token", csrfTokenAdmin);
  }

  try {
    return await pedirApi<T>(caminho, {
      ...opcoes,
      headers,
    });
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 401) {
      csrfTokenAdmin = null;
      redirecionarParaLogin();
    }

    throw erro;
  }
}
