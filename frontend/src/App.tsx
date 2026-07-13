import "./App.css";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { obterSessaoAdmin, redirecionarParaLogin } from "./lib/admin";
import CadastroPresente from "./pages/cadastropresente";
import Inicio from "./pages/home";
import LoginAdmin from "./pages/login";
import Presentes from "./pages/presentes";
import PresencaConfirmada from "./pages/presencaconfirmada";
import PresencaNaoConfirmada from "./pages/presencanaoconfirmada";
import Relatorio from "./pages/relatorio";

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

function App() {
  const caminho = window.location.pathname.replace(/\/+$/, "") || "/";

  if (caminho === "/login") return <LoginAdmin />;
  if (caminho === "/relatorio") {
    return (
      <RotaAdministrativa>
        <Relatorio />
      </RotaAdministrativa>
    );
  }
  if (caminho === "/cadastropresente") {
    return (
      <RotaAdministrativa>
        <CadastroPresente />
      </RotaAdministrativa>
    );
  }
  if (caminho === "/presentes") return <Presentes />;
  if (caminho === "/confirmar-presenca") return <Inicio permitirAtualizacao />;
  if (caminho === "/prensencaconfirmada") return <PresencaConfirmada />;
  if (caminho === "/presencaconfirmada") return <PresencaConfirmada />;
  if (caminho === "/presencanaoconfirmada") return <PresencaNaoConfirmada />;

  return <Inicio />;
}

export default App;
