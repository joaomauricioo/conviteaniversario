import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
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

const arquivoRelatorio = "relatorio-presenca";

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function linhasRelatorio(convidados: Convidado[]) {
  return convidados.map((convidado) => ({
    Nome: convidado.nome,
    Celular: formatarCelular(convidado.celular),
    Presenca: convidado.presenca ? "Sim" : "Nao",
    "Data de confirmacao": formatarData(convidado.updatedAt),
  }));
}

function Relatorio() {
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [erro, setErro] = useState("");
  const [feedbackExportacao, setFeedbackExportacao] = useState("");

  useEffect(() => {
    apiRequest<DadosRelatorio>("/relatorio")
      .then(setDados)
      .catch((error: unknown) => {
        setErro(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar o relatorio.",
        );
      });
  }, []);

  function validarDadosParaExportar() {
    if (!dados || dados.convidados.length === 0) {
      setFeedbackExportacao("Nao ha dados para exportar.");
      return false;
    }

    setFeedbackExportacao("");
    return true;
  }

  async function exportarExcel() {
    if (!validarDadosParaExportar() || !dados) return;

    const XLSX = await import("xlsx");
    const planilha = XLSX.utils.json_to_sheet(linhasRelatorio(dados.convidados));
    planilha["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 12 }, { wch: 22 }];

    const pasta = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(pasta, planilha, "Presencas");
    XLSX.writeFile(pasta, `${arquivoRelatorio}.xlsx`);
  }

  async function exportarPdf() {
    if (!validarDadosParaExportar() || !dados) return;

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
    documento.text("Relatorio de Presenca", 14, 18);

    documento.setFont("helvetica", "normal");
    documento.setFontSize(10);
    documento.text(`Gerado em: ${dataGeracao}`, 14, 26);
    documento.text(`Total geral: ${dados.totalGeral}`, 14, 34);
    documento.text(`Confirmados: ${dados.totalConfirmados}`, 64, 34);
    documento.text(`Nao confirmados: ${dados.totalNaoConfirmados}`, 118, 34);

    autoTable(documento, {
      startY: 42,
      head: [["Nome", "Celular", "Presenca", "Data de confirmacao"]],
      body: linhasRelatorio(dados.convidados).map((linha) => [
        linha.Nome,
        linha.Celular,
        linha.Presenca,
        linha["Data de confirmacao"],
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

    documento.save(`${arquivoRelatorio}.pdf`);
  }

  return (
    <main className="report-page">
      <div className="report-shell">
        <header className="report-header">
          <p className="report-kicker">Convite de aniversario</p>
          <h1>Relatorio de presenca</h1>
          <p>Acompanhe as respostas recebidas pelo convite.</p>
        </header>

        {erro && <div className="report-message report-error">{erro}</div>}
        {!dados && !erro && (
          <div className="report-message">Carregando confirmacoes...</div>
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
                <span>Nao confirmados</span>
                <strong>{dados.totalNaoConfirmados}</strong>
              </article>
            </section>

            <section className="report-actions" aria-label="Exportar relatorio">
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
              {feedbackExportacao && (
                <p className="report-export-feedback" role="status">
                  {feedbackExportacao}
                </p>
              )}
            </section>

            <section className="report-table-card">
              <div className="report-table-heading">
                <h2>Respostas</h2>
                <span>{dados.totalGeral} registro(s)</span>
              </div>

              {dados.convidados.length === 0 ? (
                <p className="report-empty">Nenhuma confirmacao recebida ainda.</p>
              ) : (
                <div className="report-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Celular</th>
                        <th>Presenca</th>
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
                              {convidado.presenca ? "Sim" : "Nao"}
                            </span>
                          </td>
                          <td>
                            {formatarData(convidado.updatedAt)}
                          </td>
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
