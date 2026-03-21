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
        const _u = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
        const esAdmin = !_u || _u.rol === "admin";

        // Cargar todos los items de esta categoría + globales para relacionados
        const [res, resGlobal] = await Promise.all([
            fetch(`/items/${tipo}`),
            fetch(`/items`)
        ]);
        let data   = await res.json();
        todosLosItemsGlobal = await resGlobal.json();

        if (esAdmin) {
            window._dashDatosUsuario = null; // Admin no usa datos de usuario
        } else {
            // Obtener solo los ids del dashboard del usuario
            const dashRes  = await fetch(`/mi-dashboard/${_u.id}`);
            const dashItems = await dashRes.json();
            const dashIds  = new Set(dashItems.map(i => i.id));

            // Filtrar solo los items que el usuario tiene en su dashboard
            const dataMap = {};
            data.forEach(i => dataMap[i.id] = i);
            data = dashItems.map(d => dataMap[d.id]).filter(Boolean);

            // Mezclar progreso personal
            const progRes  = await fetch(`/progreso/${_u.id}`);
            const progrMap = await progRes.json();

            window._dashDatosUsuario = {};
            const dashMap = {};
            dashItems.forEach((i, idx) => {
                window._dashDatosUsuario[i.id] = {
                    logros:         i.logros_usuario  ?? null,
                    fecha_agregado: i.fecha_agregado  ?? null,
                    orden:          idx
                };
                dashMap[i.id] = i;
            });

            data = data.map(item => {
                const p  = progrMap[item.id];
                const du = dashMap[item.id];
                return {
                    ...item,
                    estado:         p?.estado          ?? config.estados[0],
                    valoracion:     p?.valoracion       ?? 0,
                    capituloActual: p?.capituloActual   ?? 0,
                    paginaActual:   p?.paginaActual     ?? 0,
                    progresoManga:  p?.progresoManga ? (typeof p.progresoManga === "string" ? JSON.parse(p.progresoManga) : p.progresoManga) : { capituloActual: 0 },
                    progreso:       p?.progreso       ? (typeof p.progreso === "string" ? JSON.parse(p.progreso) : p.progreso) : { temporada: 1, capitulo: 0 },
                    // Reemplazar datos del admin con los del usuario (null si no tiene)
                    logros:         du?.logros_usuario  ?? null,
                    dlcs:           item.dlcs,          // DLCs de estructura los mantiene el admin
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
    const _u = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    if (!_u) return;

    const confirmar = await mostrarConfirmacionQuitar();
    if (!confirmar) return;

    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    try {
        // Borrar del dashboard (cascade borra fecha, dlcs_usuario, logros_usuario)
        const res = await fetch(`/mi-dashboard/${_u.id}/${itemId}`, { method: "DELETE" });
        if (res.ok) {
            // Borrar progreso personal también
            await fetch(`/progreso/${_u.id}/${itemId}`, { method: "DELETE" }).catch(() => {});
            // Limpiar _dashDatosUsuario
            if (window._dashDatosUsuario) delete window._dashDatosUsuario[itemId];
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

function mostrarConfirmacionQuitar() {
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center`;
        overlay.innerHTML = `
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:2rem;max-width:360px;width:90%;text-align:center">
                <div style="font-family:'Bebas Neue',cursive;font-size:1.4rem;letter-spacing:2px;margin-bottom:0.5rem">¿Quitar del dashboard?</div>
                <div style="font-family:'DM Sans',sans-serif;font-size:0.85rem;color:var(--muted);margin-bottom:1.5rem">Se borrará todo tu progreso y datos guardados para este item.</div>
                <div style="display:flex;gap:0.75rem;justify-content:center">
                    <button id="qd-cancelar" style="padding:0.55rem 1.25rem;border-radius:8px;border:1px solid var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.875rem;cursor:pointer">Cancelar</button>
                    <button id="qd-confirmar" style="padding:0.55rem 1.25rem;border-radius:8px;border:none;background:#ef4444;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.875rem;font-weight:600;cursor:pointer">Sí, quitar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector("#qd-confirmar").onclick = () => { overlay.remove(); resolve(true); };
        overlay.querySelector("#qd-cancelar").onclick  = () => { overlay.remove(); resolve(false); };
        overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
    });
}

function actualizarItemSilencioso(item) {
    const _u = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
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
    const _u = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
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

window.addEventListener("pageshow", () => {
    aplicarPermisos();
    const lista = document.getElementById("lista");
    if (lista) lista.innerHTML = "";
    cargarItems();
});