import { useState } from "react";
import { pedirApi } from "../lib/api";
import {
  celularValido,
  formatarCelular,
  limparDigitosCelular,
  salvarPresenca,
} from "../lib/presenca";

const ENDERECO_MAPA =
  "https://www.google.com/maps/search/?api=1&query=Cerimonial+Porto+Bello,+R.+Nelcy+Lopes+Vieira,+140,+Jardim+Limoeiro,+Serra+-+ES,+29164-018";

type PropriedadesFormulario = {
  onConfirmacaoChange?: (confirmado: boolean) => void;
};

type RespostaConfirmacao = {
  mensagem: string;
  atualizado: boolean;
};

type PropriedadesCartao = {
  className?: string;
};

function IconeTrajeMasculino() {
  return (
    <svg
      className="dress-code-avatar dress-code-avatar-man"
      viewBox="0 0 90 150"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="45" cy="145" rx="26" ry="4" fill="#d7dbe0" opacity="0.65" />
      <path d="M31 55h28l7 48H24z" fill="#070707" />
      <path d="M34 54l11 26 11-26z" fill="#ffffff" />
      <path d="M39 58l6 7 6-7-6 26z" fill="#061b3a" />
      <path d="M29 57c-7 9-11 27-10 49h9c1-18 4-34 9-45z" fill="#111111" />
      <path d="M61 57c7 9 11 27 10 49h-9c-1-18-4-34-9-45z" fill="#111111" />
      <path d="M30 102h14v39H30z" fill="#080808" />
      <path d="M47 102h14v39H47z" fill="#080808" />
      <path d="M28 139h18v6H28z" fill="#050505" />
      <path d="M45 139h18v6H45z" fill="#050505" />
      <circle cx="45" cy="31" r="16" fill="#f0c9ad" />
      <path
        d="M29 29c2-12 11-18 24-15 8 2 12 7 13 14-7-7-23-9-37 1z"
        fill="#141414"
      />
      <path d="M31 32c2 9 7 15 14 15s12-6 14-15c-8 3-19 3-28 0z" fill="#edc6aa" />
      <path d="M39 54h12l-6 8z" fill="#f5f5f5" />
      <path d="M59 59h6v4h-6z" fill="#f5f5f5" />
    </svg>
  );
}

function IconeTrajeFeminino() {
  return (
    <svg
      className="dress-code-avatar dress-code-avatar-woman"
      viewBox="0 0 100 150"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="50" cy="145" rx="34" ry="4" fill="#d7dbe0" opacity="0.65" />
      <path
        d="M21 142c8-46 13-76 29-91 16 15 22 45 30 91z"
        fill="#061b3a"
      />
      <path
        d="M32 142c7-38 12-64 18-82 8 18 13 44 20 82z"
        fill="#0b2f62"
        opacity="0.88"
      />
      <path d="M36 58c6-9 22-9 28 0l-5 22H41z" fill="#103b72" />
      <path d="M41 57h18l-9 10z" fill="#f0c9ad" />
      <path d="M34 64c-7 11-10 25-11 42h7c2-16 6-29 12-40z" fill="#f0c9ad" />
      <path d="M66 64c7 11 10 25 11 42h-7c-2-16-6-29-12-40z" fill="#f0c9ad" />
      <circle cx="50" cy="35" r="15" fill="#f0c9ad" />
      <path
        d="M36 35c-2-12 5-22 17-22 10 0 17 8 16 20-10-8-22-8-33 2z"
        fill="#171313"
      />
      <circle cx="33" cy="30" r="9" fill="#171313" />
      <circle cx="67" cy="30" r="9" fill="#171313" />
      <path d="M37 37c4 8 8 12 13 12s10-4 13-12c-7 3-18 3-26 0z" fill="#edc6aa" />
      <path d="M36 58c7 5 21 5 28 0l-3 12H39z" fill="#061b3a" />
    </svg>
  );
}

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
      aria-labelledby="dress-code-title"
    >
      <div className="dress-code-inner">
        <span className="dress-code-crown" aria-hidden="true" />
        <p className="dress-code-kicker">PARA OS XV ANOS DE</p>
        <h3 id="dress-code-title">DRESS CODE</h3>
        <strong>Isabela</strong>
        <p className="dress-code-formality">Esporte Fino</p>

        <div className="dress-code-people" aria-label="Trajes recomendados">
          <div className="dress-code-person">
            <span>HOMENS</span>
            <div className="dress-code-figure dress-code-man" aria-hidden="true">
              <IconeTrajeMasculino />
            </div>
          </div>

          <div className="dress-code-person">
            <span>MULHERES</span>
            <div className="dress-code-figure dress-code-woman" aria-hidden="true">
              <IconeTrajeFeminino />
            </div>
          </div>
        </div>

        <div className="dress-code-note">
          <span>EVITE USAR</span>
          <strong>AZUL MARINHO E PRETO</strong>
          <p>Essas cores estão reservadas para a debutante.</p>
        </div>
      </div>
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

function Formulario({ onConfirmacaoChange }: PropriedadesFormulario) {
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [presenca, setPresenca] = useState("");
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
