// 🔐 Login simples
renderizarEventos();


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