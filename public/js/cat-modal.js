// ╔══════════════════════════════════════════════════════════╗
// ║  cat-modal.js — MODAL EXPANDIDO Y PROGRESO              ║
// ╠══════════════════════════════════════════════════════════╣
// ║  Contiene:                                               ║
// ║  · abrirModalExpandido()  — abre el modal de detalle    ║
// ║  · cerrarModalExpandido() — cierra el modal             ║
// ║  · meAbrirEdicion()       — cambia modal a modo editar  ║
// ║  · meVolverDesdeEdicion() — restaura el modal           ║
// ║  · meGuardarCampo()       — guarda estado/valoracion    ║
// ║  · meCompletarRapido()    — botón completar/descompletar║
// ║  · meActualizarEpisodios/Capitulos/Paginas()            ║
// ║  · meRenderTabs/TabContenido()                          ║
// ║  · mecambiarEpisodio/Capitulo/Pagina()                  ║
// ║  · cambiarEpisodio/Capitulo/Pagina() — botones card     ║
// ║  · parchearProgreso*() — actualiza progreso en la card  ║
// ╚══════════════════════════════════════════════════════════╝

// ── Variables del modal expandido ────────────────────────
let meItemActual        = null;   // item actualmente abierto en el modal
let meTabActual         = 0;      // índice del tab de temporada activo
let meItemIdRenderizado = null;   // id del item que tiene el DOM renderizado
let meTabRenderizado    = -1;     // índice del tab que está en el DOM
let meInnerHTMLOriginal = "";     // HTML original del modal (antes de entrar en edición)

// ── Abrir modal expandido ─────────────────────────────────
// Se llama al hacer click en el póster de una card.
function abrirModalExpandido(id) {
    const item = dataOriginal.find(i => i.id === id);
    if (!item) return;

    // Si es un item diferente al que ya está en el DOM, limpiar tabs
    if (meItemIdRenderizado !== id) {
    document.getElementById("me-tab-contenido").innerHTML = "";
    meItemIdRenderizado = id;
    meTabRenderizado    = -1;
    } else {
    // Mismo item pero puede haber cambiado (ej: se guardó desde edición)
    meTabRenderizado = -1;
    }

    meItemActual = item;
    meTabActual  = item.progreso?.temporada ? item.progreso.temporada - 1 : 0;

    const color = config.color ?? "#888";
    const modal = document.getElementById("modal-expandido");

    // Fondo blur con la imagen del póster
    const bg = document.getElementById("me-bg");
    if (item.imagen) {
        bg.style.backgroundImage = `url('${esc(item.imagen)}')`;
        bg.style.opacity = "1";
    } else {
        bg.style.backgroundImage = "none";
        bg.style.opacity = "0";
    }

    // Póster
    const poster = document.getElementById("me-poster");
    poster.innerHTML    = item.imagen ? `<img src="${esc(item.imagen)}" alt="">` : `<span>${tipoEmoji(tipo)}</span>`;
    poster.style.borderColor = color;

    // Título
    document.getElementById("me-titulo").textContent = item.titulo;

    // Tags de metadata (fecha, plataforma, estadoSerie, estado, logros)
    const metaHTML = [];
    if (item.fecha) {
        const [y, m, d] = item.fecha.split("-");
        const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        const fechaFormato = `${parseInt(d)} ${meses[parseInt(m)-1]} ${y}`;
        metaHTML.push(`<span class="me-tag me-tag-fecha">${fechaFormato}</span>`);
    }
    if (item.plataforma && item.plataforma !== "null") metaHTML.push(`<span class="me-tag" style="background:${color}15;border-color:${color}40;color:${color}">${esc(item.plataforma)}</span>`);
    if (item.estadoSerie && item.estadoSerie !== "null") metaHTML.push(`<span class="me-tag me-tag-serie">${esc(item.estadoSerie)}</span>`);
    if (item.estado)      metaHTML.push(`<span class="me-tag me-tag-estado">${esc(item.estado)}</span>`);
    if (config.usalogros) {
    const claseModal = {
        "Todos completados":   "me-tag-logros-todos",
        "Algunos completados": "me-tag-logros-algunos",
        "En proceso":          "me-tag-logros-proceso",
        "Sin completar":       "me-tag-logros-sin",
        "No tiene logros":     "me-tag-logros-ninguno"
    }[item.logros] ?? "me-tag-logros-ninguno";
    const emoji = item.logros === "Todos completados" ? "🏆 " : "";
    metaHTML.push(`<span class="me-tag ${claseModal}">${emoji}${item.logros ?? "No tiene logros"}</span>`);
    }
    if (config.usaDlcs && item.dlcs?.length) {
    const dlcHTML = item.dlcs.map(d => `
        <div style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0;border-bottom:1px solid var(--border)">
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted)">${esc(d.tipo ?? "DLC")}</span>
            <span style="font-size:0.82rem;flex:1">${esc(d.nombre)}</span>
            <span class="card-tag ${claseLogros(d.logros)}" style="font-size:0.58rem">${d.logros === "Todos completados" ? "🏆 " : ""}${d.logros ?? ""}</span>
            <span class="card-tag tag-estado" style="font-size:0.58rem">${esc(d.estado ?? "")}</span>
        </div>`).join("");

    document.getElementById("me-dlcs").innerHTML = `
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">DLCs / Ediciones</div>
        ${dlcHTML}`;
    document.getElementById("me-dlcs").classList.remove("oculto");
    } else {
    document.getElementById("me-dlcs")?.classList.add("oculto");
    }
    document.getElementById("me-meta").innerHTML = metaHTML.join("");

    // Select de estado
    const selEstado = document.getElementById("me-estado");
    selEstado.innerHTML = config.estados
        .map(e => `<option value="${e}" ${e === item.estado ? "selected" : ""}>${e}</option>`).join("");
    selEstado.style.borderColor = color;

    // Select de valoración
    document.getElementById("me-valoracion").value = item.valoracion ?? 0;

    // Botón "Marcar como completado"
    const btnCompletar  = document.getElementById("me-btn-completar");
    const estadoComp    = config.estadosCompletados?.[0];
    const yaCompleto    = config.estadosCompletados?.includes(item.estado);
    btnCompletar.textContent     = yaCompleto ? "✓ Completado" : `Marcar como ${estadoComp}`;
    btnCompletar.style.background  = yaCompleto ? color : "transparent";
    btnCompletar.style.color       = yaCompleto ? "#000" : color;
    btnCompletar.style.borderColor = color;

    // Ocultar todas las secciones de progreso
    ["me-episodios","me-capitulos","me-paginas","me-tomos"].forEach(secId => {
    document.getElementById(secId)?.classList.add("oculto");
    });

    // Mostrar sección según tipo de progreso
    if (config.usaEpisodios && item.temporadas?.length) {
        document.getElementById("me-episodios").classList.remove("oculto");
        meActualizarEpisodios(color);
        meRenderTabs(color);
    }
    if (config.usaTomos) {
    const tomos     = item.tomos ?? [];
    const capActual = item.progresoManga?.capituloActual ?? 0;
    const tomoActual = tomos.find(t => capActual >= t.capituloInicio && capActual <= t.capituloFin)
                    ?? tomos[tomos.length - 1];
    const capMax    = tomos[tomos.length - 1]?.capituloFin ?? 0;
const capFin    = tomoActual?.capituloFin ?? 0;
const capInicio = tomoActual?.capituloInicio ?? 1;
const pct       = capFin > 0 ? Math.round(((capActual - capInicio + 1) / (capFin - capInicio + 1)) * 100) : 0;
const pctGlobal = capMax > 0 ? Math.min(100, Math.round((capActual / capMax) * 100)) : 0;

    const bloqueTomos = document.getElementById("me-tomos");
    bloqueTomos.classList.remove("oculto");

    // Tabs de tomos
    const tabsHTML = tomos.map((t, i) => `
    <button type="button" class="me-tab ${t === tomoActual ? "activo" : ""}" 
        style="${t === tomoActual ? `background:${color};border-color:${color};color:#000` : ""}"
        onclick="meCambiarTabManga(${i})">
        T${t.numero}
    </button>`).join("");

    bloqueTomos.innerHTML = `
    <div class="me-progreso-header">
        <span class="me-info-tomo" id="me-progreso-texto-manga">
            ${tomoActual ? `Tomo ${tomoActual.numero}` : "Sin tomos"} · Cap ${capActual}
            ${tomoActual && capFin ? `— ${pct}% del tomo` : ""}
        </span>
        <div class="progress-btns">
            <button class="prog-btn" onclick="mecambiarCapituloManga(-1, ${item.id})">−</button>
            <span class="prog-num" id="me-cap-manga-texto">Cap. ${capActual}</span>
            <button class="prog-btn" onclick="mecambiarCapituloManga(1, ${item.id})">+</button>
        </div>
    </div>
    <div class="progress-wrap" style="margin-bottom:1.25rem">
        <div class="progress-fill" id="me-barra-manga" style="width:${pctGlobal}%;will-change:width;transform:translateZ(0);background:${color}"></div>
    </div>
    <div class="me-tabs" id="me-tabs-manga">${tabsHTML}</div>
    <div id="me-tab-manga-contenido"></div>`;

    // Renderizar el tomo activo
    const tomoIdx = tomos.indexOf(tomoActual);
    meRenderTabManga(tomoIdx === -1 ? 0 : tomoIdx);
} else {
    document.getElementById("me-tomos")?.classList.add("oculto");
}
    if (config.usaCapitulos && item.capitulosTotales) {
        document.getElementById("me-capitulos").classList.remove("oculto");
        meActualizarCapitulos(color);
    }
    if (config.usaPaginas && item.paginasTotales) {
        document.getElementById("me-paginas").classList.remove("oculto");
        meActualizarPaginas(color);
    }

    // Animación de apertura
    if (modal.classList.contains("oculto")) {
        modal.classList.remove("oculto");
        requestAnimationFrame(() => modal.classList.add("me-visible"));
    } else {
        modal.classList.add("me-visible");
    }

    // Aplicar color de categoría a los botones prog-btn del modal
document.querySelectorAll("#modal-expandido .prog-btn").forEach(btn => {
    btn.onmouseenter = function() {
        this.style.background   = `${color}30`;
        this.style.borderColor  = color;
        this.style.color        = "#fff";
    };
    btn.onmouseleave = function() {
        this.style.background   = "";
        this.style.borderColor  = "";
        this.style.color        = "#6b7280";
    };
});
}
function mecambiarCapituloManga(dir, id) {
    const item  = id ? dataOriginal.find(i => i.id === id) : meItemActual;
    if (!item) return;
    const tomos = item.tomos ?? [];
    if (!tomos.length) return;

    const capMax    = tomos[tomos.length - 1].capituloFin;
    let   capActual = (item.progresoManga?.capituloActual ?? 0) + dir;

    // No salir de los límites
    if (capActual < 0)      capActual = 0;
    if (capActual > capMax) capActual = capMax;

    item.progresoManga = { capituloActual: capActual };

    // Calcular tomo actual
    const tomoActual = tomos.find(t => capActual >= t.capituloInicio && capActual <= t.capituloFin)
                    ?? tomos[tomos.length - 1];
    const capInicio  = tomoActual?.capituloInicio ?? 1;
    const capFin     = tomoActual?.capituloFin    ?? capMax;
    const pct        = Math.round(((capActual - capInicio + 1) / (capFin - capInicio + 1)) * 100);
    const pctGlobal  = Math.round((capActual / capMax) * 100);

    // Actualizar UI del modal
    const textoModal = document.getElementById("me-cap-manga-texto");
const barraModal = document.getElementById("me-barra-manga");
const infoModal  = document.getElementById("me-progreso-texto-manga");

if (textoModal) textoModal.textContent = `Cap. ${capActual}`;
if (barraModal) barraModal.style.width = `${pctGlobal}%`;
if (infoModal)  infoModal.textContent  = `Tomo ${tomoActual?.numero ?? "?"} · Cap ${capActual} — ${pct}% del tomo`;
    // Guardar silenciosamente
    const idx = dataOriginal.findIndex(i => i.id === item.id);
if (idx !== -1) dataOriginal[idx].progresoManga = item.progresoManga;
if (meItemActual?.id === item.id) meItemActual = dataOriginal[idx];
actualizarItemSilencioso({ id: item.id, progresoManga: item.progresoManga });
parchearProgresoManga(item.id);
// Actualizar tabs y dots si el modal está abierto
if (meItemActual?.id === item.id && document.getElementById("me-tabs-manga")) {
    const tomos      = item.tomos ?? [];
    const tomoActual = tomos.find(t => capActual >= t.capituloInicio && capActual <= t.capituloFin)
                    ?? tomos[tomos.length - 1];
    const tomoIdx    = tomos.indexOf(tomoActual);

    // Detectar si cambió de tomo para animar
    const tabActivo  = document.querySelector("#me-tabs-manga .me-tab.activo");
    const idxActivo  = tabActivo ? [...document.querySelectorAll("#me-tabs-manga .me-tab")].indexOf(tabActivo) : -1;
    const cambioDeTomo = idxActivo !== tomoIdx;

    const color = CONFIG[tipo]?.color ?? "#888";
    document.querySelectorAll("#me-tabs-manga .me-tab").forEach((btn, i) => {
        const activo = i === tomoIdx;
        btn.classList.toggle("activo", activo);
        btn.style.background  = activo ? color : "";
        btn.style.borderColor = activo ? color : "";
        btn.style.color       = activo ? "#000" : "";
    });

    meRenderTabManga(tomoIdx, cambioDeTomo);
}
}

// ── Cerrar modal expandido ────────────────────────────────
function cerrarModalExpandido() {
    const modal = document.getElementById("modal-expandido");
    const inner = document.querySelector(".modal-expandido-inner");

    // Si el inner fue reemplazado por el formulario, restaurarlo
    if (inner && !inner.querySelector("#me-poster")) {
        inner.innerHTML = meInnerHTMLOriginal;
    }

    modal.classList.remove("me-visible");
    setTimeout(() => {
        modal.classList.add("oculto");
        const contEl = document.getElementById("me-tab-contenido");
        if (contEl) contEl.innerHTML = "";
        meItemIdRenderizado = null;
        meTabRenderizado    = -1;
    }, 250);

    meItemActual = null;
}

// ── Abrir modo edición dentro del modal ──────────────────
// Reemplaza el contenido del modal con el formulario de edición.
// El overlay y el blur se mantienen — no hay flash.
function meAbrirEdicion() {
    const id   = meItemActual?.id;
    const item = dataOriginal.find(i => i.id === id);
    if (!item) return;

    const inner = document.querySelector(".modal-expandido-inner");
    inner.innerHTML = `
        <div class="me-bg" id="me-bg" style="
            background-image:${item.imagen ? `url('${esc(item.imagen)}')` : 'none'};
            opacity:${item.imagen ? 1 : 0}">
        </div>
        <div class="me-layout" style="grid-template-columns:1fr">
            <div class="me-contenido" style="max-width:560px;margin:0 auto;width:100%">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
                    <span class="modal-title">EDITAR — ${esc(item.titulo)}</span>
                    <button class="close-btn" onclick="meVolverDesdeEdicion(${id})">✕</button>
                </div>
                <div id="me-form-contenido" class="form-grid"></div>
            </div>
        </div>`;

    activarEdicionEnModal(id);
}

// ── Volver desde edición al modal normal ──────────────────
function meVolverDesdeEdicion(id) {
    const inner = document.querySelector(".modal-expandido-inner");
    inner.innerHTML = meInnerHTMLOriginal;

    meItemIdRenderizado = null;
    meTabRenderizado    = -1;

    abrirModalExpandido(id);
}

// ── Guardar un campo rápido (estado o valoración) ─────────
// Se llama desde los select del modal sin entrar en modo edición.
function meGuardarCampo(campo, valor) {
    if (!meItemActual) return;
    meItemActual[campo] = valor;

    // Si cambió el estado, actualizar el botón completar
    if (campo === "estado") {
        const yaCompleto = config.estadosCompletados?.includes(valor);
        const estadoComp = config.estadosCompletados?.[0];
        const color      = config.color ?? "#888";
        const btn        = document.getElementById("me-btn-completar");
        btn.textContent        = yaCompleto ? "✓ Completado" : `Marcar como ${estadoComp}`;
        btn.style.background   = yaCompleto ? color : "transparent";
        btn.style.color        = yaCompleto ? "#000" : color;
    }

    // Sincronizar dataOriginal
    const idx = dataOriginal.findIndex(i => i.id === meItemActual.id);
    if (idx !== -1) dataOriginal[idx] = { ...meItemActual };

    actualizarItemSilencioso(meItemActual);
    parchearCard(meItemActual.id);
}

// ── Botón completar / descompletar rápido ─────────────────
function meCompletarRapido() {
    if (!meItemActual) return;
    const estadoComp  = config.estadosCompletados?.[0];
    const yaCompleto  = config.estadosCompletados?.includes(meItemActual.estado);
    const nuevoEstado = yaCompleto ? config.estados[0] : estadoComp;
    document.getElementById("me-estado").value = nuevoEstado;
    meGuardarCampo("estado", nuevoEstado);
}

// ── Actualizar barra de progreso de episodios ─────────────
function meActualizarEpisodios(color = config.color) {
    const item      = meItemActual;
    const totalCaps = item.temporadas.reduce((s, t) => s + t.capitulos, 0);
    const capActual = item.temporadas
        .slice(0, item.progreso.temporada - 1)
        .reduce((s, t) => s + t.capitulos, 0) + item.progreso.capitulo;
    const pct = totalCaps ? Math.min(100, Math.round((capActual / totalCaps) * 100)) : 0;

    const tempActual = item.temporadas[item.progreso.temporada - 1];
const labelTemp  = tempActual?.tipo === "ova"      ? `OVA ${tempActual.numero}`
                 : tempActual?.tipo === "especial" ? `ESP ${tempActual.numero}`
                 : `T${item.progreso.temporada}`;
document.getElementById("me-progreso-texto").textContent = `${labelTemp} · Ep ${item.progreso.capitulo} — ${pct}%`;

const numEl = document.getElementById("me-ep-num");
if (numEl) numEl.textContent = `Ep ${item.progreso.capitulo}`;

    const barra = document.getElementById("me-barra-ep");
    barra.style.width      = `${pct}%`;
    barra.style.background = color;
}

// ── Renderizar tabs de temporadas ─────────────────────────
function meRenderTabs(color = config.color) {
    const item     = meItemActual;
    const tabsEl   = document.getElementById("me-tabs");
    const tabIndex = Math.max(0, Math.min(meTabActual, item.temporadas.length - 1));
const tabsHTML = item.temporadas.map((t, i) => {
    const label = t.tipo === "ova"      ? `OVA ${t.numero}`
                : t.tipo === "especial" ? `ESP ${t.numero}`
                : `T${t.numero}`;
    return `<button type="button" class="me-tab ${i === meTabActual ? "activo" : ""}"
        style="${i === meTabActual ? `background:${color};border-color:${color};color:#000` : ""}"
        onclick="meCambiarTab(${i})">${label}</button>`;
}).join("");
tabsEl.innerHTML = tabsHTML;

    meRenderTabContenido(color);
}

// ── Renderizar contenido del tab activo ───────────────────
function meRenderTabContenido(color = config.color) {
    const item     = meItemActual;
    const contEl   = document.getElementById("me-tab-contenido");
    const tabIndex = Math.max(0, Math.min(meTabActual, item.temporadas.length - 1));
    const temp     = item.temporadas[tabIndex];
    const esCurrent  = item.progreso.temporada - 1 === tabIndex;
    const capsVistas = esCurrent ? item.progreso.capitulo
                 : item.progreso.temporada - 1 > tabIndex ? temp.capitulos : 0;
    const pctTemp    = temp.capitulos ? Math.round((capsVistas / temp.capitulos) * 100) : 0;

    const barraTemp = contEl.querySelector(".me-barra-temp");
    const capsGrid  = contEl.querySelector(".me-caps-grid");

    // Parchear si ya está renderizado el mismo tab
    if (barraTemp && capsGrid && meTabRenderizado === tabIndex) {
        barraTemp.style.width = `${pctTemp}%`;
        capsGrid.querySelectorAll(".me-cap-dot").forEach((dot, i) => {
            const n      = i + 1;
            const visto  = capsVistas >= n;
            const actual = esCurrent && item.progreso.capitulo === n;
            dot.className = `me-cap-dot${visto ? " visto" : ""}${actual ? " actual" : ""}`;
            dot.style.background  = actual ? color : visto ? `${color}30` : "";
            dot.style.borderColor = actual ? color : visto ? `${color}60` : "";
        });
        return;
    }

    // Construir HTML completo la primera vez o al cambiar de tab
    meTabRenderizado = tabIndex;
    contEl.innerHTML = `
        <div class="me-temp-info">
            <div class="me-temp-header">
                <span style="font-family:'Bebas Neue',cursive;font-size:1.1rem;letter-spacing:1px">TEMPORADA ${
    temp.tipo === "ova"      ? `OVA ${temp.numero}` :
    temp.tipo === "especial" ? `Especial ${temp.numero}` :
    `Temporada ${temp.numero}`
}</span>
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--muted)">${temp.capitulos} capítulos</span>
            </div>
            <div class="progress-wrap" style="margin:0.5rem 0">
                <div class="me-barra-temp" style="height:100%;border-radius:99px;width:${pctTemp}%;background:${color};will-change:width;transform:translateZ(0)"></div>
            </div>
            <div class="me-caps-grid">
                ${Array.from({length: temp.capitulos}, (_, i) => {
                    const n      = i + 1;
                    const visto  = capsVistas >= n;
                    const actual = esCurrent && item.progreso.capitulo === n;
                    return `<div class="me-cap-dot${visto ? " visto" : ""}${actual ? " actual" : ""}"
                                 style="${actual ? `background:${color};border-color:${color}` : visto ? `background:${color}30;border-color:${color}60` : ""}"
                                 title="Ep ${n}">${n}</div>`;
                }).join("")}
            </div>
            ${esCurrent ? `<p style="font-size:0.75rem;color:var(--muted);margin-top:0.75rem;font-family:'JetBrains Mono',monospace">← ${temp.tipo === "ova" ? "OVA actual" : temp.tipo === "especial" ? "Especial actual" : "Temporada actual"}</p>` : ""}
        </div>`;
}

// ── Cambiar tab de temporada ──────────────────────────────
function meCambiarTab(i) {
    meTabActual = i;
    meRenderTabs();
}

// ── Actualizar barras de capítulos y páginas ──────────────
function meActualizarCapitulos(color = config.color) {
    const item = meItemActual;
    const pct  = Math.min(100, Math.round((item.capituloActual / item.capitulosTotales) * 100));
    document.getElementById("me-cap-texto").textContent = `Capítulo ${item.capituloActual} de ${item.capitulosTotales} (${pct}%)`;
    document.getElementById("me-cap-num").textContent   = item.capituloActual;
    document.getElementById("me-barra-cap").style.cssText = `width:${pct}%;background:${color}`;
}

function meActualizarPaginas(color = config.color) {
    const item = meItemActual;
    const pct  = Math.min(100, Math.round((item.paginaActual / item.paginasTotales) * 100));
    document.getElementById("me-pag-texto").textContent = `Página ${item.paginaActual} de ${item.paginasTotales} (${pct}%)`;
    document.getElementById("me-pag-num").textContent   = item.paginaActual;
    document.getElementById("me-barra-pag").style.cssText = `width:${pct}%;background:${color}`;
}

// ── Botones +/− del modal expandido ──────────────────────
function mecambiarEpisodio(delta) {
    if (!meItemActual) return;
    cambiarEpisodio(meItemActual.id, delta);
    meActualizarEpisodios();
    meRenderTabContenido();
}

function mecambiarCapitulo(delta) {
    if (!meItemActual) return;
    cambiarCapitulo(meItemActual.id, delta);
    meActualizarCapitulos();
}

function mecambiarPagina(delta) {
    if (!meItemActual) return;
    cambiarPagina(meItemActual.id, delta);
    meActualizarPaginas();
}

// ── Botones +/− de progreso en las cards del grid ────────
function cambiarEpisodio(id, delta) {
    const item = dataOriginal.find(i => i.id === id);
    if (!item || !item.progreso || !item.temporadas?.length) return;

    const temporadaActual = item.temporadas[item.progreso.temporada - 1];
    if (!temporadaActual) return;

    let { capitulo, temporada } = item.progreso;
    capitulo += delta;

    if (capitulo > temporadaActual.capitulos) {
        if (temporada < item.temporadas.length) { temporada++; capitulo = 1; }
        else { capitulo = temporadaActual.capitulos; }
    }
    if (capitulo < 1) {
        if (temporada > 1) { temporada--; capitulo = item.temporadas[temporada - 1].capitulos; }
        else { capitulo = 1; }
    }

    item.progreso = { temporada, capitulo };
actualizarItemSilencioso(item);
// Actualizar dataOriginal PRIMERO
const idx = dataOriginal.findIndex(i => i.id === id);
if (idx !== -1) dataOriginal[idx].progreso = item.progreso;
// Luego parchar el DOM
parchearProgresoEpisodio(id);

// Si el modal está abierto con este item, actualizar UI
if (meItemActual?.id === id) {
    meItemActual = dataOriginal[idx];
    meActualizarEpisodios(CONFIG[tipo]?.color ?? "#888");
    meTabActual = temporada - 1;
    meRenderTabs(CONFIG[tipo]?.color ?? "#888");
}
}

function cambiarCapitulo(id, delta) {
    const item = dataOriginal.find(i => i.id === id);
    if (!item) return;
    const nuevo = Math.max(0, Math.min(item.capitulosTotales, item.capituloActual + delta));
    if (nuevo === item.capituloActual) return;
    item.capituloActual = nuevo;
    actualizarItemSilencioso(item);
    parchearProgresoCapitulo(id);
}

function cambiarPagina(id, delta) {
    const item = dataOriginal.find(i => i.id === id);
    if (!item) return;
    const nuevo = Math.max(0, Math.min(item.paginasTotales, item.paginaActual + delta));
    if (nuevo === item.paginaActual) return;
    item.paginaActual = nuevo;
    actualizarItemSilencioso(item);
    parchearProgresoPagina(id);
}

// ── Parchear solo el bloque de progreso en la card ───────
function parchearProgresoEpisodio(id) {
    const item = dataOriginal.find(i => i.id === id);
    const card = document.getElementById(`card-${id}`);
    if (!item || !card) return;

    const totalCaps = item.temporadas.reduce((s, t) => s + t.capitulos, 0);
    const capActual = item.temporadas
        .slice(0, item.progreso.temporada - 1)
        .reduce((s, t) => s + t.capitulos, 0) + item.progreso.capitulo;
    const pct = totalCaps ? Math.min(100, Math.round((capActual / totalCaps) * 100)) : 0;

    const tempActual = item.temporadas[item.progreso.temporada - 1];
const labelTemp  = tempActual?.tipo === "ova"      ? `OVA ${tempActual.numero}`
                 : tempActual?.tipo === "especial" ? `ESP ${tempActual.numero}`
                 : `T${item.progreso.temporada}`;
card.querySelector(".progress-info").textContent = `${labelTemp} · Ep ${item.progreso.capitulo}`;
    card.querySelector(".progress-wrap").style.setProperty("--pct", `${pct}%`);
    card.querySelector(".prog-num").textContent = `Ep ${item.progreso.capitulo}`;
}

function parchearProgresoCapitulo(id) {
    const item = dataOriginal.find(i => i.id === id);
    const card = document.getElementById(`card-${id}`);
    if (!item || !card) return;

    const pct = Math.min(100, Math.round((item.capituloActual / item.capitulosTotales) * 100));
    card.querySelector(".progress-info").textContent = `Cap ${item.capituloActual} / ${item.capitulosTotales} (${pct}%)`;
    card.querySelector(".progress-wrap").style.setProperty("--pct", `${pct}%`);
    card.querySelector(".prog-num").textContent = item.capituloActual;
}

function parchearProgresoPagina(id) {
    const item = dataOriginal.find(i => i.id === id);
    const card = document.getElementById(`card-${id}`);
    if (!item || !card) return;

    const pct = Math.min(100, Math.round((item.paginaActual / item.paginasTotales) * 100));
    card.querySelector(".progress-info").textContent = `Pág ${item.paginaActual} / ${item.paginasTotales} (${pct}%)`;
    card.querySelector(".progress-wrap").style.setProperty("--pct", `${pct}%`);
    card.querySelector(".prog-num").textContent = item.paginaActual;
}

function parchearProgresoManga(id) {
    const item = dataOriginal.find(i => i.id === id);
    const card = document.getElementById(`card-${id}`);
    if (!item || !card) return;

    const capActual  = item.progresoManga?.capituloActual ?? 0;
    const capMax     = item.tomos?.[item.tomos.length - 1]?.capituloFin ?? 0;
    const tomoActual = item.tomos?.find(t => capActual >= t.capituloInicio && capActual <= t.capituloFin)
                    ?? item.tomos?.[item.tomos.length - 1];
    const pct = capMax > 0 ? Math.min(100, Math.round((capActual / capMax) * 100)) : 0;

    const infoEl = card.querySelector(".progress-info");
    const fillEl = card.querySelector(".progress-fill");
    const numEl  = card.querySelector(".prog-num");
    const wrapEl = card.querySelector(".progress-wrap");

    if (infoEl) infoEl.textContent = `Tomo ${tomoActual?.numero ?? "?"} · Cap ${capActual} (${pct}%)`;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (wrapEl) wrapEl.style.setProperty("--pct", `${pct}%`);
    if (numEl)  numEl.textContent  = `Cap ${capActual}`;
}

// Cambiar tab de tomo
function meCambiarTabManga(idx) {
    const color = CONFIG[tipo]?.color ?? "#888";
    document.querySelectorAll("#me-tabs-manga .me-tab").forEach((btn, i) => {
        const activo = i === idx;
        btn.classList.toggle("activo", activo);
        btn.style.background   = activo ? color : "";
        btn.style.borderColor  = activo ? color : "";
        btn.style.color        = activo ? "#000" : "";
    });
    meRenderTabManga(idx);
}

// Renderizar dots de capítulos de un tomo
function meRenderTabManga(idx, animar = true) {
    const item      = meItemActual;
    const tomos     = item?.tomos ?? [];
    const tomo      = tomos[idx];
    if (!tomo) return;

    const capActual = item.progresoManga?.capituloActual ?? 0;
    const total     = tomo.capituloFin - tomo.capituloInicio + 1;
    const contenedor = document.getElementById("me-tab-manga-contenido");
    if (!contenedor) return;

    const caps = Array.from({ length: total }, (_, i) => {
        const numCap  = tomo.capituloInicio + i;
        const visto   = numCap <= capActual;
const actual  = numCap === capActual;
const color   = CONFIG[tipo]?.color ?? "#888";
return `<div class="me-cap-dot ${visto ? "visto" : ""} ${actual ? "actual" : ""}" 
    style="${actual ? `background:${color};border-color:${color};color:#000` : visto ? `background:${color}25;border-color:${color}40;color:#fff` : ""}"
    title="Cap. ${numCap}">${numCap}</div>`;
    }).join("");

    const esTomoCurrent = capActual >= tomo.capituloInicio && capActual <= tomo.capituloFin;

    contenedor.innerHTML = `
    <div class="${animar ? "me-temp-info" : ""}" style="margin-top:0.75rem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:var(--text)">Tomo ${tomo.numero}</span>
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted)">${total} capítulos</span>
            </div>
            <div class="me-caps-grid">${caps}</div>
            ${esTomoCurrent ? `<div style="font-size:0.7rem;color:var(--muted);margin-top:0.5rem">← Tomo actual</div>` : ""}
        </div>`;
}