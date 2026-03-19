// ╔══════════════════════════════════════════════════════════╗
// ║  cat-core.js — NÚCLEO DE LA CATEGORÍA                   ║
// ╠══════════════════════════════════════════════════════════╣
// ║  Contiene:                                               ║
// ║  · Validación del tipo de categoría (URL param)         ║
// ║  · Variables de estado global                           ║
// ║  · Llamadas a la API (cargar, guardar, eliminar)        ║
// ║  · Actualización del header (contadores)                ║
// ║  · Inicialización del DOMContentLoaded                  ║
// ╚══════════════════════════════════════════════════════════╝

const params = new URLSearchParams(window.location.search);
const tipo   = params.get("tipo");
const config = CONFIG[tipo];

// Si la URL no tiene un tipo válido, mostrar error y parar
if (!tipo || !config) {
    document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:1rem;color:#6b7280">
            <div style="font-size:3rem">🔍</div>
            <h2 style="font-family:'Bebas Neue',cursive;font-size:2rem;letter-spacing:2px;color:#f0f2f7">Categoría no encontrada</h2>
            <a href="/" style="color:#e8ff47">← Volver al inicio</a>
        </div>`;
    throw new Error("Tipo inválido: " + tipo);
}

// ── Variables de estado global ────────────────────────────
// Estos son los datos que usa toda la aplicación.
// dataOriginal = todos los items cargados de la BD
// filtroEstado = el filtro activo del sidebar (null = todos)
// vistaActual  = "grid" o "list"
// idAEliminar  = id temporal antes de confirmar borrado
let dataOriginal = [];
let filtroEstado = null;
let vistaActual  = "grid";
let idAEliminar  = null;

// ── Título y sidebar ──────────────────────────────────────
document.getElementById("titulo-categoria").textContent =
    config.label ? config.label.slice(2).toUpperCase() : tipo.toUpperCase();

document.querySelectorAll(".platform-btn").forEach(btn => {
    const href = btn.getAttribute("href") ?? "";
    btn.classList.toggle("active", href.includes(`tipo=${tipo}`));
});

// ── API: cargar todos los items ───────────────────────────
function cargarItems() {
    fetch(`/items/${tipo}`)
        .then(r => r.json())
        .then(data => {
            dataOriginal = data;
            actualizarHeader();
            crearFiltros();
            aplicarOrden();
        })
        .catch(err => console.error("Error al cargar items:", err));
}

// ── API: actualizar item (recarga la lista después) ───────
// Usar solo cuando se necesite recargar toda la vista.
// Para cambios de progreso o edición rápida usar actualizarItemSilencioso().
function actualizarItem(item) {
    fetch(`/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
    })
        .then(r => r.json())
        .then(() => cargarItems())
        .catch(err => console.error("Error al actualizar:", err));
}

// ── API: actualizar item sin recargar la lista ────────────
// Solo hace el PUT a la BD. El DOM se actualiza por separado con parchear*.
function actualizarItemSilencioso(item) {
    fetch(`/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
    }).catch(err => console.error("Error al actualizar:", err));
}

// ── Contadores del header ─────────────────────────────────
function actualizarHeader() {
    const total       = dataOriginal.length;
    const completados = dataOriginal.filter(i => config.estadosCompletados?.includes(i.estado)).length;
    const rated       = dataOriginal.filter(i => i.valoracion > 0);
    const avg         = rated.length
        ? (rated.reduce((s, i) => s + i.valoracion, 0) / rated.length).toFixed(1)
        : "—";

    document.getElementById("total-count").textContent      = total;
    document.getElementById("completados-count").textContent = completados;
    document.getElementById("avg-rating-header").textContent = avg;
}

// ── Helper: escapar HTML para evitar XSS ─────────────────
function esc(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ── DOMContentLoaded: arranque de la página ───────────────
document.addEventListener("DOMContentLoaded", () => {
    crearFormulario();

    // Botón "+ Añadir" abre/cierra el formulario
    const toggleBtn     = document.getElementById("toggle-form");
    const formContainer = document.getElementById("form-container");

    toggleBtn.addEventListener("click", () => {
        const visible = !formContainer.classList.contains("oculto");
        formContainer.classList.toggle("oculto", visible);
        toggleBtn.textContent = visible ? "+ Añadir" : "✕ Cerrar";
    });

    // Modal de confirmación de borrado
    document.getElementById("btnConfirmar")?.addEventListener("click", () => {
        if (!idAEliminar) return;
        fetch(`/items/${idAEliminar}`, { method: "DELETE" })
            .then(r => r.json())
            .then(() => {
                idAEliminar = null;
                document.getElementById("modalConfirmacion").classList.add("oculto");
                cargarItems();
            });
    });

    document.getElementById("btnCancelar")?.addEventListener("click", () => {
        idAEliminar = null;
        document.getElementById("modalConfirmacion").classList.add("oculto");
    });

    // Cerrar modal de confirmación al hacer click fuera
    document.getElementById("modalConfirmacion")?.addEventListener("click", function(e) {
        if (e.target === this) {
            idAEliminar = null;
            this.classList.add("oculto");
        }
    });

    // Cerrar modal expandido al hacer click en el overlay
    document.getElementById("modal-expandido")?.addEventListener("click", function(e) {
        if (e.target !== this) return;

        // Si estamos en modo edición (formulario dentro del modal), volver
        const inner = document.querySelector(".modal-expandido-inner");
        if (inner && !inner.querySelector("#me-poster")) {
            const idActual = meItemActual?.id;
            if (idActual) { meVolverDesdeEdicion(idActual); return; }
        }

        cerrarModalExpandido();
    });

    // Escape cierra modales
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            cerrarModalExpandido();
            document.getElementById("modalConfirmacion").classList.add("oculto");
        }
    });

    // Guardar el HTML original del modal expandido
    meInnerHTMLOriginal = document.querySelector(".modal-expandido-inner").innerHTML;

    cargarItems();
});
