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
  const [imagensComErro, setImagensComErro] = useState<string[]>([]);

  useEffect(() => {
    pedirApi<RespostaPresentes>("/presentes")
      .then((resposta) => setPresentes(resposta.presentes))
      .catch(() => setPresentes([]))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <main className="presents-page">
      <div className="presents-shell">
        <header className="presents-header">
          <p>Sugestões especiais</p>
          <h1>Lista de presentes</h1>
        </header>

        {carregando && <div className="presents-feedback">Carregando sugestões...</div>}
        {!carregando && presentes.length === 0 && (
          <div className="presents-feedback">
            Tem nada cadastrado ainda.
          </div>
        )}

        {!carregando && presentes.length > 0 && (
          <ul className="presents-list" aria-label="Sugestões de presentes">
            {presentes.map((presente) => {
              const mostrarFoto =
                urlImagemSegura(presente.fotoUrl) &&
                !imagensComErro.includes(presente.id);

              return (
                <li
                  className={`present-item ${
                    mostrarFoto ? "" : "present-item-text-only"
                  }`.trim()}
                  key={presente.id}
                >
                  {mostrarFoto && (
                    <div className="present-item-media">
                      <img
                        src={presente.fotoUrl ?? ""}
                        alt={presente.nome}
                        onError={() =>
                          setImagensComErro((ids) => [...ids, presente.id])
                        }
                      />
                    </div>
                  )}

                  <div className="present-item-body">
                    <h2>{presente.nome}</h2>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <a className="back-to-invite" href="/">
          Voltar ao convite
        </a>
      </div>
    </main>
  );
}

export default Presentes;
