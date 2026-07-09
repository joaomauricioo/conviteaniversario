export const PRESENCA_STORAGE_KEY = "convite-resposta-presenca";

export type RespostaPresenca = "sim" | "nao";

export type PresencaSalva = {
  nome: string;
  celular: string;
  respostaPresenca: RespostaPresenca;
  mensagem?: string;
};

export function carregarPresencaSalva(): PresencaSalva | null {
  try {
    const valor = localStorage.getItem(PRESENCA_STORAGE_KEY);
    if (!valor) return null;

    const dados = JSON.parse(valor) as Partial<PresencaSalva>;
    if (
      !dados.nome ||
      !dados.celular ||
      (dados.respostaPresenca !== "sim" && dados.respostaPresenca !== "nao")
    ) {
      return null;
    }

    return {
      nome: dados.nome,
      celular: dados.celular,
      respostaPresenca: dados.respostaPresenca,
      mensagem: dados.mensagem,
    };
  } catch {
    return null;
  }
}

export function salvarPresenca(dados: PresencaSalva) {
  try {
    localStorage.setItem(PRESENCA_STORAGE_KEY, JSON.stringify(dados));
  } catch {
    // A resposta continua valendo na sessao atual mesmo se o armazenamento falhar.
  }
}

export function limparDigitosCelular(celular: string) {
  return celular.replace(/\D/g, "").slice(0, 11);
}

export function formatarCelular(celular: string) {
  const digitos = limparDigitosCelular(celular);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function celularValido(celular: string) {
  const digitos = limparDigitosCelular(celular);
  return digitos.length === 10 || digitos.length === 11;
}
