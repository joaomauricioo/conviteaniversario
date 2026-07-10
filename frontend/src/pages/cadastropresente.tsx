import { useEffect, useState } from "react";
import { pedirApi } from "../lib/api";

type Presente = {
  id: string;
  nome: string;
  fotoUrl: string | null;
  createdAt: string;
};

type RespostaPresentes = {
  presentes: Presente[];
};

type RespostaMensagem = {
  mensagem: string;
};

function CadastroPresente() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [nome, setNome] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function buscarPresentes() {
    const resposta = await pedirApi<RespostaPresentes>("/presentes");
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
      const caminho = idEmEdicao ? `/presentes/${idEmEdicao}` : "/presentes";
      const resposta = await pedirApi<RespostaMensagem>(caminho, {
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
      const resposta = await pedirApi<RespostaMensagem>(
        `/presentes/${presente.id}`,
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
    <main className="present-admin-page">
      <div className="present-admin-shell">
        <header className="present-admin-header">
          <p>Área de organização</p>
          <h1>Sugestões de presentes</h1>
          <span>Cadastre e organize as sugestões exibidas aos convidados.</span>
        </header>

        <section className="present-admin-form-card">
          <div className="present-admin-card-heading">
            <span aria-hidden="true" />
            <div>
              <h2>{idEmEdicao ? "Editar presente" : "Novo presente"}</h2>
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
              <h2>Presentes cadastrados</h2>
              <p>{presentes.length} item(ns) na lista</p>
            </div>
            <a href="/presentes" target="_blank" rel="noreferrer">
              Ver página pública
            </a>
          </div>

          {carregando && <p className="admin-list-empty">Carregando presentes...</p>}
          {!carregando && presentes.length === 0 && (
            <p className="admin-list-empty">Nenhum presente cadastrado ainda.</p>
          )}

          <div className="present-admin-list">
            {presentes.map((presente) => (
              <article key={presente.id}>
                <div className="admin-present-thumb">
                  {presente.fotoUrl ? (
                    <img src={presente.fotoUrl} alt="" />
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </div>
                <div className="admin-present-info">
                  <h3>{presente.nome}</h3>
                  <p>{presente.fotoUrl ? "Com foto" : "Sem foto"}</p>
                </div>
                <div className="admin-present-actions">
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
      </div>
    </main>
  );
}

export default CadastroPresente;
