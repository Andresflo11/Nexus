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

// ── Renderizar card del grid ──────────────────────────────
function renderCard(item, idx) {
    const color   = config.color ?? "#888";
    const poster  = item.imagen
        ? `<img src="${esc(item.imagen)}" alt="${esc(item.titulo)}" loading="lazy" onerror="this.style.display='none'">`
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
            <div class="progress-info">T${item.progreso.temporada} · Ep ${item.progreso.capitulo}</div>
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
    const tomoActual = item.tomos.find(t => capActual >= t.capituloInicio && capActual <= t.capituloFin)
                    ?? item.tomos[item.tomos.length - 1];
    const pct = capMax > 0 ? Math.min(100, Math.round((capActual / capMax) * 100)) : 0;

    progreso = `
        <div class="progress-info">Tomo ${tomoActual?.numero ?? "?"} · Cap ${capActual} (${pct}%)</div>
        <div class="progress-wrap" style="--pct:${pct}%"><div class="progress-fill" style="background:${color}"></div></div>
        <div class="progress-btns">
            <button class="prog-btn" onclick="mecambiarCapituloManga(-1, ${item.id})"style="color:#6b7280"onmouseenter="this.style.background='${color}30';this.style.borderColor='${color}';this.style.color='#fff'"onmouseleave="this.style.background='';this.style.borderColor='';this.style.color='#6b7280'">−</button>
           <span class="prog-num" style="color:${color}">Cap ${capActual}</span>
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
          <span class="card-tag tag-estado">${esc(item.estado)}</span>
          ${item.plataforma ? `<span class="card-tag tag-plataforma" style="background:${color}15;border-color:${color}40;color:${color}">${esc(item.plataforma)}</span>` : ""}
          ${item.estadoSerie && item.estadoSerie !== "null" && config.usaEstadoSerie ? `<span class="card-tag tag-estado-serie">${esc(item.estadoSerie)}</span>` : ""}
        </div>
        ${config.usalogros ? `<span class="card-tag ${claseLogros(item.logros)}" style="margin-top:0.3rem">${item.logros === "Todos completados" ? "🏆 " : ""}${item.logros ?? "No tiene logros"}</span>` : ""}
        <div class="card-bottom">
          ${progreso}
          <div class="card-actions">
            <button class="card-btn" onclick="abrirModalExpandido(${item.id});setTimeout(()=>meAbrirEdicion(),300)">✏ Editar</button>
            <button class="card-btn danger" onclick="eliminarItem(${item.id})">✕</button>
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
    if (config.usaEpisodios && item.progreso)
        extra = `<span style="font-size:0.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace"> · T${item.progreso.temporada}E${item.progreso.capitulo}</span>`;
    if (config.usaCapitulos && item.capitulosTotales)
        extra = `<span style="font-size:0.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace"> · Cap ${item.capituloActual}/${item.capitulosTotales}</span>`;
    if (config.usaPaginas && item.paginasTotales)
        extra = `<span style="font-size:0.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace"> · Pág ${item.paginaActual}/${item.paginasTotales}</span>`;

    return `
    <div class="list-item ${delay}" id="card-${item.id}">
      <span class="platform-dot" style="background:${color}"></span>
      <div class="list-thumb">${poster}</div>
      <div style="flex:1;min-width:0">
        <div class="list-title">${esc(item.titulo)}</div>
        <div class="list-estado">${esc(item.estado)}${extra}${item.plataforma ? " · " + esc(item.plataforma) : ""}</div>
      </div>
      <div class="list-fecha">${item.fecha ?? "—"}</div>
      ${item.valoracion > 0 ? `<div class="list-rating" style="background:${valColor}20;color:${valColor}">${valoracionLabel(item.valoracion)}</div>` : ""}
      ${config.usalogros ? `<span title="Logros" style="font-size:0.85rem;color:${item.logros ? "#64dd17" : "var(--muted)"}">🏆</span>` : ""}
      <div class="list-actions">
        <button class="card-btn" style="padding:0.3rem 0.6rem" onclick="abrirModalExpandido(${item.id});setTimeout(()=>meAbrirEdicion(),300)">✏</button>
        <button class="card-btn danger" style="padding:0.3rem 0.6rem" onclick="eliminarItem(${item.id})">✕</button>
      </div>
    </div>`;
}

// ── Renderizar la lista completa ──────────────────────────
function mostrar(lista) {
    const contenedor = document.getElementById("lista");
    document.getElementById("showing-count").textContent =
        `${lista.length} elemento${lista.length !== 1 ? "s" : ""}`;

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
        contenedor.innerHTML = lista.map((item, i) => renderCard(item, i)).join("");
    } else {
        contenedor.className = "media-list";
        contenedor.innerHTML = lista.map((item, i) => renderListItem(item, i)).join("");
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
        const año = extraerAño(item.fecha) || "Sin fecha";
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
            <div class="media-grid">
                ${grupos[año].map((item, i) => renderCard(item, i)).join("")}
            </div>
        </div>`).join("");
}

// ── Filtrar + ordenar + mostrar ───────────────────────────
function aplicarOrden() {
    let lista = filtroEstado
        ? dataOriginal.filter(i => i.estado === filtroEstado)
        : [...dataOriginal];

    const sort = document.getElementById("sort-select")?.value ?? "reciente";
    if      (sort === "reciente")    lista.sort((a, b) => b.id - a.id);
    else if (sort === "rating-desc") lista.sort((a, b) => (b.valoracion ?? 0) - (a.valoracion ?? 0));
    else if (sort === "rating-asc")  lista.sort((a, b) => (a.valoracion ?? 0) - (b.valoracion ?? 0));
    else if (sort === "titulo")      lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
    else if (sort === "año-desc")    lista.sort((a, b) => extraerAño(b.fecha) - extraerAño(a.fecha));
    else if (sort === "año-asc")     lista.sort((a, b) => extraerAño(a.fecha) - extraerAño(b.fecha));

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

    const crearBtn = (texto, activo, onClick) => {
        const btn = document.createElement("button");
        btn.className = "platform-btn" + (activo ? " active" : "");
        btn.innerHTML = `<span class="platform-dot" style="background:${config.color}${activo ? "" : "60"}"></span>${texto}`;
        btn.onclick = () => {
            filtrosDiv.querySelectorAll(".platform-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            onClick();
        };
        filtrosDiv.appendChild(btn);
    };

    crearBtn("Todos", !filtroEstado, () => { filtroEstado = null; aplicarOrden(); });

    config.estados.forEach(estado => {
        const cnt = dataOriginal.filter(i => i.estado === estado).length;
        crearBtn(`${estado} (${cnt})`, false, () => {
            filtroEstado = estado;
            aplicarOrden();
        });
    });
}

// ── Helper: extraer año de una fecha "YYYY-MM-DD" ─────────
function extraerAño(fecha) {
    if (!fecha) return 0;
    const año = parseInt(fecha.split("-")[0]);
    return isNaN(año) ? 0 : año;
}