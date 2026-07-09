import { ConfirmationActions, DressCodeCard } from "../components/form";
import { carregarPresencaSalva } from "../lib/presenca";

function PresencaConfirmada() {
  const presenca = carregarPresencaSalva();

  if (!presenca || presenca.respostaPresenca !== "sim") {
    window.location.replace("/");
    return null;
  }

  return (
    <div className="invite-page confirmed-page">
      <main className="invite-shell is-confirmed-layout">
        <section className="success-card" role="status">
          <span className="success-icon" aria-hidden="true" />
          <h2>Obrigado, {presenca.nome}!</h2>
          <p>
            {presenca.mensagem ??
              "Sua confirma\u00e7\u00e3o foi registrada com brilho especial."}
          </p>
        </section>

        <section className="invite-hero confirmed-hero">
          <h1>Convite de Aniversario</h1>
          <img
            className="invite-crest"
            src="/brasao-isabela-prata.png"
            alt="Brasao com a inicial de Isabela"
          />
        </section>

        <section className="confirmed-bottom-row" aria-label="Informacoes do evento">
          <DressCodeCard className="dress-code-card-hero" />
          <ConfirmationActions className="confirmation-actions-cards" />
        </section>
      </main>
    </div>
  );
}

export default PresencaConfirmada;
