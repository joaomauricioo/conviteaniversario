import "./App.css";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { obterSessaoAdmin, redirecionarParaLogin } from "./lib/admin";
import { carregarPresencaSalva } from "./lib/presenca";
import Inicio from "./pages/home";
import LoginAdmin from "./pages/login";
import PainelAdministrativo from "./pages/painel-administrador";
import PresencaConfirmada from "./pages/presencaconfirmada";
import PresencaNaoConfirmada from "./pages/presencanaoconfirmada";
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
  const buscaOriginal = window.location.search;
  const editarViaQuery = new URLSearchParams(buscaOriginal).get("editar") === "1";
  const presencaSalva = carregarPresencaSalva();
  const caminho = normalizarRota(caminhoOriginal);
  const respostaSalva = presencaSalva?.respostaPresenca ?? null;

  let caminhoFinal = caminho;

  if (!editarViaQuery) {
    if (caminho === "/" && respostaSalva === "sim") {
      caminhoFinal = "/presencaconfirmada";
    } else if (caminho === "/" && respostaSalva === "nao") {
      caminhoFinal = "/presencanaoconfirmada";
    }
  }

  if (caminhoFinal !== caminhoOriginal) {
    window.history.replaceState(null, "", caminhoFinal);
  }

  if (caminho === "/login") return <LoginAdmin />;
  if (caminho === "/presentes") return <Presentes />;
  if (caminhoFinal === "/presencaconfirmada") return <PresencaConfirmada />;
  if (caminhoFinal === "/presencanaoconfirmada") return <PresencaNaoConfirmada />;
  if (caminho === "/presencaconfirmada") return <PresencaConfirmada />;
  if (caminho === "/presencanaoconfirmada") return <PresencaNaoConfirmada />;
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
