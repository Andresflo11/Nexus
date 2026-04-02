// ╔══════════════════════════════════════════════════════════╗
// ║  cat-render.js — RENDERIZADO DE CARDS Y LISTA           ║
// ╠══════════════════════════════════════════════════════════╣
// ║  Contiene:                                               ║
// ║  · renderCard()     — HTML de cada card del grid        ║
// ║  · renderListItem() — HTML de cada fila en vista lista  ║
// ║  · mostrar()        — renderiza el grid o la lista      ║
// ║  · mostrarPorAño()  — renderiza agrupado por año        ║
// ║  · aplicarOrden()   — filtra + ordena + llama mostrar   ║
// ║  · setView()        — cambia entre grid y lista         ║
// ║  · crearFiltros()   — botones del sidebar               ║
// ║  · extraerAño()     — helper para ordenar por año       ║
// ╚══════════════════════════════════════════════════════════╝

const CAT_POR_PAGINA = 54;
let catPaginaActual  = 1;

// ── Renderizar card del grid ──────────────────────────────
function renderCard(item, idx) {
    const color   = config.color ?? "#888";

    // Imagen según temporada/tomo actual del progreso
    const _imagenCard = (() => {
        const imgs = Array.isArray(item.imagenes) ? item.imagenes : [];
        if (!imgs.length) return item.imagen || null;
        let idx = 0;
        // Episodios (series/animes)
        if (config.usaEpisodios) {
            const prog = typeof item.progreso === "string"
                ? (() => { try { return JSON.parse(item.progreso); } catch { return null; } })()
                : item.progreso;
            if (prog?.temporada) idx = prog.temporada - 1;
        }
        // Tomos (mangas/comics)
        else if (config.usaTomos && Array.isArray(item.tomos) && item.tomos.length) {
            const pm = typeof item.progresoManga === "string"
                ? (() => { try { return JSON.parse(item.progresoManga); } catch { return null; } })()
                : item.progresoManga;
            const cap = pm?.capituloActual ?? 0;
            if (cap > 0) {
                const ti = item.tomos.findIndex(t => cap >= t.capituloInicio && cap <= t.capituloFin);
                idx = ti >= 0 ? ti : 0;
            }
        }
        idx = Math.max(0, Math.min(idx, imgs.length - 1));
        return imgs[idx] || item.imagen || null;
    })();

    const poster  = _imagenCard
        ? `<img src="${esc(_imagenCard)}" alt="${esc(item.titulo)}" loading="lazy" onerror="this.style.display='none'">`
        : `<span class="card-poster-placeholder">${tipoEmoji(tipo)}</span>`;

    const valColor = valoracionColor(item.valoracion);
    const valLabel = valoracionLabel(item.valoracion);
    const rating   = item.valoracion > 0
        ? `<div class="card-rating-badge" style="background:${valColor}25;color:${valColor}">${valLabel}</div>`
        : "";

    // ── Bloque de progreso (episodios / capítulos / páginas) ──
    let progreso = "";

    if (config.usaCapitulos && item.capitulosTotales) {
        const pct = Math.min(100, Math.round((item.capituloActual / item.capitulosTotales) * 100));
        progreso = `
            <div class="progress-info">Cap ${item.capituloActual} / ${item.capitulosTotales} (${pct}%)</div>
            <div class="progress-wrap" style="--pct:${pct}%"><div class="progress-fill" style="background:${color}"></div></div>
            <div class="progress-btns">
                <button class="prog-btn" onclick="cambiarCapitulo(${item.id}, -1)"style="color:#6b7280"onmouseenter="this.style.background='${color}30';this.style.borderColor='${color}';this.style.color='#fff'"onmouseleave="this.style.background='';this.style.borderColor='';this.style.color='#6b7280'">−</button>
                <span class="prog-num" style="color:${color}">${item.capituloActual}</span>
                <button class="prog-btn" onclick="cambiarCapitulo(${item.id}, 1)"style="color:#6b7280"onmouseenter="this.style.background='${color}30';this.style.borderColor='${color}';this.style.color='#fff'"onmouseleave="this.style.background='';this.style.borderColor='';this.style.color='#6b7280'">+</button>
            </div>`;
    }

    if (config.usaPaginas && item.paginasTotales) {
        const pct = Math.min(100, Math.round((item.paginaActual / item.paginasTotales) * 100));
        progreso = `
            <div class="progress-info">Pág ${item.paginaActual} / ${item.paginasTotales} (${pct}%)</div>
            <div class="progress-wrap" style="--pct:${pct}%"><div class="progress-fill" style="background:${color}"></div></div>
            <div class="progress-btns">
                <button class="prog-btn" onclick="cambiarPagina(${item.id}, -1)"style="color:#6b7280"onmouseenter="this.style.background='${color}30';this.style.borderColor='${color}';this.style.color='#fff'"onmouseleave="this.style.background='';this.style.borderColor='';this.style.color='#6b7280'">−</button>
                <span class="prog-num" style="color:${color}">${item.paginaActual}</span>
                <button class="prog-btn" onclick="cambiarPagina(${item.id}, 1)"style="color:#6b7280"onmouseenter="this.style.background='${color}30';this.style.borderColor='${color}';this.style.color='#fff'"onmouseleave="this.style.background='';this.style.borderColor='';this.style.color='#6b7280'">+</button>
            </div>`;
    }

    if (config.usaEpisodios && item.progreso && item.temporadas?.length) {
        const totalCaps = item.temporadas.reduce((s, t) => s + t.capitulos, 0);
        const capActual = item.temporadas
            .slice(0, item.progreso.temporada - 1)
            .reduce((s, t) => s + t.capitulos, 0) + (item.progreso.capitulo ?? 0);
        const pct = totalCaps ? Math.min(100, Math.round((capActual / totalCaps) * 100)) : 0;
        progreso = `
            <div class="progress-info">${(() => {
    const t = item.temporadas[item.progreso.temporada - 1];
    return t?.tipo === "ova"      ? `OVA ${t.numero}`
         : t?.tipo === "especial" ? `ESP ${t.numero}`
         : t?.tipo === "pelicula" ? `PEL ${t.numero}`
         : t?.tipo === "ona"      ? `ONA ${t.numero}`
         : `T${item.progreso.temporada}`;
})()} (${pct}%)</div>
            <div class="progress-wrap" style="--pct:${pct}%"><div class="progress-fill" style="background:${color}"></div></div>
            <div class="progress-btns">
                <button class="prog-btn" onclick="cambiarEpisodio(${item.id}, -1)"style="color:#6b7280"onmouseenter="this.style.background='${color}30';this.style.borderColor='${color}';this.style.color='#fff'"onmouseleave="this.style.background='';this.style.borderColor='';this.style.color='#6b7280'">−</button>
                <span class="prog-num" style="color:${color}">Ep ${item.progreso.capitulo}</span>
                <button class="prog-btn" onclick="cambiarEpisodio(${item.id}, 1)"style="color:#6b7280"onmouseenter="this.style.background='${color}30';this.style.borderColor='${color}';this.style.color='#fff'"onmouseleave="this.style.background='';this.style.borderColor='';this.style.color='#6b7280'">+</button>
            </div>`;
    }

    if (config.usaTomos && item.tomos?.length) {
    const capActual  = item.progresoManga?.capituloActual ?? 0;
    const capMax     = item.tomos[item.tomos.length - 1].capituloFin;
    const tomoActual = capActual === 0
        ? item.tomos[0]
        : (item.tomos.find(t => capActual >= t.capituloInicio && capActual <= t.capituloFin)
                    ?? item.tomos[item.tomos.length - 1]);
    const tomoLabel  = config.tomoLabel     ?? "Tomo";
    const tomoNombre = config.tomoLabel     ? "Volumen" : "Tomo";
    const capLabel   = config.capituloLabel ?? "Cap";
    const pct = capMax > 0 ? Math.min(100, Math.round((capActual / capMax) * 100)) : 0;

    progreso = `
         <div class="progress-info">${tomoNombre} ${tomoActual?.numero ?? "?"} (${pct}%)</div>
        <div class="progress-wrap" style="--pct:${pct}%"><div class="progress-fill" style="background:${color}"></div></div>
        <div class="progress-btns">
            <button class="prog-btn" onclick="mecambiarCapituloManga(-1, ${item.id})"style="color:#6b7280"onmouseenter="this.style.background='${color}30';this.style.borderColor='${color}';this.style.color='#fff'"onmouseleave="this.style.background='';this.style.borderColor='';this.style.color='#6b7280'">−</button>
           <span class="prog-num" style="color:${color}">${capLabel} ${capActual}</span>
          <button class="prog-btn" onclick="mecambiarCapituloManga(1, ${item.id})"style="color:#6b7280"onmouseenter="this.style.background='${color}30';this.style.borderColor='${color}';this.style.color='#fff'"onmouseleave="this.style.background='';this.style.borderColor='';this.style.color='#6b7280'">+</button>
        </div>`;
    }

    const delay = `d${Math.min(idx + 1, 6)}`;
    return `
    <article class="card ${delay}" id="card-${item.id}">
      <div class="card-poster" onclick="abrirModalExpandido(${item.id})" style="cursor:pointer">
        ${poster}
        ${rating}
        <div class="card-estado-bar" style="background:${color}60"></div>
      </div>
      <div class="card-info">
        <div class="card-title">${esc(item.titulo)}</div>
        <div class="card-meta">
          <div class="card-bloque">
            <div class="card-bloque-label">Estado</div>
            <span class="card-tag tag-estado">${esc(item.estado)}</span>
          </div>
          ${item.estadoSerie && item.estadoSerie !== "null" && config.usaEstadoSerie ? `
          <div class="card-bloque">
            <div class="card-bloque-label">Estado de la serie</div>
            <span class="card-tag tag-estado-serie">${esc(item.estadoSerie)}</span>
          </div>` : ""}
          ${config.usalogros ? (() => {
            const lv = window._dashDatosUsuario?.[item.id]?.logros !== undefined
                ? window._dashDatosUsuario[item.id].logros
                : item.logros;
            return lv ? `
          <div class="card-bloque">
            <div class="card-bloque-label">Logros</div>
            <span class="card-tag ${claseLogros(lv)}">${lv === "Todos completados" ? "" : ""}${lv}</span>
          </div>` : "";
          })() : ""}
        </div>
        <div class="card-bottom">
          ${progreso}
          <div class="card-actions">
            ${window._esAdmin ? `
              <button class="card-btn" onclick="abrirModalExpandido(${item.id});setTimeout(()=>meAbrirEdicion(),300)">✏ Editar</button>
              <button class="card-btn danger" onclick="eliminarItem(${item.id})">✕</button>
            ` : `
              <button class="card-btn danger" title="Quitar de mi dashboard" onclick="quitarDeDashboard(${item.id}, this)">✕ Quitar</button>
            `}
          </div>
        </div>
      </div>
    </article>`;
}

// ── Renderizar fila de la vista lista ─────────────────────
function renderListItem(item, idx) {
    const color    = config.color ?? "#888";
    const poster   = item.imagen
        ? `<img src="${esc(item.imagen)}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : tipoEmoji(tipo);
    const valColor = valoracionColor(item.valoracion);
    const delay    = `d${Math.min(idx + 1, 6)}`;

    let extra = "";
    if (config.usaEpisodios && item.progreso && item.temporadas?.length) {
        const totalCaps = item.temporadas.reduce((s, t) => s + t.capitulos, 0);
        const capActual = item.temporadas.slice(0, item.progreso.temporada - 1).reduce((s, t) => s + t.capitulos, 0) + (item.progreso.capitulo ?? 0);
        const pct = totalCaps ? Math.min(100, Math.round((capActual / totalCaps) * 100)) : 0;
        const t = item.temporadas[item.progreso.temporada - 1];
        const label = t?.tipo === "ova"      ? `OVA ${t.numero}`
                    : t?.tipo === "especial" ? `ESP ${t.numero}`
                    : t?.tipo === "pelicula" ? `PEL ${t.numero}`
                    : t?.tipo === "ona"      ? `ONA ${t.numero}`
                    : `T${item.progreso.temporada}`;
        extra = `<span style="font-size:0.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace"> · ${label} Ep ${item.progreso.capitulo} (${pct}%)</span>`;
    }
    if (config.usaCapitulos && item.capitulosTotales)
        extra = `<span style="font-size:0.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace"> · Cap ${item.capituloActual}/${item.capitulosTotales}</span>`;
    if (config.usaPaginas && item.paginasTotales)
        extra = `<span style="font-size:0.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace"> · Pág ${item.paginaActual}/${item.paginasTotales}</span>`;

     return `
    <div class="list-item ${delay}" id="card-${item.id}" onclick="abrirModalExpandido(${item.id})" style="cursor:pointer">
      <span class="platform-dot" style="background:${color}"></span>
      <div class="list-thumb">${poster}</div>
      <div style="flex:1;min-width:0">
        <div class="list-title">${esc(item.titulo)}</div>
        <div class="list-estado">${esc(item.estado)}${extra}${item.plataforma ? " · " + esc(item.plataforma) : ""}</div>
      </div>
      <div class="list-fecha">${item.fecha ?? "—"}</div>
      ${item.valoracion > 0 ? `<div class="list-rating" style="background:${valColor}20;color:${valColor}">${valoracionLabel(item.valoracion)}</div>` : ""}
      ${config.usalogros ? `<span title="Logros" style="font-size:0.85rem;color:${item.logros ? "#64dd17" : "var(--muted)"}"></span>` : ""}
      <div class="list-actions">
        ${window._esAdmin ? `
        <button class="card-btn" style="padding:0.3rem 0.6rem" onclick="abrirModalExpandido(${item.id});setTimeout(()=>meAbrirEdicion(),300)">✏</button>
        <button class="card-btn danger" style="padding:0.3rem 0.6rem" onclick="eliminarItem(${item.id})">✕</button>` : ""}
      </div>
    </div>`;
}

function crearPaginacionCat(totalPags) {
    if (totalPags <= 1) return null;
    const pag = document.createElement("div");
    pag.style.cssText = "display:flex;align-items:center;justify-content:flex-end;gap:0.5rem;flex-wrap:wrap";

    const estilo = (activo) =>
        `padding:0.4rem 0.85rem;border-radius:8px;border:1px solid ${activo ? config.color : "var(--border)"};background:${activo ? `${config.color}20` : "var(--surface)"};color:${activo ? config.color : "var(--muted)"};font-family:'JetBrains Mono',monospace;font-size:0.72rem;cursor:${activo ? "default" : "pointer"};transition:all 0.15s`;

    const btnPrev = document.createElement("button");
    btnPrev.textContent = "←";
    btnPrev.style.cssText = estilo(false);
    btnPrev.disabled = catPaginaActual === 1;
    if (catPaginaActual === 1) btnPrev.style.opacity = "0.3";
    btnPrev.onclick = () => { catPaginaActual--; aplicarOrden(); window.scrollTo({top:0,behavior:"smooth"}); };
    pag.appendChild(btnPrev);

    for (let p = 1; p <= totalPags; p++) {
        if (totalPags > 7 && Math.abs(p - catPaginaActual) > 2 && p !== 1 && p !== totalPags) {
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
        btn.style.cssText = estilo(p === catPaginaActual);
        if (p !== catPaginaActual) {
            btn.onmouseover = () => { btn.style.borderColor = config.color; btn.style.color = config.color; };
            btn.onmouseout  = () => { btn.style.borderColor = "var(--border)"; btn.style.color = "var(--muted)"; };
            btn.onclick = () => { catPaginaActual = p; aplicarOrden(); window.scrollTo({top:0,behavior:"smooth"}); };
        }
        pag.appendChild(btn);
    }

    const btnNext = document.createElement("button");
    btnNext.textContent = "→";
    btnNext.style.cssText = estilo(false);
    btnNext.disabled = catPaginaActual === totalPags;
    if (catPaginaActual === totalPags) btnNext.style.opacity = "0.3";
    btnNext.onclick = () => { catPaginaActual++; aplicarOrden(); window.scrollTo({top:0,behavior:"smooth"}); };
    pag.appendChild(btnNext);

    return pag;
}

// ── Renderizar la lista completa ──────────────────────────
function mostrar(lista) {
    const contenedor  = document.getElementById("lista");
    const totalPags   = Math.ceil(lista.length / CAT_POR_PAGINA);
    catPaginaActual   = Math.min(catPaginaActual, totalPags || 1);
    const paginada    = lista.slice((catPaginaActual - 1) * CAT_POR_PAGINA, catPaginaActual * CAT_POR_PAGINA);

    document.getElementById("showing-count").textContent =
        `${lista.length} elemento${lista.length !== 1 ? "s" : ""}`;

    // Paginación arriba y abajo
    const elArr = document.getElementById("cat-pag-arriba");
    const elAba = document.getElementById("cat-pag-abajo");
    if (elArr) { elArr.innerHTML = ""; const p = crearPaginacionCat(totalPags); if (p) elArr.appendChild(p); }
    if (elAba) { elAba.innerHTML = ""; const p = crearPaginacionCat(totalPags); if (p) elAba.appendChild(p); }

    if (!lista.length) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <div class="big-icon">${config.label?.split(" ")[0] ?? "📌"}</div>
                <h3>Sin resultados</h3>
                <p>No hay elementos con este filtro. Prueba otro estado o añade uno nuevo.</p>
            </div>`;
        return;
    }

    if (vistaActual === "grid") {
        contenedor.className = "media-grid";
        contenedor.innerHTML = paginada.map((item, i) => renderCard(item, i)).join("");
    } else {
        contenedor.className = "media-list";
        contenedor.innerHTML = paginada.map((item, i) => renderListItem(item, i)).join("");
    }
}

// ── Renderizar agrupado por año ───────────────────────────
// Se usa cuando el select de ordenar tiene "año-desc" o "año-asc"
function mostrarPorAño(lista) {
    const contenedor = document.getElementById("lista");
    document.getElementById("showing-count").textContent =
        `${lista.length} elemento${lista.length !== 1 ? "s" : ""}`;

    if (!lista.length) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <div class="big-icon">${config.label?.split(" ")[0] ?? "📌"}</div>
                <h3>Sin resultados</h3>
                <p>No hay elementos con este filtro.</p>
            </div>`;
        return;
    }

    const sort = document.getElementById("sort-select")?.value;

    // Agrupar items por año
    const grupos = {};
    lista.forEach(item => {
        const año = extraerAñoItem(item) || "Sin fecha";
        if (!grupos[año]) grupos[año] = [];
        grupos[año].push(item);
    });

    // Ordenar los grupos según dirección
    const claves = Object.keys(grupos).sort((a, b) => {
        if (a === "Sin fecha") return 1;
        if (b === "Sin fecha") return -1;
        return sort === "año-desc" ? b - a : a - b;
    });

    contenedor.className = "";
contenedor.innerHTML = claves.map(año => `
    <div class="año-grupo">
        <div class="año-separador">
            <div class="año-linea"></div>
            <span class="año-label">${año}</span>
            <div class="año-linea"></div>
            <span class="año-count">${grupos[año].length}</span>
        </div>
        <div class="${vistaActual === "list" ? "media-list" : "media-grid"}">
            ${grupos[año].map((item, i) => vistaActual === "list" ? renderListItem(item, i) : renderCard(item, i)).join("")}
        </div>
    </div>`).join("");
}

// ── Filtrar + ordenar + mostrar ───────────────────────────
function aplicarOrden(resetPagina = false) {
    if (resetPagina) catPaginaActual = 1;
    let lista = [...dataOriginal];
    if (filtroEstado)      lista = lista.filter(i => i.estado === filtroEstado);
    if (filtroEstadoSerie) lista = lista.filter(i => i.estadoSerie === filtroEstadoSerie);
    if (filtroValoracion !== null)  lista = lista.filter(i => i.valoracion === filtroValoracion);

    const sort = document.getElementById("sort-select")?.value ?? "reciente";
    if (sort === "reciente") {
        if (window._dashDatosUsuario) {
            // Usuario normal: respetar orden de agregado al dashboard
            lista.sort((a, b) => (window._dashDatosUsuario[a.id]?.orden ?? 999) - (window._dashDatosUsuario[b.id]?.orden ?? 999));
        } else {
            lista.sort((a, b) => b.id - a.id);
        }
    }
    else if (sort === "rating-desc") lista.sort((a, b) => (b.valoracion ?? 0) - (a.valoracion ?? 0));
    else if (sort === "rating-asc")  lista.sort((a, b) => (a.valoracion ?? 0) - (b.valoracion ?? 0));
    else if (sort === "titulo")      lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
     else if (sort === "año-desc")    lista.sort((a, b) => extraerAñoItem(b) - extraerAñoItem(a));
    else if (sort === "año-asc")     lista.sort((a, b) => extraerAñoItem(a) - extraerAñoItem(b));

    if (sort === "año-desc" || sort === "año-asc") {
        mostrarPorAño(lista);
    } else {
        mostrar(lista);
    }
}

// ── Cambiar entre vista grid y lista ─────────────────────
function setView(v) {
    vistaActual = v;
    document.getElementById("grid-btn").classList.toggle("active", v === "grid");
    document.getElementById("list-btn").classList.toggle("active", v === "list");
    aplicarOrden();
}

// ── Botones de filtro del sidebar ─────────────────────────
function crearFiltros() {
    const filtrosDiv = document.getElementById("filtros");
    filtrosDiv.innerHTML = "";

    // ── Helper para crear botón de filtro ─────────────────
    const crearBtn = (texto, activo, onClick, color) => {
        const btn = document.createElement("button");
        const c   = color || config.color;
        btn.className = "platform-btn" + (activo ? " active" : "");
        btn.innerHTML = `<span class="platform-dot" style="background:${c}${activo ? "" : "60"}"></span>${texto}`;
        btn.onclick = onClick;
        filtrosDiv.appendChild(btn);
        return btn;
    };

    // ── Sección: Estado del usuario ───────────────────────
    const labelEstado = document.createElement("div");
    labelEstado.className = "section-label";
    labelEstado.style.marginTop = "0";
    labelEstado.textContent = "Estado";
    filtrosDiv.appendChild(labelEstado);

    const btnTodos = crearBtn("Todos", !filtroEstado, () => {
        filtroEstado = null;
        filtrosDiv.querySelectorAll(".platform-btn[data-grupo='estado']").forEach(b => b.classList.remove("active"));
        btnTodos.classList.add("active");
        aplicarOrden(true);
    });
    btnTodos.setAttribute("data-grupo", "estado");

    config.estados.forEach(estado => {
        const cnt = dataOriginal.filter(i => i.estado === estado).length;
        if (!cnt) return;
        const btn = crearBtn(`${estado} (${cnt})`, false, () => {
            filtroEstado = estado;
            filtrosDiv.querySelectorAll(".platform-btn[data-grupo='estado']").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            aplicarOrden(true);
        });
        btn.setAttribute("data-grupo", "estado");
    });

    // ── Sección: Estado de la serie (solo si aplica) ──────
    if (config.usaEstadoSerie) {
        const estadosSerie = [...new Set(
            dataOriginal.map(i => i.estadoSerie).filter(Boolean)
        )].sort();

        if (estadosSerie.length) {
            const labelSerie = document.createElement("div");
            labelSerie.className = "section-label";
            labelSerie.textContent = "Estado de la obra";
            filtrosDiv.appendChild(labelSerie);

            const btnTodosSerie = crearBtn("Todas", !filtroEstadoSerie, () => {
                filtroEstadoSerie = null;
                filtrosDiv.querySelectorAll(".platform-btn[data-grupo='serie']").forEach(b => b.classList.remove("active"));
                btnTodosSerie.classList.add("active");
                aplicarOrden(true);
            }, "#94a3b8");
            btnTodosSerie.setAttribute("data-grupo", "serie");

            estadosSerie.forEach(estado => {
                const cnt = dataOriginal.filter(i => i.estadoSerie === estado).length;
                const btn = crearBtn(`${estado} (${cnt})`, false, () => {
                    filtroEstadoSerie = estado;
                    filtrosDiv.querySelectorAll(".platform-btn[data-grupo='serie']").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    aplicarOrden(true);
                }, "#94a3b8");
                btn.setAttribute("data-grupo", "serie");
            });
        }
    }

    // ── Sección: Valoración ───────────────────────────────
    const hayValorados = dataOriginal.some(i => i.valoracion > 0);
    if (hayValorados) {
        const labelVal = document.createElement("div");
        labelVal.className = "section-label";
        labelVal.textContent = "Valoración";
        filtrosDiv.appendChild(labelVal);

        const btnTodasVal = crearBtn("Todas", filtroValoracion === null, () => {
            filtroValoracion = null;
            filtrosDiv.querySelectorAll(".platform-btn[data-grupo='val']").forEach(b => b.classList.remove("active"));
            btnTodasVal.classList.add("active");
            aplicarOrden(true);
        }, "#6b7280");
        btnTodasVal.setAttribute("data-grupo", "val");

        // Mostrar solo valoraciones que existen en los datos
        const labels = { 5: "Me Encanta", 4: "Me gustó", 3: "Indiferente", 2: "No me gustó", 1: "Pésimo", 0: "Sin valorar" };
        const colors = { 5: "#00c853", 4: "#64dd17", 3: "#ffd600", 2: "#ff6d00", 1: "#d50000", 0: "#6b7280" };
        [5, 4, 3, 2, 1, 0].forEach(v => {
            const cnt = dataOriginal.filter(i => i.valoracion === v).length;
            if (!cnt) return;
            const btn = crearBtn(`${labels[v]} (${cnt})`, false, () => {
                filtroValoracion = v;
                filtrosDiv.querySelectorAll(".platform-btn[data-grupo='val']").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                aplicarOrden(true);
            }, colors[v]);
            btn.setAttribute("data-grupo", "val");
        });
    }
}

// ── Helper: extraer año de una fecha "YYYY-MM-DD" ─────────
function extraerAño(fecha) {
    if (!fecha) return 0;
    const año = parseInt(fecha.split("-")[0]);
    return isNaN(año) ? 0 : año;
}

function extraerAñoItem(item) {
    // Para usuarios normales usar fecha_agregado al dashboard, para admin la fecha del item
    const fecha = window._dashDatosUsuario
        ? (window._dashDatosUsuario[item.id]?.fecha_agregado ?? item.fecha)
        : item.fecha;
    return extraerAño(fecha);
}