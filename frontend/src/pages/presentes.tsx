import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

type Presente = {
  id: string;
  nome: string;
  fotoUrl: string | null;
};

type PresentesResponse = {
  presentes: Presente[];
};

function Presentes() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [imagensComErro, setImagensComErro] = useState<string[]>([]);

  useEffect(() => {
    apiRequest<PresentesResponse>("/presentes")
      .then((data) => setPresentes(data.presentes))
      .catch((error: unknown) => {
        setErro(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar as sugestoes de presentes.",
        );
      })
      .finally(() => setCarregando(false));
  }, []);

  return (
    <main className="presents-page">
      <div className="presents-stars" aria-hidden="true" />
      <div className="presents-shell">
        <header className="presents-header">
          <p>Sugest&otilde;es especiais</p>
          <h1>Lista de presentes</h1>
          <span>
            Sua presen&ccedil;a j&aacute; &eacute; um presente. Caso queira nos
            mimar, reunimos algumas ideias por aqui.
          </span>
        </header>

        {carregando && (
          <div className="presents-feedback">Carregando sugest&otilde;es...</div>
        )}
        {erro && (
          <div className="presents-feedback is-error" role="alert">
            {erro}
          </div>
        )}
        {!carregando && !erro && presentes.length === 0 && (
          <div className="presents-feedback">
            Nenhuma sugest&atilde;o foi cadastrada ainda.
          </div>
        )}

        {!carregando && !erro && presentes.length > 0 && (
          <section className="presents-grid" aria-label="Sugestoes de presentes">
            {presentes.map((presente) => {
              const fotoUrl =
                presente.fotoUrl && !imagensComErro.includes(presente.id)
                  ? presente.fotoUrl
                  : null;

              return (
                <article
                  className={`present-card ${
                    fotoUrl ? "" : "present-card-text-only"
                  }`.trim()}
                  key={presente.id}
                >
                  {fotoUrl && (
                    <img
                      src={fotoUrl}
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
