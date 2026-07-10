export const CHAVE_PRESENCA_SALVA = "convite-resposta-presenca";

export type RespostaPresenca = "sim" | "nao";

export type PresencaSalva = {
  nome: string;
  celular: string;
  respostaPresenca: RespostaPresenca;
  mensagem?: string;
};

function textoValido(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}

export function carregarPresencaSalva(): PresencaSalva | null {
  try {
    const valor = localStorage.getItem(CHAVE_PRESENCA_SALVA);
    if (!valor) return null;

    const dados = JSON.parse(valor) as Partial<PresencaSalva>;
    const nome = dados.nome;
    const celular = dados.celular;
    const respostaPresenca = dados.respostaPresenca;
    const respostaValida = respostaPresenca === "sim" || respostaPresenca === "nao";

    if (!textoValido(nome) || !textoValido(celular) || !respostaValida) {
      return null;
    }

    return {
      nome: nome.trim(),
      celular: limparDigitosCelular(celular),
      respostaPresenca,
      mensagem: typeof dados.mensagem === "string" ? dados.mensagem : undefined,
    };
  } catch {
    return null;
  }
}

export function salvarPresenca(dados: PresencaSalva) {
  try {
    localStorage.setItem(CHAVE_PRESENCA_SALVA, JSON.stringify(dados));
  } catch {
    return;
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
