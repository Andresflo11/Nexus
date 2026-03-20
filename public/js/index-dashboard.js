// ╔══════════════════════════════════════════════════════════╗
// ║  index-dashboard.js — PÁGINA DE INICIO                  ║
// ╠══════════════════════════════════════════════════════════╣
// ║  Controla la página principal (index.html).             ║
// ║  Muestra el resumen de todas las categorías,            ║
// ║  los elementos recientes y los mejor valorados.         ║
// ║                                                          ║
// ║  Secciones:                                              ║
// ║  · cargarDashboard()  → carga todos los items de la BD  ║
// ║  · renderStats()      → las tarjetas de categoría       ║
// ║  · renderRecientes()  → los últimos añadidos            ║
// ║  · renderTopRated()   → los mejor valorados (≥4)        ║
// ║  · actualizarHeader() → contadores del header           ║
// ╚══════════════════════════════════════════════════════════╝

// Lista de todas las categorías en el orden que aparecen
const TIPOS = ["juegos", "peliculas", "series", "animes", "mangas", "comics", "libros"];

// Todos los items cargados de la BD (se usa en toda la página)
let todosLosItems = [];

function actualizarItemSilencioso(item) {
    fetch(`/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
    }).catch(err => console.error("Error al actualizar:", err));
}

// ── Cargar todo al arrancar ───────────────────────────────
// Hace una sola petición con todos los items y luego
// cada función de render filtra lo que necesita.
async function cargarDashboard() {
    try {
        const user    = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
        const esAdmin = user && user.rol === "admin";

        // Mostrar botón añadir solo al admin
        const btnAnadir = document.getElementById("dash-btn-anadir");
        if (btnAnadir) btnAnadir.style.display = esAdmin ? "" : "none";

        const url     = (user && !esAdmin) ? `/mi-dashboard/${user.id}` : "/items";
        const res     = await fetch(url);
        todosLosItems = await res.json();

        renderStats(todosLosItems);
        ordenarDashboard();
        actualizarHeader(todosLosItems);
        actualizarContadoresSidebar(todosLosItems);
        marcarSidebarActivo();
    } catch (e) {
        console.error("Error al cargar dashboard:", e);
    }
}

// ── Ordenar y rerenderizar las secciones de cards ─────────
// Se llama cuando el usuario cambia el select de ordenación.
function ordenarDashboard() {
    const sort = document.getElementById("sort-index")?.value ?? "reciente";
    let lista  = [...todosLosItems];

    if      (sort === "reciente")   lista.sort((a, b) => b.id - a.id);
    else if (sort === "rating-desc") lista.sort((a, b) => (b.valoracion ?? 0) - (a.valoracion ?? 0));
    else if (sort === "rating-asc")  lista.sort((a, b) => (a.valoracion ?? 0) - (b.valoracion ?? 0));
    else if (sort === "titulo")      lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
    else if (sort === "categoria")   lista.sort((a, b) => TIPOS.indexOf(a.tipo) - TIPOS.indexOf(b.tipo));

    renderEnProgreso(lista, sort === "categoria");
    renderPausadosPendientes(lista, sort === "categoria");
}

// ── Contadores del header ─────────────────────────────────
// Actualiza: total de items, categorías con al menos 1 item,
// y promedio de valoración de los items con nota.
function actualizarHeader(items) {
    document.getElementById("total-count").textContent      = items.length;
    document.getElementById("categorias-count").textContent = new Set(items.map(i => i.tipo)).size;

    const rated = items.filter(i => i.valoracion > 0);
    const avg   = rated.length
        ? (rated.reduce((s, i) => s + i.valoracion, 0) / rated.length).toFixed(1)
        : "—";
    document.getElementById("avg-rating").textContent = avg;
}

// ── Contadores del sidebar ────────────────────────────────
// Actualiza el número que aparece junto a cada categoría en el menú.
function actualizarContadoresSidebar(items) {
    TIPOS.forEach(tipo => {
        const el = document.getElementById(`cnt-${tipo}`);
        if (el) el.textContent = items.filter(i => i.tipo === tipo).length;
    });
}

// ── Tarjetas de resumen por categoría ────────────────────
// Genera las stat-cards grandes del index (una por categoría).
// Cada card muestra: emoji, cantidad total y cuántos completados.
function renderStats(items) {
    const grid = document.getElementById("stats-grid");
    grid.innerHTML = "";

    TIPOS.forEach((tipo, idx) => {
        const cfg   = CONFIG[tipo];
        const lista = items.filter(i => i.tipo === tipo);
        const comp  = lista.filter(i => cfg.estadosCompletados?.includes(i.estado)).length;

        const a = document.createElement("a");
        a.href      = `/pages/categoria.html?tipo=${tipo}`;
        a.className = `stat-card d${Math.min(idx + 1, 6)}`;
        a.style.borderColor = `${cfg.color}30`; // borde con el color de la categoría, semitransparente

        a.innerHTML = `
    <div class="stat-card-top" style="background:${cfg.color}25;transition:background 0.2s"></div>
    <div class="stat-card-icon">${tipoSVG(tipo, 32)}</div>
    <div class="stat-card-num" style="color:${cfg.color}">${lista.length}</div>
    <div class="stat-card-label">${cfg.label}</div>
    ${comp ? `<div style="font-size:0.68rem;color:var(--muted);margin-top:0.25rem;font-family:'JetBrains Mono',monospace">${comp} completados</div>` : ""}
`;

a.addEventListener("mouseenter", () => {
  a.querySelector(".stat-card-top").style.background = `${cfg.color}60`;
});
a.addEventListener("mouseleave", () => {
 a.querySelector(".stat-card-top").style.background = `${cfg.color}25`;
});
        grid.appendChild(a);
    });
}

// Estados activos por categoría
const ESTADOS_ACTIVOS = ["Jugando", "Viendo", "Leyendo"];
const ESTADOS_PAUSA   = ["Pausado", "Pendiente"];

function renderConSeparadores(items) {
    let html        = "";
    let tipoActual  = null;
    let idx         = 0;

    items.forEach(item => {
        if (item.tipo !== tipoActual) {
            tipoActual = item.tipo;
            const cfg  = CONFIG[item.tipo] ?? {};
            html += `
                <div style="grid-column:1/-1;display:flex;align-items:center;gap:0.75rem;margin-top:1.5rem;margin-bottom:0.25rem">
                    ${tipoSVG(item.tipo, 18)}
                    <span style="font-family:'Bebas Neue',cursive;font-size:1.1rem;letter-spacing:2px;color:${cfg.color}">${cfg.label.toUpperCase()}</span>
                    <div style="flex:1;height:1px;background:${cfg.color}25"></div>
                </div>`;
        }
        html += cardHTML(item, idx++);
    });

    return html;
}

// REEMPLAZA renderRecientes
function renderEnProgreso(items, porCategoria = false) {
    const grid    = document.getElementById("recent-grid");
    const activos = items.filter(i => ESTADOS_ACTIVOS.includes(i.estado));

    document.getElementById("recent-count").textContent = `${activos.length} elementos`;

    if (!activos.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
            <div class="big-icon">🎯</div>
            <h3>Nada en progreso</h3>
            <p>Empieza algo nuevo desde cualquier categoría.</p>
        </div>`;
        return;
    }

    grid.innerHTML = porCategoria
        ? renderConSeparadores(activos)
        : activos.map((item, i) => cardHTML(item, i)).join("");
}

function renderPausadosPendientes(items, porCategoria = false) {
    const grid  = document.getElementById("top-grid");
    const pausa = items.filter(i => ESTADOS_PAUSA.includes(i.estado));

    if (!pausa.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:2rem">
            <p style="font-size:0.875rem">No tienes elementos pausados ni pendientes.</p>
        </div>`;
        return;
    }

    grid.innerHTML = porCategoria
        ? renderConSeparadores(pausa)
        : pausa.map((item, i) => cardHTML(item, i)).join("");
}

// REEMPLAZA renderTopRated
// ── HTML de una card del dashboard ───────────────────────
// Mismo diseño que las cards de categoría pero sin botones de
// editar/eliminar — al hacer click va a la categoría del item.
function cardHTML(item, idx) {
    const cfg    = CONFIG[item.tipo] ?? {};
    const color  = cfg.color ?? "#888";
    const emoji  = tipoEmoji(item.tipo);

    const poster = item.imagen
        ? `<img src="${esc(item.imagen)}" alt="${esc(item.titulo)}" loading="lazy" onerror="this.style.display='none'">`
        : `<span class="card-poster-placeholder">${emoji}</span>`;

    const delay    = `d${Math.min(idx + 1, 6)}`;
    const valColor = valoracionColor(item.valoracion);
    const valLabel = valoracionLabel(item.valoracion);

    const rating = item.valoracion > 0
        ? `<div class="card-rating-badge" style="background:${valColor}25;color:${valColor}">${valLabel}</div>`
        : "";

    const tieneLogros = item.logros == 1 || item.logros === true;

    return `
    <article class="card ${delay}" onclick="abrirModalDesdeIndex(${item.id})">
      <div class="card-poster">
        ${poster}
        ${rating}
        <div class="card-estado-bar" style="background:${color}50"></div>
      </div>
      <div class="card-info">
        <div class="card-title">${esc(item.titulo)}</div>
        <div class="card-meta">
         <span class="card-tag tag-estado">${esc(item.estado)}</span>
           ${item.plataforma ? `<span class="card-tag tag-plataforma" style="background:${color}15;border-color:${color}40;color:${color}">${esc(item.plataforma)}</span>` : ""}
           ${cfg.usalogros ? `<span class="card-tag ${claseLogros(item.logros)}">${item.logros === "Todos completados" ? "🏆 " : ""}${item.logros ?? "No tiene logros"}</span>` : ""}
         </div>
        <div class="card-bottom"></div>
      </div>
    </article>`;
}

// ── Marcar activo el enlace del sidebar ───────────────────
// Resalta el botón "Inicio" en el menú lateral.
function marcarSidebarActivo() {
    document.querySelectorAll(".platform-btn").forEach(btn => {
        btn.classList.toggle("active",
            btn.getAttribute("href") === "/" || btn.getAttribute("href") === "/index.html");
    });
}

// Arrancar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", cargarDashboard);
