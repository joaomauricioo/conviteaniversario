import { useEffect, useState } from "react";
import { pedirApiAdministrativa } from "../lib/administrador";
import { formatarCelular } from "../lib/presenca";

type Convidado = {
  nome: string;
  celular: string;
  presenca: boolean;
  createdAt: string;
  updatedAt: string;
};

type DadosRelatorio = {
  totalGeral: number;
  totalConfirmados: number;
  totalNaoConfirmados: number;
  convidados: Convidado[];
};

const nomeArquivoRelatorio = "relatorio-presenca";

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function montarLinhasRelatorio(convidados: Convidado[]) {
  return convidados.map((convidado) => ({
    Nome: convidado.nome,
    Celular: formatarCelular(convidado.celular),
    Presença: convidado.presenca ? "Sim" : "Não",
    "Data de confirmação": formatarData(convidado.updatedAt),
  }));
}

function limparTextoParaArquivo(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function baixarArquivo(conteudo: string, nomeArquivo: string, tipo: string) {
  const arquivo = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");

  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Relatorio() {
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [erro, setErro] = useState("");
  const [mensagemExportacao, setMensagemExportacao] = useState("");

  useEffect(() => {
    pedirApiAdministrativa<DadosRelatorio>("/relatorio")
      .then(setDados)
      .catch((erroAtual: unknown) => {
        setErro(
          erroAtual instanceof Error
            ? erroAtual.message
            : "Não foi possível carregar o relatório.",
        );
      });
  }, []);

  function dadosPodemSerExportados() {
    if (!dados || dados.convidados.length === 0) {
      setMensagemExportacao("Não há dados para exportar.");
      return false;
    }

    setMensagemExportacao("");
    return true;
  }

  async function exportarExcel() {
    if (!dadosPodemSerExportados() || !dados) return;

    const linhas = montarLinhasRelatorio(dados.convidados);
    const cabecalho = ["Nome", "Celular", "Presença", "Data de confirmação"];
    const conteudoCabecalho = cabecalho
      .map((titulo) => `<th>${limparTextoParaArquivo(titulo)}</th>`)
      .join("");
    const conteudoLinhas = linhas
      .map(
        (linha) =>
          `<tr><td>${limparTextoParaArquivo(linha.Nome)}</td><td>${limparTextoParaArquivo(
            linha.Celular,
          )}</td><td>${limparTextoParaArquivo(
            linha["Presença"],
          )}</td><td>${limparTextoParaArquivo(linha["Data de confirmação"])}</td></tr>`,
      )
      .join("");
    const tabela = `<table><thead><tr>${conteudoCabecalho}</tr></thead><tbody>${conteudoLinhas}</tbody></table>`;

    baixarArquivo(
      tabela,
      `${nomeArquivoRelatorio}.xls`,
      "application/vnd.ms-excel;charset=utf-8",
    );
  }

  async function exportarPdf() {
    if (!dadosPodemSerExportados() || !dados) return;

    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const documento = new jsPDF({ orientation: "landscape" });
    const dataGeracao = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());

    documento.setFont("helvetica", "bold");
    documento.setFontSize(18);
    documento.text("Relatório de Presença", 14, 18);

    documento.setFont("helvetica", "normal");
    documento.setFontSize(10);
    documento.text(`Gerado em: ${dataGeracao}`, 14, 26);
    documento.text(`Total geral: ${dados.totalGeral}`, 14, 34);
    documento.text(`Confirmados: ${dados.totalConfirmados}`, 64, 34);
    documento.text(`Não confirmados: ${dados.totalNaoConfirmados}`, 118, 34);

    autoTable(documento, {
      startY: 42,
      head: [["Nome", "Celular", "Presença", "Data de confirmação"]],
      body: montarLinhasRelatorio(dados.convidados).map((linha) => [
        linha.Nome,
        linha.Celular,
        linha["Presença"],
        linha["Data de confirmação"],
      ]),
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [6, 27, 58],
        textColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    documento.save(`${nomeArquivoRelatorio}.pdf`);
  }

  return (
    <main className="report-page">
      <div className="report-shell">
        <header className="report-header">
          <p className="report-kicker">Convite de aniversário</p>
          <h1>Relatório de presença</h1>
          <p>Acompanhe as respostas recebidas pelo convite.</p>
        </header>

        {erro && <div className="report-message report-error">{erro}</div>}
        {!dados && !erro && (
          <div className="report-message">Carregando confirmações...</div>
        )}

        {dados && (
          <>
            <section className="report-totals" aria-label="Resumo">
              <article>
                <span>Total geral</span>
                <strong>{dados.totalGeral}</strong>
              </article>
              <article>
                <span>Confirmados</span>
                <strong>{dados.totalConfirmados}</strong>
              </article>
              <article>
                <span>Não confirmados</span>
                <strong>{dados.totalNaoConfirmados}</strong>
              </article>
            </section>

            <section className="report-actions" aria-label="Exportar relatório">
              <div>
                <h2>Exportar dados</h2>
                <p>Baixe os mesmos registros exibidos na tabela.</p>
              </div>
              <div className="report-action-buttons">
                <button type="button" onClick={() => void exportarExcel()}>
                  Exportar Excel
                </button>
                <button type="button" onClick={() => void exportarPdf()}>
                  Exportar PDF
                </button>
              </div>
              {mensagemExportacao && (
                <p className="report-export-feedback" role="status">
                  {mensagemExportacao}
                </p>
              )}
            </section>

            <section className="report-table-card">
              <div className="report-table-heading">
                <h2>Respostas</h2>
                <span>{dados.totalGeral} registro(s)</span>
              </div>

              {dados.convidados.length === 0 ? (
                <p className="report-empty">Nenhuma confirmação recebida ainda.</p>
              ) : (
                <div className="report-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Celular</th>
                        <th>Presença</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.convidados.map((convidado) => (
                        <tr key={convidado.celular}>
                          <td>{convidado.nome}</td>
                          <td>{formatarCelular(convidado.celular)}</td>
                          <td>
                            <span
                              className={`presence-badge ${
                                convidado.presenca ? "is-confirmed" : "is-declined"
                              }`}
                            >
                              {convidado.presenca ? "Sim" : "Não"}
                            </span>
                          </td>
                          <td>{formatarData(convidado.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default Relatorio;
