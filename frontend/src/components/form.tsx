import { useState } from "react";
import { pedirApi } from "../lib/api";
import {
  celularValido,
  formatarCelular,
  limparDigitosCelular,
  salvarPresenca,
  type PresencaSalva,
} from "../lib/presenca";

const ENDERECO_MAPA =
  "https://www.google.com/maps/search/?api=1&query=Cerimonial+Porto+Bello,+R.+Nelcy+Lopes+Vieira,+140,+Jardim+Limoeiro,+Serra+-+ES,+29164-018";

type PropriedadesFormulario = {
  onConfirmacaoChange?: (confirmado: boolean) => void;
  presencaInicial?: PresencaSalva | null;
};

type RespostaConfirmacao = {
  mensagem: string;
  atualizado: boolean;
};

type PropriedadesCartao = {
  className?: string;
};

function IconePresente() {
  return (
    <svg
      className="action-icon action-svg"
      viewBox="0 0 96 96"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="gift-action-fill" x1="18" x2="78" y1="16" y2="84">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#d7dde5" />
        </linearGradient>
      </defs>
      <path
        d="M22 39h52a5 5 0 0 1 5 5v33a5 5 0 0 1-5 5H22a5 5 0 0 1-5-5V44a5 5 0 0 1 5-5z"
        fill="url(#gift-action-fill)"
      />
      <path d="M14 31h68a4 4 0 0 1 4 4v11H10V35a4 4 0 0 1 4-4z" fill="#f6f7f9" />
      <path d="M43 31h10v51H43z" fill="#061b3a" />
      <path d="M48 48c7-11 27-8 27 6 0 10-12 18-27 30-15-12-27-20-27-30 0-14 20-17 27-6z" fill="#061b3a" />
      <path
        d="M47 30C33 29 23 22 23 14c0-6 5-10 11-8 8 2 12 11 14 24zM49 30c14-1 24-8 24-16 0-6-5-10-11-8-8 2-12 11-13 24z"
        fill="none"
        stroke="#f6f7f9"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
      />
    </svg>
  );
}

function IconeMapa() {
  return (
    <svg
      className="action-icon action-svg"
      viewBox="0 0 96 96"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="map-action-fill" x1="24" x2="72" y1="10" y2="86">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#d7dde5" />
        </linearGradient>
      </defs>
      <path
        d="M48 7c19 0 34 15 34 34 0 24-34 50-34 50S14 65 14 41C14 22 29 7 48 7z"
        fill="url(#map-action-fill)"
      />
      <circle cx="48" cy="40" r="12" fill="#061b3a" />
      <circle cx="48" cy="40" r="5" fill="#f7f8fa" opacity="0.22" />
    </svg>
  );
}

export function CartaoCodigoVestimenta({ className = "" }: PropriedadesCartao) {
  return (
    <section
      className={`dress-code-card ${className}`.trim()}
      aria-label="Dress code para os XV anos de Isabela"
    >
      <img
        className="dress-code-image"
        src="/dress-code-isabela.png"
        alt="Dress code para os XV anos de Isabela: homens e mulheres em traje formal. Azul-marinho e preto estao reservados para a debutante."
      />
    </section>
  );
}

type PropriedadesAcoes = {
  className?: string;
};

export function AcoesConfirmacao({ className = "" }: PropriedadesAcoes) {
  return (
    <div className={`confirmation-actions ${className}`.trim()}>
      <a className="gift-link" href="/presentes">
        <span className="action-ornament" aria-hidden="true" />
        <IconePresente />
        <strong>Sugestão de presentes</strong>
        <span className="action-divider" aria-hidden="true" />
        <small>Clique para ver nossas sugestões</small>
      </a>
      <a
        className="gift-link"
        href={ENDERECO_MAPA}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="action-ornament" aria-hidden="true" />
        <IconeMapa />
        <strong>Local do evento</strong>
        <span className="action-divider" aria-hidden="true" />
        <small>Clique para abrir o mapa e ver o endereço</small>
      </a>
    </div>
  );
}

function Formulario({ onConfirmacaoChange, presencaInicial }: PropriedadesFormulario) {
  const [nome, setNome] = useState(presencaInicial?.nome ?? "");
  const [celular, setCelular] = useState(
    presencaInicial ? formatarCelular(presencaInicial.celular) : "",
  );
  const [presenca, setPresenca] = useState(presencaInicial?.respostaPresenca ?? "");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro("");

    if (!nome.trim() || !celular.trim() || !presenca) {
      setErro("Preencha o nome, o celular e informe sua presença.");
      return;
    }

    if (!celularValido(celular)) {
      setErro("Informe um celular válido com DDD.");
      return;
    }

    setCarregando(true);

    try {
      const nomeLimpo = nome.trim();
      const celularLimpo = limparDigitosCelular(celular);
      const presencaConfirmada = presenca === "sim";

      const resposta = await pedirApi<RespostaConfirmacao>("/confirmar-presenca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeLimpo,
          celular: celularLimpo,
          presenca: presencaConfirmada,
        }),
      });

      salvarPresenca({
        nome: nomeLimpo,
        celular: celularLimpo,
        respostaPresenca: presencaConfirmada ? "sim" : "nao",
        mensagem: resposta.mensagem,
      });
      onConfirmacaoChange?.(true);
      window.location.href =
        presencaConfirmada ? "/presencaconfirmada" : "/presencanaoconfirmada";
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar sua confirmação.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="form">
      <form onSubmit={handleSubmit}>
        <div className="form-heading">
          <span>Confirme sua presença</span>
        </div>

        <label htmlFor="nome">Nome</label>
        <input
          id="nome"
          type="text"
          placeholder="Digite seu nome"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          maxLength={100}
          required
        />

        <label htmlFor="celular">Celular</label>
        <input
          id="celular"
          type="tel"
          inputMode="tel"
          placeholder="(27) 99999-9999"
          value={celular}
          onChange={(event) => setCelular(formatarCelular(event.target.value))}
          maxLength={15}
          required
        />

        <p>Você confirma sua presença?</p>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="presenca"
              value="sim"
              checked={presenca === "sim"}
              onChange={() => setPresenca("sim")}
              required
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
            <span>Não</span>
          </label>
        </div>

        {erro && <p className="form-error" role="alert">{erro}</p>}

        <button type="submit" disabled={carregando}>
          {carregando ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}

export default Formulario;
