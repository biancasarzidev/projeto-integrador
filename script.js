// 🔐 Login simples
const senhaCorreta = "uningati2025";

window.onload = () => {
  if (localStorage.getItem("logado") === "true") {
    mostrarSistema();
  } else {
    document.getElementById("loginSection").classList.remove("hidden");
  }
};

function fazerLogin() {
  const senha = document.getElementById("senha").value;
  if (senha === senhaCorreta) {
    localStorage.setItem("logado", "true");
    mostrarSistema();
  } else {
    alert("Senha incorreta!");
  }
}

function fazerLogout() {
  localStorage.removeItem("logado");
  location.reload();
}

function mostrarSistema() {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("sistema").classList.remove("hidden");
}

// 🎯 Lógica de agendamento
const form = document.getElementById('formEvento');
const lista = document.getElementById('listaEventos');
const filtroCurso = document.getElementById('filtroCurso');

let eventos = JSON.parse(localStorage.getItem('eventos')) || [];
let editando = -1;

renderizarEventos();

form.addEventListener('submit', e => {
  e.preventDefault();

  const evento = {
    titulo: document.getElementById('titulo').value,
    dataHora: document.getElementById('dataHora').value,
    local: document.getElementById('local').value,
    publico: document.getElementById('publico').value,
    curso: document.getElementById('curso').value,
    descricao: document.getElementById('descricao').value
  };

  if (editando === -1) {
    eventos.push(evento);
  } else {
    eventos[editando] = evento;
    editando = -1;
  }

  localStorage.setItem('eventos', JSON.stringify(eventos));
  form.reset();
  renderizarEventos();
});

filtroCurso.addEventListener('change', renderizarEventos);

function renderizarEventos() {
  const filtro = filtroCurso.value;
  lista.innerHTML = '';
  const eventosFiltrados = filtro ? eventos.filter(e => e.curso === filtro) : eventos;

  eventosFiltrados.forEach((evento, index) => {
    const li = document.createElement('li');
    li.className = 'border p-4 rounded shadow bg-white';
    li.innerHTML = `
      <h3 class="text-lg font-bold text-indigo-700">${evento.titulo}</h3>
      <p><strong>Data/Hora:</strong> ${evento.dataHora}</p>
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

function editarEvento(index) {
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

function excluirEvento(index) {
  if (confirm('Tem certeza que deseja excluir este evento?')) {
    eventos.splice(index, 1);
    localStorage.setItem('eventos', JSON.stringify(eventos));
    renderizarEventos();
  }
}
