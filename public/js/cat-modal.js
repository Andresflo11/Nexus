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
let meDatosUsuario = null;  // { fecha_agregado, dlcs_usuario } del dashboard

// ── Helper: obtener imagen según temporada/tomo actual ────
function _getImagenParaSeccion(item, idx) {
    const imagenes = Array.isArray(item.imagenes) ? item.imagenes : [];
    // Si hay imagen para ese índice y no está vacía, usarla
    if (imagenes[idx]) return imagenes[idx];
    // Fallback a la imagen principal
    return item.imagen || null;
}

function _actualizarPosterModal(imagen) {
    const poster = document.getElementById("me-poster");
    const bg     = document.getElementById("me-bg");
    if (!poster || !imagen) return;
    const img = poster.querySelector("img");
    if (img && img.src === imagen) return;

    // Precargar antes de hacer el swap
    const preload = new Image();
    preload.onload = () => {
        if (img) {
            img.src = imagen;
        } else {
            poster.innerHTML = `<img src="${imagen}" alt="">`;
        }
        if (bg) bg.style.backgroundImage = `url('${imagen}')`;
    };
    preload.onerror = () => {};
    preload.src = imagen;
}

// ── Actualizar imagen de la card del grid (sin parpadeo) ──
function _actualizarImagenCard(itemId, idx) {
    const item = dataOriginal.find(i => i.id === itemId);
    const card = document.getElementById(`card-${itemId}`);
    if (!item || !card) return;
    const imagen = _getImagenParaSeccion(item, idx);
    if (!imagen) return;
    const posterEl = card.querySelector(".card-poster");
    if (!posterEl) return;
    const imgActual = posterEl.querySelector("img");

    // Si es la misma imagen, no hacer nada
    if (imgActual && imgActual.src === imagen) return;

    // Precargar la nueva imagen antes de mostrarla
    const preload = new Image();
    preload.onload = () => {
        if (imgActual) {
            // Swap directo sin animación — ya está precargada, no hay flash
            imgActual.src = imagen;
        } else {
            const ph = posterEl.querySelector(".card-poster-placeholder");
            if (ph) ph.remove();
            const ni = document.createElement("img");
            ni.src     = imagen;
            ni.alt     = item.titulo;
            ni.loading = "lazy";
            ni.onerror = function() { this.style.display = "none"; };
            posterEl.prepend(ni);
        }
    };
    preload.onerror = () => {}; // si falla, mantener imagen actual
    preload.src = imagen;
}

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
    meDatosUsuario  = null;
    meTabActual  = item.progreso?.temporada ? item.progreso.temporada - 1 : 0;

    const color = config.color ?? "#888";
    const modal = document.getElementById("modal-expandido");

     // Fondo blur con la imagen del póster (de la temporada/tomo actual)
    const bg = document.getElementById("me-bg");
    const _tabIni  = item.progreso?.temporada ? item.progreso.temporada - 1 : 0;
    const _tomoIni = (() => {
        if (!config.usaTomos || !item.tomos?.length) return 0;
        const cap = item.progresoManga?.capituloActual ?? 0;
        const idx = item.tomos.findIndex(t => cap >= t.capituloInicio && cap <= t.capituloFin);
        return idx >= 0 ? idx : 0;
    })();
    const _secIdx   = config.usaEpisodios ? _tabIni : config.usaTomos ? _tomoIni : 0;
    const _imgInicial = _getImagenParaSeccion(item, _secIdx);
    if (_imgInicial) {
        bg.style.backgroundImage = `url('${esc(_imgInicial)}')`;
        bg.style.opacity = "1";
    } else {
        bg.style.backgroundImage = "none";
        bg.style.opacity = "0";
    }

    // Póster — usar imagen de la temporada/tomo actual si existe
    const poster = document.getElementById("me-poster");
    const tabInicial = item.progreso?.temporada ? item.progreso.temporada - 1 : 0;
    const tomoInicial = (() => {
        if (!config.usaTomos || !item.tomos?.length) return 0;
        const cap = item.progresoManga?.capituloActual ?? 0;
        const idx = item.tomos.findIndex(t => cap >= t.capituloInicio && cap <= t.capituloFin);
        return idx >= 0 ? idx : 0;
    })();
    const seccionIdx  = config.usaEpisodios ? tabInicial : config.usaTomos ? tomoInicial : 0;
    const imagenInicial = _getImagenParaSeccion(item, seccionIdx);
    poster.innerHTML    = imagenInicial ? `<img src="${esc(imagenInicial)}" alt="">` : `<span>${tipoEmoji(tipo)}</span>`;
    poster.style.borderColor = color;

    // Título
    document.getElementById("me-titulo").textContent = item.titulo;
    const btnIrItem = document.getElementById("btn-ir-item");
    if (btnIrItem) {
        const paginaActual = window.location.pathname.split("/").pop() || "index.html";
        const origen = encodeURIComponent(window.location.pathname + window.location.search);
        btnIrItem.href = `/pages/item.html?id=${item.id}&origen=${origen}`;
        btnIrItem.removeAttribute("target"); // nunca abrir en pestaña nueva
    }

    // Tags de metadata (fecha, plataforma, estadoSerie, estado, logros)
    function meBloque(label, valor, valorColor) {
        return `<div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.52rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted);margin-bottom:0.15rem">${label}</div>
            <span style="font-family:'Bebas Neue',cursive;font-size:1.6rem;color:${valorColor ?? "var(--text)"};letter-spacing:1.5px;line-height:1">${valor}</span>
        </div>`;
    }
    const metaHTML = [];
    const fechaSrc = meDatosUsuario?.fecha_agregado ?? item.fecha;
    if (fechaSrc) {
        const [y, m, d] = fechaSrc.split("-");
        const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        metaHTML.push(meBloque("Fecha agregada", `${parseInt(d)} ${meses[parseInt(m)-1]} ${y}`));
    }
    const plats = (()=>{ if(!item.plataforma||item.plataforma==="null") return []; if(Array.isArray(item.plataforma)) return item.plataforma.filter(Boolean); return [item.plataforma]; })();
    if (item.tipo !== "juegos") plats.forEach(p => metaHTML.push(meBloque("Plataforma", esc(p), color)));
    if (item.estadoSerie && item.estadoSerie !== "null") metaHTML.push(meBloque("Estado de la obra", esc(item.estadoSerie), "#4ade80"));
    if (item.estado) metaHTML.push(meBloque("Tu estado", esc(item.estado), color));
    if (config.usalogros && item.logros) {
        const logrosColor = { "Todos completados":"#64dd17","Algunos completados":"var(--accent)","En proceso":"#ff6b35","Sin completar":"#9ca3af","No tiene logros":"#6b7280" }[item.logros] ?? "#6b7280";
        const emoji = item.logros === "Todos completados" ? "" : "";
        metaHTML.push(meBloque("Logros", `${emoji}${item.logros ?? "No tiene logros"}`, logrosColor));
    }
    if (config.usaDlcs && item.dlcs?.length) {
    const logrosColor = (l) => ({"Todos completados":"#64dd17","Algunos completados":"var(--accent)","En proceso":"#ff6b35","Sin completar":"#9ca3af","No tiene logros":"#6b7280"})[l] ?? "#6b7280";
    const hayLogros = item.dlcs.some(d => d.logros);
    const hayEstado = item.dlcs.some(d => d.estado);
    const dlcHTML = item.dlcs.map(d => `
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.45rem 0;border-bottom:1px solid var(--border)">
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);min-width:36px">${esc(d.tipo ?? "DLC")}</span>
            <span style="font-size:0.82rem;flex:1">${esc(d.nombre)}</span>
            ${hayLogros ? `<span style="font-family:'Bebas Neue',cursive;font-size:0.88rem;color:${logrosColor(d.logros)};letter-spacing:1px;line-height:1;min-width:80px;text-align:right">${d.logros === "Todos completados" ? "" : ""}${d.logros ?? ""}</span>` : ""}
            ${hayEstado ? `<span style="font-family:'Bebas Neue',cursive;font-size:0.88rem;color:${color};letter-spacing:1px;line-height:1;min-width:70px;text-align:right">${esc(d.estado ?? "")}</span>` : ""}
        </div>`).join("");

    const labelStyle = "font-family:'JetBrains Mono',monospace;font-size:0.46rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted)";
    document.getElementById("me-dlcs").innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;padding-bottom:0.35rem;border-bottom:1px solid var(--border2);margin-bottom:0.1rem">
            <span style="${labelStyle};min-width:36px">Tipo</span>
            <span style="${labelStyle};flex:1">Nombre</span>
            ${hayLogros ? `<span style="${labelStyle};min-width:80px;text-align:right">Logros</span>` : ""}
            ${hayEstado ? `<span style="${labelStyle};min-width:70px;text-align:right">Estado</span>` : ""}
        </div>
        ${dlcHTML}`;
    const _uAdmin = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    const dlcsEl = document.getElementById("me-dlcs");
    if (dlcsEl) dlcsEl.classList.toggle("oculto", _uAdmin?.rol !== "admin");
    document.getElementById("me-dlcs").classList.remove("oculto");
    } else {
    document.getElementById("me-dlcs")?.classList.add("oculto");
    }
    document.getElementById("me-meta").innerHTML = `<div style="display:flex;gap:1.5rem;flex-wrap:wrap">${metaHTML.join("")}</div>`;

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
    if (btnCompletar) {
        btnCompletar.textContent     = yaCompleto ? "✓ Completado" : `Marcar como ${estadoComp}`;
        btnCompletar.style.background  = yaCompleto ? color : "transparent";
        btnCompletar.style.color       = yaCompleto ? "#000" : color;
        btnCompletar.style.borderColor = color;
    }

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
    const tomos      = item.tomos ?? [];
    const tomoLabel  = config.tomoLabel     ?? "T";
    const capLabel   = config.capituloLabel ?? "Cap.";
    const secLabel   = config.tomoLabel     ? "Volúmenes" : "Tomos";
    const capActual = item.progresoManga?.capituloActual ?? 0;
    const tomoActual = capActual === 0
                    ? (tomos[0] ?? null)
                    : (tomos.find(t => capActual >= t.capituloInicio && capActual <= t.capituloFin) ?? tomos[tomos.length - 1]);
    const capMax    = tomos[tomos.length - 1]?.capituloFin ?? 0;
const capFin    = tomoActual?.capituloFin ?? 0;
const capInicio = tomoActual?.capituloInicio ?? 1;
const pct       = capFin > 0 ? Math.round(((capActual - capInicio + 1) / (capFin - capInicio + 1)) * 100) : 0;
const pctGlobal = capMax > 0 ? Math.min(100, Math.round((capActual / capMax) * 100)) : 0;

    const bloqueTomos = document.getElementById("me-tomos");
    bloqueTomos.classList.remove("oculto");

    // Tabs de tomos
    const tomoNombre = config.tomoLabel ? "Volumen" : "Tomo";

    const tabsHTML = tomos.map((t, i) => `
    <button type="button" class="me-tab ${t === tomoActual ? "activo" : ""}" 
        style="${t === tomoActual ? `background:${color};border-color:${color};color:#000` : ""}"
        onclick="meCambiarTabManga(${i})">
        ${tomoLabel}${t.numero}
    </button>`).join("");

    bloqueTomos.innerHTML = `
    <div class="me-progreso-header">
        <span class="me-info-tomo" id="me-progreso-texto-manga">
            ${tomoActual ? `${tomoNombre} ${tomoActual.numero}` : `Sin ${secLabel.toLowerCase()}`}
            ${tomoActual && capFin ? `— ${pctGlobal}%` : ""}
        </span>
        <div class="progress-btns">
            <button class="prog-btn" onclick="mecambiarCapituloManga(-1, ${item.id})">−</button>
            <span class="prog-num" id="me-cap-manga-texto">${capLabel} ${capActual}</span>
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

    // Mostrar botón editar solo si es admin
    const btnEditar = document.getElementById("btn-editar-modal");
    if (btnEditar) {
        const _u = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
        if (_u?.rol === "admin") {
            btnEditar.style.display = "";
            btnEditar.textContent = "✏ Editar todos los campos";
        } else if (_u) {
            btnEditar.style.display = "";
            btnEditar.textContent = "✏ Editar mi progreso";
        } else {
            btnEditar.style.display = "none";
        }
    }

    const _uDash = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    if (_uDash && _uDash.rol !== "admin") {
        fetch(`/mi-dashboard/${_uDash.id}`)
            .then(r => r.json())
            .then(items => {
                const d = items.find(i => i.id === item.id);
                meDatosUsuario = d
                    ? { fecha_agregado: d.fecha_agregado, dlcs_usuario: d.dlcs_usuario, logros: d.logros_usuario }
                    : null;

                // ── Re-renderizar me-meta ──────────────────
                const metaEl = document.getElementById("me-meta");
                if (metaEl) {
                    function mb(label, valor, vc) {
                        return `<div>
                            <div style="font-family:'JetBrains Mono',monospace;font-size:0.52rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted);margin-bottom:0.15rem">${label}</div>
                            <span style="font-family:'Bebas Neue',cursive;font-size:1.6rem;color:${vc??"var(--text)"};letter-spacing:1.5px;line-height:1">${valor}</span>
                        </div>`;
                    }
                    const metas = [];
                    const fs = meDatosUsuario?.fecha_agregado;
                    if (fs) {
                        const [fy,fm,fd] = fs.split("-");
                        const mm = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
                        metas.push(mb("Fecha agregada", `${parseInt(fd)} ${mm[parseInt(fm)-1]} ${fy}`));
                    }
                    if (item.tipo !== "juegos") {
                        const pl = (()=>{ if(!item.plataforma||item.plataforma==="null") return []; if(Array.isArray(item.plataforma)) return item.plataforma.filter(Boolean); return [item.plataforma]; })();
                        pl.forEach(p => metas.push(mb("Plataforma", p, color)));
                    }
                    if (item.estadoSerie && item.estadoSerie !== "null") metas.push(mb("Estado de la obra", item.estadoSerie, "#4ade80"));
                    if (item.estado) metas.push(mb("Tu estado", item.estado, color));
                    if (config.usalogros) {
                        const lv = meDatosUsuario !== null ? (meDatosUsuario?.logros || null) : (item.logros || null);
                        if (lv) {
                            const lc = {"Todos completados":"#64dd17","Algunos completados":"var(--accent)","En proceso":"#ff6b35","Sin completar":"#9ca3af","No tiene logros":"#6b7280"}[lv] ?? "#6b7280";
                            metas.push(mb("Logros", `${lv==="Todos completados"?"":""}${lv}`, lc));
                        }
                    }
                    metaEl.innerHTML = `<div style="display:flex;gap:1.5rem;flex-wrap:wrap">${metas.join("")}</div>`;
                }
                document.getElementById("me-dlcs")?.classList.add("oculto");
                // ── Re-renderizar me-dlcs-usuario ──────────
                const secDlc = document.getElementById("me-dlcs-usuario");
                if (!secDlc || !config.usaDlcs || !item.dlcs?.length) return;
                const dlcsU = meDatosUsuario?.dlcs_usuario ?? {};
                const logrosColor = l => ({"Todos completados":"#64dd17","Algunos completados":"var(--accent)","En proceso":"#ff6b35","Sin completar":"#9ca3af","No tiene logros":"#6b7280"})[l] ?? "#6b7280";
                const hayLogros = item.dlcs.some((_, i) => dlcsU[i]?.logros);
                const hayEstado = item.dlcs.some((_, i) => dlcsU[i]?.estado);
                if (!hayLogros && !hayEstado) { secDlc.classList.add("oculto"); return; }
                const labelStyle = "font-family:'JetBrains Mono',monospace;font-size:0.46rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted)";
                const rows = item.dlcs.map((d, i) => {
                    const du = dlcsU[i] ?? {};
                    return `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.45rem 0;border-bottom:1px solid var(--border)">
                        <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);min-width:36px">${esc(d.tipo??"DLC")}</span>
                        <span style="font-size:0.82rem;flex:1">${esc(d.nombre)}</span>
                        ${hayLogros ? `<span style="font-family:'Bebas Neue',cursive;font-size:0.88rem;color:${logrosColor(du.logros)};letter-spacing:1px;line-height:1;min-width:80px;text-align:right">${du.logros==="Todos completados"?"":""}${du.logros??""}</span>` : ""}
                        ${hayEstado ? `<span style="font-family:'Bebas Neue',cursive;font-size:0.88rem;color:${color};letter-spacing:1px;line-height:1;min-width:70px;text-align:right">${esc(du.estado??"")}</span>` : ""}
                    </div>`;
                }).join("");
                secDlc.innerHTML = `
                    <div style="display:flex;align-items:center;gap:0.75rem;padding-bottom:0.35rem;border-bottom:1px solid var(--border2);margin-bottom:0.1rem">
                        <span style="${labelStyle};min-width:36px">Tipo</span>
                        <span style="${labelStyle};flex:1">Nombre</span>
                        ${hayLogros ? `<span style="${labelStyle};min-width:80px;text-align:right">Logros</span>` : ""}
                        ${hayEstado ? `<span style="${labelStyle};min-width:70px;text-align:right">Estado</span>` : ""}
                    </div>${rows}`;
                secDlc.classList.remove("oculto");
            }).catch(() => {});
    }

    // ── Relacionados ──────────────────────────────────────
    const secRel = document.getElementById("me-relacionados");
    const relacionados = Array.isArray(item.relacionados) ? item.relacionados : [];
    if (relacionados.length && secRel) {
        secRel.classList.remove("oculto");
        secRel.innerHTML = `<div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.75rem">Relacionados</div>
        <div id="me-rel-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.5rem">
            <div style="color:var(--muted);font-size:0.78rem">Cargando...</div>
        </div>`;
        fetch(`/items/bulk/${relacionados.join(",")}`)
            .then(r => r.json())
            .then(rels => {
                const html = rels.map(r => {
                    const cfg2 = CONFIG[r.tipo];
                    return `<div style="display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--border);border-radius:10px;transition:border-color 0.2s,transform 0.15s;overflow:hidden"
                        onmouseover="this.style.borderColor='${cfg2?.color ?? color}';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border)';this.style.transform=''">
                        ${r.imagen
                            ? `<img src="${r.imagen}" style="width:100%;aspect-ratio:2/3;object-fit:cover;display:block">`
                            : `<div style="width:100%;aspect-ratio:2/3;display:flex;align-items:center;justify-content:center;font-size:2rem;background:var(--bg)">${cfg2?.label.split(" ")[0] ?? "?"}</div>`}
                        <div style="padding:0.4rem 0.45rem">
                            <div style="font-size:0.68rem;font-weight:600;line-height:1.2;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(r.titulo)}</div>
                            <div style="font-size:0.55rem;color:${cfg2?.color ?? "var(--muted)"};font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;margin-top:0.2rem">${cfg2?.label.slice(2) ?? r.tipo}</div>
                        </div>
                    </div>`;
                }).join("");
                const cont = document.getElementById("me-rel-cards");
                if (cont) cont.innerHTML = html || `<div style="color:var(--muted);font-size:0.78rem">Sin items relacionados</div>`;
            }).catch(() => {
                const cont = document.getElementById("me-rel-cards");
                if (cont) cont.innerHTML = `<div style="color:var(--muted);font-size:0.78rem">Error cargando</div>`;
            });
    } else if (secRel) {
        secRel.classList.add("oculto");
        secRel.innerHTML = "";
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
    const tomoActual = capActual === 0
        ? tomos[0]
        : (tomos.find(t => capActual >= t.capituloInicio && capActual <= t.capituloFin)
           ?? tomos[tomos.length - 1]);
    const capInicio  = tomoActual?.capituloInicio ?? 1;
    const capFin     = tomoActual?.capituloFin    ?? capMax;
    const pct        = Math.round(((capActual - capInicio + 1) / (capFin - capInicio + 1)) * 100);
    const pctGlobal  = Math.round((capActual / capMax) * 100);

    // Actualizar UI del modal
    const textoModal = document.getElementById("me-cap-manga-texto");
const barraModal = document.getElementById("me-barra-manga");
const infoModal  = document.getElementById("me-progreso-texto-manga");

const _tL = CONFIG[item.tipo]?.tomoLabel ?? "T";
const _cL = CONFIG[item.tipo]?.capituloLabel ?? "Cap.";
const _cfg       = CONFIG[item.tipo] ?? {};
const _tomoNombre = _cfg.tomoLabel ? "Volumen" : "Tomo";
const _capLabel   = _cfg.capituloLabel ?? "Cap.";
if (textoModal) textoModal.textContent = `${_capLabel} ${capActual}`;
if (barraModal) barraModal.style.width = `${pctGlobal}%`;
if (infoModal)  infoModal.textContent  = `${_tomoNombre} ${tomoActual?.numero ?? "?"} — ${pctGlobal}%`;
     // Guardar silenciosamente
    const idx = dataOriginal.findIndex(i => i.id === item.id);
if (idx !== -1) dataOriginal[idx].progresoManga = item.progresoManga;
if (meItemActual?.id === item.id) meItemActual = dataOriginal[idx];
actualizarItemSilencioso({ id: item.id, progresoManga: item.progresoManga });
parchearProgresoManga(item.id);
// Actualizar imagen de la card y modal según tomo actual
const _tomoIdxCard = item.tomos?.indexOf(tomoActual) ?? 0;
const _tomoIdxFinal = _tomoIdxCard >= 0 ? _tomoIdxCard : 0;
_actualizarImagenCard(item.id, _tomoIdxFinal);
// Si el modal está abierto, actualizar imagen también
if (meItemActual?.id === item.id) {
    const imagenModal = _getImagenParaSeccion(meItemActual, _tomoIdxFinal);
    if (imagenModal) _actualizarPosterModal(imagenModal);
}
// Actualizar tabs y dots si el modal está abierto
if (meItemActual?.id === item.id && document.getElementById("me-tabs-manga")) {
    const tomos      = item.tomos ?? [];
    const tomoActual = capActual === 0
        ? tomos[0]
        : (tomos.find(t => capActual >= t.capituloInicio && capActual <= t.capituloFin)
           ?? tomos[tomos.length - 1]);
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
    const _u = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    const esAdmin = _u?.rol === "admin";

    const inner = document.querySelector(".modal-expandido-inner");
    inner.innerHTML = `
        <div class="me-bg" id="me-bg" style="
            background-image:${item.imagen ? `url('${esc(item.imagen)}')` : 'none'};
            opacity:${item.imagen ? 1 : 0}">
        </div>
        <div style="position:relative;z-index:1;padding:2.5rem 0;max-height:96vh;overflow-y:auto;
            display:flex;flex-direction:column;align-items:center">
            <div style="width:100%;max-width:${esAdmin ? "100%" : "720px"};padding:0 2rem">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
                    <span class="modal-title">${esAdmin ? "EDITAR — " : "MI PROGRESO — "}${esc(item.titulo)}</span>
                    <button class="close-btn" onclick="meVolverDesdeEdicion(${id})">✕</button>
                </div>
                <div id="me-form-contenido" style="display:grid;grid-template-columns:${esAdmin ? "repeat(auto-fill,minmax(220px,1fr))" : "1fr"};gap:0.75rem"></div>
            </div>
        </div>`;

    if (esAdmin) {
        activarEdicionEnModal(id);
    } else {
        activarEdicionUsuario(id, _u.id);
    }
}

// ── Volver desde edición al modal normal ──────────────────
function meVolverDesdeEdicion(id) {
    const inner = document.querySelector(".modal-expandido-inner");
    inner.innerHTML = meInnerHTMLOriginal;

    meItemIdRenderizado = null;
    meTabRenderizado    = -1;

    abrirModalExpandido(id);
}
function meActualizarMetaEstado(valor) {
    const metaEl = document.getElementById("me-meta");
    if (!metaEl) return;
    // Buscar el bloque "Tu estado" y actualizarlo
    const bloques = metaEl.querySelectorAll("div > div");
    bloques.forEach(bloque => {
        const label = bloque.querySelector("div");
        if (label && label.textContent.trim().toUpperCase() === "TU ESTADO") {
            const span = bloque.querySelector("span");
            if (span) span.textContent = valor;
        }
    });
}
// ── Guardar un campo rápido (estado o valoración) ─────────
// Se llama desde los select del modal sin entrar en modo edición.
function meGuardarCampo(campo, valor) {
    if (!meItemActual) return;
    meItemActual[campo] = valor;

    // Si cambió el estado, actualizar botón completar y me-meta
    if (campo === "estado") {
        const yaCompleto = config.estadosCompletados?.includes(valor);
        const estadoComp = config.estadosCompletados?.[0];
        const color      = config.color ?? "#888";
        const btn        = document.getElementById("me-btn-completar");
        if (btn) {
            btn.textContent        = yaCompleto ? "✓ Completado" : `Marcar como ${estadoComp}`;
            btn.style.background   = yaCompleto ? color : "transparent";
            btn.style.color        = yaCompleto ? "#000" : color;
        }
        meActualizarMetaEstado(valor);
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
                 : tempActual?.tipo === "pelicula" ? `PEL ${tempActual.numero}`
                 : tempActual?.tipo === "ona"      ? `ONA ${tempActual.numero}`
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
                : t.tipo === "pelicula" ? `PEL ${t.numero}`
                : t.tipo === "ona"      ? `ONA ${t.numero}`
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
    temp.tipo === "pelicula" ? `Película ${temp.numero}` :
    temp.tipo === "ona"      ? `ONA ${temp.numero}` :
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
            ${esCurrent ? `<p style="font-size:0.75rem;color:var(--muted);margin-top:0.75rem;font-family:'JetBrains Mono',monospace">← ${temp.tipo === "ova" ? "OVA actual" : temp.tipo === "especial" ? "Especial actual" : temp.tipo === "pelicula" ? "Película actual" : temp.tipo === "ona" ? "ONA actual": "Temporada actual"}</p>` : ""}
        </div>`;
}

// ── Cambiar tab de temporada ──────────────────────────────
function meCambiarTab(i) {
    meTabActual = i;
    meRenderTabs();
    // Cambiar imagen según la temporada seleccionada
    if (meItemActual) {
        const imagen = _getImagenParaSeccion(meItemActual, i);
        if (imagen) _actualizarPosterModal(imagen);
    }
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
        else { capitulo = 0; }
    }

    item.progreso = { temporada, capitulo };
actualizarItemSilencioso(item);
// Actualizar dataOriginal PRIMERO
const idx = dataOriginal.findIndex(i => i.id === id);
if (idx !== -1) dataOriginal[idx].progreso = item.progreso;
// Luego parchar el DOM
parchearProgresoEpisodio(id);
// Actualizar imagen de la card según temporada actual
_actualizarImagenCard(id, temporada - 1);

// Si el modal está abierto con este item, actualizar UI
if (meItemActual?.id === id) {
    meItemActual = dataOriginal[idx];
    meActualizarEpisodios(CONFIG[tipo]?.color ?? "#888");
    meTabActual = temporada - 1;
    meRenderTabs(CONFIG[tipo]?.color ?? "#888");
    // Actualizar imagen del modal también
    const imagenModal = _getImagenParaSeccion(meItemActual, temporada - 1);
    if (imagenModal) _actualizarPosterModal(imagenModal);
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
    // Para cómics con tomos, actualizar imagen según tomo actual
    if (item.tomos?.length) {
        const tomoIdx = item.tomos.findIndex(t => nuevo >= t.capituloInicio && nuevo <= t.capituloFin);
        if (tomoIdx >= 0) {
            _actualizarImagenCard(id, tomoIdx);
            // Si el modal está abierto, actualizar imagen también
            if (meItemActual?.id === id) {
                const imagenModal = _getImagenParaSeccion(meItemActual, tomoIdx);
                if (imagenModal) _actualizarPosterModal(imagenModal);
            }
        }
    }
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
                 : tempActual?.tipo === "pelicula" ? `PEL ${tempActual.numero}`
                 : tempActual?.tipo === "ona"      ? `ONA ${tempActual.numero}`
                 : `T${item.progreso.temporada}`;
card.querySelector(".progress-info").textContent = `${labelTemp} (${pct}%)`;
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
    const tomoActual = capActual === 0
                    ? (item.tomos?.[0] ?? null)
                    : (item.tomos?.find(t => capActual >= t.capituloInicio && capActual <= t.capituloFin) ?? item.tomos?.[item.tomos.length - 1]);
    const pct = capMax > 0 ? Math.min(100, Math.round((capActual / capMax) * 100)) : 0;

    const infoEl = card.querySelector(".progress-info");
    const fillEl = card.querySelector(".progress-fill");
    const numEl  = card.querySelector(".prog-num");
    const wrapEl = card.querySelector(".progress-wrap");

    const _cfg      = CONFIG[item.tipo] ?? {};
    const tomoNombre = _cfg.tomoLabel     ? "Volumen" : "Tomo";
    const capLabel   = _cfg.capituloLabel ?? "Cap";
    if (infoEl) infoEl.textContent = `${tomoNombre} ${tomoActual?.numero ?? "?"} (${pct}%)`;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (wrapEl) wrapEl.style.setProperty("--pct", `${pct}%`);
    if (numEl)  numEl.textContent  = `${capLabel} ${capActual}`;
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
    // Cambiar imagen según el tomo seleccionado
    if (meItemActual) {
        const imagen = _getImagenParaSeccion(meItemActual, idx);
        if (imagen) _actualizarPosterModal(imagen);
    }
}

// Renderizar dots de capítulos de un tomo
function meRenderTabManga(idx, animar = true) {
    const item       = meItemActual;
    const tomos      = item?.tomos ?? [];
    const tomo       = tomos[idx];
    if (!tomo) return;

    const _cfg       = CONFIG[item.tipo] ?? {};
    const tomoNombre = _cfg.tomoLabel     ? "Volumen" : "Tomo";
    const tomoLabel  = _cfg.tomoLabel     ?? "T";
    const capLabel   = _cfg.capituloLabel ?? "Cap.";
    const capsNombre = _cfg.capituloLabel ? _cfg.capituloLabel.toLowerCase() + "s" : "capítulos";

    const capActual = item.progresoManga?.capituloActual ?? 0;
    const total     = tomo.capituloFin - tomo.capituloInicio + 1;
    const contenedor = document.getElementById("me-tab-manga-contenido");
    if (!contenedor) return;

    const caps = Array.from({ length: total }, (_, i) => {
        const numCap = tomo.capituloInicio + i;
        const visto  = numCap <= capActual;
        const actual = numCap === capActual;
        const color  = CONFIG[tipo]?.color ?? "#888";
        return `<div class="me-cap-dot ${visto ? "visto" : ""} ${actual ? "actual" : ""}" 
            style="${actual ? `background:${color};border-color:${color};color:#000` : visto ? `background:${color}25;border-color:${color}40;color:#fff` : ""}"
            title="${capLabel} ${numCap}">${numCap}</div>`;
    }).join("");

    const esTomoCurrent = capActual >= tomo.capituloInicio && capActual <= tomo.capituloFin;

    contenedor.innerHTML = `
    <div class="${animar ? "me-temp-info" : ""}" style="margin-top:0.75rem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:var(--text)">${tomoNombre} ${tomo.numero}</span>
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted)">${total} ${capsNombre}</span>
            </div>
            <div class="me-caps-grid">${caps}</div>
            ${esTomoCurrent ? `<div style="font-size:0.7rem;color:var(--muted);margin-top:0.5rem">← ${tomoNombre} actual</div>` : ""}
        </div>`;

        function meRenderDatosUsuario(item, config, color, userId) {
    // Fecha editable
    const fechaEl = document.getElementById("me-fecha-usuario");
    if (fechaEl) {
        const val = meDatosUsuario?.fecha_agregado ?? "";
        fechaEl.innerHTML = `
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.52rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted);margin-bottom:0.3rem">Fecha agregada</div>
            <input type="date" value="${val}" style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;background:var(--surface2);border:1px solid var(--border);border-radius:7px;color:var(--text);padding:0.3rem 0.6rem;outline:none"
                onchange="meGuardarDatoUsuario(${userId},${item.id},'fecha_agregado',this.value)">`;
    }

    // DLCs editables (estado y logros por DLC)
    if (!config.usaDlcs || !item.dlcs?.length) return;
    const secDlc = document.getElementById("me-dlcs-usuario");
    if (!secDlc) return;
    const dlcsU = meDatosUsuario?.dlcs_usuario ?? {};
    const labelStyle = "font-family:'JetBrains Mono',monospace;font-size:0.46rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted)";
    const logrosOpts = ["","Sin completar","En proceso","Algunos completados","Todos completados","No tiene logros"];
    const estadosOpts = config.estados ?? [];

    const rows = item.dlcs.map((d, i) => {
        const du = dlcsU[i] ?? {};
        return `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.45rem 0;border-bottom:1px solid var(--border)">
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);min-width:36px">${esc(d.tipo ?? "DLC")}</span>
            <span style="font-size:0.82rem;flex:1">${esc(d.nombre)}</span>
            <select onchange="meGuardarDlcUsuario(${userId},${item.id},${i},'logros',this.value)"
                style="font-size:0.72rem;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:0.2rem 0.4rem;font-family:'DM Sans',sans-serif">
                ${logrosOpts.map(o => `<option value="${o}" ${du.logros===o?"selected":""}>${o||"— Logros —"}</option>`).join("")}
            </select>
            <select onchange="meGuardarDlcUsuario(${userId},${item.id},${i},'estado',this.value)"
                style="font-size:0.72rem;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:${color};padding:0.2rem 0.4rem;font-family:'DM Sans',sans-serif">
                ${estadosOpts.map(o => `<option value="${o}" ${du.estado===o?"selected":""}>${o}</option>`).join("")}
            </select>
        </div>`;
    }).join("");

    secDlc.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;padding-bottom:0.35rem;border-bottom:1px solid var(--border2);margin-bottom:0.1rem">
            <span style="${labelStyle};min-width:36px">Tipo</span>
            <span style="${labelStyle};flex:1">Nombre</span>
            <span style="${labelStyle};min-width:120px;text-align:right">Logros</span>
            <span style="${labelStyle};min-width:100px;text-align:right">Estado</span>
        </div>${rows}`;
    secDlc.classList.remove("oculto");
}

async function meGuardarDatoUsuario(userId, itemId, campo, valor) {
    const body = { [campo]: valor };
    if (campo !== "fecha_agregado") return;
    if (!meDatosUsuario) meDatosUsuario = {};
    meDatosUsuario.fecha_agregado = valor;
    await fetch(`/mi-dashboard/${userId}/${itemId}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
}

async function meGuardarDlcUsuario(userId, itemId, idx, campo, valor) {
    if (!meDatosUsuario) meDatosUsuario = {};
    if (!meDatosUsuario.dlcs_usuario) meDatosUsuario.dlcs_usuario = {};
    if (!meDatosUsuario.dlcs_usuario[idx]) meDatosUsuario.dlcs_usuario[idx] = {};
    meDatosUsuario.dlcs_usuario[idx][campo] = valor;
    await fetch(`/mi-dashboard/${userId}/${itemId}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ dlcs_usuario: meDatosUsuario.dlcs_usuario }) });
}
}