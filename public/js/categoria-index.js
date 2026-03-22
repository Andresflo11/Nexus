// ╔══════════════════════════════════════════════════════════╗
// ║  categoria-index.js — Vista explorador de categoría     ║
// ╚══════════════════════════════════════════════════════════╝

const params = new URLSearchParams(location.search);
const TIPO   = params.get("tipo") || "juegos";
const CFG    = CONFIG[TIPO] || {};

document.documentElement.style.setProperty("--cat-color", CFG.color || "var(--accent)");
document.title = `NEXUS — ${CFG.label?.slice(2) || TIPO}`;

let todosItems   = [];
let dashIds      = new Set();
const POR_PAGINA = 54;
let paginaActual = 1;

const filtros = {
    buscar:      "",
    generos:     new Set(),
    plataformas: new Set(),
    creador:     "",
    estadoSerie: "",
    orden:       "reciente"
};

// ── Definición de filtros por categoría ──────────────────
function getDefinicionFiltros() {
    const defs = [];
    if (CFG.generosOpciones?.length)
        defs.push({ id: "generos", label: "Género", tipo: "chips-multi", opciones: CFG.generosOpciones });
    if (CFG.plataformasOpciones?.length)
        defs.push({ id: "plataformas", label: CFG.usaPlataforma ? "Plataforma / Servicio" : "Formato", tipo: "chips-multi", opciones: CFG.plataformasOpciones });
    if (CFG.creadorLabel)
        defs.push({ id: "creador", label: CFG.creadorLabel, tipo: "texto", placeholder: `Buscar por ${CFG.creadorLabel.toLowerCase()}...` });
    if (CFG.usaEstadoSerie)
        defs.push({ id: "estadoSerie", label: "Estado de la obra", tipo: "chips-uno", opciones: ["En emisión","Finalizada","Temporada confirmada","Cancelada","Temporada sin confirmar","Publicación"] });
    return defs;
}

// ── Renderizar sidebar ────────────────────────────────────
function renderizarSidebar() {
    const cont = document.getElementById("ci-filtros-dinamicos");
    cont.innerHTML = "";
    getDefinicionFiltros().forEach(def => {
        const sec = document.createElement("div");
        sec.className = "ci-filtro-seccion";

        if (def.tipo === "chips-multi" || def.tipo === "chips-uno") {
            const opcionesPresentes = def.opciones.filter(op => todosItems.some(it => {
                if (def.id === "generos") {
                    const g = it.generos ? (Array.isArray(it.generos) ? it.generos : (() => { try { return JSON.parse(it.generos); } catch { return []; } })()) : [];
                    return g.includes(op);
                }
                if (def.id === "plataformas") return normalizarPlataformas(it.plataforma).includes(op);
                if (def.id === "estadoSerie") return it.estadoSerie === op;
                return false;
            }));
            if (!opcionesPresentes.length) return;

            sec.innerHTML = `<div class="ci-filtro-label">${def.label}</div><div class="ci-chips" id="chips-${def.id}"></div>`;
            cont.appendChild(sec);
            const chipsWrap = sec.querySelector(`#chips-${def.id}`);

            opcionesPresentes.forEach(op => {
                const chip = document.createElement("button");
                chip.className = "ci-chip";
                chip.textContent = op;
                const est = filtros[def.id];
                if (def.tipo === "chips-multi" && est instanceof Set && est.has(op)) chip.classList.add("activo");
                if (def.tipo === "chips-uno" && est === op) chip.classList.add("activo");
                chip.onclick = () => {
                    if (def.tipo === "chips-multi") {
                        filtros[def.id].has(op) ? filtros[def.id].delete(op) : filtros[def.id].add(op);
                    } else {
                        filtros[def.id] = filtros[def.id] === op ? "" : op;
                    }
                    paginaActual = 1;
                    actualizarClearBtn();
                    renderizarGrid();
                    chipsWrap.querySelectorAll(".ci-chip").forEach(c => {
                        const v = c.textContent, e2 = filtros[def.id];
                        c.classList.toggle("activo", e2 instanceof Set ? e2.has(v) : e2 === v);
                    });
                };
                chipsWrap.appendChild(chip);
            });

        } else if (def.tipo === "texto") {
            sec.innerHTML = `<div class="ci-filtro-label">${def.label}</div>
                <input class="ci-input" id="input-${def.id}" placeholder="${def.placeholder || ""}" value="${filtros[def.id] || ""}">`;
            cont.appendChild(sec);
            sec.querySelector(`#input-${def.id}`).addEventListener("input", e => {
                filtros[def.id] = e.target.value.trim().toLowerCase();
                paginaActual = 1;
                actualizarClearBtn();
                renderizarGrid();
            });
        }
    });
}

// ── Limpiar filtros ───────────────────────────────────────
function limpiarFiltros() {
    filtros.buscar = ""; filtros.generos.clear(); filtros.plataformas.clear();
    filtros.creador = ""; filtros.estadoSerie = "";
    paginaActual = 1;
    document.getElementById("ci-buscar").value = "";
    renderizarSidebar(); actualizarClearBtn(); renderizarGrid();
}

function actualizarClearBtn() {
    const hay = filtros.buscar || filtros.generos.size || filtros.plataformas.size || filtros.creador || filtros.estadoSerie;
    document.getElementById("ci-clear-btn").classList.toggle("visible", !!hay);
}

// ── Filtrar y ordenar ─────────────────────────────────────
function filtrarItems() {
    return todosItems.filter(it => {
        if (filtros.buscar && !it.titulo?.toLowerCase().includes(filtros.buscar)) return false;
        if (filtros.generos.size) {
            const g = it.generos ? (Array.isArray(it.generos) ? it.generos : (() => { try { return JSON.parse(it.generos); } catch { return []; } })()) : [];
            if (![...filtros.generos].some(gen => g.includes(gen))) return false;
        }
        if (filtros.plataformas.size) {
            if (![...filtros.plataformas].some(pl => normalizarPlataformas(it.plataforma).includes(pl))) return false;
        }
        if (filtros.creador && !it.creador?.toLowerCase().includes(filtros.creador)) return false;
        if (filtros.estadoSerie && it.estadoSerie !== filtros.estadoSerie) return false;
        return true;
    });
}

function ordenarItems(lista) {
    const copy = [...lista], o = filtros.orden;
    if (o === "titulo")      copy.sort((a,b) => (a.titulo||"").localeCompare(b.titulo||""));
    if (o === "titulo-desc") copy.sort((a,b) => (b.titulo||"").localeCompare(a.titulo||""));
    if (o === "rating-desc") copy.sort((a,b) => (b.valoracion||0) - (a.valoracion||0));
    if (o === "rating-asc")  copy.sort((a,b) => (a.valoracion||0) - (b.valoracion||0));
    if (o === "año-desc")    copy.sort((a,b) => (parseInt(b.fecha)||0) - (parseInt(a.fecha)||0));
    if (o === "año-asc")     copy.sort((a,b) => (parseInt(a.fecha)||0) - (parseInt(b.fecha)||0));
    return copy;
}

// ── Paginación ────────────────────────────────────────────
function crearPaginacion(totalPags) {
    if (totalPags <= 1) return null;
    const pag = document.createElement("div");
    pag.style.cssText = "display:flex;align-items:center;justify-content:flex-end;gap:0.5rem;flex-wrap:wrap";

    const estilo = (activo) =>
        `padding:0.4rem 0.85rem;border-radius:8px;border:1px solid ${activo ? "var(--cat-color)" : "var(--border)"};background:${activo ? "color-mix(in srgb,var(--cat-color) 15%,transparent)" : "var(--surface)"};color:${activo ? "var(--cat-color)" : "var(--muted)"};font-family:'JetBrains Mono',monospace;font-size:0.72rem;cursor:${activo ? "default" : "pointer"};transition:all 0.15s`;

    const btnPrev = document.createElement("button");
    btnPrev.textContent = "←";
    btnPrev.style.cssText = estilo(false);
    btnPrev.disabled = paginaActual === 1;
    if (paginaActual === 1) btnPrev.style.opacity = "0.3";
    btnPrev.onclick = () => { paginaActual--; renderizarGrid(); window.scrollTo({top:0,behavior:"smooth"}); };
    pag.appendChild(btnPrev);

    for (let p = 1; p <= totalPags; p++) {
        if (totalPags > 7 && Math.abs(p - paginaActual) > 2 && p !== 1 && p !== totalPags) {
            if (p === 2 || p === totalPags - 1) {
                const dots = document.createElement("span");
                dots.textContent = "…";
                dots.style.cssText = "color:var(--muted);font-size:0.8rem;padding:0 0.2rem";
                pag.appendChild(dots);
            }
            continue;
        }
        const btn = document.createElement("button");
        btn.textContent = p;
        btn.style.cssText = estilo(p === paginaActual);
        if (p !== paginaActual) {
            btn.onmouseover = () => { btn.style.borderColor = "var(--cat-color)"; btn.style.color = "var(--cat-color)"; };
            btn.onmouseout  = () => { btn.style.borderColor = "var(--border)"; btn.style.color = "var(--muted)"; };
            btn.onclick = () => { paginaActual = p; renderizarGrid(); window.scrollTo({top:0,behavior:"smooth"}); };
        }
        pag.appendChild(btn);
    }

    const btnNext = document.createElement("button");
    btnNext.textContent = "→";
    btnNext.style.cssText = estilo(false);
    btnNext.disabled = paginaActual === totalPags;
    if (paginaActual === totalPags) btnNext.style.opacity = "0.3";
    btnNext.onclick = () => { paginaActual++; renderizarGrid(); window.scrollTo({top:0,behavior:"smooth"}); };
    pag.appendChild(btnNext);

    return pag;
}

// ── Renderizar grid ───────────────────────────────────────
function renderizarGrid() {
    const _u         = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    const mostrarBtn = _u && _u.rol !== "admin";
    const listaFull  = ordenarItems(filtrarItems());
    const totalPags  = Math.ceil(listaFull.length / POR_PAGINA);
    paginaActual     = Math.min(paginaActual, totalPags || 1);
    const lista      = listaFull.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

    document.getElementById("ci-count").textContent = `${listaFull.length} elemento${listaFull.length !== 1 ? "s" : ""}`;

    // Paginación arriba
    const elPagArriba = document.getElementById("ci-pag-arriba");
    const elPagAbajo  = document.getElementById("ci-pag-abajo");
    if (elPagArriba) { elPagArriba.innerHTML = ""; const p = crearPaginacion(totalPags); if (p) elPagArriba.appendChild(p); }
    if (elPagAbajo)  { elPagAbajo.innerHTML  = ""; const p = crearPaginacion(totalPags); if (p) elPagAbajo.appendChild(p); }

    const grid = document.getElementById("ci-grid");
    grid.innerHTML = "";

    if (!listaFull.length) {
        const hayFiltros = filtros.buscar || filtros.generos.size || filtros.plataformas.size || filtros.creador || filtros.estadoSerie;
        grid.innerHTML = `<div class="ci-empty">
            <div class="ci-empty-icon">${CFG.label?.split(" ")[0] || "🔍"}</div>
            <h3>Sin resultados</h3>
            <p>${hayFiltros ? "Prueba con otros filtros." : "Esta categoría está vacía."}</p>
        </div>`;
        return;
    }

    lista.forEach((it, i) => {
        const card = document.createElement("div");
        card.className = "ci-card";
        card.style.animationDelay = `${Math.min(i, 12) * 30}ms`;
        card.onclick = () => {
            const origen = encodeURIComponent(window.location.pathname + window.location.search);
            sessionStorage.setItem("nexus_item_origen", decodeURIComponent(origen));
            window.location.href = `/pages/item.html?id=${it.id}&origen=${origen}`;
        };

        const posterHTML = it.imagen
            ? `<img src="${it.imagen}" alt="${it.titulo}" loading="lazy">`
            : `<span>${CFG.label?.split(" ")[0] || "?"}</span>`;

        const generos = it.generos ? (Array.isArray(it.generos) ? it.generos : (() => { try { return JSON.parse(it.generos); } catch { return []; } })()) : [];
        const metaPartes = [];
        if (it.creador) metaPartes.push(it.creador);
        if (generos.length) metaPartes.push(generos[0]);
        const metaText = metaPartes.length ? `<div class="ci-card-meta"><span>${metaPartes.join(" · ")}</span></div>` : "";

        card.innerHTML = `
            <div class="ci-poster">
                ${posterHTML}
                <div class="ci-poster-overlay"></div>
            </div>
            <div class="ci-card-info">
                <div class="ci-card-nombre">${it.titulo || "Sin título"}</div>
                ${metaText}
            </div>`;

        if (mostrarBtn) {
            const yaAgregado = dashIds.has(it.id);
            const btn = document.createElement("button");
            btn.className = "catidx-add-btn";
            btn.title = yaAgregado ? "Ya en tu dashboard" : "Agregar a mi dashboard";
            if (yaAgregado) {
                btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>`;
                btn.style.borderColor = "#22c55e40";
                btn.style.cursor = "default";
            } else {
                btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    try {
                        const res = await fetch("/mi-dashboard", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({userId:_u.id, itemId:it.id}) });
                        if (res.ok) {
                            dashIds.add(it.id);
                            btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>`;
                            btn.style.borderColor = "#22c55e40"; btn.style.cursor = "default"; btn.onclick = null;
                        }
                    } catch {}
                };
            }
            card.appendChild(btn);
        }
        grid.appendChild(card);
    });
}

// ── Toggle sidebar móvil ──────────────────────────────────
function toggleSidebarMovil() {
    document.getElementById("ci-sidebar").classList.toggle("abierto");
}

// ── Cargar datos ──────────────────────────────────────────
async function cargar() {
    try {
        const _u = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
        todosItems = (await (await fetch("/items")).json()).filter(i => i.tipo === TIPO);
        if (_u && _u.rol !== "admin") {
            dashIds = new Set((await (await fetch(`/mi-dashboard/${_u.id}`)).json()).map(i => i.id));
        }
        document.getElementById("ci-titulo").textContent = (CFG.label || TIPO).slice(2).toUpperCase();
        renderizarSidebar();
        renderizarGrid();
    } catch(e) { console.error(e); }
}

// ── Eventos ───────────────────────────────────────────────
document.getElementById("ci-buscar").addEventListener("input", e => {
    filtros.buscar = e.target.value.toLowerCase();
    paginaActual = 1; actualizarClearBtn(); renderizarGrid();
});
document.getElementById("ci-orden").addEventListener("change", e => {
    filtros.orden = e.target.value;
    paginaActual = 1; renderizarGrid();
});

window.addEventListener("pageshow", () => cargar());
cargar();