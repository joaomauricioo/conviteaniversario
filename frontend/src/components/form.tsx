import { useEffect, useRef, useState } from "react";
import { pedirApi } from "../lib/api";
import {
  celularValido,
  formatarCelular,
  limparDigitosCelular,
  salvarPresenca,
  type PresencaSalva,
  type RespostaPresenca,
} from "../lib/presenca";

const ENDERECO_MAPA =
  "https://www.google.com/maps/search/?api=1&query=Cerimonial+Porto+Bello,+R.+Nelcy+Lopes+Vieira,+140,+Jardim+Limoeiro,+Serra+-+ES,+29164-018";

type PropriedadesFormulario = {
  onConfirmacaoChange?: (confirmado: RespostaPresenca) => void;
  presencaInicial?: PresencaSalva | null;
  permitirEdicaoLivre?: boolean;
};

type RespostaConfirmacao = {
  mensagem: string;
  atualizado: boolean;
};

type PropriedadesCartao = {
  className?: string;
};

type PropriedadesIconeImagem = {
  src: string;
};

function IconeImagem({ src }: PropriedadesIconeImagem) {
  return (
    <span className="image-icon action-icon" aria-hidden="true">
      <img src={src} alt="" />
    </span>
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
        src="/dress-code-isabela.jpeg"
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
      <div className="dress-code-card">
        <img
          className="dress-code-image"
          src="/sugestoes-presentes.jpeg"
          alt="Sugestões de presentes"
        />
      </div>
      <a
        className="gift-link"
        href={ENDERECO_MAPA}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="action-ornament" aria-hidden="true" />
        <IconeImagem src="/icone-localizacao.png" />
        <strong>Local do evento</strong>
        <span className="action-divider" aria-hidden="true" />
        <small>Clique para abrir o mapa e ver o endereço</small>
      </a>
    </div>
  );
}

function Formulario({
  onConfirmacaoChange,
  presencaInicial,
  permitirEdicaoLivre = false,
}: PropriedadesFormulario) {
  const celularRef = useRef<HTMLInputElement | null>(null);
  const celularConfirmacaoRef = useRef<HTMLInputElement | null>(null);
  const bloquearDadosPessoais = Boolean(presencaInicial && permitirEdicaoLivre);
  const [nome, setNome] = useState(presencaInicial?.nome ?? "");
  const [celular, setCelular] = useState(
    presencaInicial ? formatarCelular(presencaInicial.celular) : "",
  );
  const [presenca, setPresenca] = useState(presencaInicial?.respostaPresenca ?? "");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mostrarConfirmacaoNumero, setMostrarConfirmacaoNumero] = useState(false);

  useEffect(() => {
    if (!mostrarConfirmacaoNumero) return;

    window.requestAnimationFrame(() => {
      celularConfirmacaoRef.current?.focus();
      celularConfirmacaoRef.current?.select();
    });
  }, [mostrarConfirmacaoNumero]);

  async function enviarConfirmacao(ignorarConfirmacaoNumero = false) {
    if (!nome.trim() || !celular.trim() || !presenca) {
      setErro("Preencha o nome, o celular e informe sua presença.");
      return;
    }

    if (!celularValido(celular)) {
      setErro("Informe um celular válido com DDD.");
      return;
    }

    const nomeLimpo = nome.trim();
    const celularLimpo = limparDigitosCelular(celular);
    const presencaConfirmada = presenca === "sim";

    if (presencaConfirmada && !ignorarConfirmacaoNumero) {
      setMostrarConfirmacaoNumero(true);
      return;
    }

    setCarregando(true);
    setErro("");
    setMostrarConfirmacaoNumero(false);

    try {
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
      onConfirmacaoChange?.(presencaConfirmada ? "sim" : "nao");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar sua confirmação.",
      );
    } finally {
      setCarregando(false);
      if (!presencaConfirmada) {
        setMostrarConfirmacaoNumero(false);
      }
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro("");
    await enviarConfirmacao();
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
          readOnly={bloquearDadosPessoais}
          aria-readonly={bloquearDadosPessoais}
          onChange={(event) => {
            if (bloquearDadosPessoais) return;
            setNome(event.target.value);
            setMostrarConfirmacaoNumero(false);
          }}
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
          ref={celularRef}
          readOnly={bloquearDadosPessoais}
          aria-readonly={bloquearDadosPessoais}
          onChange={(event) => {
            if (bloquearDadosPessoais) return;
            setCelular(formatarCelular(event.target.value));
            setMostrarConfirmacaoNumero(false);
          }}
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
              onChange={() => {
                setPresenca("sim");
                setMostrarConfirmacaoNumero(false);
              }}
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
              onChange={() => {
                setPresenca("nao");
                setMostrarConfirmacaoNumero(false);
              }}
            />
            <span>Não</span>
          </label>
        </div>

        {erro && (
          <p className="form-error" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" disabled={carregando}>
          {carregando ? "Enviando..." : "Enviar"}
        </button>

        {mostrarConfirmacaoNumero && (
          <div
            className="presence-check-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="presence-check-title"
          >
            <div className="presence-check-panel">
              <h3 id="presence-check-title">Confira o número informado</h3>
              <label className="presence-check-field" htmlFor="celular-confirmacao">
                <span className="sr-only">Número</span>
                <input
                  id="celular-confirmacao"
                  ref={celularConfirmacaoRef}
                  type="tel"
                  inputMode="tel"
                  value={celular}
                  readOnly={bloquearDadosPessoais}
                  aria-readonly={bloquearDadosPessoais}
                  onChange={(event) => {
                    if (bloquearDadosPessoais) return;
                    setCelular(formatarCelular(event.target.value));
                  }}
                  maxLength={15}
                  aria-label="Número"
                />
              </label>
              <div className="presence-check-actions">
                <button
                  type="button"
                  className="presence-check-primary"
                  onClick={() => void enviarConfirmacao(true)}
                  disabled={carregando}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default Formulario;
