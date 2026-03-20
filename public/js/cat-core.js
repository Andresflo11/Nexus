// ╔══════════════════════════════════════════════════════════╗
// ║  cat-core.js — NÚCLEO DE LA CATEGORÍA                   ║
// ╚══════════════════════════════════════════════════════════╝

const params = new URLSearchParams(window.location.search);
const tipo   = params.get("tipo");
const config = CONFIG[tipo];

if (!tipo || !config) {
    document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:1rem;color:#6b7280">
            <div style="font-size:3rem">🔍</div>
            <h2 style="font-family:'Bebas Neue',cursive;font-size:2rem;letter-spacing:2px;color:#f0f2f7">Categoría no encontrada</h2>
            <a href="/" style="color:#e8ff47">← Volver al inicio</a>
        </div>`;
    throw new Error("Tipo inválido: " + tipo);
}

let dataOriginal = [];
let todosLosItemsGlobal = [];
let filtroEstado = null;
let vistaActual  = "grid";
let idAEliminar  = null;

document.getElementById("titulo-categoria").textContent =
    config.label ? config.label.slice(2).toUpperCase() : tipo.toUpperCase();

document.querySelectorAll(".platform-btn").forEach(btn => {
    const href = btn.getAttribute("href") ?? "";
    btn.classList.toggle("active", href.includes(`tipo=${tipo}`));
});

async function cargarItems() {
    try {
        const _u = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
        const esAdmin = !_u || _u.rol === "admin";

        // Cargar todos los items de esta categoría + globales para relacionados
        const [res, resGlobal] = await Promise.all([
            fetch(`/items/${tipo}`),
            fetch(`/items`)
        ]);
        let data   = await res.json();
        todosLosItemsGlobal = await resGlobal.json();

        if (!esAdmin) {
            // Obtener solo los ids del dashboard del usuario
            const dashRes  = await fetch(`/mi-dashboard/${_u.id}`);
            const dashItems = await dashRes.json();
            const dashIds  = new Set(dashItems.map(i => i.id));

            // Filtrar solo los items que el usuario tiene en su dashboard
            data = data.filter(i => dashIds.has(i.id));

            // Mezclar progreso personal
            const progRes  = await fetch(`/progreso/${_u.id}`);
            const progrMap = await progRes.json();

            data = data.map(item => {
                const p = progrMap[item.id];
                return {
                    ...item,
                    estado:         p?.estado          ?? config.estados[0],
                    valoracion:     p?.valoracion       ?? 0,
                    capituloActual: p?.capituloActual   ?? 0,
                    paginaActual:   p?.paginaActual     ?? 0,
                    progresoManga:  p?.progresoManga ? (typeof p.progresoManga === "string" ? JSON.parse(p.progresoManga) : p.progresoManga) : { capituloActual: 0 },
                    progreso:       p?.progreso       ? (typeof p.progreso === "string" ? JSON.parse(p.progreso) : p.progreso) : { temporada: 1, capitulo: 0 },
                };
            });
        }

        dataOriginal = data;
        actualizarHeader();
        crearFiltros();
        aplicarOrden();

        setTimeout(() => {
            const hash = window.location.hash;
            if (hash) {
                const card = document.querySelector(hash);
                if (card) {
                    card.scrollIntoView({ behavior: "smooth", block: "center" });
                    card.style.outline = `2px solid ${config.color}`;
                    card.style.outlineOffset = "3px";
                    setTimeout(() => {
                        card.style.outline = "";
                        card.style.outlineOffset = "";
                    }, 2000);
                }
            }
        }, 300);
    } catch(err) {
        console.error("Error al cargar items:", err);
    }
}

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

async function quitarDeDashboard(itemId, btn) {
    const _u = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    if (!_u) return;
    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    try {
        const res = await fetch(`/mi-dashboard/${_u.id}/${itemId}`, { method: "DELETE" });
        if (res.ok) {
            const card = document.getElementById(`card-${itemId}`);
            if (card) card.remove();
            dataOriginal = dataOriginal.filter(i => i.id !== itemId);
            actualizarHeader();
            crearFiltros();
        } else {
            if (btn) { btn.disabled = false; btn.textContent = "✕ Quitar"; }
        }
    } catch {
        if (btn) { btn.disabled = false; btn.textContent = "✕ Quitar"; }
    }
}

function actualizarItemSilencioso(item) {
    const _u = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    if (_u && _u.rol !== "admin") {
        fetch(`/progreso/${_u.id}/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                estado:         item.estado,
                valoracion:     item.valoracion,
                capituloActual: item.capituloActual,
                paginaActual:   item.paginaActual,
                progresoManga:  item.progresoManga,
                progreso:       item.progreso
            })
        }).catch(err => console.error("Error al guardar progreso:", err));
    } else {
        fetch(`/items/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item)
        }).catch(err => console.error("Error al actualizar:", err));
    }
}

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

function aplicarPermisos() {
    const _u = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    window._esAdmin = _u && _u.rol === "admin";
    const btnAnadir = document.getElementById("btn-anadir-categoria");
    if (btnAnadir) btnAnadir.style.display = window._esAdmin ? "" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
    aplicarPermisos();
    crearFormulario();

    const toggleBtn     = document.getElementById("toggle-form");
    const formContainer = document.getElementById("form-container");

    if (toggleBtn && formContainer) {
        toggleBtn.addEventListener("click", () => {
            const visible = !formContainer.classList.contains("oculto");
            formContainer.classList.toggle("oculto", visible);
            toggleBtn.textContent = visible ? "+ Añadir" : "✕ Cerrar";
        });
    }

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

    document.getElementById("modalConfirmacion")?.addEventListener("click", function(e) {
        if (e.target === this) {
            idAEliminar = null;
            this.classList.add("oculto");
        }
    });

    document.getElementById("modal-expandido")?.addEventListener("click", function(e) {
        if (e.target !== this) return;
        const inner = document.querySelector(".modal-expandido-inner");
        if (inner && !inner.querySelector("#me-poster")) {
            const idActual = meItemActual?.id;
            if (idActual) { meVolverDesdeEdicion(idActual); return; }
        }
        cerrarModalExpandido();
    });

    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            cerrarModalExpandido();
            document.getElementById("modalConfirmacion").classList.add("oculto");
        }
    });

    meInnerHTMLOriginal = document.querySelector(".modal-expandido-inner").innerHTML;

    cargarItems();
});

window.addEventListener("hashchange", () => {
    const hash = window.location.hash;
    if (hash) {
        const card = document.querySelector(hash);
        if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "center" });
            card.style.outline = `2px solid ${config.color}`;
            card.style.outlineOffset = "3px";
            setTimeout(() => {
                card.style.outline = "";
                card.style.outlineOffset = "";
            }, 2000);
        }
    }
});