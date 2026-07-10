import "./App.css";
import CadastroPresente from "./pages/cadastropresente";
import Inicio from "./pages/home";
import Presentes from "./pages/presentes";
import PresencaConfirmada from "./pages/presencaconfirmada";
import PresencaNaoConfirmada from "./pages/presencanaoconfirmada";
import Relatorio from "./pages/relatorio";

function App() {
  const caminho = window.location.pathname.replace(/\/+$/, "") || "/";

  if (caminho === "/relatorio") return <Relatorio />;
  if (caminho === "/cadastropresente") return <CadastroPresente />;
  if (caminho === "/presentes") return <Presentes />;
  if (caminho === "/confirmar-presenca") return <Inicio permitirAtualizacao />;
  if (caminho === "/prensencaconfirmada") return <PresencaConfirmada />;
  if (caminho === "/presencaconfirmada") return <PresencaConfirmada />;
  if (caminho === "/presencanaoconfirmada") return <PresencaNaoConfirmada />;

  return <Inicio />;
}

export default App;
