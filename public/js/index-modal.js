// index-modal.js — solo variables exclusivas del index
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

function actualizarItemSilencioso(item) {
    fetch(`/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
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