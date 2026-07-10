import Formulario from "../components/form";
import { carregarPresencaSalva } from "../lib/presenca";
import PresencaConfirmada from "./presencaconfirmada";
import PresencaNaoConfirmada from "./presencanaoconfirmada";

function Inicio() {
  const presencaSalva = carregarPresencaSalva();

  if (presencaSalva?.respostaPresenca === "sim") return <PresencaConfirmada />;
  if (presencaSalva?.respostaPresenca === "nao") return <PresencaNaoConfirmada />;

  return (
    <div className="invite-page">
      <div className="star-field star-field-top" aria-hidden="true" />
      <div className="star-field star-field-bottom" aria-hidden="true" />

      <main className="invite-shell">
        <section className="invite-hero">
          <h1>Convite de Aniversário</h1>
          <img
            className="invite-crest"
            src="/brasao-isabela-prata.png"
            alt="Brasão com a inicial de Isabela"
          />
          <p className="invite-message">
            Para viver as emoções deste dia tão importante, quero estar ao lado
            de pessoas especiais como você.
          </p>
        </section>

        <Formulario />
      </main>
    </div>
  );
}

export default Inicio;
