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

    // ── Campos de información pública ───────────────────────
    add(`<input type="text" name="creador" placeholder="${config.creadorLabel ?? 'Creador'} (opcional)">`);
    add(`<input type="number" name="anio" placeholder="Año de lanzamiento" min="1800" max="2100">`);
    add(`<input type="text" name="duracion" placeholder="Duración (ej: 2h 15min, 24 eps)">`);

    // Géneros: chips seleccionables
    if (config.generosOpciones?.length) {
        const chips = config.generosOpciones.map(g =>
            `<span class="genero-chip" data-genero="${g}" onclick="toggleGeneroChip(this)"
                style="display:inline-block;padding:0.25rem 0.65rem;border-radius:99px;border:1px solid var(--border2);
                font-size:0.72rem;cursor:pointer;transition:all 0.15s;background:transparent;color:var(--muted)">${g}</span>`
        ).join("");
        add(`<div style="grid-column:1/-1">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Géneros</div>
            <div id="generos-chips" style="display:flex;flex-wrap:wrap;gap:0.4rem">${chips}</div>
            <input type="hidden" name="generos" id="generos-hidden">
        </div>`);
    }

    // Saga
    add(`<input type="text" name="saga" placeholder="Saga / Franquicia (opcional)">`);
    add(`<input type="number" name="ordenPublicacion" placeholder="Nº en orden de publicación" min="1">`);
    add(`<input type="number" name="ordenCronologico" placeholder="Nº en orden cronológico" min="1">`);

    // Links
    add(`<div style="grid-column:1/-1">
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Dónde verlo / comprarlo</div>
        <div id="links-container-inline"></div>
        <button type="button" onclick="agregarFilaLink('inline')"
            style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
            + Añadir link
        </button>
    </div>`);

    if (config.usaPlataforma) add(`<input type="text" name="plataforma" placeholder="Plataforma">`);
    if (config.usalogros) {
    const opts = config.opcionesLogros.map(o => `<option value="${o}">${o}</option>`).join("");
    add(`<select name="logros">${opts}</select>`);
    }
    if (config.usaEpisodios) {
        add(`<div style="grid-column:1/-1">
    <label style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;display:block;margin-bottom:0.4rem">Temporadas / OVAs / Especiales / Películas / ONAs</label>
    <div id="temporadas-container-inline"></div>
<button type="button" onclick="agregarFilaTemporada('inline')"
        style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
        + Añadir temporada / OVA / Películas / ONAs
    </button>
</div>
<div class="number-wrap"><input type="number" name="temporadaActual" placeholder="Temporada actual (índice)" min="1"></div>
<div class="number-wrap"><input type="number" name="capituloActualEp" placeholder="Capítulo actual" min="0"></div>`);
    }
    if (config.usaTomos) {
    add(`<div style="grid-column:1/-1">
        <label style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;display:block;margin-bottom:0.4rem">${config.tomoLabel ? "Volúmenes" : "Tomos"}</label>
        <div id="tomos-container-inline"></div>
        <button type="button" onclick="agregarFilaTomo('inline')"
            style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
            + Añadir ${config.tomoLabel ? "volumen" : "tomo"}
        </button>
    </div>`);
    add(`<div class="number-wrap"><input type="number" name="capituloActualManga" placeholder="${config.capituloLabel ?? "Capítulo"} actual" min="0"></div>`);
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
        valoracion: parseInt(form.querySelector('[name="valoracion"]').value) || 0,
        creador:    form.creador?.value.trim() || null,
        anio:       parseInt(form.anio?.value) || null,
        duracion:   form.duracion?.value.trim() || null,
        generos:    leerGenerosSeleccionados(),
        saga:             form.saga?.value.trim() || null,
        ordenPublicacion: parseInt(form.ordenPublicacion?.value) || null,
        ordenCronologico: parseInt(form.ordenCronologico?.value) || null,
        links:      leerLinksDelForm('inline')
    };

    if (config.usaPlataforma) nuevo.plataforma = form.plataforma?.value.trim() || null;
    if (config.usalogros) nuevo.logros = form.logros?.value ?? 'No tiene logros';

    if (config.usaEpisodios) {
    nuevo.temporadas = leerTemporadasDelForm('inline');
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
    if (config.usaPlataforma) {
        const plataformas   = config.plataformasOpciones ?? [];
        const actuales      = normalizarPlataformas(item.plataforma);
        const optsPlat      = plataformas
            .filter(p => p !== "Otro")
            .map(p => `<option value="${p}">${p}</option>`).join("");
        const chipsHTML     = actuales.map(p => renderPlataformaChip(p, id)).join("");
        extra += `<div style="grid-column:1/-1" id="plat-wrap-${id}">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">${config.creadorLabel ? "Plataforma(s)" : "Plataforma(s)"}</div>
            <div id="plat-chips-${id}" style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.5rem">${chipsHTML}</div>
            <div style="display:flex;gap:0.5rem;align-items:center">
                <select id="plat-sel-${id}" style="flex:1;font-size:0.8rem">
                    <option value="">— Añadir plataforma —</option>
                    ${optsPlat}
                    <option value="__custom__">Escribir manualmente...</option>
                </select>
                <button type="button" onclick="agregarPlataforma(${id})"
                    style="padding:0.45rem 0.8rem;border-radius:7px;border:1px solid var(--border2);background:transparent;color:var(--muted);cursor:pointer;font-size:0.8rem;white-space:nowrap">
                    + Añadir
                </button>
            </div>
            <input type="text" id="plat-custom-${id}" placeholder="Nombre de la plataforma..."
                style="display:none;margin-top:0.4rem;width:100%;box-sizing:border-box">
        </div>`;
    }
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
    if (config.usaEpisodios) {
        const temp = Array.isArray(item.temporadas) ? item.temporadas : [];
        temporadaContador = temp.length;
        const tempRows = temp.map((t, i) => `
        <div id="temporada-row-${i}" style="display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem">
            <select id="temp-tipo-${i}" style="flex-shrink:0;width:120px">
                <option value="normal"  ${(t.tipo ?? "normal") === "normal"   ? "selected" : ""}>Temporada</option>
                <option value="ova"     ${t.tipo === "ova"     ? "selected" : ""}>OVA</option>
                <option value="especial"${t.tipo === "especial"? "selected" : ""}>Especial</option>
                <option value="pelicula"${t.tipo === "pelicula"? "selected" : ""}>Película</option>
                <option value="ona"${t.tipo === "ona"? "selected" : ""}>ONA</option>
            </select>
            <input type="number" id="temp-caps-${i}" value="${t.capitulos ?? ""}" placeholder="Nº caps" min="1" style="flex:1">
            <button type="button" onclick="eliminarFilaTemporada(${i})"
                style="color:#ef4444;background:transparent;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer">✕</button>
        </div>`).join("");

        extra += `
        <div style="grid-column:1/-1;margin-top:0.5rem">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Temporadas / OVAs / Especiales / Películas / ONAs</div>
            <div id="temporadas-container">${tempRows}</div>
            <button type="button" onclick="agregarFilaTemporada('edit')"
                style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
                + Añadir temporada / OVA / Películas / ONAs
            </button>
        </div>
        <div class="number-wrap"><input type="number" id="input-temporada-actual-${id}" value="${item.progreso?.temporada ?? 1}" placeholder="Temporada actual (índice)" min="1"></div>
        <div class="number-wrap"><input type="number" id="input-capitulo-actual-ep-${id}" value="${item.progreso?.capitulo ?? 0}" placeholder="Capítulo actual" min="0"></div>`;
    }
    if (config.usaTomos) {
    const tomos = Array.isArray(item.tomos) ? item.tomos : [];
    tomoContador = tomos.length;
    const tomoRows = tomos.map((t, i) => `
        <div id="tomo-row-${i}" style="display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem">
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);white-space:nowrap">${config.tomoLabel ? "Vol." : "Tomo"} ${t.numero}</span>
            <input type="number" id="tomo-inicio-${i}" value="${t.capituloInicio ?? ""}" placeholder="${config.capituloLabel ?? "Cap."} inicio" min="1">
            <input type="number" id="tomo-fin-${i}"    value="${t.capituloFin ?? ""}"    placeholder="${config.capituloLabel ?? "Cap."} inicio" min="1">
            <button type="button" onclick="eliminarFilaTomo(${i})" style="color:#ef4444;background:transparent;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer">✕</button>
        </div>`).join("");

    extra += `
        <div style="grid-column:1/-1;margin-top:0.5rem">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">${config.tomoLabel ? "Volúmenes" : "Tomos"}</div>
            <div id="tomos-container">${tomoRows}</div>
            <button type="button" onclick="agregarFilaTomo('edit')"
                style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
                + Añadir ${config.tomoLabel ? "volumen" : "tomo"}
            </button>
        </div>`;

    extra += `<input type="number" id="input-cap-manga-${id}" 
    value="${item.progresoManga?.capituloActual ?? 0}" 
    placeholder="${config.capituloLabel ?? "Capítulo"} actual" min="0"
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

    // Sección de items relacionados
    const relacionadosActuales = Array.isArray(item.relacionados) ? item.relacionados : [];
    const relacionadosHTML = relacionadosActuales.map(rid => {
        const fuenteRel = (typeof todosLosItemsGlobal !== "undefined" && todosLosItemsGlobal.length)
            ? todosLosItemsGlobal : dataOriginal;
        const rel  = fuenteRel.find(i => i.id === rid);
        const cfg2 = rel ? CONFIG[rel.tipo] : null;
        return rel ? `
        <div id="rel-tag-${rid}" style="display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0.6rem;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:0.8rem">
            ${cfg2 ? `<span style="color:${cfg2.color};font-size:0.7rem">${cfg2.label.split(" ")[0]}</span>` : ""}
            <span>${esc(rel.titulo)}</span>
            <button type="button" onclick="quitarRelacionado(${rid})" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:0;margin-left:auto;font-size:0.75rem">✕</button>
        </div>` : "";
    }).join("");

    extra += `
        <div style="grid-column:1/-1;margin-top:0.5rem">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Items relacionados</div>
            <div id="relacionados-lista" style="display:flex;flex-direction:column;gap:0.4rem;margin-bottom:0.5rem">${relacionadosHTML}</div>
            <div style="position:relative">
                <input type="text" id="rel-buscar" placeholder="Buscar item para relacionar..." autocomplete="off"
                    style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.55rem 0.8rem;color:var(--text);font-size:0.85rem;box-sizing:border-box"
                    oninput="buscarParaRelacionar(this.value, ${id})">
                <div id="rel-resultados" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;z-index:99;max-height:200px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.4)"></div>
            </div>
        </div>`;

    const estadoOpts = config.estados.map(e => `<option value="${e}" ${e === item.estado ? "selected" : ""}>${e}</option>`).join("");
    const valOpts    = [5,4,3,2,1,0].map(v => {
        const labels = {5:"Me Encanta",4:"Me gustó",3:"Indiferente",2:"No me gustó",1:"Pésimo",0:"Sin valorar"};
        return `<option value="${v}" ${item.valoracion == v ? "selected" : ""}>${labels[v]}</option>`;
    }).join("");

    // ── Géneros chips para edición ────────────────────────────
    const generosActuales = Array.isArray(item.generos) ? item.generos : [];
    let generosEditHTML = "";
    if (config.generosOpciones?.length) {
        const chips = config.generosOpciones.map(g => {
            const sel = generosActuales.includes(g);
            return `<span class="genero-chip${sel ? " seleccionado" : ""}" data-genero="${g}" onclick="toggleGeneroChip(this)"
                style="display:inline-block;padding:0.25rem 0.65rem;border-radius:99px;border:1px solid ${sel ? config.color : "var(--border2)"};
                font-size:0.72rem;cursor:pointer;transition:all 0.15s;background:${sel ? config.color + "25" : "transparent"};color:${sel ? config.color : "var(--muted)"}">${g}</span>`;
        }).join("");
        generosEditHTML = `<div style="grid-column:1/-1;margin-top:0.5rem">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Géneros</div>
            <div id="generos-chips" style="display:flex;flex-wrap:wrap;gap:0.4rem">${chips}</div>
            <input type="hidden" name="generos" id="generos-hidden">
        </div>`;
    }

    // ── Links para edición ───────────────────────────────────
    const linksActuales = Array.isArray(item.links) ? item.links : [];
    linkContador = linksActuales.length;
    const linkRows = linksActuales.map((l, i) => renderFilaLink(i, l)).join("");
    const linksEditHTML = `<div style="grid-column:1/-1;margin-top:0.5rem">
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Dónde verlo / comprarlo</div>
        <div id="links-container">${linkRows}</div>
        <button type="button" onclick="agregarFilaLink('edit')"
            style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
            + Añadir link
        </button>
    </div>`;

    document.getElementById("me-form-contenido").innerHTML = `
        <input type="text" id="input-titulo-${id}" value="${esc(item.titulo)}" placeholder="Título">
        <select id="input-estado-${id}">${estadoOpts}</select>
        <input type="date" id="edit-fecha-${id}" value="${item.fecha ?? ""}">
        <input type="text" id="input-imagen-${id}" value="${esc(item.imagen ?? "")}" placeholder="URL imagen">
        <select id="input-valoracion-${id}">${valOpts}</select>
        <input type="text" id="input-creador-${id}" value="${esc(item.creador ?? "")}" placeholder="${config.creadorLabel ?? 'Creador'}">
        <input type="number" id="input-anio-${id}" value="${item.anio ?? ""}" placeholder="Año de lanzamiento" min="1800" max="2100">
        <input type="text" id="input-duracion-${id}" value="${esc(item.duracion ?? "")}" placeholder="Duración">
        ${generosEditHTML}
        <input type="text" id="input-saga-${id}" value="${esc(item.saga ?? "")}" placeholder="Saga / Franquicia">
        <input type="number" id="input-orden-pub-${id}" value="${item.ordenPublicacion ?? ""}" placeholder="Nº orden publicación" min="1">
        <input type="number" id="input-orden-cron-${id}" value="${item.ordenCronologico ?? ""}" placeholder="Nº orden cronológico" min="1">
        ${linksEditHTML}
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
        valoracion: parseInt(document.getElementById(`input-valoracion-${id}`).value),
        creador:    document.getElementById(`input-creador-${id}`)?.value.trim() || null,
        anio:       parseInt(document.getElementById(`input-anio-${id}`)?.value) || null,
        duracion:   document.getElementById(`input-duracion-${id}`)?.value.trim() || null,
        generos:    leerGenerosSeleccionados(),
        saga:             document.getElementById(`input-saga-${id}`)?.value.trim() || null,
        ordenPublicacion: parseInt(document.getElementById(`input-orden-pub-${id}`)?.value) || null,
        ordenCronologico: parseInt(document.getElementById(`input-orden-cron-${id}`)?.value) || null,
        links:      leerLinksDelForm('edit')
    };

    if (config.usaPlataforma) {
        actualizado.plataforma = leerPlataformasChips(id);
    }
    if (config.usalogros)
        actualizado.logros = document.getElementById(`input-logros-${id}`)?.value ?? 'No tiene logros';
    if (config.usaEpisodios) {
    actualizado.temporadas = leerTemporadasDelForm('edit');
    actualizado.progreso   = {
        temporada: parseInt(document.getElementById(`input-temporada-actual-${id}`)?.value) || 1,
        capitulo:  parseInt(document.getElementById(`input-capitulo-actual-ep-${id}`)?.value) || 0
    };
}
    if (config.usaTomos) actualizado.tomos = leerTomosDeLForm('edit');
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

    const listaRel = document.getElementById("relacionados-lista");
    let nuevosRelIds = [];
    if (listaRel) {
        nuevosRelIds = [...listaRel.querySelectorAll("[id^='rel-tag-']")]
            .map(el => parseInt(el.id.replace("rel-tag-", "")))
            .filter(Boolean);
        actualizado.relacionados = nuevosRelIds.length ? nuevosRelIds : null;
    }

    const idx = dataOriginal.findIndex(i => i.id === id);
    if (idx !== -1) dataOriginal[idx] = { ...dataOriginal[idx], ...actualizado };
    meItemActual = dataOriginal[idx];

    actualizarItemSilencioso(actualizado);

    // ── Sincronización bidireccional de relacionados ──────
    // Para cada item relacionado, asegurarse de que también tenga este id en sus relacionados.
    // También quitar este id de items que ya NO están en la nueva lista.
    const fuente = (typeof todosLosItemsGlobal !== "undefined" && todosLosItemsGlobal.length)
        ? todosLosItemsGlobal : dataOriginal;

    // Items que antes tenían relación con este pero ahora fueron quitados
    fuente.forEach(otroItem => {
        if (otroItem.id === id) return;
        const otrosRels = Array.isArray(otroItem.relacionados) ? otroItem.relacionados : [];
        const meTeníaAntes = otrosRels.includes(id);
        const metieneAhora = nuevosRelIds.includes(otroItem.id);

        if (metieneAhora && !otrosRels.includes(id)) {
            // Añadir este id a los relacionados del otro
            const nuevoRels = [...otrosRels, id];
            otroItem.relacionados = nuevoRels;
            sincronizarRelacionadosRemoto(otroItem.id, nuevoRels);
        } else if (!metieneAhora && meTeníaAntes) {
            // Quitar este id de los relacionados del otro
            const nuevoRels = otrosRels.filter(r => r !== id);
            otroItem.relacionados = nuevoRels.length ? nuevoRels : null;
            sincronizarRelacionadosRemoto(otroItem.id, nuevoRels.length ? nuevoRels : null);
        }
    });
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
    const color = config.color ?? "#888";
if (metaEl) metaEl.innerHTML = `
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
    })() : ""}`;

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
    <div class="card-bloque">
        <div class="card-bloque-label">Estado</div>
        <span class="card-tag tag-estado">${esc(item.estado)}</span>
    </div>
    ${item.estadoSerie && item.estadoSerie !== "null" && config.usaEstadoSerie ? `
    <div class="card-bloque">
        <div class="card-bloque-label">Estado de la serie</div>
        <span class="card-tag tag-estado-serie">${esc(item.estadoSerie)}</span>
    </div>` : ""}
    ${config.usalogros && item.logros ? `
    <div class="card-bloque">
        <div class="card-bloque-label">Logros</div>
        <span class="card-tag ${claseLogros(item.logros)}">${item.logros === "Todos completados" ? "" : ""}${item.logros}</span>
    </div>` : ""}`;
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
    const cfg = (typeof formModalTipoActual !== "undefined" && formModalTipoActual)
        ? CONFIG[formModalTipoActual]
        : config;

    const container = document.getElementById("dlcs-container");
    const i = dlcContador++;
    const div = document.createElement("div");
    div.id = `dlc-row-${i}`;
    div.style.cssText = "display:flex;gap:0.5rem;align-items:center;grid-column:1/-1;margin-top:0.4rem";
    div.innerHTML = `
        <input type="text" id="dlc-nombre-${i}" placeholder="Nombre del DLC">
        <select id="dlc-tipo-${i}">
            ${cfg.tiposDlc.map(t => `<option>${t}</option>`).join("")}
        </select>
        <select id="dlc-estado-${i}">
            ${cfg.estadosDlc.map(e => `<option>${e}</option>`).join("")}
        </select>
        <select id="dlc-logros-${i}">
            ${cfg.opcionesLogros.map(o => `<option>${o}</option>`).join("")}
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
    const container = document.getElementById(
        modo === "edit"   ? "tomos-container" :
        modo === "inline" ? "tomos-container-inline" :
                            "tomos-container-new"
    );
    // Mismo patrón que agregarFilaDlc: formModalTipoActual en dashboard, config en categoria
    const _cfg = (typeof formModalTipoActual !== "undefined" && formModalTipoActual)
        ? CONFIG[formModalTipoActual]
        : (typeof config !== "undefined" ? config : {});
    const tomoLabel  = _cfg.tomoLabel     ? "Vol." : "Tomo";
    const capLabel   = _cfg.capituloLabel ?? "Cap.";

    const i      = tomoContador++;
    const numero = i + 1;
    const div    = document.createElement("div");
    div.id          = `tomo-row-${i}`;
    div.style.cssText = "display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem";
    div.innerHTML = `
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);white-space:nowrap">${tomoLabel} ${numero}</span>
        <input type="number" id="tomo-inicio-${i}" placeholder="${capLabel} inicio" min="1">
        <input type="number" id="tomo-fin-${i}"    placeholder="${capLabel} fin"   min="1">
        <button type="button" onclick="eliminarFilaTomo(${i})" style="color:#ef4444;background:transparent;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer">✕</button>`;
    container.appendChild(div);
}

function eliminarFilaTomo(i) {
    document.getElementById(`tomo-row-${i}`)?.remove();
}

function leerTomosDeLForm(modo) {
    const containerId = modo === "new"    ? "tomos-container-new"
                      : modo === "inline" ? "tomos-container-inline"
                      : modo === "edit"   ? "tomos-container"
                      : null;
    const container = containerId
        ? document.getElementById(containerId)
        : document.getElementById("tomos-container")
       ?? document.getElementById("tomos-container-inline")
       ?? document.getElementById("tomos-container-new");
    if (!container) return [];
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

let temporadaContador = 0;

function agregarFilaTemporada(modo) {
    const container = document.getElementById(
    modo === "edit"   ? "temporadas-container" :
    modo === "inline" ? "temporadas-container-inline" :
                        "temporadas-container-new"
);
    if (!container) return;

    const i   = temporadaContador++;
    const div = document.createElement("div");
    div.id    = `temporada-row-${i}`;
    div.style.cssText = "display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem";
    div.innerHTML = `
        <select id="temp-tipo-${i}" style="flex-shrink:0;width:120px">
            <option value="normal">Temporada</option>
            <option value="ova">OVA</option>
            <option value="especial">Especial</option>
            <option value="pelicula">Película</option>
            <option value="ona">ONA</option>
        </select>
        <input type="number" id="temp-caps-${i}" placeholder="Nº caps" min="1" style="flex:1">
        <button type="button" onclick="eliminarFilaTemporada(${i})"
            style="color:#ef4444;background:transparent;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer">✕</button>`;
    container.appendChild(div);
}

function eliminarFilaTemporada(i) {
    document.getElementById(`temporada-row-${i}`)?.remove();
}

function leerTemporadasDelForm(modo) {
    const containerId = modo === "new"    ? "temporadas-container-new"
                      : modo === "inline" ? "temporadas-container-inline"
                      : modo === "edit"   ? "temporadas-container"
                      : null;
    const container = containerId
        ? document.getElementById(containerId)
        : document.getElementById("temporadas-container")
       ?? document.getElementById("temporadas-container-inline")
       ?? document.getElementById("temporadas-container-new");
    if (!container) return null;

    const contadores = { normal: 0, ova: 0, especial: 0 , pelicula: 0, ona: 0};
    const temporadas = [];

    container.querySelectorAll("[id^='temp-caps-']").forEach(input => {
        const i       = input.id.split("-").pop();
        const caps    = parseInt(input.value);
        const tipoSel = document.getElementById(`temp-tipo-${i}`)?.value ?? "normal";
        if (isNaN(caps) || caps < 1) return;

        contadores[tipoSel]++;
        temporadas.push({
            numero:    contadores[tipoSel],
            capitulos: caps,
            tipo:      tipoSel
        });
    });

    return temporadas.length ? temporadas : null;
}

// ── Relacionados: buscar ──────────────────────────────────
function buscarParaRelacionar(q, itemId) {
    const resDiv = document.getElementById("rel-resultados");
    if (!resDiv) return;
    if (!q.trim()) { resDiv.style.display = "none"; return; }

    const listaRel  = document.getElementById("relacionados-lista");
    const yaIds     = new Set(
        [...(listaRel?.querySelectorAll("[id^='rel-tag-']") ?? [])]
            .map(el => parseInt(el.id.replace("rel-tag-", "")))
    );
    yaIds.add(itemId); // no relacionarse consigo mismo

    const fuente = (typeof todosLosItemsGlobal !== "undefined" && todosLosItemsGlobal.length)
        ? todosLosItemsGlobal : dataOriginal;
    const resultados = fuente
        .filter(i => i.id !== itemId && !yaIds.has(i.id) && i.titulo?.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8);

    if (!resultados.length) { resDiv.style.display = "none"; return; }

    resDiv.style.display = "block";
    resDiv.innerHTML = resultados.map(r => {
        const cfg2 = CONFIG[r.tipo];
        return `<div onclick="agregarRelacionado(${r.id}, ${itemId})"
            style="display:flex;align-items:center;gap:0.6rem;padding:0.55rem 0.8rem;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.15s"
            onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background='transparent'">
            ${r.imagen ? `<img src="${r.imagen}" style="width:28px;height:40px;object-fit:cover;border-radius:4px;flex-shrink:0">` : `<span style="font-size:1.1rem;flex-shrink:0">${cfg2?.label.split(" ")[0] ?? "?"}</span>`}
            <div>
                <div style="font-size:0.82rem;line-height:1.2">${esc(r.titulo)}</div>
                <div style="font-size:0.65rem;color:${cfg2?.color ?? "var(--muted)"};font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.06em">${cfg2?.label.slice(2) ?? r.tipo}</div>
            </div>
        </div>`;
    }).join("");
}

function agregarRelacionado(relId, itemId) {
    const fuente = (typeof todosLosItemsGlobal !== "undefined" && todosLosItemsGlobal.length)
        ? todosLosItemsGlobal : dataOriginal;
    const rel   = fuente.find(i => i.id === relId);
    const cfg2  = rel ? CONFIG[rel.tipo] : null;
    if (!rel) return;

    const listaRel  = document.getElementById("relacionados-lista");
    const resDiv    = document.getElementById("rel-resultados");
    const inputBus  = document.getElementById(`rel-buscar-${itemId}`);
    if (!listaRel) return;

    const tag = document.createElement("div");
    tag.id = `rel-tag-${relId}`;
    tag.style.cssText = "display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0.6rem;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:0.8rem";
    tag.innerHTML = `
        <span style="color:${cfg2?.color ?? "#888"};font-size:0.7rem">${cfg2?.label.split(" ")[0] ?? ""}</span>
        <span style="flex:1">${esc(rel.titulo)}</span>
        <button type="button" onclick="quitarRelacionado(${relId}, ${itemId})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:0.75rem;padding:0">✕</button>`;
    listaRel.appendChild(tag);

    if (resDiv) resDiv.style.display = "none";
    if (inputBus) inputBus.value = "";
}

function quitarRelacionado(relId, itemId) {
    document.getElementById(`rel-tag-${relId}`)?.remove();
}

// Actualiza solo el campo relacionados de un item remoto sin tocarlo completo
async function sincronizarRelacionadosRemoto(itemId, relIds) {
    try {
        // Obtener el item completo para no pisar sus otros campos
        const res  = await fetch(`/items/id/${itemId}`);
        if (!res.ok) return;
        const item = await res.json();
        item.relacionados = relIds;
        await fetch(`/items/${itemId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item)
        });
        // Actualizar también en memoria global
        const fuente = (typeof todosLosItemsGlobal !== "undefined") ? todosLosItemsGlobal : [];
        const gi = fuente.findIndex(i => i.id === itemId);
        if (gi !== -1) fuente[gi].relacionados = relIds;
    } catch(e) {
        console.error("Error sincronizando relacionados:", e);
    }
}

// ── Plataformas múltiples: widget chips ───────────────────

function renderPlataformaChip(nombre, id) {
    const color = config?.color ?? "#888";
    return `<span id="plat-chip-${id}-${CSS.escape(nombre)}"
        style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.25rem 0.55rem;
        border-radius:99px;border:1px solid ${color}50;background:${color}15;
        color:${color};font-size:0.72rem">
        ${esc(nombre)}
        <button type="button" onclick="quitarPlataforma('${esc(nombre)}',${id})"
            style="background:none;border:none;color:inherit;cursor:pointer;padding:0;
            font-size:0.7rem;line-height:1;opacity:0.7" title="Quitar">✕</button>
    </span>`;
}

function agregarPlataforma(id) {
    const sel    = document.getElementById(`plat-sel-${id}`);
    const custom = document.getElementById(`plat-custom-${id}`);
    const chips  = document.getElementById(`plat-chips-${id}`);
    if (!sel || !chips) return;

    let nombre = sel.value;
    if (nombre === "__custom__") {
        if (custom) {
            custom.style.display = "block";
            custom.focus();
            custom.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); confirmarPlataformaCustom(id); } };
        }
        return;
    }
    if (!nombre) return;

    // Evitar duplicados
    if (chips.querySelector(`[id="plat-chip-${id}-${CSS.escape(nombre)}"]`)) return;
    chips.insertAdjacentHTML("beforeend", renderPlataformaChip(nombre, id));
    sel.value = "";
}

function confirmarPlataformaCustom(id) {
    const custom = document.getElementById(`plat-custom-${id}`);
    const chips  = document.getElementById(`plat-chips-${id}`);
    const sel    = document.getElementById(`plat-sel-${id}`);
    if (!custom || !chips) return;
    const nombre = custom.value.trim();
    if (!nombre) return;
    if (!chips.querySelector(`[id="plat-chip-${id}-${CSS.escape(nombre)}"]`))
        chips.insertAdjacentHTML("beforeend", renderPlataformaChip(nombre, id));
    custom.value        = "";
    custom.style.display = "none";
    if (sel) sel.value  = "";
}

function quitarPlataforma(nombre, id) {
    document.getElementById(`plat-chip-${id}-${CSS.escape(nombre)}`)?.remove();
}

function leerPlataformasChips(id) {
    const chips = document.getElementById(`plat-chips-${id}`);
    if (!chips) return null;
    const plats = [...chips.querySelectorAll("span[id^='plat-chip-']")]
        .map(el => el.childNodes[0]?.textContent?.trim())
        .filter(Boolean);
    return plats.length ? plats : null;
}

// ── Géneros: chips seleccionables ─────────────────────────

function toggleGeneroChip(el) {
    const color = config?.color ?? "#7c5cfc";
    const activo = el.classList.toggle("seleccionado");
    el.style.background   = activo ? color + "25" : "transparent";
    el.style.borderColor  = activo ? color : "var(--border2)";
    el.style.color        = activo ? color : "var(--muted)";
}

function leerGenerosSeleccionados() {
    const chips = document.querySelectorAll(".genero-chip.seleccionado");
    const generos = [...chips].map(c => c.dataset.genero);
    return generos.length ? generos : null;
}

// ── Links: filas dinámicas ────────────────────────────────

let linkContador = 0;

// Plataformas predefinidas con sus colores
const PLATAFORMAS_PREDEFINIDAS = [
    { nombre: "Netflix",       color: "#e50914" },
    { nombre: "Steam",         color: "#1b2838" },
    { nombre: "Prime Video",   color: "#00a8e0" },
    { nombre: "Disney+",       color: "#113ccf" },
    { nombre: "HBO Max",       color: "#5822b4" },
    { nombre: "Apple TV+",     color: "#555555" },
    { nombre: "Crunchyroll",   color: "#f47521" },
    { nombre: "Spotify",       color: "#1db954" },
    { nombre: "YouTube",       color: "#ff0000" },
    { nombre: "Epic Games",    color: "#2d2d2d" },
    { nombre: "PlayStation",   color: "#003087" },
    { nombre: "Xbox",          color: "#107c10" },
    { nombre: "Nintendo",      color: "#e4000f" },
    { nombre: "GOG",           color: "#86328a" },
    { nombre: "Otro",          color: "#6b7280" }
];

function renderFilaLink(i, datos = {}) {
    const optsPlataforma = PLATAFORMAS_PREDEFINIDAS.map(p =>
        `<option value="${p.nombre}" ${datos.plataforma === p.nombre ? "selected" : ""}>${p.nombre}</option>`
    ).join("");
    return `<div id="link-row-${i}" style="display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem;grid-column:1/-1">
        <select id="link-plataforma-${i}" style="flex-shrink:0;width:130px;font-size:0.8rem"
            onchange="actualizarColorLink(${i})">
            ${optsPlataforma}
        </select>
        <input type="text" id="link-nombre-${i}" value="${esc(datos.nombre ?? "")}" placeholder="Nombre personalizado (opcional)" style="flex:1;font-size:0.8rem">
        <input type="url"  id="link-url-${i}"    value="${esc(datos.url ?? "")}"    placeholder="https://..." style="flex:2;font-size:0.8rem">
        <button type="button" onclick="eliminarFilaLink(${i})"
            style="color:#ef4444;background:transparent;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer;flex-shrink:0">✕</button>
    </div>`;
}

function agregarFilaLink(modo) {
    const containerId = modo === "edit" ? "links-container" : "links-container-inline";
    const container   = document.getElementById(containerId);
    if (!container) return;
    const i = linkContador++;
    container.insertAdjacentHTML("beforeend", renderFilaLink(i));
}

function eliminarFilaLink(i) {
    document.getElementById(`link-row-${i}`)?.remove();
}

function leerLinksDelForm(modo) {
    const containerId = modo === "edit" ? "links-container" : "links-container-inline";
    const container   = document.getElementById(containerId);
    if (!container) return null;
    const links = [];
    container.querySelectorAll("[id^='link-url-']").forEach(input => {
        const i          = input.id.split("-").pop();
        const url        = input.value.trim();
        if (!url) return;
        const plataforma = document.getElementById(`link-plataforma-${i}`)?.value ?? "Otro";
        const nombre     = document.getElementById(`link-nombre-${i}`)?.value.trim() || plataforma;
        links.push({ plataforma, nombre, url });
    });
    return links.length ? links : null;
}

function activarEdicionUsuario(itemId, userId) {
    const item   = dataOriginal.find(i => i.id === itemId);
    const config = CONFIG[item?.tipo];
    if (!item || !config) return;
    const color  = config.color ?? "#888";

    const contenedor = document.getElementById("me-form-contenido");
    if (!contenedor) return;

    const dlcs       = Array.isArray(item.dlcs) ? item.dlcs : [];
    const dlcsU      = meDatosUsuario?.dlcs_usuario ?? {};
    const logrosOpts = ["Sin completar","En proceso","Algunos completados","Todos completados","No tiene logros"];
    const estadosOpts = config.estados ?? [];

    const labelStyle = `font-family:'JetBrains Mono',monospace;font-size:0.52rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted);margin-bottom:0.5rem`;

    function chipGroup(opciones, valorActual, inputId, colorActivo) {
        return `<div style="display:flex;flex-wrap:wrap;gap:0.35rem" id="chips-${inputId}">
            ${opciones.map(o => `
                <button type="button"
                    onclick="ueSeleccionarChip('${inputId}','${o.replace(/'/g,"\\'")}','${(colorActivo||color).replace(/'/g,"\\'")}',this)"
                    style="padding:0.28rem 0.75rem;border-radius:99px;border:1px solid;font-family:'DM Sans',sans-serif;font-size:0.72rem;cursor:pointer;transition:all 0.15s;
                        ${valorActual === o
                            ? `background:${colorActivo||color};border-color:${colorActivo||color};color:#000;font-weight:600`
                            : `background:transparent;border-color:var(--border2);color:var(--muted)`}">
                    ${o}
                </button>`).join("")}
            <input type="hidden" id="${inputId}" value="${valorActual ?? ""}">
        </div>`;
    }

    // Fecha
    let html = `
        <div style="grid-column:1/-1">
            <div style="${labelStyle}">Fecha agregada</div>
            <input type="date" id="ue-fecha" value="${meDatosUsuario?.fecha_agregado ?? ""}">
        </div>`;

    // Logros generales (juegos)
    if (config.usalogros) {
        const logrosActual = meDatosUsuario !== null
            ? (meDatosUsuario?.logros || "")
            : (item.logros || "");
        html += `
        <div style="grid-column:1/-1">
            <div style="${labelStyle}">Logros</div>
            ${chipGroup(logrosOpts, logrosActual, "ue-logros", "#64dd17")}
        </div>`;
    }

    // DLCs
    if (config.usaDlcs && dlcs.length) {
        const colStyle = `font-family:'JetBrains Mono',monospace;font-size:0.5rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted)`;
        const filas = dlcs.map((d, i) => {
            const du = dlcsU[i] ?? {};
            return `
            <div style="padding:0.75rem 0;border-bottom:1px solid var(--border)">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.6rem">
                    <span style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:var(--muted)">${esc(d.tipo??"DLC")}</span>
                    <span style="font-size:0.85rem;font-weight:500">${esc(d.nombre)}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:0.5rem">
                    <div>
                        <div style="${colStyle};margin-bottom:0.35rem">Estado</div>
                        ${chipGroup(estadosOpts, du.estado ?? "", `ue-dlc-estado-${i}`, color)}
                    </div>
                    <div>
                        <div style="${colStyle};margin-bottom:0.35rem">Logros</div>
                        ${chipGroup(logrosOpts, du.logros ?? "", `ue-dlc-logros-${i}`, "#64dd17")}
                    </div>
                </div>
            </div>`;
        }).join("");

        html += `
        <div style="grid-column:1/-1;margin-top:0.25rem">
            <div style="${labelStyle}">DLCs / Ediciones</div>
            ${filas}
        </div>`;
    }

    // Botón guardar
    html += `
        <div style="grid-column:1/-1;margin-top:1.25rem">
            <button onclick="guardarEdicionUsuario(${itemId},${userId})"
                style="width:100%;padding:0.65rem;background:${color};color:#000;border:none;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer">
                Guardar
            </button>
        </div>`;

    contenedor.innerHTML = html;
    setTimeout(() => initDatePickers(), 0);
}

function ueSeleccionarChip(inputId, valor, colorActivo, btnPulsado) {
    const input = document.getElementById(inputId);
    const grupo = document.getElementById(`chips-${inputId}`);
    if (!input || !grupo) return;

    const yaActivo = input.value === valor;

    grupo.querySelectorAll("button").forEach(b => {
        b.style.background  = "transparent";
        b.style.borderColor = "var(--border2)";
        b.style.color       = "var(--muted)";
        b.style.fontWeight  = "";
    });

    if (yaActivo) {
        input.value = ""; // desmarcar
    } else {
        input.value = valor;
        btnPulsado.style.background  = colorActivo;
        btnPulsado.style.borderColor = colorActivo;
        btnPulsado.style.color       = "#000";
        btnPulsado.style.fontWeight  = "600";
    }
}

async function guardarEdicionUsuario(itemId, userId) {
    const fecha = document.getElementById("ue-fecha")?.value ?? null;
    const item  = dataOriginal.find(i => i.id === itemId);
    const dlcs  = Array.isArray(item?.dlcs) ? item.dlcs : [];
    const dlcsU = {};
    dlcs.forEach((_, i) => {
        dlcsU[i] = {
            logros: document.getElementById(`ue-dlc-logros-${i}`)?.value ?? "",
            estado: document.getElementById(`ue-dlc-estado-${i}`)?.value ?? ""
        };
    });
    const logros = document.getElementById("ue-logros")?.value || null;
    await fetch(`/mi-dashboard/${userId}/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha_agregado: fecha, dlcs_usuario: dlcsU, logros_usuario: logros || null })
    });
    if (!window._dashDatosUsuario) window._dashDatosUsuario = {};
    if (!window._dashDatosUsuario[itemId]) window._dashDatosUsuario[itemId] = {};
    window._dashDatosUsuario[itemId].logros = logros || null;

    parchearCard(itemId); // ← actualizar la card con el nuevo valor antes de volver
    meDatosUsuario = null;
    meVolverDesdeEdicion(itemId);
}