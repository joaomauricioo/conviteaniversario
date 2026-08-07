import { useState } from "react";
import { entrarAdmin } from "../lib/admin";

const MENSAGEM_ERRO_LOGIN = "Usuário ou senha inválidos.";

function destinoAposLogin() {
  const parametros = new URLSearchParams(window.location.search);
  const redirect = parametros.get("redirect");

  if (redirect?.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }

  return "/admin";
}

function LoginAdmin() {
  const [usuarioOuEmail, setUsuarioOuEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviarLogin(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await entrarAdmin(usuarioOuEmail, senha);
      window.location.replace(destinoAposLogin());
    } catch {
      setErro(MENSAGEM_ERRO_LOGIN);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-login-card-header">
          <a
            className="admin-login-back-link"
            href="/"
            aria-label="Voltar para o convite"
            title="Voltar para o convite"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11H20a1 1 0 1 1 0 2h-9.59l4.3 4.3a1 1 0 0 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.41 0Z" />
            </svg>
            <span className="sr-only">Voltar para o convite</span>
          </a>
          <h1 id="admin-login-title">Login administrativo</h1>
        </div>

        <form onSubmit={enviarLogin}>
          <label htmlFor="admin-usuario">Usuário ou e-mail</label>
          <input
            id="admin-usuario"
            autoComplete="username"
            value={usuarioOuEmail}
            onChange={(evento) => setUsuarioOuEmail(evento.target.value)}
            required
          />

          <label htmlFor="admin-senha">Senha</label>
          <input
            id="admin-senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            required
          />

          {erro && (
            <p className="admin-login-error" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginAdmin;
