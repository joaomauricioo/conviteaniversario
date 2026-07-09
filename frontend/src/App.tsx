import Home from "./pages/home";
import Relatorio from "./pages/relatorio";
import CadastroPresente from "./pages/cadastropresente";
import Presentes from "./pages/presentes";
import PresencaConfirmada from "./pages/presencaconfirmada";
import PresencaNaoConfirmada from "./pages/presencanaoconfirmada";
import "./App.css";

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/relatorio") return <Relatorio />;
  if (path === "/cadastropresente") return <CadastroPresente />;
  if (path === "/presentes") return <Presentes />;
  if (path === "/prensencaconfirmada") return <PresencaConfirmada />;
  if (path === "/presencaconfirmada") return <PresencaConfirmada />;
  if (path === "/presencanaoconfirmada") return <PresencaNaoConfirmada />;

  return <Home />;
}

export default App
