// ╔══════════════════════════════════════════════════════════╗
// ║  index-dashboard.js — PÁGINA DE INICIO                  ║
// ╚══════════════════════════════════════════════════════════╝

const TIPOS = ["juegos", "peliculas", "series", "animes", "mangas", "comics", "libros"];
let todosLosItems = [];

function actualizarItemSilencioso(item) {
    const _u = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    if (_u && _u.rol !== "admin") {
        fetch(`/progreso/${_u.id}/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: item.estado, valoracion: item.valoracion, capituloActual: item.capituloActual, paginaActual: item.paginaActual, progresoManga: item.progresoManga, progreso: item.progreso })
        }).catch(err => console.error("Error al guardar progreso:", err));
    } else {
        fetch(`/items/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item)
        }).catch(err => console.error("Error al actualizar:", err));
    }
}

async function cargarDashboard() {
    try {
        const user    = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
        const esAdmin = !user || user.rol === "admin";

        const btnAnadir = document.getElementById("dash-btn-anadir");
        if (btnAnadir) btnAnadir.style.display = esAdmin ? "" : "none";

        let items;
        if (esAdmin) {
            const res = await fetch("/items");
            items = await res.json();
        } else {
            const res = await fetch(`/mi-dashboard/${user.id}`);
            items = await res.json();

            const progRes  = await fetch(`/progreso/${user.id}`);
            const progrMap = await progRes.json();

            items = items.map(item => {
                const p = progrMap[item.id];
                return {
                    ...item,
                    estado:         p?.estado          ?? null,
                    valoracion:     p?.valoracion       ?? 0,
                    capituloActual: p?.capituloActual   ?? 0,
                    paginaActual:   p?.paginaActual     ?? 0,
                    progresoManga:  p?.progresoManga ? (typeof p.progresoManga === "string" ? JSON.parse(p.progresoManga) : p.progresoManga) : { capituloActual: 0 },
                    progreso:       p?.progreso       ? (typeof p.progreso === "string" ? JSON.parse(p.progreso) : p.progreso) : { temporada: 1, capitulo: 0 },
                };
            });
        }

        todosLosItems = items;
        renderStats(todosLosItems);
        ordenarDashboard();
        actualizarHeader(todosLosItems);
        actualizarContadoresSidebar(todosLosItems);
        marcarSidebarActivo();
    } catch (e) {
        console.error("Error al cargar dashboard:", e);
    }
}

function ordenarDashboard() {
    const sort = document.getElementById("sort-index")?.value ?? "reciente";
    let lista  = [...todosLosItems];

    if      (sort === "reciente")    lista.sort((a, b) => b.id - a.id);
    else if (sort === "rating-desc") lista.sort((a, b) => (b.valoracion ?? 0) - (a.valoracion ?? 0));
    else if (sort === "rating-asc")  lista.sort((a, b) => (a.valoracion ?? 0) - (b.valoracion ?? 0));
    else if (sort === "titulo")      lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
    else if (sort === "categoria")   lista.sort((a, b) => TIPOS.indexOf(a.tipo) - TIPOS.indexOf(b.tipo));

    renderEnProgreso(lista, sort === "categoria");
    renderPausadosPendientes(lista, sort === "categoria");
}

function actualizarHeader(items) {
    document.getElementById("total-count").textContent      = items.length;
    document.getElementById("categorias-count").textContent = new Set(items.map(i => i.tipo)).size;
    const rated = items.filter(i => i.valoracion > 0);
    const avg   = rated.length ? (rated.reduce((s, i) => s + i.valoracion, 0) / rated.length).toFixed(1) : "—";
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
        const a = document.createElement("a");
        a.href      = `/pages/categoria.html?tipo=${tipo}`;
        a.className = `stat-card d${Math.min(idx + 1, 6)}`;
        a.style.borderColor = `${cfg.color}30`;
        a.innerHTML = `
            <div class="stat-card-top" style="background:${cfg.color}25;transition:background 0.2s"></div>
            <div class="stat-card-icon">${tipoSVG(tipo, 32)}</div>
            <div class="stat-card-num" style="color:${cfg.color}">${lista.length}</div>
            <div class="stat-card-label">${cfg.label}</div>
            ${comp ? `<div style="font-size:0.68rem;color:var(--muted);margin-top:0.25rem;font-family:'JetBrains Mono',monospace">${comp} completados</div>` : ""}`;
        a.addEventListener("mouseenter", () => a.querySelector(".stat-card-top").style.background = `${cfg.color}60`);
        a.addEventListener("mouseleave", () => a.querySelector(".stat-card-top").style.background = `${cfg.color}25`);
        grid.appendChild(a);
    });
}

const ESTADOS_ACTIVOS = ["Jugando", "Viendo", "Leyendo"];
const ESTADOS_PAUSA   = ["Pausado", "Pendiente"];

function renderConSeparadores(items) {
    let html = "", tipoActual = null, idx = 0;
    items.forEach(item => {
        if (item.tipo !== tipoActual) {
            tipoActual = item.tipo;
            const cfg  = CONFIG[item.tipo] ?? {};
            html += `<div style="grid-column:1/-1;display:flex;align-items:center;gap:0.75rem;margin-top:1.5rem;margin-bottom:0.25rem">
                ${tipoSVG(item.tipo, 18)}
                <span style="font-family:'Bebas Neue',cursive;font-size:1.1rem;letter-spacing:2px;color:${cfg.color}">${cfg.label.toUpperCase()}</span>
                <div style="flex:1;height:1px;background:${cfg.color}25"></div>
            </div>`;
        }
        html += cardHTML(item, idx++);
    });
    return html;
}

function renderEnProgreso(items, porCategoria = false) {
    const grid    = document.getElementById("recent-grid");
    const activos = items.filter(i => ESTADOS_ACTIVOS.includes(i.estado));
    document.getElementById("recent-count").textContent = `${activos.length} elementos`;
    if (!activos.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="big-icon">🎯</div><h3>Nada en progreso</h3><p>Empieza algo nuevo desde cualquier categoría.</p></div>`;
        return;
    }
    grid.innerHTML = porCategoria ? renderConSeparadores(activos) : activos.map((item, i) => cardHTML(item, i)).join("");
}

function renderPausadosPendientes(items, porCategoria = false) {
    const grid  = document.getElementById("top-grid");
    const pausa = items.filter(i => ESTADOS_PAUSA.includes(i.estado));
    if (!pausa.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:2rem"><p style="font-size:0.875rem">No tienes elementos pausados ni pendientes.</p></div>`;
        return;
    }
    grid.innerHTML = porCategoria ? renderConSeparadores(pausa) : pausa.map((item, i) => cardHTML(item, i)).join("");
}

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
    const rating   = item.valoracion > 0 ? `<div class="card-rating-badge" style="background:${valColor}25;color:${valColor}">${valLabel}</div>` : "";
    const _u = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    const esAdmin = !_u || _u.rol === "admin";

    return `
    <article class="card ${delay}" id="dash-card-${item.id}" onclick="abrirModalDesdeIndex(${item.id})">
      <div class="card-poster">
        ${poster}${rating}
        <div class="card-estado-bar" style="background:${color}50"></div>
      </div>
      <div class="card-info">
        <div class="card-title">${esc(item.titulo)}</div>
        <div class="card-meta">
          <span class="card-tag tag-estado">${esc(item.estado ?? "Sin estado")}</span>
          ${item.plataforma ? `<span class="card-tag tag-plataforma" style="background:${color}15;border-color:${color}40;color:${color}">${esc(item.plataforma)}</span>` : ""}
        </div>
        <div class="card-bottom">
          ${!esAdmin ? `
            <div class="card-actions">
              <button class="card-btn danger" title="Quitar de mi dashboard" onclick="event.stopPropagation();quitarDeDashboardIndex(${item.id}, this)">✕ Quitar</button>
            </div>` : ""}
        </div>
      </div>
    </article>`;
}

function marcarSidebarActivo() {
    document.querySelectorAll(".platform-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("href") === "/" || btn.getAttribute("href") === "/index.html");
    });
}

async function quitarDeDashboardIndex(itemId, btn) {
    const _u = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    if (!_u) return;
    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    try {
        const res = await fetch(`/mi-dashboard/${_u.id}/${itemId}`, { method: "DELETE" });
        if (res.ok) {
            todosLosItems = todosLosItems.filter(i => i.id !== itemId);
            const card = document.getElementById(`dash-card-${itemId}`);
            if (card) card.remove();
            actualizarHeader(todosLosItems);
            actualizarContadoresSidebar(todosLosItems);
            renderStats(todosLosItems);
        } else {
            if (btn) { btn.disabled = false; btn.textContent = "✕ Quitar"; }
        }
    } catch {
        if (btn) { btn.disabled = false; btn.textContent = "✕ Quitar"; }
    }
}

document.addEventListener("DOMContentLoaded", cargarDashboard);
