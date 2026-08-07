import "./App.css";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { obterSessaoAdmin, redirecionarParaLogin } from "./lib/admin";
import Inicio from "./pages/home";
import LoginAdmin from "./pages/login";
import PainelAdministrativo from "./pages/painel-administrador";
import Presentes from "./pages/presentes";

function RotaAdministrativa({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    obterSessaoAdmin()
      .then(() => setAutenticado(true))
      .catch(() => {
        setErro("Redirecionando para o login...");
        redirecionarParaLogin();
      });
  }, []);

  if (autenticado) return <>{children}</>;

  return (
    <main className="admin-loading-page">
      <p>{erro || "Verificando acesso..."}</p>
    </main>
  );
}

function normalizarRota(caminho: string) {
  switch (caminho) {
    case "/confirmar-presenca":
    case "/presencaconfirmada":
    case "/presencanaoconfirmada":
      return "/";
    case "/painel-administrador":
    case "/painel-administrador/cadastropresente":
    case "/painel-administrador/relatorio":
    case "/painel-administrador/convidados":
    case "/cadastropresente":
    case "/relatorio":
    case "/lista-convidados":
      return "/admin";
    default:
      return caminho;
  }
}

function App() {
  const caminhoOriginal = window.location.pathname.replace(/\/+$/, "") || "/";
  const caminho = normalizarRota(caminhoOriginal);

  if (caminho !== caminhoOriginal) {
    window.history.replaceState(null, "", caminho);
  }

  if (caminho === "/login") return <LoginAdmin />;
  if (caminho === "/presentes") return <Presentes />;
  if (caminho === "/admin") {
    return (
      <RotaAdministrativa>
        <PainelAdministrativo />
      </RotaAdministrativa>
    );
  }

  return <Inicio />;
}

export default App;
