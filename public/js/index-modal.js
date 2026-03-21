// index-modal.js — variables y modal exclusivos del dashboard
let dataOriginal = [];
let tipo         = null;
let config       = null;

function abrirModalDesdeIndex(id) {
    const item = todosLosItems.find(i => i.id === id);
    if (!item) return;
    tipo         = item.tipo;
    config       = CONFIG[item.tipo];
    dataOriginal = todosLosItems;
    if (!meInnerHTMLOriginal) {
        meInnerHTMLOriginal = document.querySelector(".modal-expandido-inner").innerHTML;
    }
    abrirModalExpandido(id);
}

function actualizarItemSilenciosoIndex(item) {
    const _u = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    const esAdmin = !_u || _u.rol === "admin";
    const url  = esAdmin ? `/items/${item.id}` : `/progreso/${_u.id}/${item.id}`;
    const body = esAdmin ? item : {
        estado: item.estado, valoracion: item.valoracion,
        capituloActual: item.capituloActual, paginaActual: item.paginaActual,
        progresoManga: item.progresoManga, progreso: item.progreso
    };
    fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })
    .then(() => {
        const idx = todosLosItems.findIndex(i => i.id === item.id);
        if (idx !== -1) Object.assign(todosLosItems[idx], item);
    })
    .catch(err => console.error("Error al actualizar:", err));
}

document.addEventListener("DOMContentLoaded", () => {
    meInnerHTMLOriginal = document.querySelector(".modal-expandido-inner")?.innerHTML ?? "";
    document.getElementById("modal-expandido")?.addEventListener("click", function(e) {
        if (e.target === this) cerrarModalExpandido();
    });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") cerrarModalExpandido();
    });
});