import { useEffect, useState } from "react";
import Formulario from "../components/form";
import { carregarPresencaSalva, type RespostaPresenca } from "../lib/presenca";
import PresencaConfirmada from "./presencaconfirmada";
import PresencaNaoConfirmada from "./presencanaoconfirmada";

type PropriedadesInicio = {
  permitirAtualizacao?: boolean;
};

function Inicio({ permitirAtualizacao = false }: PropriedadesInicio) {
  const [presencaSalva] = useState(() => carregarPresencaSalva());
  const [resultadoConfirmacao, setResultadoConfirmacao] =
    useState<RespostaPresenca | null>(null);
  const editarViaQuery =
    permitirAtualizacao ||
    new URLSearchParams(window.location.search).get("editar") === "1";

  const respostaAtiva =
    resultadoConfirmacao ?? (!editarViaQuery ? presencaSalva?.respostaPresenca ?? null : null);

  useEffect(() => {
    if (respostaAtiva === "sim" && window.location.pathname !== "/presencaconfirmada") {
      window.history.replaceState(null, "", "/presencaconfirmada");
    }

    if (respostaAtiva === "nao" && window.location.pathname !== "/presencanaoconfirmada") {
      window.history.replaceState(null, "", "/presencanaoconfirmada");
    }
  }, [respostaAtiva]);

  if (respostaAtiva === "sim") {
    return <PresencaConfirmada />;
  }

  if (respostaAtiva === "nao") {
    return <PresencaNaoConfirmada />;
  }

  const destinoLoginAdmin = `/login?redirect=${encodeURIComponent("/admin")}`;

  return (
    <div className="invite-page">
      <div className="star-field star-field-top" aria-hidden="true" />
      <div className="star-field star-field-bottom" aria-hidden="true" />

      <main className="invite-shell">
        <a
          className="invite-admin-entry"
          href={destinoLoginAdmin}
          aria-label="Abrir login administrativo"
          title="Acesso administrativo"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 12.2a4.5 4.5 0 1 0-4.5-4.5 4.5 4.5 0 0 0 4.5 4.5Zm0 1.8c-4.12 0-7.5 2.45-7.5 5.45V21h15v-1.55c0-3-3.38-5.45-7.5-5.45Z" />
          </svg>
          <span className="sr-only">Acesso do administrador</span>
        </a>
        <section className="invite-hero">
          <h1>Convite de Aniversário</h1>
          <img
            className="invite-crest"
            src="/brasao-isabela-prata.png"
            alt="Brasão com a inicial de Isabela"
          />
          <p className="invite-message">
            Para viver as emoções deste dia tão importante, quero estar ao lado de
            pessoas especiais como você.
          </p>
        </section>

        <Formulario
          presencaInicial={presencaSalva}
          permitirEdicaoLivre={editarViaQuery}
          onConfirmacaoChange={setResultadoConfirmacao}
        />
      </main>
    </div>
  );
}

export default Inicio;
