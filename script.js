// 🔐 Login simples
const senhaCorreta = "uningati2025";

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // ==========================
  // Elementos principais
  // ==========================
  const loginSection = document.getElementById("loginSection");
  const sistema = document.getElementById("sistema");
  const loginForm = document.getElementById("loginForm") || null;
  const btnLogout = document.getElementById("btnLogout") || null;

  const form = document.getElementById("formEvento");
  const lista = document.getElementById("listaEventos");
  const filtroCurso = document.getElementById("filtroCurso");
  const buscaTexto = document.getElementById("buscaTexto");
  const estadoVazio = document.getElementById("estadoVazio");

  const campoDataHora = document.getElementById("dataHora");

  // ==========================
  // Catálogo de cursos (fonte única)
  // ==========================
  const cursos = [
    { value: "Sistemas para Internet", label: "Sistemas para Internet" },
    {
      value: "Análise e Desenvolvimento de Sistemas",
      label: "Análise e Desenvolvimento de Sistemas (ADS)",
    },
    { value: "Engenharia da Computação", label: "Engenharia da Computação" },
    { value: "Direito", label: "Direito" },
  ];

  // Preenche os <select> a partir de 'cursos'
  function preencherSelects() {
    // <select id="curso"> (formulário)
    const selCurso = document.getElementById("curso");
    if (selCurso) {
      selCurso.innerHTML = "";
      cursos.forEach((c) => {
        selCurso.insertAdjacentHTML(
          "beforeend",
          `<option value="${c.value}">${c.label}</option>`
        );
      });
    }

    // <select id="filtroCurso"> (filtro de lista)
    if (filtroCurso) {
      filtroCurso.innerHTML = `<option value="">Todos</option>`;
      cursos.forEach((c) => {
        // Mostra "ADS" curto no filtro, mas mantém o value completo
        const labelFiltro = c.label.replace(" (ADS)", "").replace("(ADS)", "ADS");
        filtroCurso.insertAdjacentHTML(
          "beforeend",
          `<option value="${c.value}">${labelFiltro}</option>`
        );
      });
    }
  }

  // ==========================
  // Login / Sessão
  // ==========================
  const mostrarSistema = () => {
    loginSection?.classList.add("hidden");
    sistema?.classList.remove("hidden");
  };

  const fazerLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      try {
        localStorage.removeItem("logado");
      } catch (err) {
        console.warn("Falha ao limpar sessão do localStorage", err);
      }
      location.reload();
    }
  };

  const fazerLogin = (senha) => {
    if (senha === senhaCorreta) {
      try {
        localStorage.setItem("logado", "true");
      } catch (err) {
        console.warn("Falha ao salvar sessão no localStorage", err);
      }
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
      loginSection?.classList.remove("hidden");
    }
  } catch (err) {
    console.warn("Falha ao ler sessão do localStorage", err);
    loginSection?.classList.remove("hidden");
  }

  // Login via formulário
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const senha = (document.getElementById("senha") || { value: "" }).value;
      fazerLogin(senha);
    });
  }
  if (btnLogout) btnLogout.addEventListener("click", fazerLogout);

  // ==========================
  // Dados / Persistência
  // ==========================
  const STORAGE_KEY = "eventos";
  let eventos = [];
  let editando = -1; // index no array "eventos"

  const carregarEventos = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      eventos = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(eventos)) eventos = [];
    } catch (err) {
      console.warn("Falha ao carregar eventos do localStorage", err);
      eventos = [];
    }
  };

  const salvarEventos = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos));
    } catch (err) {
      console.warn("Falha ao salvar eventos no localStorage", err);
    }
  };

  carregarEventos();

  // ==========================
  // Utilidades
  // ==========================
  // Normaliza string para comparação robusta (sem acentos/caixa/espaços)
  const normalizar = (str) => {
    return (str || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // remove acentos
  };

  // Normaliza valor de curso (só trim aqui; comparação usa normalizar())
  const sanitizeCurso = (value) => (value || "").toString().trim();

  const formatarDataHora = (isoString) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const dia = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const hora = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dia} às ${hora}`;
  };

  const mostrarMensagem = (texto, tipo = "sucesso") => {
    const mapa = {
      sucesso: "text-green-600",
      alerta: "text-yellow-600",
      erro: "text-red-600",
    };
    const cor = mapa[tipo] || mapa.sucesso;
    const aviso = document.createElement("div");
    aviso.textContent = texto;
    aviso.className = `${cor} font-semibold mt-4 text-center`;
    form.appendChild(aviso);
    setTimeout(() => aviso.remove(), 3000);
  };

  const validarEvento = (e) => {
    if (!e.titulo || !e.dataHora || !e.local) {
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

  // Preencher datetime-local com agora (corrigindo fuso)
  const setAgoraNoCampo = () => {
    if (!campoDataHora) return;
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    campoDataHora.value = agora.toISOString().slice(0, 16);
  };
  if (campoDataHora && !campoDataHora.value) setAgoraNoCampo();

  // ==========================
  // Renderização
  // ==========================
  const renderizarEventos = () => {
    const termo = (buscaTexto?.value || "").toString().trim();
    const filtro = (filtroCurso?.value || "").toString().trim();

    lista.setAttribute("aria-busy", "true");
    lista.innerHTML = "";

    let base = [...eventos];

    // Filtro por curso (tolerante a acentos/caixa/espaços)
    if (filtro) {
      const filtroNorm = normalizar(filtro);
      base = base.filter((e) => normalizar(e.curso) === filtroNorm);
    }

    // Busca texto em título/local (tolerante)
    if (termo) {
      const termoNorm = normalizar(termo);
      base = base.filter(
        (e) =>
          normalizar(e.titulo).includes(termoNorm) ||
          normalizar(e.local).includes(termoNorm)
      );
    }

    // Ordenar por data ascendente
    base.sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));

    if (estadoVazio) {
      estadoVazio.classList.toggle("hidden", base.length > 0);
    }

    base.forEach((evento) => {
      const originalIndex = eventos.indexOf(evento); // índice no array principal

      const li = document.createElement("li");
      li.className = "border p-4 rounded shadow bg-white";

      const h3 = document.createElement("h3");
      h3.className = "text-lg font-bold text-indigo-700 break-words";
      h3.textContent = evento.titulo;

      const pData = document.createElement("p");
      pData.innerHTML = `<strong>Data/Hora:</strong> ${formatarDataHora(
        evento.dataHora
      )}`;

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
      spanDesc.textContent = evento.descricao || "-";
      pDesc.appendChild(spanDesc);

      const divBtns = document.createElement("div");
      divBtns.className = "mt-3 space-x-2";

      const btnEditar = document.createElement("button");
      btnEditar.className =
        "px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600";
      btnEditar.textContent = "Editar";
      btnEditar.setAttribute("aria-label", "Editar evento");
      btnEditar.addEventListener("click", () => editarEvento(originalIndex));

      const btnExcluir = document.createElement("button");
      btnExcluir.className =
        "px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600";
      btnExcluir.textContent = "Excluir";
      btnExcluir.setAttribute("aria-label", "Excluir evento");
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

  // ==========================
  // Inicialização de selects e primeira render
  // ==========================
  preencherSelects();
  renderizarEventos();

  // ==========================
  // Handlers
  // ==========================
  // Submit do formulário
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const evento = {
      titulo: document.getElementById("titulo").value.trim(),
      dataHora: document.getElementById("dataHora").value,
      local: document.getElementById("local").value.trim(),
      publico: document.getElementById("publico").value.trim(),
      curso: sanitizeCurso(document.getElementById("curso").value),
      descricao: document.getElementById("descricao").value.trim(),
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
    setAgoraNoCampo(); // repõe datetime para "agora"
    renderizarEventos();
  });

  // Filtro por curso
  if (filtroCurso) {
    filtroCurso.addEventListener("change", renderizarEventos);
  }

  // Busca por texto (debounce leve)
  if (buscaTexto) {
    let timer = null;
    buscaTexto.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(renderizarEventos, 200);
    });
  }

  // Editar evento
  function editarEvento(index) {
    const evento = eventos[index];
    if (!evento) return;

    document.getElementById("titulo").value = evento.titulo;

    // Normaliza para datetime-local (YYYY-MM-DDTHH:mm)
    const d = new Date(evento.dataHora);
    const valorDatetime = isNaN(d.getTime())
      ? evento.dataHora // caso tenha sido salvo no formato correto já
      : new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
    document.getElementById("dataHora").value = valorDatetime;

    document.getElementById("local").value = evento.local;
    document.getElementById("publico").value = evento.publico || "";
    document.getElementById("curso").value = sanitizeCurso(evento.curso || "");
    document.getElementById("descricao").value = evento.descricao || "";

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

  // Expor apenas se o HTML usa onclick="..."
  window.fazerLogout = fazerLogout;
  window.fazerLogin = () => {
    const senha = (document.getElementById("senha") || { value: "" }).value;
    fazerLogin(senha);
  };
  window.editarEvento = editarEvento;
  window.excluirEvento = excluirEvento;
});
