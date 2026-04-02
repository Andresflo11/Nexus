// ── Modal de formulario universal ─────────────────────────
// Funciona en index.html y categoria.html.
// Si estamos en categoria.html, preselecciona el tipo actual.

let formModalTipoActual = null;

function abrirFormModal(tipoPreseleccionado = null) {
    formModalTipoActual = tipoPreseleccionado ?? tipo ?? "juegos";
    const modal = document.getElementById("modal-formulario");
    modal.classList.remove("oculto");
    requestAnimationFrame(() => modal.classList.add("me-visible"));
    renderSelectorCategorias();
    cambiarTipoFormModal(formModalTipoActual);
}

function cerrarFormModal() {
    const modal = document.getElementById("modal-formulario");
    modal.classList.remove("me-visible");
    setTimeout(() => modal.classList.add("oculto"), 250);
}

function renderSelectorCategorias() {
    const container = document.getElementById("form-modal-categorias");
    container.innerHTML = Object.entries(CONFIG).map(([key, cfg]) => `
        <button type="button"
            id="fmc-btn-${key}"
            class="fmc-cat-btn ${key === formModalTipoActual ? "activo" : ""}"
            style="${key === formModalTipoActual ? `background:${cfg.color}20;border-color:${cfg.color};color:${cfg.color}` : ""}"
            onclick="cambiarTipoFormModal('${key}')">
            ${tipoSVG(key, 14)}
            <span>${cfg.label}</span>
        </button>`).join("");
}

function cambiarTipoFormModal(nuevoTipo) {
    // Desactivar botón anterior
    const anterior = document.getElementById(`fmc-btn-${formModalTipoActual}`);
    if (anterior) {
        anterior.classList.remove("activo");
        anterior.style.background   = "";
        anterior.style.borderColor  = "";
        anterior.style.color        = "";
    }

    formModalTipoActual = nuevoTipo;
    window._tipoFormActual = nuevoTipo;
    const cfg   = CONFIG[nuevoTipo];
    const color = cfg.color ?? "#888";

    // Activar botón nuevo
    const nuevo = document.getElementById(`fmc-btn-${nuevoTipo}`);
    if (nuevo) {
        nuevo.classList.add("activo");
        nuevo.style.background  = `${color}20`;
        nuevo.style.borderColor = color;
        nuevo.style.color       = color;
    }

    // Actualizar título
    document.getElementById("form-modal-titulo").innerHTML =
        `${tipoSVG(nuevoTipo, 20)} <span style="color:${color}">Añadir ${cfg.label}</span>`;

    // Regenerar campos
    buildFormModalCampos(nuevoTipo);
}

function buildFormModalCampos(t) {
    temporadaContador = 0;
    tomoContador      = 0;
    linkContador      = 0;
    const cfg      = CONFIG[t];
    const color    = cfg.color ?? "#888";
    const form     = document.getElementById("form-modal-campos");
    form.innerHTML = "";
    form.setAttribute("autocomplete", "off");

    const add = (html) => form.insertAdjacentHTML("beforeend", html);

    // ── Campos base ───────────────────────────────────────────
    add(`<input type="text" name="titulo" placeholder="Título" required>`);

    const selEstado = document.createElement("select");
    selEstado.name  = "estado";
    cfg.estados.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e; opt.textContent = e;
        selEstado.appendChild(opt);
    });
    form.appendChild(selEstado);

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

    // ── Plataforma como chips múltiples ───────────────────────
    if (cfg.usaPlataforma) {
        const plataformas = (cfg.plataformasOpciones ?? []).filter(p => p !== "Otro");
        const optsPlat    = plataformas.map(p => `<option value="${p}">${p}</option>`).join("");
        add(`<div style="grid-column:1/-1" id="plat-wrap-fmm">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Plataforma(s)</div>
            <div id="plat-chips-fmm" style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.5rem"></div>
            <div style="display:flex;gap:0.5rem;align-items:center">
                <select id="plat-sel-fmm" style="flex:1;font-size:0.8rem">
                    <option value="">— Añadir plataforma —</option>
                    ${optsPlat}
                    <option value="__custom__">Escribir manualmente...</option>
                </select>
                <button type="button" onclick="fmmAgregarPlataforma()"
                    style="padding:0.45rem 0.8rem;border-radius:7px;border:1px solid var(--border2);background:transparent;color:var(--muted);cursor:pointer;font-size:0.8rem;white-space:nowrap">
                    + Añadir
                </button>
            </div>
            <input type="text" id="plat-custom-fmm" placeholder="Nombre de la plataforma..."
                style="display:none;margin-top:0.4rem;width:100%;box-sizing:border-box">
        </div>`)
    }

    if (cfg.usalogros) {
        const opts = cfg.opcionesLogros.map(o => `<option value="${o}">${o}</option>`).join("");
        add(`<select name="logros">${opts}</select>`);
    }

    // ── Campos de información pública ─────────────────────────
    add(`<input type="text" name="creador" placeholder="${cfg.creadorLabel ?? 'Creador'} (opcional)">`);
    add(`<input type="number" name="anio" placeholder="Año de lanzamiento" min="1800" max="2100">`);
    add(`<input type="text" name="duracion" placeholder="Duración (ej: 2h 15min, 24 eps)">`);

    // Géneros como chips
    if (cfg.generosOpciones?.length) {
        const chips = cfg.generosOpciones.map(g =>
            `<span class="genero-chip" data-genero="${g}" onclick="toggleGeneroChip(this)"
                style="display:inline-block;padding:0.25rem 0.65rem;border-radius:99px;
                border:1px solid var(--border2);font-size:0.72rem;cursor:pointer;
                transition:all 0.15s;background:transparent;color:var(--muted)">${g}</span>`
        ).join("");
        add(`<div style="grid-column:1/-1">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Géneros</div>
            <div id="generos-chips" style="display:flex;flex-wrap:wrap;gap:0.4rem">${chips}</div>
        </div>`);
    }
    add(`<div style="grid-column:1/-1">
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Títulos alternativos</div>
        <div id="titulos-alt-container-new" style="display:flex;flex-direction:column;gap:0.35rem"></div>
        <button type="button" onclick="agregarTituloAlt('new')"
            style="margin-top:0.4rem;padding:0.35rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
            + Añadir título alternativo
        </button>
    </div>`);

    // Saga y orden
    add(`<input type="text" name="saga" placeholder="Saga / Franquicia (opcional)">`);
    add(`<input type="number" name="ordenPublicacion" placeholder="Nº orden publicación" min="1">`);
    add(`<input type="number" name="ordenCronologico" placeholder="Nº orden cronológico" min="1">`);

    // Links
    add(`<div style="grid-column:1/-1">
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Dónde verlo / comprarlo</div>
        <div id="links-container-fmm"></div>
        <button type="button" onclick="agregarFilaLinkFmm()"
            style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
            + Añadir link
        </button>
    </div>`);

    // Imágenes múltiples (se construye vacío al crear, se rellena si hay temporadas/tomos)
    add(`<div style="grid-column:1/-1;margin-top:0.5rem">
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">
            Imágenes adicionales
            <span style="opacity:0.5;font-size:0.55rem;margin-left:0.5rem">(una por temporada/tomo en orden)</span>
        </div>
        <div id="imagenes-container-new" style="display:flex;flex-direction:column;gap:0.25rem"></div>
        <button type="button" onclick="agregarFilaImagenNew()"
            style="margin-top:0.4rem;padding:0.35rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
            + Añadir imagen
        </button>
    </div>`);

    // ── Campos específicos por tipo ────────────────────────────
    if (cfg.usaEpisodios) {
        add(`<div style="grid-column:1/-1">
            <label style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;display:block;margin-bottom:0.4rem">Temporadas / OVAs / Especiales / Películas / ONAs</label>
            <div id="temporadas-container-new"></div>
            <button type="button" onclick="agregarFilaTemporada('new')"
                style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
                + Añadir temporada / OVA / Películas / ONAs
            </button>
        </div>
        <div class="number-wrap"><input type="number" name="temporadaActual" placeholder="Temporada actual (índice)" min="1"></div>
        <div class="number-wrap"><input type="number" name="capituloActualEp" placeholder="Capítulo actual" min="0"></div>`);
    }

    if (cfg.usaTomos) {
        add(`<div style="grid-column:1/-1">
            <label style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;display:block;margin-bottom:0.4rem">${cfg.tomoLabel ? "Volúmenes" : "Tomos"}</label>
            <div id="tomos-container-new"></div>
            <button type="button" onclick="agregarFilaTomo('new')"
                style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
                + Añadir ${cfg.tomoLabel ? "volumen" : "tomo"}
            </button>
            <div class="number-wrap" style="margin-top:0.5rem"><input type="number" name="capituloActualManga" placeholder="${cfg.capituloLabel ?? "Capítulo"} actual" min="0"></div>
        </div>`);
    }

    if (cfg.usaEstadoSerie) {
        const sel = document.createElement("select");
        sel.name  = "estadoSerie";
        ["En emisión","Finalizada","Temporada confirmada","Cancelada","Temporada sin confirmar","Publicación"]
            .forEach(e => {
                const o = document.createElement("option");
                o.value = e; o.textContent = e;
                sel.appendChild(o);
            });
        form.appendChild(sel);
    }

    if (cfg.usaCapitulos) {
        add(`<div class="number-wrap"><input type="number" name="capitulosTotales" placeholder="Capítulos totales" min="1"></div>
             <div class="number-wrap"><input type="number" name="capituloActual" placeholder="Capítulo actual" min="0"></div>`);
    }

    if (cfg.usaPaginas) {
        add(`<div class="number-wrap"><input type="number" name="paginasTotales" placeholder="Páginas totales" min="1"></div>
             <div class="number-wrap"><input type="number" name="paginaActual" placeholder="Página actual" min="0"></div>`);
    }

    if (cfg.usaDlcs) {
        add(`<div style="grid-column:1/-1">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">DLCs</div>
            <div id="dlcs-container"></div>
            <button type="button" onclick="agregarFilaDlc()"
                style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
                + Añadir DLC
            </button>
        </div>`);
    }

    // ── Botón guardar ──────────────────────────────────────────
    add(`<button type="submit" style="grid-column:1/-1;background:${color};color:#000;border:none;padding:0.75rem;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:0.9rem;cursor:pointer;transition:opacity 0.15s"
        onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
        Guardar
    </button>`);

    form.onsubmit = (e) => guardarFormModal(e, t);

}

// ── Plataforma múltiple en form-modal ────────────────────

function fmmAgregarPlataforma() {
    const sel    = document.getElementById("plat-sel-fmm");
    const custom = document.getElementById("plat-custom-fmm");
    const chips  = document.getElementById("plat-chips-fmm");
    if (!sel || !chips) return;

    let nombre = sel.value;
    if (nombre === "__custom__") {
        if (custom) {
            custom.style.display = "block";
            custom.focus();
            custom.onkeydown = (e) => {
                if (e.key === "Enter") { e.preventDefault(); fmmConfirmarPlataformaCustom(); }
            };
        }
        return;
    }
    if (!nombre) return;
    if (chips.querySelector(`[data-plat="${CSS.escape(nombre)}"]`)) return;
    chips.insertAdjacentHTML("beforeend", fmmRenderChip(nombre));
    sel.value = "";
}

function fmmConfirmarPlataformaCustom() {
    const custom = document.getElementById("plat-custom-fmm");
    const chips  = document.getElementById("plat-chips-fmm");
    const sel    = document.getElementById("plat-sel-fmm");
    if (!custom || !chips) return;
    const nombre = custom.value.trim();
    if (!nombre) return;
    if (!chips.querySelector(`[data-plat="${CSS.escape(nombre)}"]`))
        chips.insertAdjacentHTML("beforeend", fmmRenderChip(nombre));
    custom.value        = "";
    custom.style.display = "none";
    if (sel) sel.value  = "";
}

function fmmRenderChip(nombre) {
    const color = CONFIG[formModalTipoActual]?.color ?? "#888";
    return `<span data-plat="${esc(nombre)}"
        style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.25rem 0.55rem;
        border-radius:99px;border:1px solid ${color}50;background:${color}15;
        color:${color};font-size:0.72rem">
        ${esc(nombre)}
        <button type="button" onclick="this.parentElement.remove()"
            style="background:none;border:none;color:inherit;cursor:pointer;padding:0;font-size:0.7rem;opacity:0.7">✕</button>
    </span>`;
}

function leerPlataformasFmm() {
    const chips = document.getElementById("plat-chips-fmm");
    if (!chips) return null;
    const plats = [...chips.querySelectorAll("[data-plat]")]
        .map(el => el.dataset.plat)
        .filter(Boolean);
    return plats.length ? plats : null;
}

// ── Links específicos del form-modal ─────────────────────
let fmmLinkContador = 0;

function agregarFilaLinkFmm() {
    const container = document.getElementById("links-container-fmm");
    if (!container) return;
    const i = fmmLinkContador++;
    const optsPlataforma = PLATAFORMAS_PREDEFINIDAS.map(p =>
        `<option value="${p.nombre}">${p.nombre}</option>`
    ).join("");
    container.insertAdjacentHTML("beforeend", `
        <div id="fmm-link-row-${i}" style="display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem;flex-wrap:wrap">
            <select id="fmm-link-plataforma-${i}" style="flex-shrink:0;width:130px;font-size:0.8rem"
                onchange="fmmToggleLinkCustom(${i})">
                ${optsPlataforma}
            </select>
            <input type="text" id="fmm-link-nombre-${i}" placeholder="Nombre (opcional)" style="flex:1;min-width:100px;font-size:0.8rem">
            <input type="url"  id="fmm-link-url-${i}"    placeholder="https://..."       style="flex:2;min-width:140px;font-size:0.8rem">
            <button type="button" onclick="document.getElementById('fmm-link-row-${i}').remove()"
                style="color:#ef4444;background:transparent;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer;flex-shrink:0">✕</button>
        </div>`);
}

function fmmToggleLinkCustom(i) {
    // No necesita toggle porque el campo nombre ya sirve como personalización
}

function leerLinksFmm() {
    const container = document.getElementById("links-container-fmm");
    if (!container) return null;
    const links = [];
    container.querySelectorAll("[id^='fmm-link-url-']").forEach(input => {
        const i          = input.id.replace("fmm-link-url-", "");
        const url        = input.value.trim();
        if (!url) return;
        const plataforma = document.getElementById(`fmm-link-plataforma-${i}`)?.value ?? "Otro";
        const nombre     = document.getElementById(`fmm-link-nombre-${i}`)?.value.trim() || plataforma;
        links.push({ plataforma, nombre, url });
    });
    return links.length ? links : null;
}

async function guardarFormModal(e, t) {
    e.preventDefault();
    const form = e.target;
    const cfg  = CONFIG[t];

    const nuevo = {
        tipo:       t,
        titulo:     form.titulo.value.trim(),
        estado:     form.estado.value,
        fecha:      form.fecha.value,
        imagen:     form.imagen?.value.trim() || null,
        valoracion: parseInt(form.querySelector('[name="valoracion"]').value) || 0,
        plataforma: cfg.usaPlataforma ? leerPlataformasFmm() : null,
        creador:    form.creador?.value.trim() || null,
        anio:       parseInt(form.anio?.value) || null,
        duracion:   form.duracion?.value.trim() || null,
        generos:    leerGenerosSeleccionados(),
        saga:             form.saga?.value.trim() || null,
        ordenPublicacion: parseInt(form.ordenPublicacion?.value) || null,
        ordenCronologico: parseInt(form.ordenCronologico?.value) || null,
        links:       leerLinksFmm(),
        titulos_alt: leerTitulosAlt('new'),
        imagenes:    leerImagenesFmm()
    };

    if (cfg.usalogros)       nuevo.logros      = form.logros?.value ?? "No tiene logros";
    if (cfg.usaEstadoSerie)  nuevo.estadoSerie = form.estadoSerie?.value || null;

    if (cfg.usaEpisodios) {
        nuevo.temporadas = leerTemporadasDelForm('new');
        nuevo.progreso   = {
            temporada: parseInt(form.querySelector('[name="temporadaActual"]')?.value)  || 1,
            capitulo:  parseInt(form.querySelector('[name="capituloActualEp"]')?.value) || 0
        };
    }

    if (cfg.usaTomos) {
        nuevo.tomos         = leerTomosDeLForm('new');
        nuevo.progresoManga = { capituloActual: parseInt(form.capituloActualManga?.value) || 0 };
    }

    if (cfg.usaCapitulos) {
        nuevo.capitulosTotales = parseInt(form.capitulosTotales?.value) || null;
        nuevo.capituloActual   = parseInt(form.capituloActual?.value)   || 0;
    }

    if (cfg.usaPaginas) {
        nuevo.paginasTotales = parseInt(form.paginasTotales?.value) || null;
        nuevo.paginaActual   = parseInt(form.paginaActual?.value)   || 0;
    }

    if (cfg.usaDlcs) nuevo.dlcs = leerDlcsDelForm();
    else             nuevo.dlcs = null;

    try {
        await fetch("/items", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(nuevo)
        });
        cerrarFormModal();
        resetDatePickers();
        fmmLinkContador = 0;

        if (typeof cargarDashboard === "function") cargarDashboard();
        if (typeof cargarItems     === "function") cargarItems();
    } catch (err) {
        console.error("Error al guardar:", err);
    }
}

// Cerrar al hacer click fuera
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("modal-formulario")?.addEventListener("click", function(e) {
        if (e.target === this) cerrarFormModal();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") cerrarFormModal();
    });
});

// ── Imágenes múltiples en form-modal ──────────────────────
let fmmImagenContador = 0;

function agregarFilaImagenNew() {
    const container = document.getElementById("imagenes-container-new");
    if (!container) return;
    const i = fmmImagenContador++;
    container.insertAdjacentHTML("beforeend", `
        <div id="fmm-imagen-row-${i}" style="display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem">
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--muted);white-space:nowrap;min-width:80px">Imagen ${i + 1}</span>
            <input type="url" id="fmm-imagen-url-${i}" placeholder="URL imagen..."
                style="flex:1;font-size:0.8rem">
            <button type="button" onclick="document.getElementById('fmm-imagen-row-${i}').remove()"
                style="color:#ef4444;background:transparent;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer;flex-shrink:0">✕</button>
        </div>`);
}

function leerImagenesFmm() {
    const container = document.getElementById("imagenes-container-new");
    if (!container) return null;
    const urls = [...container.querySelectorAll("[id^='fmm-imagen-url-']")]
        .map(el => el.value.trim());
    while (urls.length && !urls[urls.length - 1]) urls.pop();
    const resultado = urls.map(u => u || null);
    return resultado.length ? resultado : null;
}