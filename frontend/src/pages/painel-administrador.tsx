import { useEffect, useMemo, useRef, useState } from "react";
import { baixarArquivoApi } from "../lib/api";
import { pedirApiAdmin, sairAdmin } from "../lib/admin";
import { formatarCelular } from "../lib/presenca";

type SecaoPainel = "relatorio" | "presentes" | "convidados";

type Presente = {
  id: string;
  nome: string;
  fotoUrl: string | null;
  ordem: number;
  createdAt: string;
};

type RespostaPresentes = {
  presentes: Presente[];
};

type RespostaMensagem = {
  mensagem: string;
};

type ConvidadoConfirmacao = {
  id: string;
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
  convidados: ConvidadoConfirmacao[];
};

type ConvidadoLista = {
  id: string;
  nome: string;
  identificacao: string;
  createdAt: string;
  updatedAt: string;
};

type RespostaListaConvidados = {
  convidados: ConvidadoLista[];
};

type RespostaImportacaoListaConvidados = {
  mensagem: string;
  importados: number;
  novos: number;
  atualizados: number;
  ignorados: number;
  duplicadosNaPlanilha: number;
};

type PropriedadesSecao = {
  titulo: string;
  descricao: string;
};

const ITENS_MENU: Array<{
  secao: SecaoPainel;
  titulo: string;
  descricao: string;
}> = [
  {
    secao: "relatorio",
    titulo: "Relatorio",
    descricao: "Acompanhe as confirmações recebidas.",
  },
  {
    secao: "presentes",
    titulo: "Cadastro de presentes",
    descricao: "Gerencie as sugestões exibidas aos convidados.",
  },
  {
    secao: "convidados",
    titulo: "Lista de convidados",
    descricao: "Cadastre quem pode confirmar presença.",
  },
];

function normalizarBusca(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizarIdentificacao(valor: string) {
  return valor.replace(/\D/g, "");
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
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

function formatarIdentificacaoExibicao(identificacao: string) {
  const digitos = normalizarIdentificacao(identificacao);
  if (digitos.length === 10 || digitos.length === 11) {
    return formatarCelular(digitos);
  }

  return identificacao;
}

function SecaoPainelCabecalho({ titulo, descricao }: PropriedadesSecao) {
  return (
    <header className="admin-section-header">
      <div>
        <p className="report-kicker">Área administrativa</p>
        <h2>{titulo}</h2>
        <p>{descricao}</p>
      </div>
    </header>
  );
}

function SecaoPresentes() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [nome, setNome] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [idArrastando, setIdArrastando] = useState<string | null>(null);
  const [idAlvo, setIdAlvo] = useState<string | null>(null);

  async function buscarPresentes() {
    const resposta = await pedirApiAdmin<RespostaPresentes>("/admin/presentes");
    return resposta.presentes;
  }

  async function atualizarListaPresentes() {
    try {
      const lista = await buscarPresentes();
      setPresentes(lista);
      setErro("");
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível carregar os presentes.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarPresentes()
      .then(setPresentes)
      .catch((erroAtual: unknown) => {
        setErro(
          erroAtual instanceof Error
            ? erroAtual.message
            : "Não foi possível carregar os presentes.",
        );
      })
      .finally(() => setCarregando(false));
  }, []);

  function limparFormulario() {
    setNome("");
    setFotoUrl("");
    setIdEmEdicao(null);
  }

  async function salvarPresente(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");
    setSucesso("");

    const nomeLimpo = nome.trim();
    const fotoUrlLimpa = fotoUrl.trim();

    if (!nomeLimpo) {
      setErro("Informe o nome do presente.");
      return;
    }

    setSalvando(true);

    try {
      const caminho = idEmEdicao
        ? `/admin/presentes/${idEmEdicao}`
        : "/admin/presentes";
      const resposta = await pedirApiAdmin<RespostaMensagem>(caminho, {
        method: idEmEdicao ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeLimpo,
          fotoUrl: fotoUrlLimpa || null,
        }),
      });

      setSucesso(resposta.mensagem);
      limparFormulario();
      await atualizarListaPresentes();
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível salvar o presente.",
      );
    } finally {
      setSalvando(false);
    }
  }

  function reposicionarPresentes(
    lista: Presente[],
    origemId: string,
    destinoId: string,
  ) {
    const origemIndex = lista.findIndex((presente) => presente.id === origemId);
    const destinoIndex = lista.findIndex((presente) => presente.id === destinoId);

    if (origemIndex < 0 || destinoIndex < 0 || origemIndex === destinoIndex) {
      return lista;
    }

    const novaLista = [...lista];
    const [itemMovido] = novaLista.splice(origemIndex, 1);
    const indiceDestinoAjustado = origemIndex < destinoIndex ? destinoIndex - 1 : destinoIndex;

    novaLista.splice(indiceDestinoAjustado, 0, itemMovido);

    return novaLista.map((presente, indice) => ({
      ...presente,
      ordem: indice + 1,
    }));
  }

  function iniciarArraste(evento: React.DragEvent<HTMLElement>, presenteId: string) {
    evento.dataTransfer.effectAllowed = "move";
    evento.dataTransfer.setData("text/plain", presenteId);
    setIdArrastando(presenteId);
  }

  function permitirArraste(evento: React.DragEvent<HTMLElement>, presenteId: string) {
    evento.preventDefault();
    evento.dataTransfer.dropEffect = "move";

    if (idArrastando && idArrastando !== presenteId) {
      setIdAlvo(presenteId);
    }
  }

  function limparArraste() {
    setIdArrastando(null);
    setIdAlvo(null);
  }

  async function soltarArraste(evento: React.DragEvent<HTMLElement>, presenteId: string) {
    evento.preventDefault();

    const origemId = evento.dataTransfer.getData("text/plain") || idArrastando;
    if (!origemId || origemId === presenteId) {
      limparArraste();
      return;
    }

    const novaLista = reposicionarPresentes(presentes, origemId, presenteId);
    if (novaLista === presentes) {
      limparArraste();
      return;
    }

    setErro("");
    setSucesso("");
    setPresentes(novaLista);
    limparArraste();

    try {
      const resposta = await pedirApiAdmin<RespostaMensagem>("/admin/presentes/ordem", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: novaLista.map((presente) => presente.id),
        }),
      });

      setSucesso(resposta.mensagem);
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível salvar a nova ordem dos presentes.",
      );
      await atualizarListaPresentes();
    }
  }

  async function moverPresente(presenteId: string, direcao: "subir" | "descer") {
    setErro("");
    setSucesso("");

    try {
      const resposta = await pedirApiAdmin<RespostaMensagem>(
        `/admin/presentes/${presenteId}/mover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direcao }),
        },
      );

      setSucesso(resposta.mensagem);
      await atualizarListaPresentes();
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível alterar a ordem do presente.",
      );
    }
  }

  function iniciarEdicao(presente: Presente) {
    setIdEmEdicao(presente.id);
    setNome(presente.nome);
    setFotoUrl(presente.fotoUrl ?? "");
    setErro("");
    setSucesso("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirPresente(presente: Presente) {
    if (!window.confirm(`Deseja excluir "${presente.nome}"?`)) return;

    setErro("");
    setSucesso("");

    try {
      const resposta = await pedirApiAdmin<RespostaMensagem>(
        `/admin/presentes/${presente.id}`,
        { method: "DELETE" },
      );

      setSucesso(resposta.mensagem);
      if (idEmEdicao === presente.id) limparFormulario();
      await atualizarListaPresentes();
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível excluir o presente.",
      );
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-presentes-title">
      <SecaoPainelCabecalho
        titulo="Cadastro de presentes"
        descricao="Cadastre e organize as sugestões exibidas aos convidados."
      />

      <section className="present-admin-form-card">
        <div className="present-admin-card-heading">
          <span className="image-icon admin-heading-icon" aria-hidden="true">
            <img src="/icone-presente.png" alt="" />
          </span>
          <div>
            <h3 id="admin-presentes-title">{idEmEdicao ? "Editar presente" : "Novo presente"}</h3>
            <p>A foto é opcional e pode ser adicionada por URL.</p>
          </div>
        </div>

        <form onSubmit={salvarPresente}>
          <label htmlFor="presente-nome">Nome do presente</label>
          <input
            id="presente-nome"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Ex.: Jogo de taças"
            maxLength={120}
            required
          />

          <label htmlFor="presente-foto">
            URL da foto <span>(opcional)</span>
          </label>
          <input
            id="presente-foto"
            type="url"
            value={fotoUrl}
            onChange={(evento) => setFotoUrl(evento.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            maxLength={500}
          />

          {erro && (
            <p className="admin-notice is-error" role="alert">
              {erro}
            </p>
          )}
          {sucesso && (
            <p className="admin-notice is-success" role="status">
              {sucesso}
            </p>
          )}

          <div className="present-form-actions">
            <button type="submit" disabled={salvando}>
              {salvando
                ? "Salvando..."
                : idEmEdicao
                  ? "Salvar alterações"
                  : "Cadastrar presente"}
            </button>
            {idEmEdicao && (
              <button
                className="button-secondary"
                type="button"
                onClick={limparFormulario}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="present-admin-list-card">
        <div className="present-list-heading">
          <div>
            <h3>Presentes cadastrados</h3>
            <p>{presentes.length} item(ns) na lista</p>
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            Ver convite público
          </a>
        </div>

        {carregando && <p className="admin-list-empty">Carregando presentes...</p>}
        {!carregando && presentes.length === 0 && (
          <p className="admin-list-empty">Nenhum presente cadastrado ainda.</p>
        )}

        <div className="present-admin-list">
          {presentes.map((presente, indice) => (
            <article
              key={presente.id}
              className={[
                "present-admin-item",
                idArrastando === presente.id ? "is-dragging" : "",
                idAlvo === presente.id ? "is-drop-target" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              draggable
              onDragStart={(evento) => iniciarArraste(evento, presente.id)}
              onDragOver={(evento) => permitirArraste(evento, presente.id)}
              onDragEnter={(evento) => permitirArraste(evento, presente.id)}
              onDrop={(evento) => void soltarArraste(evento, presente.id)}
              onDragEnd={limparArraste}
            >
              <div className="admin-present-thumb">
                {presente.fotoUrl ? (
                  <img src={presente.fotoUrl} alt="" />
                ) : (
                  <span className="image-icon admin-present-placeholder" aria-hidden="true">
                    <img src="/icone-presente.png" alt="" />
                  </span>
                )}
              </div>
              <div className="admin-present-info">
                <h4>{presente.nome}</h4>
                <p>{presente.fotoUrl ? "Com foto" : "Sem foto"}</p>
              </div>
              <div className="admin-present-actions">
                <div className="admin-present-order-controls" aria-label="Reordenar presente">
                  <button
                    className="button-order"
                    type="button"
                    disabled={indice === 0}
                    onClick={() => void moverPresente(presente.id, "subir")}
                    aria-label="Mover para cima"
                    title="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    className="button-order"
                    type="button"
                    disabled={indice === presentes.length - 1}
                    onClick={() => void moverPresente(presente.id, "descer")}
                    aria-label="Mover para baixo"
                    title="Mover para baixo"
                  >
                    ↓
                  </button>
                </div>
                <button type="button" onClick={() => iniciarEdicao(presente)}>
                  Editar
                </button>
                <button
                  className="button-danger"
                  type="button"
                  onClick={() => void excluirPresente(presente)}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function SecaoRelatorio() {
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [erro, setErro] = useState("");
  const [mensagemExportacao, setMensagemExportacao] = useState("");
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroPresenca, setFiltroPresenca] = useState<"todos" | "confirmados" | "nao-confirmados">(
    "todos",
  );
  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [celularEdicao, setCelularEdicao] = useState("");
  const [presencaEdicao, setPresencaEdicao] = useState<"sim" | "nao">("sim");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const convidadosFiltrados = useMemo(() => {
    if (!dados) return [];

    const termoBusca = normalizarBusca(busca);

    return dados.convidados.filter((convidado) => {
      const passaNoFiltro =
        filtroPresenca === "todos" ||
        (filtroPresenca === "confirmados" && convidado.presenca) ||
        (filtroPresenca === "nao-confirmados" && !convidado.presenca);

      if (!passaNoFiltro) return false;
      if (!termoBusca) return true;

      const textoConvidado = normalizarBusca(
        `${convidado.nome} ${convidado.celular} ${formatarCelular(convidado.celular)}`,
      );

      return textoConvidado.includes(termoBusca);
    });
  }, [busca, dados, filtroPresenca]);

  async function carregarRelatorio() {
    try {
      const resposta = await pedirApiAdmin<DadosRelatorio>("/admin/relatorio");
      setDados(resposta);
      setErro("");
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível carregar o relatório.",
      );
    }
  }

  useEffect(() => {
    const atrasoCarregamento = window.setTimeout(() => {
      void carregarRelatorio();
    }, 0);

    return () => window.clearTimeout(atrasoCarregamento);
  }, []);

  function iniciarEdicao(convidado: ConvidadoConfirmacao) {
    setIdEmEdicao(convidado.id);
    setNomeEdicao(convidado.nome);
    setCelularEdicao(formatarCelular(convidado.celular));
    setPresencaEdicao(convidado.presenca ? "sim" : "nao");
    setMensagemAcao("");
    setErro("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setIdEmEdicao(null);
    setNomeEdicao("");
    setCelularEdicao("");
    setPresencaEdicao("sim");
  }

  function dadosPodemSerExportados(convidados: ConvidadoConfirmacao[]) {
    if (convidados.length === 0) {
      setMensagemExportacao("Não há dados para exportar.");
      return false;
    }

    setMensagemExportacao("");
    return true;
  }

  async function exportarExcel() {
    if (!dadosPodemSerExportados(convidadosFiltrados)) return;

    const linhas = convidadosFiltrados.map((convidado) => ({
      Nome: convidado.nome,
      Celular: formatarCelular(convidado.celular),
      Presenca: convidado.presenca ? "Sim" : "Não",
      "Data de confirmação": formatarData(convidado.updatedAt),
    }));
    const cabecalho = ["Nome", "Celular", "Presença", "Data de confirmação"];
    const conteudoCabecalho = cabecalho
      .map((titulo) => `<th>${limparTextoParaArquivo(titulo)}</th>`)
      .join("");
    const conteudoLinhas = linhas
      .map(
        (linha) =>
          `<tr><td>${limparTextoParaArquivo(linha.Nome)}</td><td>${limparTextoParaArquivo(
            linha.Celular,
          )}</td><td>${limparTextoParaArquivo(linha.Presenca)}</td><td>${limparTextoParaArquivo(
            linha["Data de confirmação"],
          )}</td></tr>`,
      )
      .join("");
    const tabela = `<table><thead><tr>${conteudoCabecalho}</tr></thead><tbody>${conteudoLinhas}</tbody></table>`;

    baixarArquivo(
      tabela,
      "relatorio-presenca.xls",
      "application/vnd.ms-excel;charset=utf-8",
    );
  }

  async function exportarPdf() {
    if (!dados || !dadosPodemSerExportados(convidadosFiltrados)) return;

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
      body: convidadosFiltrados.map((convidado) => [
        convidado.nome,
        formatarCelular(convidado.celular),
        convidado.presenca ? "Sim" : "Não",
        formatarData(convidado.updatedAt),
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

    documento.save("relatorio-presenca.pdf");
  }

  async function salvarEdicao(evento: React.FormEvent) {
    evento.preventDefault();

    if (!idEmEdicao) return;

    const nomeLimpo = nomeEdicao.trim();
    const celularLimpo = celularEdicao.trim();

    if (!nomeLimpo || !celularLimpo) {
      setErro("Informe o nome e o celular da confirmação.");
      return;
    }

    setSalvandoEdicao(true);
    setErro("");
    setMensagemAcao("");

    try {
      const resposta = await pedirApiAdmin<RespostaMensagem>(`/admin/relatorio/${idEmEdicao}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeLimpo,
          celular: celularLimpo,
          presenca: presencaEdicao === "sim",
        }),
      });

      setMensagemAcao(resposta.mensagem);
      cancelarEdicao();
      await carregarRelatorio();
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível atualizar a confirmação.",
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function excluirConfirmacao(convidado: ConvidadoConfirmacao) {
    if (!window.confirm(`Deseja excluir a confirmação de "${convidado.nome}"?`)) return;

    setErro("");
    setMensagemAcao("");

    try {
      const resposta = await pedirApiAdmin<RespostaMensagem>(`/admin/relatorio/${convidado.id}`, {
        method: "DELETE",
      });

      setMensagemAcao(resposta.mensagem);
      if (idEmEdicao === convidado.id) {
        cancelarEdicao();
      }
      await carregarRelatorio();
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível excluir a confirmação.",
      );
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-relatorio-title">
      <SecaoPainelCabecalho
        titulo="Relatório de presença"
        descricao="Acompanhe as respostas recebidas pelo convite."
      />

      {erro && <div className="report-message report-error">{erro}</div>}
      {!dados && !erro && <div className="report-message">Carregando confirmações...</div>}

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

          {idEmEdicao && (
            <section className="present-admin-form-card report-edit-card" aria-label="Editar confirmação">
              <div className="present-admin-card-heading">
                <div>
                  <h2>Editar resposta</h2>
                  <p>Atualize os dados da confirmação selecionada.</p>
                </div>
                <button type="button" className="button-secondary" onClick={cancelarEdicao}>
                  Cancelar
                </button>
              </div>

              <form onSubmit={salvarEdicao}>
                <label htmlFor="relatorio-nome">
                  Nome
                  <input
                    id="relatorio-nome"
                    type="text"
                    value={nomeEdicao}
                    onChange={(evento) => setNomeEdicao(evento.target.value)}
                    placeholder="Nome do convidado"
                    maxLength={100}
                    required
                  />
                </label>

                <label htmlFor="relatorio-celular">
                  Celular
                  <input
                    id="relatorio-celular"
                    type="tel"
                    inputMode="tel"
                    value={celularEdicao}
                    onChange={(evento) => setCelularEdicao(formatarCelular(evento.target.value))}
                    placeholder="(27) 99999-9999"
                    maxLength={15}
                    required
                  />
                </label>

                <label>
                  Presença
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="relatorio-presenca"
                        value="sim"
                        checked={presencaEdicao === "sim"}
                        onChange={() => setPresencaEdicao("sim")}
                      />
                      <span>Sim</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="relatorio-presenca"
                        value="nao"
                        checked={presencaEdicao === "nao"}
                        onChange={() => setPresencaEdicao("nao")}
                      />
                      <span>Não</span>
                    </label>
                  </div>
                </label>

                <div className="present-form-actions">
                  <button type="submit" disabled={salvandoEdicao}>
                    {salvandoEdicao ? "Salvando..." : "Salvar alteração"}
                  </button>
                  <button type="button" className="button-secondary" onClick={cancelarEdicao}>
                    Limpar
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="report-actions" aria-label="Exportar relatório">
            <div>
              <h3>Exportar dados</h3>
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
            {mensagemAcao && (
              <p className="report-export-feedback" role="status">
                {mensagemAcao}
              </p>
            )}
          </section>

          <section className="report-table-card">
            <div className="report-table-heading">
              <div>
                <h3>Respostas</h3>
                <span>
                  {convidadosFiltrados.length} de {dados.totalGeral} registro(s)
                </span>
              </div>
            </div>

            <div className="report-filters">
              <label>
                <span>Buscar</span>
                <input
                  type="search"
                  value={busca}
                  placeholder="Nome ou celular"
                  onChange={(evento) => setBusca(evento.target.value)}
                />
              </label>
              <div className="report-filter-group" aria-label="Filtrar por presença">
                <button
                  className={filtroPresenca === "todos" ? "is-active" : ""}
                  type="button"
                  onClick={() => setFiltroPresenca("todos")}
                >
                  Todos
                </button>
                <button
                  className={filtroPresenca === "confirmados" ? "is-active" : ""}
                  type="button"
                  onClick={() => setFiltroPresenca("confirmados")}
                >
                  Confirmados
                </button>
                <button
                  className={filtroPresenca === "nao-confirmados" ? "is-active" : ""}
                  type="button"
                  onClick={() => setFiltroPresenca("nao-confirmados")}
                >
                  Não confirmados
                </button>
              </div>
            </div>

            {dados.convidados.length === 0 ? (
              <p className="report-empty">Nenhuma confirmação recebida ainda.</p>
            ) : convidadosFiltrados.length === 0 ? (
              <p className="report-empty">Nenhum registro encontrado.</p>
            ) : (
              <div className="report-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Celular</th>
                      <th>Presença</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convidadosFiltrados.map((convidado) => (
                      <tr key={convidado.id}>
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
                        <td>
                          <div className="admin-present-actions report-row-actions">
                            <button type="button" onClick={() => iniciarEdicao(convidado)}>
                              Editar
                            </button>
                            <button
                              className="button-danger"
                              type="button"
                              onClick={() => void excluirConfirmacao(convidado)}
                            >
                              Excluir
                            </button>
                          </div>
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
    </section>
  );
}

function SecaoListaConvidados() {
  const [convidados, setConvidados] = useState<ConvidadoLista[]>([]);
  const [nome, setNome] = useState("");
  const [identificacao, setIdentificacao] = useState("");
  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [arquivoImportacao, setArquivoImportacao] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const arquivoImportacaoRef = useRef<HTMLInputElement | null>(null);

  async function buscarConvidados() {
    const resposta = await pedirApiAdmin<RespostaListaConvidados>(
      "/admin/lista-convidados",
    );
    return resposta.convidados;
  }

  async function atualizarListaConvidados() {
    try {
      const lista = await buscarConvidados();
      setConvidados(lista);
      setErro("");
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível carregar a lista de convidados.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarConvidados()
      .then(setConvidados)
      .catch((erroAtual: unknown) => {
        setErro(
          erroAtual instanceof Error
            ? erroAtual.message
            : "Não foi possível carregar a lista de convidados.",
        );
      })
      .finally(() => setCarregando(false));
  }, []);

  function limparFormulario() {
    setNome("");
    setIdentificacao("");
    setIdEmEdicao(null);
  }

  async function salvarConvidado(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");
    setSucesso("");

    const nomeLimpo = nome.trim();
    const identificacaoLimpa = identificacao.trim();

    if (!nomeLimpo || !identificacaoLimpa) {
      setErro("Informe o nome e a identificação do convidado.");
      return;
    }

    setSalvando(true);

    try {
      const caminho = idEmEdicao
        ? `/admin/lista-convidados/${idEmEdicao}`
        : "/admin/lista-convidados";
      const resposta = await pedirApiAdmin<RespostaMensagem>(caminho, {
        method: idEmEdicao ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeLimpo,
          identificacao: identificacaoLimpa,
        }),
      });

      setSucesso(resposta.mensagem);
      limparFormulario();
      await atualizarListaConvidados();
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível salvar o convidado.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function baixarModeloImportacao() {
    await baixarArquivoApi(
      "/admin/lista-convidados/modelo-importacao",
      "modelo-importacao-convidados.xlsx",
    );
  }

  function selecionarArquivoImportacao(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0] ?? null;
    setArquivoImportacao(arquivo);
    setErro("");
    setSucesso("");
  }

  function limparArquivoImportacao() {
    setArquivoImportacao(null);
    if (arquivoImportacaoRef.current) {
      arquivoImportacaoRef.current.value = "";
    }
  }

  async function importarConvidadosExcel() {
    if (!arquivoImportacao) {
      setErro("Escolha a planilha Excel para importar.");
      return;
    }

    setImportando(true);
    setErro("");
    setSucesso("");

    try {
      const resposta = await pedirApiAdmin<RespostaImportacaoListaConvidados>(
        "/admin/lista-convidados/importar",
        {
          method: "POST",
          headers: {
            "Content-Type":
              arquivoImportacao.type ||
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
          body: arquivoImportacao,
        },
      );

      setSucesso(resposta.mensagem);
      limparArquivoImportacao();
      await atualizarListaConvidados();
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível importar a planilha.",
      );
    } finally {
      setImportando(false);
    }
  }

  function iniciarEdicao(convidado: ConvidadoLista) {
    setIdEmEdicao(convidado.id);
    setNome(convidado.nome);
    setIdentificacao(convidado.identificacao);
    setErro("");
    setSucesso("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirConvidado(convidado: ConvidadoLista) {
    if (!window.confirm(`Deseja excluir "${convidado.nome}" da lista?`)) return;

    setErro("");
    setSucesso("");

    try {
      const resposta = await pedirApiAdmin<RespostaMensagem>(
        `/admin/lista-convidados/${convidado.id}`,
        { method: "DELETE" },
      );

      setSucesso(resposta.mensagem);
      if (idEmEdicao === convidado.id) limparFormulario();
      await atualizarListaConvidados();
    } catch (erroAtual) {
      setErro(
        erroAtual instanceof Error
          ? erroAtual.message
          : "Não foi possível excluir o convidado.",
      );
    }
  }

  const convidadosFiltrados = useMemo(() => {
    const termoBusca = normalizarBusca(busca);
    if (!termoBusca) return convidados;

    return convidados.filter((convidado) => {
      const texto = normalizarBusca(
        `${convidado.nome} ${convidado.identificacao} ${formatarIdentificacaoExibicao(
          convidado.identificacao,
        )}`,
      );

      return texto.includes(termoBusca);
    });
  }, [busca, convidados]);

  return (
    <section className="admin-section" aria-labelledby="admin-convidados-title">
      <SecaoPainelCabecalho
        titulo="Lista de convidados"
        descricao="Cadastre os convidados que podem confirmar presença."
      />

      <section className="present-admin-form-card">
        <div className="present-admin-card-heading">
          <span className="image-icon admin-heading-icon" aria-hidden="true">
            <img src="/icone-estrela.png" alt="" />
          </span>
          <div>
            <h3 id="admin-convidados-title">
              {idEmEdicao ? "Editar convidado" : "Novo convidado"}
            </h3>
            <p>O número ou identificação será validado quando a pessoa responder SIM.</p>
          </div>
        </div>

        <form onSubmit={salvarConvidado}>
          <label htmlFor="convidado-nome">Nome do convidado</label>
          <input
            id="convidado-nome"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Ex.: Maria Silva"
            maxLength={100}
            required
          />

          <label htmlFor="convidado-identificacao">
            Telefone ou identificação
          </label>
          <input
            id="convidado-identificacao"
            value={identificacao}
            onChange={(evento) => setIdentificacao(evento.target.value)}
            placeholder="Ex.: (27) 99999-9999 ou 123456"
            maxLength={120}
            required
          />

          {erro && (
            <p className="admin-notice is-error" role="alert">
              {erro}
            </p>
          )}
          {sucesso && (
            <p className="admin-notice is-success" role="status">
              {sucesso}
            </p>
          )}

          <div className="present-form-actions">
            <button type="submit" disabled={salvando}>
              {salvando
                ? "Salvando..."
                : idEmEdicao
                  ? "Salvar alterações"
                  : "Cadastrar convidado"}
            </button>
            {idEmEdicao && (
              <button
                className="button-secondary"
                type="button"
                onClick={limparFormulario}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="convidados-importacao">
          <div className="present-admin-card-heading">
            <span className="image-icon admin-heading-icon" aria-hidden="true">
              <img src="/icone-estrela.png" alt="" />
            </span>
            <div>
              <h3>Importar por Excel</h3>
              <p>Baixe o modelo, preencha Nome e Numero e envie a planilha.</p>
            </div>
          </div>

          <div className="present-form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => void baixarModeloImportacao()}
            >
              Baixar modelo Excel
            </button>
          </div>

          <label htmlFor="arquivo-importacao-convidados">Planilha Excel</label>
          <input
            ref={arquivoImportacaoRef}
            id="arquivo-importacao-convidados"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={selecionarArquivoImportacao}
          />

          {arquivoImportacao && (
            <p className="admin-import-file-name">Arquivo selecionado: {arquivoImportacao.name}</p>
          )}

          <div className="present-form-actions">
            <button type="button" disabled={importando || !arquivoImportacao} onClick={() => void importarConvidadosExcel()}>
              {importando ? "Importando..." : "Importar convidados"}
            </button>
            {arquivoImportacao && (
              <button type="button" className="button-secondary" onClick={limparArquivoImportacao}>
                Limpar arquivo
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="present-admin-list-card">
        <div className="present-list-heading">
          <div>
            <h3>Convidados cadastrados</h3>
            <p>{convidados.length} item(ns) na lista</p>
          </div>
        </div>

        <div className="admin-list-search">
          <label>
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              placeholder="Nome ou identificação"
              onChange={(evento) => setBusca(evento.target.value)}
            />
          </label>
        </div>

        {carregando && <p className="admin-list-empty">Carregando convidados...</p>}
        {!carregando && convidados.length === 0 && (
          <p className="admin-list-empty">Nenhum convidado cadastrado ainda.</p>
        )}
        {!carregando && convidados.length > 0 && convidadosFiltrados.length === 0 && (
          <p className="admin-list-empty">Nenhum convidado encontrado.</p>
        )}

        <div className="present-admin-list">
          {convidadosFiltrados.map((convidado) => (
            <article
              key={convidado.id}
              className="present-admin-item present-admin-item-convidado"
            >
              <div className="admin-present-info">
                <h4>{convidado.nome}</h4>
                <p>{formatarIdentificacaoExibicao(convidado.identificacao)}</p>
              </div>
              <div className="admin-present-actions">
                <button type="button" onClick={() => iniciarEdicao(convidado)}>
                  Editar
                </button>
                <button
                  className="button-danger"
                  type="button"
                  onClick={() => void excluirConvidado(convidado)}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function PainelAdministrativo() {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoPainel>("relatorio");

  async function encerrarSessao() {
    await sairAdmin();
    window.location.replace("/login");
  }

  return (
    <main className="admin-panel-page">
      <div className="admin-panel-shell">
        <header className="admin-panel-header">
          <div>
            <p className="report-kicker">Convite de aniversário</p>
            <h1>Painel de Administrador</h1>
            <p>Gerencie presentes, convidados e confirmações em um único lugar.</p>
          </div>

          <button
            className="admin-logout-button"
            type="button"
            onClick={() => void encerrarSessao()}
          >
            Sair
          </button>
        </header>

        <div className="admin-panel-layout">
          <aside className="admin-panel-sidebar" aria-label="Navegação administrativa">
            {ITENS_MENU.map((item) => (
              <button
                key={item.secao}
                type="button"
                className={secaoAtiva === item.secao ? "is-active" : ""}
                onClick={() => setSecaoAtiva(item.secao)}
              >
                <span>{item.titulo}</span>
                <small>{item.descricao}</small>
              </button>
            ))}
          </aside>

          <div className="admin-panel-content">
            {secaoAtiva === "presentes" && <SecaoPresentes />}
            {secaoAtiva === "relatorio" && <SecaoRelatorio />}
            {secaoAtiva === "convidados" && <SecaoListaConvidados />}
          </div>
        </div>
      </div>
    </main>
  );
}

export default PainelAdministrativo;
