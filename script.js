// 🔐 Login simples
const senhaCorreta = "uningati2025";

document.addEventListener("DOMContentLoaded", () => {
  // Verifica se já está logado
  if (localStorage.getItem("logado") === "true") {
    mostrarSistema();
  } else {
    document.getElementById("loginSection").classList.remove("hidden");
  }

 const campoDataHora = document.getElementById("dataHora");
if (campoDataHora && !campoDataHora.value) {
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset()); // corrige fuso horário
  campoDataHora.value = agora.toISOString().slice(0, 16); // aplica no formato do input
}


  // Variáveis DOM
  const form = document.getElementById('formEvento');
  const lista = document.getElementById('listaEventos');
  const filtroCurso = document.getElementById('filtroCurso');

  let eventos = JSON.parse(localStorage.getItem('eventos')) || [];
  let editando = -1;

  renderizarEventos();

  // Submissão do formulário
  form.addEventListener('submit', e => {
    e.preventDefault();

    const evento = {
      titulo: document.getElementById('titulo').value.trim(),
      dataHora: document.getElementById('dataHora').value,
      local: document.getElementById('local').value,
      publico: document.getElementById('publico').value,
      curso: document.getElementById('curso').value,
      descricao: document.getElementById('descricao').value
    };

    if (!evento.titulo) {
      alert("O título do evento é obrigatório!");
      return;
    }

    if (editando === -1) {
      eventos.push(evento);
      mostrarMensagem("Evento cadastrado com sucesso!");
    } else {
      eventos[editando] = evento;
      mostrarMensagem("Evento atualizado com sucesso!", "yellow");
      editando = -1;
    }

    localStorage.setItem('eventos', JSON.stringify(eventos));
    form.reset();
    renderizarEventos();
  });

  // Filtro por curso
  filtroCurso.addEventListener('change', renderizarEventos);

  // Renderizar eventos na tela
  function renderizarEventos() {
    const filtro = filtroCurso.value;
    lista.innerHTML = '';
    const eventosFiltrados = filtro ? eventos.filter(e => e.curso === filtro) : eventos;

    eventosFiltrados.forEach((evento, index) => {
      const li = document.createElement('li');
      li.className = 'border p-4 rounded shadow bg-white';
      li.innerHTML = `
        <h3 class="text-lg font-bold text-indigo-700">${evento.titulo}</h3>
        <p><strong>Data/Hora:</strong> ${formatarDataHora(evento.dataHora)}</p>
        <p><strong>Local:</strong> ${evento.local}</p>
        <p><strong>Público:</strong> ${evento.publico}</p>
        <p><strong>Curso:</strong> ${evento.curso}</p>
        <p><strong>Descrição:</strong> ${evento.descricao}</p>
        <div class="mt-3 space-x-2">
          <button onclick="editarEvento(${index})" class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Editar</button>
          <button onclick="excluirEvento(${index})" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Excluir</button>
        </div>
      `;
      lista.appendChild(li);
    });
  }

  // Formatar data/hora para o formato brasileiro
  function formatarDataHora(isoString) {
    const data = new Date(isoString);
    const [dia, hora] = data.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).split(', ');
    return `${dia} às ${hora}`;
  }

  // Editar evento
  window.editarEvento = function(index) {
    const evento = eventos[index];
    document.getElementById('titulo').value = evento.titulo;
    document.getElementById('dataHora').value = evento.dataHora;
    document.getElementById('local').value = evento.local;
    document.getElementById('publico').value = evento.publico;
    document.getElementById('curso').value = evento.curso;
    document.getElementById('descricao').value = evento.descricao;
    editando = index;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Excluir evento
  window.excluirEvento = function(index) {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      eventos.splice(index, 1);
      localStorage.setItem('eventos', JSON.stringify(eventos));
      renderizarEventos();
      mostrarMensagem("Evento excluído com sucesso!", "red");
    }
  }

  // Mensagens de feedback
  function mostrarMensagem(texto, cor = "green") {
    const aviso = document.createElement("div");
    aviso.textContent = texto;
    aviso.className = `text-${cor}-600 font-semibold mt-4 text-center`;
    form.appendChild(aviso);
    setTimeout(() => aviso.remove(), 3000);
  }
});

// Função global: logout
function fazerLogout() {
  if (confirm("Deseja realmente sair?")) {
    localStorage.removeItem("logado");
    location.reload();
  }
}

// Função global: mostrar sistema (pós-login)
function mostrarSistema() {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("sistema").classList.remove("hidden");
}

// Função global: login
function fazerLogin() {
  const senha = document.getElementById("senha").value;
  if (senha === senhaCorreta) {
    localStorage.setItem("logado", "true");
    mostrarSistema();
  } else {
    alert("Senha incorreta!");
  }
}
