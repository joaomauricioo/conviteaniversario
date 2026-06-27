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
      console.log("Marque Sim ou Não");
      return;
    }
    setEnviado(true);
    localStorage.setItem("formularioEnviado", "true");
  }
  if (enviado) {
    return (
      <div>
        <h2>Obrigado {nome} por confirmar sua presença!</h2>
      </div>
    )
  }
  return (
    <div className="form">
      <form onSubmit={handleSubmit}>
        <label>Nome</label>
        <input
          id="nome"
          type="text"
          placeholder="Digite seu nome:"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <label>Email</label>
        <input
          id="email"
          type="email"
          placeholder="Digite seu email:"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p>Você confirma sua presença?</p>
        <input
          type="radio"
          name="presenca"
          value="sim"
          checked={presenca === "sim"}
          onChange={() => setPresenca("sim")}
        /> Sim
        <input
          type="radio"
          name="presenca"
          value="nao"
          checked={presenca === "nao"}
          onChange={() => setPresenca("nao")}
        /> Não
        <button>Enviar</button>
      </form>
    </div>
  )
}

export default Form;