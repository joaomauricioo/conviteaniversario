import * as XLSX from "xlsx";

export type LinhaImportacaoConvidado = {
  nome: string;
  identificacao: string;
};

export type ResultadoImportacaoConvidados = {
  convidados: LinhaImportacaoConvidado[];
  linhasIgnoradas: number;
  linhasDuplicadas: number;
};

function limparTexto(valor: string) {
  return valor
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarCabecalho(valor: string) {
  return limparTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizarTelefoneImportacao(valor: string) {
  let digitos = valor.replace(/\D/g, "");

  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.slice(2);
  }

  if (digitos.length === 8 || digitos.length === 9) {
    digitos = `27${digitos}`;
  }

  if (digitos.length !== 10 && digitos.length !== 11) {
    return null;
  }

  return digitos;
}

function encontrarIndiceCabecalho(cabecalhos: string[], nomesAceitos: string[]) {
  return cabecalhos.findIndex((cabecalho) => nomesAceitos.includes(cabecalho));
}

function lerTextoCelula(valor: unknown) {
  if (typeof valor === "string") return limparTexto(valor);
  if (typeof valor === "number" || typeof valor === "bigint") return String(valor);
  if (typeof valor === "boolean") return valor ? "TRUE" : "FALSE";
  return "";
}

export function gerarModeloImportacaoListaConvidados() {
  const workbook = XLSX.utils.book_new();
  const planilha = XLSX.utils.aoa_to_sheet([["Nome", "Numero"]]);

  planilha["!cols"] = [{ wch: 34 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, planilha, "Convidados");

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });
}

export function lerImportacaoListaConvidados(conteudo: Buffer): ResultadoImportacaoConvidados {
  if (!conteudo || conteudo.length === 0) {
    throw new Error("Envie uma planilha Excel válida.");
  }

  const workbook = XLSX.read(conteudo, { type: "buffer" });
  const nomeAba = workbook.SheetNames[0];

  if (!nomeAba) {
    throw new Error("A planilha não contém nenhuma aba.");
  }

  const planilha = workbook.Sheets[nomeAba];
  if (!planilha) {
    throw new Error("Não foi possível ler a primeira aba da planilha.");
  }

  const linhas = XLSX.utils.sheet_to_json<unknown[]>(planilha, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (linhas.length === 0) {
    throw new Error("A planilha está vazia.");
  }

  const cabecalhos = (linhas[0] ?? []).map((valor) => normalizarCabecalho(lerTextoCelula(valor)));
  const indiceNome = encontrarIndiceCabecalho(cabecalhos, ["nome"]);
  const indiceNumero = encontrarIndiceCabecalho(cabecalhos, [
    "numero",
    "numerodetelefone",
    "telefone",
    "celular",
    "identificacao",
  ]);

  if (indiceNome < 0 || indiceNumero < 0) {
    throw new Error("A planilha precisa ter as colunas Nome e Numero.");
  }

  const convidados = new Map<string, LinhaImportacaoConvidado>();
  let linhasIgnoradas = 0;
  let linhasDuplicadas = 0;

  for (let indice = 1; indice < linhas.length; indice += 1) {
    const linha = linhas[indice] ?? [];
    const nome = limparTexto(lerTextoCelula(linha[indiceNome]));
    const numeroBruto = limparTexto(lerTextoCelula(linha[indiceNumero]));

    if (!nome && !numeroBruto) {
      continue;
    }

    if (!nome || !numeroBruto) {
      linhasIgnoradas += 1;
      continue;
    }

    const identificacao = normalizarTelefoneImportacao(numeroBruto);
    if (!identificacao) {
      linhasIgnoradas += 1;
      continue;
    }

    if (convidados.has(identificacao)) {
      linhasDuplicadas += 1;
    }

    convidados.set(identificacao, { nome, identificacao });
  }

  if (convidados.size === 0) {
    throw new Error(
      "Nenhum convidado válido foi encontrado. Verifique se a planilha foi preenchida corretamente.",
    );
  }

  return {
    convidados: Array.from(convidados.values()),
    linhasIgnoradas,
    linhasDuplicadas,
  };
}
