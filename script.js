const URL_ENVIO = "https://formspree.io/f/mrpqgelp";
const TEMPO_LIMITE_MS = 10000;

document.addEventListener("DOMContentLoaded", () => {

  const secoes = document.querySelectorAll("header[id], section[id]");
  const abas = document.querySelectorAll(".nav-tab");

  function atualizarAba() {
    let atual = "inicio";
    secoes.forEach((sec) => {
      if (window.scrollY >= sec.offsetTop - 140) atual = sec.id;
    });
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
      atual = secoes[secoes.length - 1].id;
    }
    abas.forEach((aba) => aba.classList.toggle("active", aba.dataset.section === atual));
  }
  window.addEventListener("scroll", atualizarAba);
  atualizarAba();

  const botaoSobre = document.getElementById("toggle-about-btn");
  const sobreExtra = document.getElementById("about-extra");

  botaoSobre.addEventListener("click", () => {
    const abrir = sobreExtra.hidden;
    sobreExtra.hidden = !abrir;
    botaoSobre.setAttribute("aria-expanded", String(abrir));
    botaoSobre.textContent = abrir ? "Mostrar menos" : "Ler mais";
  });


  document.querySelectorAll(".photocard-wrapper").forEach((cartao) => {
    cartao.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      cartao.classList.toggle("flipped");
    });
    cartao.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cartao.classList.toggle("flipped");
      }
    });
  });


  const botaoEmail = document.getElementById("copy-email-btn");
  const textoEmail = document.getElementById("email-text");

  botaoEmail.addEventListener("click", async () => {
    const email = botaoEmail.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      textoEmail.textContent = "E-mail copiado!";
      setTimeout(() => { textoEmail.textContent = email; }, 2000);
    } catch {
      textoEmail.textContent = email;
    }
  });


  const form = document.getElementById("form-contato");
  const nome = document.getElementById("nome");
  const email = document.getElementById("email");
  const motivo = document.getElementById("motivo");
  const blocoAssunto = document.getElementById("container-assunto");
  const assunto = document.getElementById("assunto");
  const mensagem = document.getElementById("mensagem");
  const contador = document.getElementById("contador-msg");
  const status = document.getElementById("status-envio");
  const btnEnviar = document.getElementById("btn-enviar");

  const campos = [nome, email, motivo, assunto, mensagem];
  let enviando = false;

  const regras = {
    nome: () => {
      const n = nome.value.trim().length;
      return n < 3 || n > 80 ? "O nome deve ter entre 3 e 80 caracteres." : "";
    },
    email: () => {
      const valor = email.value.trim();
      const formatoOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
      return !formatoOk || email.validity.typeMismatch ? "Insira um e-mail com formato válido." : "";
    },
    motivo: () => (motivo.value ? "" : "Selecione um motivo."),
    assunto: () => {
      if (assunto.disabled) return "";
      const n = assunto.value.trim().length;
      return n < 5 || n > 100 ? "O assunto deve ter entre 5 e 100 caracteres." : "";
    },
    mensagem: () => {
      const n = mensagem.value.trim().length;
      return n < 30 || n > 1000 ? "A mensagem precisa ter entre 30 e 1000 caracteres." : "";
    }
  };

  function validarCampo(campo) {
    const erro = regras[campo.id]();
    const espaco = document.getElementById("erro-" + campo.id);
    espaco.textContent = erro;
    if (erro) campo.setAttribute("aria-invalid", "true");
    else campo.removeAttribute("aria-invalid");
    return erro === "";
  }

  function mostrarStatus(texto, tipo) {
    status.textContent = texto;
    status.className = tipo;
  }

  function atualizarContador() {
    const n = mensagem.value.trim().length;
    contador.textContent = n + " / 1000";
    contador.classList.toggle("contador-alerta", n > 1000 || (n > 0 && n < 30));
  }

  function atualizarAssunto() {
    const outro = motivo.value === "Outro";
    blocoAssunto.hidden = !outro;
    assunto.disabled = !outro;
    if (!outro) {
      assunto.value = "";
      assunto.removeAttribute("aria-invalid");
      document.getElementById("erro-assunto").textContent = "";
    }
  }

  async function enviarMensagem() {
    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
    const corpo = {
      _subject: "Portfólio: " + motivo.value + (assunto.value.trim() ? " - " + assunto.value.trim() : ""),
      nome: nome.value.trim(),
      email: email.value.trim(),
      motivo: motivo.value,
      mensagem: mensagem.value.trim()
    };
    if (assunto.value.trim()) corpo.assunto = assunto.value.trim();

    try {
      const resposta = await fetch(URL_ENVIO, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(corpo),
        signal: controle.signal
      });
      if (!resposta.ok) throw new Error("Status " + resposta.status);
    } finally {
      clearTimeout(limite);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (enviando) return;
    mostrarStatus("", "");

    const invalidos = campos.filter((campo) => !validarCampo(campo));
    if (invalidos.length > 0) {
      mostrarStatus("Corrija " + invalidos.length + " campo(s) antes de enviar.", "erro");
      invalidos[0].focus();
      return;
    }

    enviando = true;
    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando...";
    mostrarStatus("Enviando sua mensagem...", "processando");

    try {
      await enviarMensagem();
      form.reset();
      atualizarAssunto();
      atualizarContador();
      mostrarStatus("Mensagem enviada com sucesso! Responderei no e-mail que você informou.", "sucesso");
    } catch (erro) {
      mostrarStatus("Falha no envio. Seus dados foram mantidos: tente novamente.", "erro");
    } finally {
      enviando = false;
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Enviar mensagem";
    }
  });

  campos.forEach((campo) => {
    campo.addEventListener("blur", () => validarCampo(campo));
    campo.addEventListener("input", () => {
      if (campo.hasAttribute("aria-invalid")) validarCampo(campo);
    });
  });
  mensagem.addEventListener("input", atualizarContador);
  motivo.addEventListener("change", atualizarAssunto);
});