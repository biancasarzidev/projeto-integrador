// 🔐 Login simples
const senhaCorreta = "uningati2025";

document.addEventListener("DOMContentLoaded", () => {
  // Elementos principais
  const loginSection = document.getElementById("loginSection");
  const sistema = document.getElementById("sistema");
  const loginForm = document.getElementById("loginForm") || null; // compatível com HTML atual/antigo
  const btnLogout = document.getElementById("btnLogout") || null;

  const form = document.getElementById("formEvento");
  const lista = document.getElementById("listaEventos");
  const filtroCurso = document.getElementById("filtroCurso");
  const buscaTexto = document.getElementById("buscaTexto"); // pode não existir no seu HTML original
  const estadoVazio = document.getElementById("estadoVazio");

  // --------- Login / Sessão ----------
  const mostrarSistema = () => {
    // Se você trocou a classe .hidden pelo nosso .is-hidden no CSS, ajuste aqui também.
    loginSection.classList.add("hidden");
    sistema.classList.remove("hidden");
  };

  const fazerLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      try { localStorage.removeItem("logado"); } catch {}
      location.reload();
    }
  };

  const fazerLogin = (senha) => {
    if (senha === senhaCorreta) {
      try { localStorage.setItem("logado", "true"); } catch {}
      mostrarSistema();
    } else {
      alert("Senha incorreta!");
    }
  };

  // Estado inicial de login
  try {
    if (localStorage.getItem("logado") === "true") {
      mostrarSistema();
    } else {
      loginSection.classList.remove("hidden");
    }
  } catch {
    loginSection.classList.remove("hidden");
  }

  // Suporte a submit no form de login (se existir) e ao botão original com onclick
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const senha = (document.getElementById("senha") || { value: "" }).value;
      fazerLogin(senha);
    });
  }
  if (btnLogout) {
    btnLogout.addEventListener("click", fazerLogout);
  }

  // --------- Dados / Persistência ----------
  const STORAGE_KEY = "eventos";
  let eventos = [];
  let editando = -1; // index no array "eventos"

  const carregarEventos = () => {
    try {
      eventos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      if (!Array.isArray(eventos)) eventos = [];
    } catch {
      eventos = [];
    }
  };

  const salvarEventos = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos));
    } catch {}
  };

  carregarEventos();

  // Preencher datetime-local com agora (corrigindo fuso)
  const campoDataHora = document.getElementById("dataHora");
  if (campoDataHora && !campoDataHora.value) {
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    campoDataHora.value = agora.toISOString().slice(0, 16);
  }

  // --------- Utilidades ----------
  const formatarDataHora = (isoString) => {
    const d = new Date(isoString);
    // Fallback se data inválida
    if (isNaN(d.getTime())) return isoString;
    const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `${dia} às ${hora}`;
  };

  const mostrarMensagem = (texto, tipo = "sucesso") => {
    // tipagem fixa para Tailwind não “perder” a classe
    const mapa = {
      sucesso: "text-green-600",
      alerta: "text-yellow-600",
      erro: "text-red-600"
    };
    const cor = mapa[tipo] || mapa.sucesso;
    const aviso = document.createElement("div");
    aviso.textContent = texto;
    aviso.className = `${cor} font-semibold mt-4 text-center`;
    form.appendChild(aviso);
    setTimeout(() => aviso.remove(), 3000);
  };

  const validarEvento = (e) => {
    if (!e.titulo || !e.dataHora || !e.local || !e.descricao) {
      mostrarMensagem("Preencha os campos obrigatórios!", "erro");
      return false;
    }
    // bloquear data passada (tolerância 1 min)
    const agora = new Date();
    const date = new Date(e.dataHora);
    if (isNaN(date.getTime()) || date.getTime() < agora.getTime() - 60 * 1000) {
      mostrarMensagem("Escolha uma data e hora futura.", "erro");
      return false;
    }
    return true;
  };

  // --------- Renderização ----------
  const renderizarEventos = () => {
    const termo = (buscaTexto?.value || "").toLowerCase().trim();
    const filtro = (filtroCurso?.value || "").trim();

    lista.setAttribute("aria-busy", "true");
    lista.innerHTML = "";

    let base = [...eventos];

    // Filtro por curso
    if (filtro) base = base.filter(e => e.curso === filtro);

    // Busca texto em título/local
    if (termo) {
      base = base.filter(e =>
        (e.titulo || "").toLowerCase().includes(termo) ||
        (e.local || "").toLowerCase().includes(termo)
      );
    }

    // Ordenar por data ascendente
    base.sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));

    if (estadoVazio) {
      estadoVazio.classList.toggle("hidden", base.length > 0);
    }

    base.forEach((evento) => {
      const originalIndex = eventos.indexOf(evento); // índice correto no array principal

      const li = document.createElement("li");
      li.className = "border p-4 rounded shadow bg-white";

      const h3 = document.createElement("h3");
      h3.className = "text-lg font-bold text-indigo-700";
      h3.textContent = evento.titulo;

      const pData = document.createElement("p");
      pData.innerHTML = `<strong>Data/Hora:</strong> ${formatarDataHora(evento.dataHora)}`;

      const pLocal = document.createElement("p");
      pLocal.innerHTML = `<strong>Local:</strong> `;
      const spanLocal = document.createElement("span");
      spanLocal.textContent = evento.local;
      pLocal.appendChild(spanLocal);

      const pPublico = document.createElement("p");
      pPublico.innerHTML = `<strong>Público:</strong> `;
      const spanPublico = document.createElement("span");
      spanPublico.textContent = evento.publico || "-";
      pPublico.appendChild(spanPublico);

      const pCurso = document.createElement("p");
      pCurso.innerHTML = `<strong>Curso:</strong> `;
      const spanCurso = document.createElement("span");
      spanCurso.textContent = evento.curso || "-";
      pCurso.appendChild(spanCurso);

      const pDesc = document.createElement("p");
      pDesc.innerHTML = `<strong>Descrição:</strong> `;
      const spanDesc = document.createElement("span");
      spanDesc.textContent = evento.descricao;
      pDesc.appendChild(spanDesc);

      const divBtns = document.createElement("div");
      divBtns.className = "mt-3 space-x-2";

      const btnEditar = document.createElement("button");
      btnEditar.className = "px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600";
      btnEditar.textContent = "Editar";
      btnEditar.addEventListener("click", () => editarEvento(originalIndex));

      const btnExcluir = document.createElement("button");
      btnExcluir.className = "px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", () => excluirEvento(originalIndex));

      divBtns.appendChild(btnEditar);
      divBtns.appendChild(btnExcluir);

      li.appendChild(h3);
      li.appendChild(pData);
      li.appendChild(pLocal);
      li.appendChild(pPublico);
      li.appendChild(pCurso);
      li.appendChild(pDesc);
      li.appendChild(divBtns);

      lista.appendChild(li);
    });

    lista.setAttribute("aria-busy", "false");
  };

  // Primeira renderização
  renderizarEventos();

  // --------- Handlers ----------
  // Submit do formulário
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const evento = {
      titulo: document.getElementById("titulo").value.trim(),
      dataHora: document.getElementById("dataHora").value,
      local: document.getElementById("local").value.trim(),
      publico: document.getElementById("publico").value.trim(),
      curso: document.getElementById("curso").value,
      descricao: document.getElementById("descricao").value.trim()
    };

    if (!validarEvento(evento)) return;

    if (editando === -1) {
      eventos.push(evento);
      mostrarMensagem("Evento cadastrado com sucesso!", "sucesso");
    } else {
      eventos[editando] = evento;
      mostrarMensagem("Evento atualizado com sucesso!", "alerta");
      editando = -1;
    }

    salvarEventos();
    form.reset();
    // Repor datetime para agora após reset
    if (campoDataHora) {
      const agora = new Date();
      agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
      campoDataHora.value = agora.toISOString().slice(0, 16);
    }
    renderizarEventos();
  });

  // Filtro por curso
  filtroCurso.addEventListener("change", renderizarEventos);

  // Busca por texto (se existir no HTML)
  if (buscaTexto) {
    let timer = null;
    buscaTexto.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(renderizarEventos, 200); // debounce leve
    });
  }

  // Editar evento
  function editarEvento(index) {
    const evento = eventos[index];
    if (!evento) return;
    document.getElementById("titulo").value = evento.titulo;
    document.getElementById("dataHora").value = evento.dataHora;
    document.getElementById("local").value = evento.local;
    document.getElementById("publico").value = evento.publico;
    document.getElementById("curso").value = evento.curso;
    document.getElementById("descricao").value = evento.descricao;
    editando = index;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Excluir evento
  function excluirEvento(index) {
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      eventos.splice(index, 1);
      salvarEventos();
      renderizarEventos();
      mostrarMensagem("Evento excluído com sucesso!", "erro");
    }
  }

  // Expor apenas se seu HTML ainda usa onclick="fazerLogout()" ou similares
  window.fazerLogout = fazerLogout;
  window.fazerLogin = () => {
    const senha = (document.getElementById("senha") || { value: "" }).value;
    fazerLogin(senha);
  };
  window.editarEvento = editarEvento;
  window.excluirEvento = excluirEvento;
});
