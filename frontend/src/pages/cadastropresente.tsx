import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

type Presente = {
  id: string;
  nome: string;
  fotoUrl: string | null;
  createdAt: string;
};

type PresentesResponse = {
  presentes: Presente[];
};

function CadastroPresente() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [nome, setNome] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarPresentes() {
    try {
      const data = await apiRequest<PresentesResponse>("/presentes");
      setPresentes(data.presentes);
      setErro("");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os presentes.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarPresentes();
  }, []);

  function limparFormulario() {
    setNome("");
    setFotoUrl("");
    setEditandoId(null);
  }

  async function salvarPresente(event: React.FormEvent) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!nome.trim()) {
      setErro("Informe o nome do presente.");
      return;
    }

    setSalvando(true);

    try {
      const path = editandoId ? `/presentes/${editandoId}` : "/presentes";
      const response = await apiRequest<{ mensagem: string }>(path, {
        method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          fotoUrl: fotoUrl.trim() || null,
        }),
      });

      setSucesso(response.mensagem);
      limparFormulario();
      await carregarPresentes();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o presente.",
      );
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(presente: Presente) {
    setEditandoId(presente.id);
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
      const response = await apiRequest<{ mensagem: string }>(
        `/presentes/${presente.id}`,
        { method: "DELETE" },
      );
      setSucesso(response.mensagem);
      if (editandoId === presente.id) limparFormulario();
      await carregarPresentes();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Nao foi possivel excluir o presente.",
      );
    }
  }

  return (
    <main className="present-admin-page">
      <div className="present-admin-shell">
        <header className="present-admin-header">
          <p>Area de organizacao</p>
          <h1>Sugestoes de presentes</h1>
          <span>Cadastre e organize as sugestoes exibidas aos convidados.</span>
        </header>

        <section className="present-admin-form-card">
          <div className="present-admin-card-heading">
            <span aria-hidden="true" />
            <div>
              <h2>{editandoId ? "Editar presente" : "Novo presente"}</h2>
              <p>A foto e opcional e pode ser adicionada por URL.</p>
            </div>
          </div>

          <form onSubmit={salvarPresente}>
            <label htmlFor="presente-nome">Nome do presente</label>
            <input
              id="presente-nome"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex.: Jogo de tacas"
              required
            />

            <label htmlFor="presente-foto">
              URL da foto <span>(opcional)</span>
            </label>
            <input
              id="presente-foto"
              type="url"
              value={fotoUrl}
              onChange={(event) => setFotoUrl(event.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
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
                  : editandoId
                    ? "Salvar alteracoes"
                    : "Cadastrar presente"}
              </button>
              {editandoId && (
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
              Ver pagina publica
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
