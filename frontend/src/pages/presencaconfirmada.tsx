import { AcoesConfirmacao, CartaoCodigoVestimenta } from "../components/form";
import { carregarPresencaSalva } from "../lib/presenca";

function PresencaConfirmada() {
  const presencaSalva = carregarPresencaSalva();

  if (!presencaSalva || presencaSalva.respostaPresenca !== "sim") {
    window.location.replace("/");
    return null;
  }

  return (
    <div className="invite-page confirmed-page">
      <main className="invite-shell is-confirmed-layout">
        <section className="success-card" role="status">
          <span className="success-icon" aria-hidden="true" />
          <h2>Obrigado, {presencaSalva.nome}!</h2>
          <p>
            {presencaSalva.mensagem ??
              "Sua confirmação foi registrada com brilho especial."}
          </p>
        </section>

        <section className="invite-hero confirmed-hero">
          <img
            className="invite-crest"
            src="/brasao-isabela-prata.png"
            alt="Brasão com a inicial de Isabela"
          />
        </section>

        <section className="confirmed-bottom-row" aria-label="Informações do evento">
          <CartaoCodigoVestimenta className="dress-code-card-hero" />
          <AcoesConfirmacao className="confirmation-actions-cards" />
        </section>
      </main>
    </div>
  );
}

export default PresencaConfirmada;
