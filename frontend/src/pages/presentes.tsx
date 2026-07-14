import { useEffect, useState } from "react";
import { pedirApi } from "../lib/api";

type Presente = {
  id: string;
  nome: string;
  fotoUrl: string | null;
};

type RespostaPresentes = {
  presentes: Presente[];
};

function urlImagemSegura(fotoUrl: string | null) {
  if (!fotoUrl) return false;

  try {
    const url = new URL(fotoUrl);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function Presentes() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [imagensComErro, setImagensComErro] = useState<string[]>([]);

  useEffect(() => {
    pedirApi<RespostaPresentes>("/presentes")
      .then((resposta) => setPresentes(resposta.presentes))
      .catch((erroAtual: unknown) => {
        setErro(
          erroAtual instanceof Error
            ? erroAtual.message
            : "Não foi possível carregar as sugestões de presentes.",
        );
      })
      .finally(() => setCarregando(false));
  }, []);

  return (
    <main className="presents-page">
      <div className="presents-shell">
        <header className="presents-header">
          <p>Sugestões especiais</p>
          <h1>Lista de presentes</h1>
        </header>

        {carregando && (
          <div className="presents-feedback">Carregando sugestões...</div>
        )}
        {erro && (
          <div className="presents-feedback is-error" role="alert">
            {erro}
          </div>
        )}
        {!carregando && !erro && presentes.length === 0 && (
          <div className="presents-feedback">
            Nenhuma sugestão foi cadastrada ainda.
          </div>
        )}

        {!carregando && !erro && presentes.length > 0 && (
          <section className="presents-grid" aria-label="Sugestões de presentes">
            {presentes.map((presente) => {
              const mostrarFoto =
                urlImagemSegura(presente.fotoUrl) &&
                !imagensComErro.includes(presente.id);

              return (
                <article
                  className={`present-card ${
                    mostrarFoto ? "" : "present-card-text-only"
                  }`.trim()}
                  key={presente.id}
                >
                  {mostrarFoto && (
                    <img
                      src={presente.fotoUrl ?? ""}
                      alt={presente.nome}
                      onError={() =>
                        setImagensComErro((ids) => [...ids, presente.id])
                      }
                    />
                  )}
                  <h2>{presente.nome}</h2>
                </article>
              );
            })}
          </section>
        )}

        <a className="back-to-invite" href="/">
          Voltar ao convite
        </a>
      </div>
    </main>
  );
}

export default Presentes;
