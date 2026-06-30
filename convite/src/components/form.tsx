import { useState } from "react";

function Form() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [presenca, setPresenca] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const dadosFormulario = {
      nome,
      email,
      presenca,
    };

    console.log(dadosFormulario);

    if (nome === "") {
      console.log("Digite seu nome");
      return;
    }
    if (email === "") {
      console.log("Digite seu email");
      return;
    }
    if (presenca === "") {
      console.log("Marque Sim ou Nao");
      return;
    }
    setEnviado(true);
    localStorage.setItem("formularioEnviado", "true");
  }

  if (enviado) {
    return (
      <div className="success-card">
        <span className="success-icon" aria-hidden="true">*</span>
        <h2>Obrigado, {nome}!</h2>
        <p>Sua confirmacao foi registrada com brilho especial.</p>
      </div>
    )
  }

  return (
    <div className="form">
      <form onSubmit={handleSubmit}>
        <div className="form-heading">
          <span>Confirme sua presenca</span>

        </div>

        <label htmlFor="nome">Nome</label>
        <input
          id="nome"
          type="text"
          placeholder="Digite seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <p>Voce confirma sua presenca?</p>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="presenca"
              value="sim"
              checked={presenca === "sim"}
              onChange={() => setPresenca("sim")}
            />
            <span>Sim</span>
          </label>

          <label className="radio-option">
            <input
              type="radio"
              name="presenca"
              value="nao"
              checked={presenca === "nao"}
              onChange={() => setPresenca("nao")}
            />
            <span>Nao</span>
          </label>
        </div>

        <button>Enviar</button>
      </form>
    </div>
  )
}

export default Form;
