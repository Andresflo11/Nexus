// ── categoria.js — NEXUS ─────────────────────────────────────────────────────

const params = new URLSearchParams(window.location.search);
const tipo   = params.get("tipo");
const config = CONFIG[tipo];

if (!tipo || !config) {
    document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:1rem;color:#6b7280">
        <div style="font-size:3rem">🔍</div>
        <h2 style="font-family:'Bebas Neue',cursive;font-size:2rem;letter-spacing:2px;color:#f0f2f7">Categoría no encontrada</h2>
        <a href="/" style="color:#e8ff47">← Volver al inicio</a>
    </div>`;
    throw new Error("Tipo inválido: " + tipo);
}

// Estado global
let dataOriginal  = [];
let filtroEstado  = null;
let vistaActual   = "grid";
let idAEliminar   = null;

// ── Inicializar título ────────────────────────────────────────────────────────
document.getElementById("titulo-categoria").textContent =
    config.label ? config.label.slice(2).toUpperCase() : tipo.toUpperCase();

// Marcar sidebar activo
document.querySelectorAll(".platform-btn").forEach(btn => {
    const href = btn.getAttribute("href") ?? "";
    btn.classList.toggle("active", href.includes(`tipo=${tipo}`));
});

// ── API calls ─────────────────────────────────────────────────────────────────
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

function actualizarHeader() {
    const total     = dataOriginal.length;
    const completados = dataOriginal.filter(i => config.estadosCompletados?.includes(i.estado)).length;
    const rated     = dataOriginal.filter(i => i.valoracion > 0);
    const avg       = rated.length
        ? (rated.reduce((s, i) => s + i.valoracion, 0) / rated.length).toFixed(1)
        : "—";

    document.getElementById("total-count").textContent       = total;
    document.getElementById("completados-count").textContent  = completados;
    document.getElementById("avg-rating-header").textContent  = avg;
}

// ── Render ────────────────────────────────────────────────────────────────────
function mostrar(lista) {
    const contenedor = document.getElementById("lista");
    document.getElementById("showing-count").textContent = `${lista.length} elemento${lista.length !== 1 ? "s" : ""}`;

    if (!lista.length) {
        contenedor.innerHTML = `<div class="empty-state">
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

function renderCard(item, idx) {
    const color    = config.color ?? "#888";
    const poster   = item.imagen
        ? `<img src="${esc(item.imagen)}" alt="${esc(item.titulo)}" loading="lazy" onerror="this.style.display='none'">`
        : `<span class="card-poster-placeholder">${tipoEmoji(tipo)}</span>`;

    const valColor  = valoracionColor(item.valoracion);
    const valLabel  = valoracionLabel(item.valoracion);
    const rating    = item.valoracion > 0
        ? `<div class="card-rating-badge" style="background:${valColor}25;color:${valColor}">${valLabel}</div>`
        : "";

    // Progreso
    let progreso = "";
    if (config.usaCapitulos && item.capitulosTotales) {
    const pct = Math.min(100, Math.round((item.capituloActual / item.capitulosTotales) * 100));
    progreso = `
        <div class="progress-info">Cap ${item.capituloActual} / ${item.capitulosTotales} (${pct}%)</div>
        <div class="progress-wrap">
            <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="progress-btns">
            <button class="prog-btn" onclick="cambiarCapitulo(${item.id}, -1)">−</button>
            <span class="prog-num">${item.capituloActual}</span>
            <button class="prog-btn" onclick="cambiarCapitulo(${item.id}, 1)">+</button>
        </div>`;
}
if (config.usaPaginas && item.paginasTotales) {
    const pct = Math.min(100, Math.round((item.paginaActual / item.paginasTotales) * 100));
    progreso = `
        <div class="progress-info">Pág ${item.paginaActual} / ${item.paginasTotales} (${pct}%)</div>
        <div class="progress-wrap">
            <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="progress-btns">
            <button class="prog-btn" onclick="cambiarPagina(${item.id}, -1)">−</button>
            <span class="prog-num">${item.paginaActual}</span>
            <button class="prog-btn" onclick="cambiarPagina(${item.id}, 1)">+</button>
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
        <div class="progress-wrap">
            <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="progress-btns">
            <button class="prog-btn" onclick="cambiarEpisodio(${item.id}, -1)">−</button>
            <span class="prog-num">Ep ${item.progreso.capitulo}</span>
            <button class="prog-btn" onclick="cambiarEpisodio(${item.id}, 1)">+</button>
        </div>`;
}

    const delay = `d${Math.min(idx + 1, 6)}`;
    return `
    <article class="card ${delay}" id="card-${item.id}">
      <div class="card-poster">
        ${poster}
        ${rating}
        <div class="card-estado-bar" style="background:${color}60"></div>
      </div>
      <div class="card-info">
        <div class="card-title">${esc(item.titulo)}</div>
        <div class="card-meta">${esc(item.estado)}${item.plataforma ? " · " + esc(item.plataforma) : ""}</div>
        ${config.usalogros ? `<div style="font-size:0.68rem;margin-top:0.2rem;color:${item.logros ? "#64dd17" : "var(--muted)"}">
            ${item.logros ? "🏆 Logros completos" : "○ Logros pendientes"}</div>` : ""}
        ${progreso}
      </div>
      <div class="card-actions">
        <button class="card-btn" onclick="activarEdicion(${item.id})">✏ Editar</button>
        <button class="card-btn danger" onclick="eliminarItem(${item.id})">✕</button>
      </div>
    </article>`;
}

function renderListItem(item, idx) {
    const color   = config.color ?? "#888";
    const poster  = item.imagen
        ? `<img src="${esc(item.imagen)}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : tipoEmoji(tipo);
    const valColor = valoracionColor(item.valoracion);
    const delay = `d${Math.min(idx + 1, 6)}`;

    let extra = "";
    if (config.usaEpisodios && item.progreso) {
        extra = `<span style="font-size:0.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace"> · T${item.progreso.temporada}E${item.progreso.capitulo}</span>`;
    }
    if (config.usaCapitulos && item.capitulosTotales) {
        extra = `<span style="font-size:0.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace"> · Cap ${item.capituloActual}/${item.capitulosTotales}</span>`;
    }
    if (config.usaPaginas && item.paginasTotales) {
        extra = `<span style="font-size:0.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace"> · Pág ${item.paginaActual}/${item.paginasTotales}</span>`;
    }

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
        <button class="card-btn" style="padding:0.3rem 0.6rem" onclick="activarEdicion(${item.id})">✏</button>
        <button class="card-btn danger" style="padding:0.3rem 0.6rem" onclick="eliminarItem(${item.id})">✕</button>
      </div>
    </div>`;
}

// ── Vista & orden ─────────────────────────────────────────────────────────────
function setView(v) {
    vistaActual = v;
    document.getElementById("grid-btn").classList.toggle("active", v === "grid");
    document.getElementById("list-btn").classList.toggle("active", v === "list");
    aplicarOrden();
}

function aplicarOrden() {
    let lista = filtroEstado
        ? dataOriginal.filter(i => i.estado === filtroEstado)
        : [...dataOriginal];

    const sort = document.getElementById("sort-select")?.value ?? "reciente";
    if      (sort === "reciente")    lista.sort((a, b) => b.id - a.id);
    else if (sort === "rating-desc") lista.sort((a, b) => (b.valoracion ?? 0) - (a.valoracion ?? 0));
    else if (sort === "rating-asc")  lista.sort((a, b) => (a.valoracion ?? 0) - (b.valoracion ?? 0));
    else if (sort === "titulo")      lista.sort((a, b) => a.titulo.localeCompare(b.titulo));

    mostrar(lista);
}

// ── Filtros ───────────────────────────────────────────────────────────────────
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

// ── Formulario ────────────────────────────────────────────────────────────────
function crearFormulario() {
    const form = document.getElementById("formulario");
    form.innerHTML = "";

    const add = (html) => { form.insertAdjacentHTML("beforeend", html); };

    add(`<input type="text" name="titulo" placeholder="Título" required>`);

    const selectEstado = document.createElement("select");
    selectEstado.name = "estado";
    config.estados.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e; opt.textContent = e;
        selectEstado.appendChild(opt);
    });
    form.appendChild(selectEstado);

    add(`<input type="date" name="fecha" required>`);
    add(`<input type="text" name="imagen" placeholder="URL imagen (opcional)">`);
    add(`<select name="valoracion">
        <option value="5">Me Encanta</option>
        <option value="4">Me gustó</option>
        <option value="3">Indiferente</option>
        <option value="2">No me gustó</option>
        <option value="1">Pésimo</option>
        <option value="0">Sin valorar</option>
    </select>`);

    if (config.usaPlataforma) {
        add(`<input type="text" name="plataforma" placeholder="Plataforma">`);
    }
    if (config.usalogros) {
        add(`<label class="labelFormulario"><input type="checkbox" name="logros"> Logros Completados</label>`);
    }
    if (config.usaEpisodios) {
        add(`<input type="number" name="temporadasTotal" placeholder="Num. temporadas" min="1">
             <input type="text"   name="capitulosPorTemporada" placeholder="Caps por temporada (ej: 12,24,13)">
             <input type="number" name="temporadaActual" placeholder="Temporada actual" min="1">
             <input type="number" name="capituloActualEp" placeholder="Capítulo actual" min="0">`);
    }
    if (config.usaEstadoSerie) {
        const sel = document.createElement("select");
        sel.name = "estadoSerie";
        ["En emisión","Finalizada","Temporada confirmada","Cancelada","Temporada sin confirmar","Publicación"]
            .forEach(e => { const o = document.createElement("option"); o.value = e; o.textContent = e; sel.appendChild(o); });
        form.appendChild(sel);
    }
    if (config.usaCapitulos) {
        add(`<input type="number" name="capitulosTotales" placeholder="Capítulos totales" min="1">
             <input type="number" name="capituloActual"   placeholder="Capítulo actual"   min="0">`);
    }
    if (config.usaPaginas) {
        add(`<input type="number" name="paginasTotales" placeholder="Páginas totales" min="1">
             <input type="number" name="paginaActual"   placeholder="Página actual"   min="0">`);
    }

    add(`<button type="submit">Guardar</button>`);
    form.addEventListener("submit", agregarItem);
}

function agregarItem(e) {
    e.preventDefault();
    const form = e.target;

    const nuevo = {
        tipo,
        titulo:    form.titulo.value.trim(),
        estado:    form.estado.value,
        fecha:     form.fecha.value,
        imagen:    form.imagen?.value.trim() || null,
        valoracion: parseInt(form.valoracion.value)
    };

    if (config.usaPlataforma)  nuevo.plataforma = form.plataforma?.value.trim() || null;
    if (config.usalogros)       nuevo.logros     = form.logros?.checked ?? false;

    if (config.usaEpisodios) {
        const caps = (form.capitulosPorTemporada?.value ?? "").split(",").map(c => parseInt(c.trim())).filter(n => !isNaN(n));
        nuevo.temporadas = caps.map((c, i) => ({ numero: i + 1, capitulos: c }));
        nuevo.progreso   = {
            temporada: parseInt(form.temporadaActual?.value) || 1,
            capitulo:  parseInt(form.capituloActualEp?.value) || 0
        };
    }
    if (config.usaEstadoSerie) nuevo.estadoSerie     = form.estadoSerie?.value || null;
    if (config.usaCapitulos) {
        nuevo.capitulosTotales = parseInt(form.capitulosTotales?.value) || null;
        nuevo.capituloActual   = parseInt(form.capituloActual?.value)   || 0;
    }
    if (config.usaPaginas) {
        nuevo.paginasTotales = parseInt(form.paginasTotales?.value) || null;
        nuevo.paginaActual   = parseInt(form.paginaActual?.value)   || 0;
    }

    fetch("/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo)
    })
        .then(r => r.json())
        .then(() => {
            form.reset();
            // Cerrar el formulario
            document.getElementById("form-container").classList.add("oculto");
            document.getElementById("toggle-form").textContent = "+ Añadir";
            cargarItems();
        })
        .catch(err => console.error("Error al agregar:", err));
}

// ── Eliminar ──────────────────────────────────────────────────────────────────
function eliminarItem(id) {
    idAEliminar = id;
    document.getElementById("modalConfirmacion").classList.remove("oculto");
}

// ── Editar ────────────────────────────────────────────────────────────────────
function activarEdicion(id) {
    const item     = dataOriginal.find(i => i.id === id);
    const modal    = document.getElementById("modal-edicion");
    const contenido = document.getElementById("modal-contenido");

    modal.classList.remove("oculto");

    let extra = "";

    if (config.usaPlataforma) {
        extra += `<input type="text" id="input-plataforma-${id}" value="${esc(item.plataforma ?? "")}" placeholder="Plataforma">`;
    }
    if (config.usalogros) {
        extra += `<label class="labelFormulario" style="align-items:center">
            <input type="checkbox" id="input-logros-${id}" ${item.logros ? "checked" : ""}> Logros Completados
        </label>`;
    }
    if (config.usaEpisodios && item.temporadas) {
        extra += `
        <input type="text"   id="input-capitulosPorTemporada-${id}" placeholder="Caps/temporada (ej: 12,24)" value="${item.temporadas.map(t => t.capitulos).join(",")}">
        <input type="number" id="input-temporadaActual-${id}" placeholder="Temporada actual" value="${item.progreso?.temporada ?? 1}">
        <input type="number" id="input-capituloActual-${id}"  placeholder="Capítulo actual"  value="${item.progreso?.capitulo  ?? 0}">`;
    }
    if (config.usaEstadoSerie) {
        const opts = ["En emisión","Finalizada","Temporada confirmada","Cancelada","Temporada sin confirmar","Publicación"]
            .map(e => `<option value="${e}" ${e === item.estadoSerie ? "selected" : ""}>${e}</option>`).join("");
        extra += `<select id="estadoSerie-${id}">${opts}</select>`;
    }
    if (config.usaCapitulos) {
        extra += `
        <input type="number" id="capitulosTotales-${id}" value="${item.capitulosTotales ?? ""}" placeholder="Capítulos totales" min="1">
        <input type="number" id="capituloActual-${id}"   value="${item.capituloActual   ?? ""}" placeholder="Capítulo actual"   min="0">`;
    }
    if (config.usaPaginas) {
        extra += `
        <input type="number" id="paginasTotales-${id}" value="${item.paginasTotales ?? ""}" placeholder="Páginas totales" min="1">
        <input type="number" id="paginaActual-${id}"   value="${item.paginaActual   ?? ""}" placeholder="Página actual"   min="0">`;
    }

    const estadoOpts = config.estados.map(e => `<option value="${e}" ${e === item.estado ? "selected" : ""}>${e}</option>`).join("");
    const valOpts = [5,4,3,2,1,0].map(v => {
        const labels = { 5:"Me Encanta", 4:"Me gustó", 3:"Indiferente", 2:"No me gustó", 1:"Pésimo", 0:"Sin valorar" };
        return `<option value="${v}" ${item.valoracion == v ? "selected" : ""}>${labels[v]}</option>`;
    }).join("");

    contenido.innerHTML = `
        <input type="text" id="input-titulo-${id}" value="${esc(item.titulo)}" placeholder="Título">
        <select id="input-estado-${id}">${estadoOpts}</select>
        <input type="date" id="edit-fecha-${id}" value="${item.fecha ?? ""}">
        <input type="text" id="input-imagen-${id}" value="${esc(item.imagen ?? "")}" placeholder="URL imagen">
        <select id="input-valoracion-${id}">${valOpts}</select>
        ${extra}
        <button onclick="guardarEdicionCompleta(${id})">💾 Guardar cambios</button>
        <button type="button" onclick="cerrarModalEdicion()">Cancelar</button>`;
}

function guardarEdicionCompleta(id) {
    const actualizado = {
        id,
        titulo:     document.getElementById(`input-titulo-${id}`).value.trim(),
        estado:     document.getElementById(`input-estado-${id}`).value,
        fecha:      document.getElementById(`edit-fecha-${id}`).value,
        imagen:     document.getElementById(`input-imagen-${id}`).value.trim() || null,
        valoracion: parseInt(document.getElementById(`input-valoracion-${id}`).value)
    };

    if (config.usaPlataforma) {
        actualizado.plataforma = document.getElementById(`input-plataforma-${id}`)?.value.trim() || null;
    }
    if (config.usalogros) {
        actualizado.logros = document.getElementById(`input-logros-${id}`)?.checked ?? false;
    }
    if (config.usaEpisodios) {
        const caps = (document.getElementById(`input-capitulosPorTemporada-${id}`)?.value ?? "")
            .split(",").map(c => parseInt(c.trim())).filter(n => !isNaN(n));
        actualizado.temporadas = caps.map((c, i) => ({ numero: i + 1, capitulos: c }));
        actualizado.progreso   = {
            temporada: parseInt(document.getElementById(`input-temporadaActual-${id}`)?.value) || 1,
            capitulo:  parseInt(document.getElementById(`input-capituloActual-${id}`)?.value)  || 0
        };
    }
    if (config.usaEstadoSerie) {
        actualizado.estadoSerie = document.getElementById(`estadoSerie-${id}`)?.value || null;
    }
    if (config.usaCapitulos) {
        actualizado.capitulosTotales = parseInt(document.getElementById(`capitulosTotales-${id}`)?.value) || null;
        actualizado.capituloActual   = parseInt(document.getElementById(`capituloActual-${id}`)?.value)   || 0;
    }
    if (config.usaPaginas) {
        actualizado.paginasTotales = parseInt(document.getElementById(`paginasTotales-${id}`)?.value) || null;
        actualizado.paginaActual   = parseInt(document.getElementById(`paginaActual-${id}`)?.value)   || 0;
    }

    actualizarItem(actualizado);
    cerrarModalEdicion();
}

function cerrarModalEdicion() {
    document.getElementById("modal-edicion").classList.add("oculto");
    document.getElementById("modal-contenido").innerHTML = "";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ── Botones rápidos de progreso ───────────────────────────────────────────────

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
    parchearProgresoEpisodio(id);
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

// Envía el PUT pero NO recarga la lista
function actualizarItemSilencioso(item) {
    fetch(`/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
    }).catch(err => console.error("Error al actualizar:", err));
}

// Parcha solo los elementos visuales del card afectado
function parchearProgresoEpisodio(id) {
    const item  = dataOriginal.find(i => i.id === id);
    const card  = document.getElementById(`card-${id}`);
    const color = config.color ?? "#888";
    if (!item || !card) return;

    const totalCaps = item.temporadas.reduce((s, t) => s + t.capitulos, 0);
    const capActual = item.temporadas
        .slice(0, item.progreso.temporada - 1)
        .reduce((s, t) => s + t.capitulos, 0) + item.progreso.capitulo;
    const pct = totalCaps ? Math.min(100, Math.round((capActual / totalCaps) * 100)) : 0;

    card.querySelector(".progress-info").textContent =
        `T${item.progreso.temporada} · Ep ${item.progreso.capitulo}`;
    card.querySelector(".progress-fill").style.width = `${pct}%`;
    card.querySelector(".prog-num").textContent = `Ep ${item.progreso.capitulo}`;
}

function parchearProgresoCapitulo(id) {
    const item  = dataOriginal.find(i => i.id === id);
    const card  = document.getElementById(`card-${id}`);
    const color = config.color ?? "#888";
    if (!item || !card) return;

    const pct = Math.min(100, Math.round((item.capituloActual / item.capitulosTotales) * 100));

    card.querySelector(".progress-info").textContent =
        `Cap ${item.capituloActual} / ${item.capitulosTotales} (${pct}%)`;
    card.querySelector(".progress-fill").style.width = `${pct}%`;
    card.querySelector(".prog-num").textContent = item.capituloActual;
}

function parchearProgresoPagina(id) {
    const item  = dataOriginal.find(i => i.id === id);
    const card  = document.getElementById(`card-${id}`);
    if (!item || !card) return;

    const pct = Math.min(100, Math.round((item.paginaActual / item.paginasTotales) * 100));

    card.querySelector(".progress-info").textContent =
        `Pág ${item.paginaActual} / ${item.paginasTotales} (${pct}%)`;
    card.querySelector(".progress-fill").style.width = `${pct}%`;
    card.querySelector(".prog-num").textContent = item.paginaActual;
}

// ── DOMContentLoaded ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    crearFormulario();

    // Toggle formulario
    const toggleBtn    = document.getElementById("toggle-form");
    const formContainer = document.getElementById("form-container");

    toggleBtn.addEventListener("click", () => {
        const visible = !formContainer.classList.contains("oculto");
        formContainer.classList.toggle("oculto", visible);
        toggleBtn.textContent = visible ? "+ Añadir" : "✕ Cerrar";
    });

    // Modal confirmación eliminar
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

    // Cerrar modales al hacer clic en el overlay
    document.getElementById("modal-edicion")?.addEventListener("click", function (e) {
        if (e.target === this) cerrarModalEdicion();
    });
    document.getElementById("modalConfirmacion")?.addEventListener("click", function (e) {
        if (e.target === this) {
            idAEliminar = null;
            this.classList.add("oculto");
        }
    });

    // Escape cierra modales
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            cerrarModalEdicion();
            document.getElementById("modalConfirmacion").classList.add("oculto");
        }
    });

    cargarItems();
});
