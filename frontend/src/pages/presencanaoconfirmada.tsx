import { carregarPresencaSalva } from "../lib/presenca";

function PresencaNaoConfirmada() {
  const presenca = carregarPresencaSalva();

  if (!presenca || presenca.respostaPresenca !== "nao") {
    window.location.replace("/");
    return null;
  }

  return (
    <div className="invite-page declined-page">
      <main className="declined-shell">
        <section className="declined-card" role="status">
          <span className="success-icon" aria-hidden="true" />
          <h1>Que pena, {presenca.nome}.</h1>
          <p>Sentiremos sua falta nesse dia tao especial.</p>
          <p className="declined-note">
            {presenca.mensagem ??
              "Sua resposta foi registrada com carinho. Obrigada por avisar."}
          </p>
        </section>
      </main>
    </div>
  );
}

export default PresencaNaoConfirmada;
