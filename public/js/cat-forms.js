// ╔══════════════════════════════════════════════════════════╗
// ║  cat-forms.js — FORMULARIOS Y EDICIÓN DE ITEMS          ║
// ╠══════════════════════════════════════════════════════════╣
// ║  Contiene:                                               ║
// ║  · crearFormulario()      — construye el form de añadir ║
// ║  · agregarItem()          — envía el form a la API      ║
// ║  · activarEdicionEnModal()— rellena el form de editar   ║
// ║  · guardarEdicionCompleta()— guarda y parchea la card   ║
// ║  · parchearCard()         — actualiza la card sin reload║
// ║  · parchearCardEstado()   — solo actualiza el estado    ║
// ║  · eliminarItem()         — abre el modal de confirmar  ║
// ║  · wrapNumberInputs()     — añade botones +/− a numbers ║
// ║  · wrapNumbers()          — wrapper legacy              ║
// ╚══════════════════════════════════════════════════════════╝

// ── Construir el formulario de añadir ────────────────────
// Se llama una vez al cargar la página.
// Genera los campos según el tipo de categoría (config).
function crearFormulario() {
    const form = document.getElementById("formulario");
form.innerHTML = "";
form.setAttribute("autocomplete", "off");

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
    setTimeout(() => { initDatePickers(); wrapNumberInputs(); }, 0);
    add(`<input type="text" name="imagen" placeholder="URL imagen (opcional)">`);
    add(`<select name="valoracion">
        <option value="5">Me Encanta</option>
        <option value="4">Me gustó</option>
        <option value="3">Indiferente</option>
        <option value="2">No me gustó</option>
        <option value="1">Pésimo</option>
        <option value="0">Sin valorar</option>
    </select>`);

    if (config.usaPlataforma) add(`<input type="text" name="plataforma" placeholder="Plataforma">`);
    if (config.usalogros) {
    const opts = config.opcionesLogros.map(o => `<option value="${o}">${o}</option>`).join("");
    add(`<select name="logros">${opts}</select>`);
    }
    if (config.usaEpisodios) {
        add(`<div class="number-wrap"><input type="number" name="temporadasTotal" placeholder="Num. temporadas" min="1"></div>
             <input type="text" name="capitulosPorTemporada" placeholder="Caps por temporada (ej: 12,24,13)">
             <div class="number-wrap"><input type="number" name="temporadaActual" placeholder="Temporada actual" min="1"></div>
             <div class="number-wrap"><input type="number" name="capituloActualEp" placeholder="Capítulo actual" min="0"></div>`);
    }
    if (config.usaTomos) {
    add(`<div style="grid-column:1/-1">
        <label style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;display:block;margin-bottom:0.4rem">Tomos</label>
        <div id="tomos-container-new"></div>
        <button type="button" onclick="agregarFilaTomo('new')"
            style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
            + Añadir tomo
        </button>
    </div>`);
    add(`<div class="number-wrap"><input type="number" name="capituloActualManga" placeholder="Capítulo actual" min="0"></div>`);
}
    if (config.usaEstadoSerie) {
        const sel = document.createElement("select");
        sel.name = "estadoSerie";
        ["En emisión","Finalizada","Temporada confirmada","Cancelada","Temporada sin confirmar","Publicación"]
            .forEach(e => { const o = document.createElement("option"); o.value = e; o.textContent = e; sel.appendChild(o); });
        form.appendChild(sel);
    }
    if (config.usaCapitulos) {
        add(`<div class="number-wrap"><input type="number" name="capitulosTotales" placeholder="Capítulos totales" min="1"></div>
             <div class="number-wrap"><input type="number" name="capituloActual" placeholder="Capítulo actual" min="0"></div>`);
    }
    if (config.usaPaginas) {
        add(`<div class="number-wrap"><input type="number" name="paginasTotales" placeholder="Páginas totales" min="1"></div>
             <div class="number-wrap"><input type="number" name="paginaActual" placeholder="Página actual" min="0"></div>`);
    }

    add(`<button type="submit">Guardar</button>`);
    form.addEventListener("submit", agregarItem);
}

// ── Enviar formulario de añadir ───────────────────────────
function agregarItem(e) {
    e.preventDefault();
    const form = e.target;

    const nuevo = {
        tipo,
        titulo:     form.titulo.value.trim(),
        estado:     form.estado.value,
        fecha:      form.fecha.value,
        imagen:     form.imagen?.value.trim() || null,
        valoracion: parseInt(form.querySelector('[name="valoracion"]').value) || 0
    };

    if (config.usaPlataforma) nuevo.plataforma = form.plataforma?.value.trim() || null;
    if (config.usalogros) nuevo.logros = form.logros?.value ?? 'No tiene logros';

    if (config.usaEpisodios) {
        const caps = (form.capitulosPorTemporada?.value ?? "").split(",").map(c => parseInt(c.trim())).filter(n => !isNaN(n));
        nuevo.temporadas = caps.map((c, i) => ({ numero: i + 1, capitulos: c }));
        nuevo.progreso   = {
            temporada: parseInt(form.temporadaActual?.value)  || 1,
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

    if (config.usaDlcs) nuevo.dlcs = leerDlcsDelForm();
    else nuevo.dlcs = null;

    if (config.usaTomos) {
    nuevo.tomos         = leerTomosDeLForm();
    nuevo.progresoManga = { capituloActual: parseInt(form.capituloActualManga?.value) || 0 };
}

    fetch("/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo)
    })
        .then(r => r.json())
        .then(() => {
            form.reset();
            resetDatePickers();
            document.getElementById("form-container").classList.add("oculto");
            document.getElementById("toggle-form").textContent = "+ Añadir";
            cargarItems();
        })
        .catch(err => console.error("Error al agregar:", err));
}

// ── Rellenar formulario de edición dentro del modal ───────
// Se llama desde meAbrirEdicion() cuando se pulsa "✏ Editar todos los campos"
function activarEdicionEnModal(id) {
    const item = dataOriginal.find(i => i.id === id);
    if (!item) return;

    let extra = "";
    if (config.usaPlataforma)
        extra += `<input type="text" id="input-plataforma-${id}" value="${esc(item.plataforma ?? "")}" placeholder="Plataforma">`;
    if (config.usalogros) {
    const opts = config.opcionesLogros.map(o => `<option value="${o}" ${o === item.logros ? "selected" : ""}>${o}</option>`).join("");
    extra += `<select id="input-logros-${id}">${opts}</select>`;
    }
    if (config.usaDlcs) {
    const dlcs = Array.isArray(item.dlcs) ? item.dlcs : [];
    dlcContador = dlcs.length;
    const dlcRows = dlcs.map((d, i) => `
        <div id="dlc-row-${i}" style="display:flex;gap:0.5rem;align-items:center;grid-column:1/-1">
            <input type="text"   id="dlc-nombre-${i}" value="${esc(d.nombre ?? "")}" placeholder="Nombre del DLC">
            <select id="dlc-tipo-${i}">
                ${config.tiposDlc.map(t => `<option ${t === d.tipo ? "selected" : ""}>${t}</option>`).join("")}
            </select>
            <select id="dlc-estado-${i}">
                ${config.estadosDlc.map(e => `<option ${e === d.estado ? "selected" : ""}>${e}</option>`).join("")}
            </select>
            <select id="dlc-logros-${i}">
                ${config.opcionesLogros.map(o => `<option ${o === d.logros ? "selected" : ""}>${o}</option>`).join("")}
            </select>
            <button type="button" onclick="eliminarFilaDlc(${i})" style="color:#ef4444;background:transparent;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer">✕</button>
        </div>`).join("");
    extra += `
        <div style="grid-column:1/-1;margin-top:0.5rem">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">DLCs / Ediciones</div>
            <div id="dlcs-container">${dlcRows}</div>
            <button type="button" onclick="agregarFilaDlc()" 
                style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
                + Añadir DLC
            </button>
        </div>`;
    }
    if (config.usaEpisodios && item.temporadas) {
        extra += `
        <input type="text" id="input-capitulosPorTemporada-${id}" placeholder="Caps/temporada (ej: 12,24)" value="${item.temporadas.map(t => t.capitulos).join(",")}">
        <div class="number-wrap"><input type="number" id="input-temporadaActual-${id}" placeholder="Temporada actual" value="${item.progreso?.temporada ?? 1}"></div>
        <div class="number-wrap"><input type="number" id="input-capituloActual-${id}" placeholder="Capítulo actual" value="${item.progreso?.capitulo ?? 0}"></div>`;
    }
    if (config.usaTomos) {
    const tomos = Array.isArray(item.tomos) ? item.tomos : [];
    tomoContador = tomos.length;
    const tomoRows = tomos.map((t, i) => `
        <div id="tomo-row-${i}" style="display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem">
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);white-space:nowrap">Tomo ${t.numero}</span>
            <input type="number" id="tomo-inicio-${i}" value="${t.capituloInicio ?? ""}" placeholder="Cap. inicio" min="1">
            <input type="number" id="tomo-fin-${i}"    value="${t.capituloFin ?? ""}"    placeholder="Cap. fin"   min="1">
            <button type="button" onclick="eliminarFilaTomo(${i})" style="color:#ef4444;background:transparent;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer">✕</button>
        </div>`).join("");

    extra += `
        <div style="grid-column:1/-1;margin-top:0.5rem">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Tomos</div>
            <div id="tomos-container">${tomoRows}</div>
            <button type="button" onclick="agregarFilaTomo('edit')"
                style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
                + Añadir tomo
            </button>
        </div>`;

    extra += `<input type="number" id="input-cap-manga-${id}" 
    value="${item.progresoManga?.capituloActual ?? 0}" 
    placeholder="Capítulo actual" min="0" 
    style="margin-top:0.5rem">`;
}
    if (config.usaEstadoSerie) {
        const opts = ["En emisión","Finalizada","Temporada confirmada","Cancelada","Temporada sin confirmar","Publicación"]
            .map(e => `<option value="${e}" ${e === item.estadoSerie ? "selected" : ""}>${e}</option>`).join("");
        extra += `<select id="estadoSerie-${id}">${opts}</select>`;
    }
    if (config.usaCapitulos) {
        extra += `
        <div class="number-wrap"><input type="number" id="capitulosTotales-${id}" value="${item.capitulosTotales ?? ""}" placeholder="Capítulos totales" min="1"></div>
        <div class="number-wrap"><input type="number" id="capituloActual-${id}" value="${item.capituloActual ?? ""}" placeholder="Capítulo actual" min="0"></div>`;
    }
    if (config.usaPaginas) {
        extra += `
        <div class="number-wrap"><input type="number" id="paginasTotales-${id}" value="${item.paginasTotales ?? ""}" placeholder="Páginas totales" min="1"></div>
        <div class="number-wrap"><input type="number" id="paginaActual-${id}" value="${item.paginaActual ?? ""}" placeholder="Página actual" min="0"></div>`;
    }

    const estadoOpts = config.estados.map(e => `<option value="${e}" ${e === item.estado ? "selected" : ""}>${e}</option>`).join("");
    const valOpts    = [5,4,3,2,1,0].map(v => {
        const labels = {5:"Me Encanta",4:"Me gustó",3:"Indiferente",2:"No me gustó",1:"Pésimo",0:"Sin valorar"};
        return `<option value="${v}" ${item.valoracion == v ? "selected" : ""}>${labels[v]}</option>`;
    }).join("");

    document.getElementById("me-form-contenido").innerHTML = `
        <input type="text" id="input-titulo-${id}" value="${esc(item.titulo)}" placeholder="Título">
        <select id="input-estado-${id}">${estadoOpts}</select>
        <input type="date" id="edit-fecha-${id}" value="${item.fecha ?? ""}">
        <input type="text" id="input-imagen-${id}" value="${esc(item.imagen ?? "")}" placeholder="URL imagen">
        <select id="input-valoracion-${id}">${valOpts}</select>
        ${extra}
        <div style="display:flex;gap:0.75rem;margin-top:0.5rem;grid-column:1/-1">
            <button onclick="guardarEdicionCompleta(${id});meVolverDesdeEdicion(${id})"
                style="flex:1;padding:0.7rem;background:${config.color};color:#000;border:none;border-radius:10px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:0.9rem;cursor:pointer;transition:opacity 0.15s"
                onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
                💾 Guardar cambios
            </button>
            <button type="button" onclick="meVolverDesdeEdicion(${id})"
                style="flex:1;padding:0.7rem;background:transparent;color:var(--muted);border:1px solid var(--border);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:0.9rem;cursor:pointer;transition:all 0.15s"
                onmouseover="this.style.borderColor='var(--border2)';this.style.color='var(--text)'"
                onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">
                ← Volver
            </button>
        </div>`;

    setTimeout(() => { initDatePickers(); wrapNumberInputs(); }, 0);
}

// ── Guardar todos los campos del formulario de edición ────
// Actualiza dataOriginal + meItemActual en memoria al instante,
// luego envía a la BD en segundo plano y parchea la card.
function guardarEdicionCompleta(id) {
    const actualizado = {
        id,
        titulo:     document.getElementById(`input-titulo-${id}`).value.trim(),
        estado:     document.getElementById(`input-estado-${id}`).value,
        fecha:      document.getElementById(`edit-fecha-${id}`).value,
        imagen:     document.getElementById(`input-imagen-${id}`).value.trim() || null,
        valoracion: parseInt(document.getElementById(`input-valoracion-${id}`).value)
    };

    if (config.usaPlataforma)
        actualizado.plataforma = document.getElementById(`input-plataforma-${id}`)?.value.trim() || null;
    if (config.usalogros)
        actualizado.logros = document.getElementById(`input-logros-${id}`)?.value ?? 'No tiene logros';
    if (config.usaEpisodios) {
        const caps = (document.getElementById(`input-capitulosPorTemporada-${id}`)?.value ?? "")
            .split(",").map(c => parseInt(c.trim())).filter(n => !isNaN(n));
        actualizado.temporadas = caps.map((c, i) => ({ numero: i + 1, capitulos: c }));
        actualizado.progreso   = {
            temporada: parseInt(document.getElementById(`input-temporadaActual-${id}`)?.value) || 1,
            capitulo:  parseInt(document.getElementById(`input-capituloActual-${id}`)?.value)  || 0
        };
    }
    if (config.usaTomos) actualizado.tomos = leerTomosDeLForm();
    if (config.usaEstadoSerie)
        actualizado.estadoSerie = document.getElementById(`estadoSerie-${id}`)?.value || null;
    if (config.usaCapitulos) {
        actualizado.capitulosTotales = parseInt(document.getElementById(`capitulosTotales-${id}`)?.value) || null;
        actualizado.capituloActual   = parseInt(document.getElementById(`capituloActual-${id}`)?.value)   || 0;
    }
    if (config.usaPaginas) {
        actualizado.paginasTotales = parseInt(document.getElementById(`paginasTotales-${id}`)?.value) || null;
        actualizado.paginaActual   = parseInt(document.getElementById(`paginaActual-${id}`)?.value)   || 0;
    }

    // Actualizar en memoria inmediatamente (sin esperar el fetch)
    if (config.usaDlcs) actualizado.dlcs = leerDlcsDelForm();

    if (config.usaTomos) {
    actualizado.tomos         = leerTomosDeLForm();
    actualizado.progresoManga = {
        capituloActual: parseInt(document.getElementById(`input-cap-manga-${id}`)?.value) || 0
    };
    }

    const idx = dataOriginal.findIndex(i => i.id === id);
    if (idx !== -1) dataOriginal[idx] = { ...dataOriginal[idx], ...actualizado };
    meItemActual = dataOriginal[idx];

    actualizarItemSilencioso(actualizado);
    parchearCard(id);
    if (meItemActual?.id === id && document.getElementById("me-tab-contenido")) {
    meItemActual = dataOriginal.find(i => i.id === id);
    meItemIdRenderizado = null; // forzar rerenderizado completo
    abrirModalExpandido(id);
}
}

// ── Parchear la card del grid sin recargar la lista ───────
// Actualiza título, estado, plataforma, logros, badge de valoración
// e imagen directamente en el DOM.
function parchearCard(id) {
    const item = dataOriginal.find(i => i.id === id);
    const card = document.getElementById(`card-${id}`);
    if (!item || !card) return;

    const valColor = valoracionColor(item.valoracion);
    const valLabel = valoracionLabel(item.valoracion);

    // Título
    const titleEl = card.querySelector(".card-title");
    if (titleEl) titleEl.textContent = item.titulo;

    // Estado + plataforma + logros en un solo innerHTML
    const metaEl = card.querySelector(".card-meta");
    if (metaEl) metaEl.innerHTML = `
        <span class="card-tag tag-estado">${esc(item.estado)}</span>
        ${item.plataforma ? `<span class="card-tag tag-plataforma">${esc(item.plataforma)}</span>` : ""}`;

    if (config.usalogros) {
        const tieneLogros = item.logros == 1 || item.logros === true;
        let logrosTag = card.querySelector(".tag-logros-si, .tag-logros-no, .tag-logros-algunos, .tag-logros-proceso, .tag-logros-ninguno");
        if (!logrosTag) {
        logrosTag = document.createElement("span");
        logrosTag.style.marginTop = "0.3rem";
        card.querySelector(".card-info")?.appendChild(logrosTag);
        }
        logrosTag.className   = `card-tag ${claseLogros(item.logros)}`;
        logrosTag.textContent = (item.logros === "Todos completados" ? "🏆 " : "") + (item.logros ?? "No tiene logros");
    }

    // Badge de valoración
    const badge = card.querySelector(".card-rating-badge");
    if (item.valoracion > 0) {
        if (badge) {
            badge.textContent    = valLabel;
            badge.style.background = `${valColor}25`;
            badge.style.color    = valColor;
        } else {
            const nb = document.createElement("div");
            nb.className = "card-rating-badge";
            nb.textContent = valLabel;
            nb.style.cssText = `background:${valColor}25;color:${valColor}`;
            card.querySelector(".card-poster")?.appendChild(nb);
        }
    } else if (badge) {
        badge.remove();
    }

    // Imagen del póster
    const posterEl = card.querySelector(".card-poster");
    if (posterEl) {
        const img = posterEl.querySelector("img");
        if (item.imagen) {
            if (img) { img.src = item.imagen; }
            else {
                posterEl.querySelector(".card-poster-placeholder")?.remove();
                const ni = document.createElement("img");
                ni.src = item.imagen; ni.alt = item.titulo; ni.loading = "lazy";
                ni.onerror = function() { this.style.display = "none"; };
                posterEl.prepend(ni);
            }
        } else {
            img?.remove();
            if (!posterEl.querySelector(".card-poster-placeholder")) {
                const ph = document.createElement("span");
                ph.className = "card-poster-placeholder";
                ph.textContent = tipoEmoji(tipo);
                posterEl.prepend(ph);
            }
        }
    }

    // Progreso
    if (config.usaEpisodios && item.temporadas?.length) parchearProgresoEpisodio(id);
    if (config.usaCapitulos && item.capitulosTotales)   parchearProgresoCapitulo(id);
    if (config.usaPaginas   && item.paginasTotales)     parchearProgresoPagina(id);
    if (config.usaTomos     && item.tomos?.length)      parchearProgresoManga(id);
}

// ── Parchear solo el estado en la card ───────────────────
// Se usa cuando se cambia el estado desde el modal expandido.
function parchearCardEstado(id) {
    const color = CONFIG[tipo]?.color ?? "#888";
    const item = dataOriginal.find(i => i.id === id);
    const card = document.getElementById(`card-${id}`);
    if (!item || !card) return;

    const metaEl = card.querySelector(".card-meta");
    if (metaEl) metaEl.innerHTML = `
        <span class="card-tag tag-estado">${esc(item.estado)}</span>
        ${item.plataforma ? `<span class="card-tag tag-plataforma" style="background:${color}15;border-color:${color}40;color:${color}">📺 ${esc(item.plataforma)}</span>` : ""}`;
}

// ── Abrir modal de confirmación para borrar ───────────────
function eliminarItem(id) {
    idAEliminar = id;
    document.getElementById("modalConfirmacion").classList.remove("oculto");
}

// ── Input number con botones +/− ──────────────────────────
// Envuelve cada input[type=number] con un contenedor que tiene
// botones − y + a los lados. Se llama desde crearFormulario y
// activarEdicionEnModal.
function wrapNumberInputs() {
    document.querySelectorAll("input[type='number']:not(.num-init)").forEach(input => {
        input.classList.add("num-init");

        const wrap = document.createElement("div");
        wrap.className = "num-wrap";

        const btnMenos = document.createElement("button");
        btnMenos.type = "button";
        btnMenos.className = "num-btn";
        btnMenos.textContent = "−";
        btnMenos.addEventListener("click", () => {
            const min = input.min !== "" ? parseInt(input.min) : 0;
            const val = parseInt(input.value) || 0;
            input.value = Math.max(min, val - 1);
        });

        const btnMas = document.createElement("button");
        btnMas.type = "button";
        btnMas.className = "num-btn";
        btnMas.textContent = "+";
        btnMas.addEventListener("click", () => {
            const max = input.max !== "" ? parseInt(input.max) : Infinity;
            const val = parseInt(input.value) || 0;
            input.value = Math.min(max, val + 1);
        });

        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(btnMenos);
        wrap.appendChild(input);
        wrap.appendChild(btnMas);
    });
}

// Wrapper legacy — solo envuelve en .number-wrap sin botones
function wrapNumbers() {
    document.querySelectorAll('.form-grid input[type="number"], #me-form-contenido input[type="number"]').forEach(input => {
        if (input.closest(".number-wrap")) return;
        const wrap = document.createElement("div");
        wrap.className = "number-wrap";
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);
    });
}

let dlcContador = 0;

function agregarFilaDlc() {
    const container = document.getElementById("dlcs-container");
    const i = dlcContador++;
    const div = document.createElement("div");
    div.id = `dlc-row-${i}`;
    div.style.cssText = "display:flex;gap:0.5rem;align-items:center;grid-column:1/-1;margin-top:0.4rem";
    div.innerHTML = `
        <input type="text" id="dlc-nombre-${i}" placeholder="Nombre del DLC">
        <select id="dlc-tipo-${i}">
            ${config.tiposDlc.map(t => `<option>${t}</option>`).join("")}
        </select>
        <select id="dlc-estado-${i}">
            ${config.estadosDlc.map(e => `<option>${e}</option>`).join("")}
        </select>
        <select id="dlc-logros-${i}">
            ${config.opcionesLogros.map(o => `<option>${o}</option>`).join("")}
        </select>
        <button type="button" onclick="eliminarFilaDlc(${i})" style="color:#ef4444;background:transparent;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer">✕</button>`;
    container.appendChild(div);
}

function eliminarFilaDlc(i) {
    document.getElementById(`dlc-row-${i}`)?.remove();
}

function leerDlcsDelForm() {
    const container = document.getElementById("dlcs-container");
    if (!container) return null;
    const dlcs = [];
    container.querySelectorAll("[id^='dlc-nombre-']").forEach(input => {
        const i = input.id.split("-").pop();
        const nombre = input.value.trim();
        if (!nombre) return; // ignorar filas vacías
        dlcs.push({
            nombre,
            tipo:   document.getElementById(`dlc-tipo-${i}`)?.value,
            estado: document.getElementById(`dlc-estado-${i}`)?.value,
            logros: document.getElementById(`dlc-logros-${i}`)?.value
        });
    });
    return dlcs.length ? dlcs : null;
}

let tomoContador = 0;

function agregarFilaTomo(modo) {
    const container = document.getElementById(modo === "edit" ? "tomos-container" : "tomos-container-new");
    const i         = tomoContador++;
    const numero    = i + 1;
    const div       = document.createElement("div");
    div.id          = `tomo-row-${i}`;
    div.style.cssText = "display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem";
    div.innerHTML = `
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);white-space:nowrap">Tomo ${numero}</span>
        <input type="number" id="tomo-inicio-${i}" placeholder="Cap. inicio" min="1">
        <input type="number" id="tomo-fin-${i}"    placeholder="Cap. fin"   min="1">
        <button type="button" onclick="eliminarFilaTomo(${i})" style="color:#ef4444;background:transparent;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer">✕</button>`;
    container.appendChild(div);
}

function eliminarFilaTomo(i) {
    document.getElementById(`tomo-row-${i}`)?.remove();
}

function leerTomosDeLForm() {
    const container = document.getElementById("tomos-container") 
                   ?? document.getElementById("tomos-container-new");
    if (!container) return null;
    const tomos = [];
    container.querySelectorAll("[id^='tomo-inicio-']").forEach(input => {
        const i      = input.id.split("-").pop();
        const inicio = parseInt(input.value);
        const fin    = parseInt(document.getElementById(`tomo-fin-${i}`)?.value);
        if (isNaN(inicio) || isNaN(fin)) return; // ignorar filas incompletas
        tomos.push({ numero: tomos.length + 1, capituloInicio: inicio, capituloFin: fin });
    });
    return tomos.length ? tomos : null;
}