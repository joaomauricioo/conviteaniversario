import { carregarPresencaSalva } from "../lib/presenca";

function PresencaNaoConfirmada() {
  const presencaSalva = carregarPresencaSalva();

  if (!presencaSalva || presencaSalva.respostaPresenca !== "nao") {
    window.location.replace("/");
    return null;
  }

  return (
    <div className="invite-page declined-page">
      <main className="declined-shell">
        <section className="declined-card" role="status">
          <span className="success-icon" aria-hidden="true" />
          <h1>Que pena, {presencaSalva.nome}.</h1>
          <p>Sentirei sua falta nesse dia tão especial.</p>
          <div className="presence-update-action">
            <a className="presence-update-button" href="/confirmar-presenca">
              Atualizar presença
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PresencaNaoConfirmada;
