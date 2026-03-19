// ── Dashboard principal ──────────────────────────────────────────────────────

const TIPOS = ["juegos", "peliculas", "series", "animes", "mangas", "comics", "libros"];

async function cargarDashboard() {
    try {
        // Carga todos los items de una sola vez
        const res  = await fetch("/items");
        const todos = await res.json();

        renderStats(todos);
        renderRecientes(todos);
        renderTopRated(todos);
        actualizarHeader(todos);
        actualizarContadoresSidebar(todos);
        marcarSidebarActivo();
    } catch (e) {
        console.error("Error al cargar dashboard:", e);
    }
}

function actualizarHeader(items) {
    document.getElementById("total-count").textContent    = items.length;
    document.getElementById("categorias-count").textContent = new Set(items.map(i => i.tipo)).size;

    const rated = items.filter(i => i.valoracion > 0);
    const avg   = rated.length
        ? (rated.reduce((s, i) => s + i.valoracion, 0) / rated.length).toFixed(1)
        : "—";
    document.getElementById("avg-rating").textContent = avg;
}

function actualizarContadoresSidebar(items) {
    TIPOS.forEach(tipo => {
        const el = document.getElementById(`cnt-${tipo}`);
        if (el) el.textContent = items.filter(i => i.tipo === tipo).length;
    });
}

function renderStats(items) {
    const grid = document.getElementById("stats-grid");
    grid.innerHTML = "";

    TIPOS.forEach((tipo, idx) => {
        const cfg   = CONFIG[tipo];
        const lista = items.filter(i => i.tipo === tipo);
        const comp  = lista.filter(i => cfg.estadosCompletados?.includes(i.estado)).length;

        const a       = document.createElement("a");
        a.href        = `/pages/categoria.html?tipo=${tipo}`;
        a.className   = `stat-card d${Math.min(idx + 1, 6)}`;
        a.style.borderColor = `${cfg.color}30`;
        a.innerHTML   = `
            <div class="stat-card-icon">${cfg.label.split(" ")[0]}</div>
            <div class="stat-card-num" style="color:${cfg.color}">${lista.length}</div>
            <div class="stat-card-label">${cfg.label.slice(2)}</div>
            ${comp ? `<div style="font-size:0.68rem;color:var(--muted);margin-top:0.25rem;font-family:'JetBrains Mono',monospace">${comp} completados</div>` : ""}
        `;
        grid.appendChild(a);
    });
}

function renderRecientes(items) {
    const grid    = document.getElementById("recent-grid");
    const recents = [...items]
        .sort((a, b) => b.id - a.id)
        .slice(0, 12);

    document.getElementById("recent-count").textContent = `${recents.length} de ${items.length}`;
    grid.innerHTML = recents.length
        ? recents.map((item, i) => cardHTML(item, i)).join("")
        : `<div class="empty-state" style="grid-column:1/-1"><div class="big-icon">🌌</div><h3>Vacío por aquí</h3><p>Empieza añadiendo elementos desde cualquier categoría.</p></div>`;
}

function renderTopRated(items) {
    const grid = document.getElementById("top-grid");
    const top  = [...items]
        .filter(i => i.valoracion >= 4)
        .sort((a, b) => b.valoracion - a.valoracion)
        .slice(0, 12);

    grid.innerHTML = top.length
        ? top.map((item, i) => cardHTML(item, i)).join("")
        : `<div class="empty-state" style="grid-column:1/-1;padding:2rem"><p style="font-size:0.875rem">Aún no hay elementos con valoración alta.</p></div>`;
}

function cardHTML(item, idx) {
    const cfg    = CONFIG[item.tipo] ?? {};
    const color  = cfg.color ?? "#888";
    const emoji  = tipoEmoji(item.tipo);
    const poster = item.imagen
        ? `<img src="${esc(item.imagen)}" alt="${esc(item.titulo)}" loading="lazy" onerror="this.style.display='none'">`
        : `<span class="card-poster-placeholder">${emoji}</span>`;
    const delay  = `d${Math.min(idx + 1, 6)}`;

    const valColor = valoracionColor(item.valoracion);
    const valLabel = valoracionLabel(item.valoracion);
    const rating   = item.valoracion > 0
        ? `<div class="card-rating-badge" style="background:${valColor}25;color:${valColor}">${valLabel}</div>`
        : "";

    return `
    <article class="card ${delay}" onclick="window.location.href='/pages/categoria.html?tipo=${item.tipo}'">
      <div class="card-poster">
        ${poster}
        ${rating}
        <div class="card-estado-bar" style="background:${color}50"></div>
      </div>
      <div class="card-info">
        <div class="card-title">${esc(item.titulo)}</div>
        <div class="card-meta">${esc(item.tipo)} · ${item.fecha ?? "—"}</div>
      </div>
    </article>`;
}

function marcarSidebarActivo() {
    document.querySelectorAll(".platform-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("href") === "/" || btn.getAttribute("href") === "/index.html");
    });
}

function esc(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", cargarDashboard);
