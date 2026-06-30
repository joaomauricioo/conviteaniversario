import Form from "../components/form"

function Home() {
  return (
    <div className="invite-page">
      <div className="star-field star-field-top" aria-hidden="true" />
      <div className="star-field star-field-bottom" aria-hidden="true" />

      <main className="invite-shell">
        <section className="invite-hero">
          <h1>Convite de Aniversario</h1>
          <img
            className="invite-crest"
            src="/brasao-isabela-prata.png"
            alt="Brasao com a inicial de Isabela"
          />
          <p className="invite-message">
            Para viver as emocoes deste dia tao importante, quero estar ao lado
            de pessoas especiais como voce.
          </p>
        </section>

        <Form />
      </main>
    </div>
  )
}

export default Home
