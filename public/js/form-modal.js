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
    const cfg      = CONFIG[t];
    const color    = cfg.color ?? "#888";
    const form     = document.getElementById("form-modal-campos");
    form.innerHTML = "";
    form.setAttribute("autocomplete", "off");

    const add = (html) => form.insertAdjacentHTML("beforeend", html);

    add(`<input type="text" name="titulo" placeholder="Título" required>`);

    // Select de estado
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

    if (cfg.usaPlataforma)
        add(`<input type="text" name="plataforma" placeholder="Plataforma">`);

    if (cfg.usalogros) {
        const opts = cfg.opcionesLogros.map(o => `<option value="${o}">${o}</option>`).join("");
        add(`<select name="logros">${opts}</select>`);
    }

    if (cfg.usaEpisodios) {
        add(`<div class="number-wrap"><input type="number" name="temporadasTotal" placeholder="Num. temporadas" min="1"></div>
             <input type="text" name="capitulosPorTemporada" placeholder="Caps por temporada (ej: 12,24,13)">
             <div class="number-wrap"><input type="number" name="temporadaActual" placeholder="Temporada actual" min="1"></div>
             <div class="number-wrap"><input type="number" name="capituloActualEp" placeholder="Capítulo actual" min="0"></div>`);
    }

    if (cfg.usaTomos) {
        add(`<div style="grid-column:1/-1">
            <label style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;display:block;margin-bottom:0.4rem">Tomos</label>
            <div id="tomos-container-new"></div>
            <button type="button" onclick="agregarFilaTomo('new')"
                style="margin-top:0.5rem;padding:0.4rem 0.9rem;border-radius:7px;border:1px dashed var(--border2);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;width:100%">
                + Añadir tomo
            </button>
            <div class="number-wrap" style="margin-top:0.5rem"><input type="number" name="capituloActualManga" placeholder="Capítulo actual" min="0"></div>
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

    // Botón guardar con color de categoría
    add(`<button type="submit" style="grid-column:1/-1;background:${color};color:#000;border:none;padding:0.75rem;border-radius:8px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:0.9rem;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
        Guardar
    </button>`);

    form.onsubmit = (e) => guardarFormModal(e, t);
}

async function guardarFormModal(e, t) {
    e.preventDefault();
    const form = e.target;
    const cfg  = CONFIG[t];

    const nuevo = {
        tipo:      t,
        titulo:    form.titulo.value.trim(),
        estado:    form.estado.value,
        fecha:     form.fecha.value,
        imagen:    form.imagen?.value.trim() || null,
        valoracion: parseInt(form.querySelector('[name="valoracion"]').value) || 0
    };

    if (cfg.usaPlataforma)   nuevo.plataforma  = form.plataforma?.value.trim() || null;
    if (cfg.usalogros)       nuevo.logros      = form.logros?.value ?? "No tiene logros";
    if (cfg.usaEstadoSerie)  nuevo.estadoSerie = form.estadoSerie?.value || null;

    if (cfg.usaEpisodios) {
        const caps = (form.capitulosPorTemporada?.value ?? "").split(",").map(c => parseInt(c.trim())).filter(n => !isNaN(n));
        nuevo.temporadas = caps.map((c, i) => ({ numero: i + 1, capitulos: c }));
        nuevo.progreso   = {
            temporada: parseInt(form.temporadaActual?.value)  || 1,
            capitulo:  parseInt(form.capituloActualEp?.value) || 0
        };
    }

    if (cfg.usaTomos) {
        nuevo.tomos         = leerTomosDeLForm();
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

        // Recargar según en qué página estemos
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