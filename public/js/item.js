// ╔══════════════════════════════════════════════════════════╗
// ║  item.js — layout 2 columnas (póster izq, info der)    ║
// ╚══════════════════════════════════════════════════════════╝

function esc(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function normalizarPlataformas(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string" && val !== "null") return [val];
  return [];
}
function tipoSVG(tipo, size = 16) {
  const svgs = {
    juegos:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4"/><circle cx="16" cy="11" r="1" fill="currentColor"/><circle cx="18" cy="13" r="1" fill="currentColor"/></svg>`,
    peliculas:`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5"/></svg>`,
    series:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>`,
    animes:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="6" x2="22" y2="6"/><line x1="4" y1="3" x2="20" y2="3"/><line x1="6" y1="6" x2="6" y2="20"/><line x1="18" y1="6" x2="18" y2="20"/><line x1="6" y1="9" x2="18" y2="9"/></svg>`,
    mangas:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    comics:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    libros:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  };
  return svgs[tipo] ?? "";
}

const PLAT_COLORS = {
  "Netflix":"#e50914","Steam":"#1b2838","Prime Video":"#00a8e0",
  "Disney+":"#113ccf","HBO Max":"#5822b4","Apple TV+":"#555",
  "Crunchyroll":"#f47521","Spotify":"#1db954","YouTube":"#ff0000",
  "Epic Games":"#2d2d2d","PlayStation":"#003087","PlayStation 5":"#003087",
  "PlayStation 4":"#003087","Xbox":"#107c10","Xbox Series X/S":"#107c10",
  "Xbox One":"#107c10","Nintendo":"#e4000f","Nintendo Switch":"#e4000f",
  "GOG":"#86328a","Funimation":"#410099","HIDIVE":"#00baff",
  "MangaPlus":"#e40026","Webtoon":"#00dc64","Kindle":"#ff9900",
  "Audible":"#f8991d","Kobo":"#00aee8"
};
function platColor(n) { return PLAT_COLORS[n] ?? "#6b7280"; }

const params    = new URLSearchParams(window.location.search);
const itemId    = parseInt(params.get("id"));
let   item      = null;
let   cfg       = null;
let   tabActual = 0;
let   modoSaga  = "publicacion";

// ── Carga ─────────────────────────────────────────────────

async function cargarItem() {
  try {
    const res = await fetch(`/items/id/${itemId}`);
    if (!res.ok) throw new Error();
    item = await res.json();
    cfg  = CONFIG[item.tipo];
    if (!cfg) throw new Error();
    renderItem();
  } catch {
    document.getElementById("item-loading").innerHTML = `
      <div style="font-size:2.5rem">🔍</div>
      <div style="color:var(--muted)">Item no encontrado</div>
      <a href="/" style="color:var(--accent);font-size:0.82rem;margin-top:0.5rem">← Volver al inicio</a>`;
  }
}

// ── Render principal ──────────────────────────────────────

function renderItem() {
  const color = cfg.color ?? "#888";
  document.title = `NEXUS — ${item.titulo}`;

  // Fondo blur de fondo de página
  const bg = document.getElementById("item-bg");
  if (item.imagen) { bg.style.backgroundImage = `url('${esc(item.imagen)}')`; bg.style.opacity = "1"; }

  // Link de volver
  const itemParams = new URLSearchParams(window.location.search);
  const origenParam = itemParams.get("origen");
  if (origenParam) {
      // Origen explícito en la URL — siempre prioritario
      sessionStorage.setItem("nexus_item_origen", decodeURIComponent(origenParam));
  } else {
      // Fallback: usar referrer
      const referrer = document.referrer;
      if (referrer.includes("categoria.html") || referrer.includes("categoria-index.html") || referrer.includes("dashboard.html")) {
          sessionStorage.setItem("nexus_item_origen", referrer);
      } else if (!referrer.includes("item.html")) {
          sessionStorage.removeItem("nexus_item_origen");
      }
  }
  const origen = sessionStorage.getItem("nexus_item_origen");
  if (origen) {
      document.getElementById("back-btn").href = origen;
  }

  // Póster
  const poster = document.getElementById("item-poster");
  poster.style.borderColor = color;
  poster.innerHTML = item.imagen
    ? `<img src="${esc(item.imagen)}" alt="${esc(item.titulo)}">`
    : `<span>${cfg.label.split(" ")[0]}</span>`;

  renderColumnaIzquierda(color);
  renderColumnaDerecha(color);

  document.getElementById("item-loading").style.display = "none";
  document.getElementById("item-body").style.display    = "";
}

// ════════════════════════════════════════════════════════
//  COLUMNA IZQUIERDA: póster + tarjeta de info secundaria
// ════════════════════════════════════════════════════════

function renderColumnaIzquierda(color) {
  const col = document.getElementById("item-left-col");

  // Páginas debajo del póster (solo libros)
  if (cfg.usaPaginas && item.paginasTotales) {
    const paginasEl = document.createElement("div");
    paginasEl.className = "item-left-card";
    paginasEl.innerHTML = `
      <div class="item-left-card-row" style="text-align:center">
        <div class="item-left-card-label">Páginas</div>
        <span style="font-family:'Bebas Neue',cursive;font-size:1.8rem;letter-spacing:1px;color:${color};line-height:1">${item.paginasTotales}</span>
      </div>`;
    document.getElementById("item-poster").insertAdjacentElement("afterend", paginasEl);
  }

  const generos = Array.isArray(item.generos) ? item.generos : [];
  const plats   = normalizarPlataformas(item.plataforma);
  const links   = Array.isArray(item.links) ? item.links : [];

  const hayMeta = generos.length || plats.length || links.length;
  if (!hayMeta && !needsDashboard()) return;

  const card = document.createElement("div");
  card.className = "item-left-card";

  // Géneros
  if (generos.length) {
    const chips = generos.map(g =>
      `<span class="item-chip" style="border-color:${color}40;background:${color}0d;color:${color}">${esc(g)}</span>`
    ).join("");
    card.insertAdjacentHTML("beforeend", `
      <div class="item-left-card-row">
        <div class="item-left-card-label">Géneros</div>
        <div class="item-chips-wrap">${chips}</div>
      </div>`);
  }

  // Plataformas
  if (plats.length) {
    const chips = plats.map(p =>
      `<span class="item-chip" style="border-color:${color}35;background:${color}08;color:${color}bb">${esc(p)}</span>`
    ).join("");
    card.insertAdjacentHTML("beforeend", `
      <div class="item-left-card-row">
        <div class="item-left-card-label">Disponible en</div>
        <div class="item-chips-wrap">${chips}</div>
      </div>`);
  }

  // Links
  if (links.length) {
    const linksHTML = links.map(l => {
      const pc = platColor(l.plataforma);
      return `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="item-link-btn"
        style="border-color:${pc}40;background:${pc}0d"
        onmouseover="this.style.background='${pc}22';this.style.borderColor='${pc}70'"
        onmouseout="this.style.background='${pc}0d';this.style.borderColor='${pc}40'">
        <span style="width:7px;height:7px;border-radius:50%;background:${pc};flex-shrink:0"></span>
        <span style="flex:1;color:var(--text);font-weight:500">${esc(l.nombre ?? l.plataforma)}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--muted);flex-shrink:0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>`;
    }).join("");
    card.insertAdjacentHTML("beforeend", `
      <div class="item-left-card-row">
        <div class="item-left-card-label">Dónde verlo / Dónde comprarlo</div>
        ${linksHTML}
      </div>`);
  }

  // Dashboard btn — se inserta ANTES de la tarjeta de info
  const _u = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
  if (_u && _u.rol !== "admin") {
    const wrap = document.createElement("div");
    wrap.id = "item-btn-dashboard-wrap";
    wrap.innerHTML = `<button id="item-btn-dashboard" onclick="agregarAlDashboard()"
        style="width:100%;padding:0.6rem 1rem;background:transparent;border:1px solid ${color}35;border-radius:12px;color:${color};cursor:pointer;font-size:0.8rem;display:flex;align-items:center;justify-content:center;gap:0.5rem;transition:background 0.18s;font-family:'DM Sans',sans-serif"
        onmouseover="this.style.background='${color}10'" onmouseout="this.style.background='transparent'">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Añadir a mi dashboard</button>`;
    col.appendChild(wrap);

    // Verificar si ya está agregado y actualizar el botón
    fetch(`/mi-dashboard/${_u.id}`).then(r => r.json()).then(dashItems => {
      if (dashItems.some(d => d.id === item.id)) {
        wrap.innerHTML = `<div style="padding:0.65rem 1rem;background:#22c55e0d;border:1px solid #22c55e35;border-radius:12px;color:#22c55e;font-size:0.8rem;display:flex;align-items:center;gap:0.5rem">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            Ya en tu dashboard</div>`;
      }
    }).catch(() => {});
  }

  col.appendChild(card);
}

function needsDashboard() {
  try { const u = JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); return u && u.rol !== "admin"; } catch { return false; }
}

// ════════════════════════════════════════════════════════
//  COLUMNA DERECHA: título + saga + progreso + extra
// ════════════════════════════════════════════════════════

function renderColumnaDerecha(color) {
  const col = document.getElementById("item-right-col");
  col.innerHTML = "";

  // ── Cabecera: tipo + título + creador + año ───────────
  // DESPUÉS:
  const header = document.createElement("div");
  header.className = "item-header-block";

  const bloques = [];
  if (item.anio)
    bloques.push(`<div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.52rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted);margin-bottom:0.15rem">Año de publicación</div>
      <span style="font-family:'Bebas Neue',cursive;font-size:2rem;color:${color};letter-spacing:2px;line-height:1">${esc(String(item.anio))}</span>
    </div>`);
  if (item.creador)
    bloques.push(`<div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.52rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted);margin-bottom:0.15rem">${esc(cfg.creadorLabel ?? "Creador")}</div>
      <span style="font-family:'Bebas Neue',cursive;font-size:2rem;color:var(--text);letter-spacing:1px;line-height:1">${esc(item.creador)}</span>
    </div>`);
  if (item.duracion)
    bloques.push(`<div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.52rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted);margin-bottom:0.15rem">Duración</div>
      <span style="font-family:'Bebas Neue',cursive;font-size:2rem;color:var(--text);letter-spacing:1px;line-height:1">${esc(item.duracion)}</span>
    </div>`);
  if (item.estadoSerie && item.estadoSerie !== "null")
    bloques.push(`<div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.52rem;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted);margin-bottom:0.15rem">Estado</div>
      <span style="font-family:'Bebas Neue',cursive;font-size:2rem;color:var(--text);letter-spacing:1px;line-height:1">${esc(item.estadoSerie)}</span>
    </div>`);

  header.innerHTML = `
    <div class="item-tipo-label" style="color:${color}">
      ${tipoSVG(item.tipo, 15)}
      <span>${cfg.label.slice(2).trim()}</span>
    </div>
    <h1 class="item-titulo">${esc(item.titulo)}</h1>
    ${bloques.length ? `<div style="display:flex;gap:1.5rem;margin-top:0.5rem;flex-wrap:wrap">${bloques.join("")}</div>` : ""}
  `;
  col.appendChild(header);

  // ── Saga ──────────────────────────────────────────────

  if (cfg.usaDlcs && item.dlcs?.length && item.tipo === "juegos") col.appendChild(buildSeccionDlcs(color));

  

  // ── Progreso ──────────────────────────────────────────
  if (cfg.usaEpisodios && item.temporadas?.length)  col.appendChild(buildSeccionEpisodios(color));
  if (cfg.usaTomos && item.tomos?.length)            col.appendChild(buildSeccionManga(color, undefined));
  if (cfg.usaCapitulos && item.capitulosTotales)     col.appendChild(buildSeccionCapitulos(color));

  // ── Saga ──────────────────────────────────────────────
  if (item.saga) renderSeccionSaga(col, color);

  // ── DLCs (resto de categorías: después del progreso) ──
  if (cfg.usaDlcs && item.dlcs?.length && item.tipo !== "juegos") col.appendChild(buildSeccionDlcs(color));

  // ── Relacionados ──────────────────────────────────────
  if (item.relacionados?.length) col.appendChild(buildSeccionRelacionados(color));
}

// ── Saga — carrusel horizontal ────────────────────────────

async function renderSeccionSaga(col, color) {
  const sec = document.createElement("div");
  sec.className = "item-section"; sec.id = "sec-saga";
  sec.innerHTML = `
    <div class="item-saga-header">
      <div class="item-section-label" style="margin-bottom:0">
        Saga: <span style="color:${color};letter-spacing:0;font-size:0.72rem;font-weight:600">${esc(item.saga)}</span>
      </div>
      <div class="item-saga-toggle">
        <button id="saga-btn-pub" class="item-saga-btn activo"
          style="background:${color};color:#000;border-color:${color}"
          onclick="cambiarModoSaga('publicacion')">Publicación</button>
        <button id="saga-btn-cron" class="item-saga-btn"
          onclick="cambiarModoSaga('cronologico')">Cronológico</button>
      </div>
    </div>
    <div class="item-saga-carrusel" id="saga-carrusel">
      <div style="color:var(--muted);font-size:0.78rem;padding:0.25rem 0">Cargando saga...</div>
    </div>`;
  col.appendChild(sec);

  try {
    const res  = await fetch(`/items`);
    const todo = await res.json();
    window._sagaCache = todo.filter(i =>
      i.saga === item.saga && (i.ordenPublicacion != null || i.ordenCronologico != null)
    );
    renderCarruselSaga(window._sagaCache, color);
  } catch {
    const c = document.getElementById("saga-carrusel");
    if (c) c.innerHTML = `<div style="color:var(--muted);font-size:0.78rem">No se pudo cargar la saga</div>`;
  }
}

function renderCarruselSaga(items, color) {
  const carrusel = document.getElementById("saga-carrusel");
  if (!carrusel) return;

  const campo    = modoSaga === "cronologico" ? "ordenCronologico" : "ordenPublicacion";
  const ordenados = [...items].filter(i => i[campo] != null).sort((a, b) => a[campo] - b[campo]);

  if (!ordenados.length) {
    carrusel.innerHTML = `<div style="color:var(--muted);font-size:0.78rem">Sin entradas con orden definido</div>`;
    return;
  }

  carrusel.innerHTML = ordenados.map(entry => {
    const esActual = entry.id === item.id;
    const cfg2     = CONFIG[entry.tipo];
    const c2       = cfg2?.color ?? "#888";
    const num      = entry[campo];

    return `<div class="saga-card ${esActual ? "saga-card-actual" : ""}"
        onclick="${esActual ? "" : `window.location.href='/pages/item.html?id=${entry.id}'`}">
        <div class="saga-poster" style="border-color:${esActual ? color : "transparent"}">
          ${entry.imagen
            ? `<img src="${esc(entry.imagen)}" alt="${esc(entry.titulo)}">`
            : `<span style="color:${c2}">${cfg2?.label.split(" ")[0] ?? "?"}</span>`}
          <div class="saga-num-badge">${num}</div>
          ${esActual ? `<div class="saga-aqui-badge" style="color:${color};border-color:${color}50">← aquí</div>` : ""}
        </div>
        <div class="saga-info">
          <div class="saga-tipo-label" style="color:${c2}">${cfg2?.label.slice(2).trim() ?? entry.tipo}</div>
          <div class="saga-titulo" style="color:${esActual ? color : "var(--text)"}">${esc(entry.titulo)}</div>
          ${entry.anio ? `<div class="saga-anio">${entry.anio}</div>` : ""}
        </div>
      </div>`;
  }).join("");

  // Scroll al item actual si no está al inicio
  setTimeout(() => {
    const idx = ordenados.findIndex(e => e.id === item.id);
    if (idx > 2) {
      const cards = carrusel.querySelectorAll(".saga-card");
      cards[idx]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, 120);
}

function cambiarModoSaga(modo) {
  modoSaga = modo;
  const color   = cfg.color ?? "#888";
  const btnPub  = document.getElementById("saga-btn-pub");
  const btnCron = document.getElementById("saga-btn-cron");
  [btnPub, btnCron].forEach(b => { if(b){ b.classList.remove("activo"); b.style.background=""; b.style.color=""; b.style.borderColor=""; } });
  const activo = modo === "publicacion" ? btnPub : btnCron;
  if (activo) { activo.classList.add("activo"); activo.style.background=color; activo.style.color="#000"; activo.style.borderColor=color; }

  if (window._sagaCache) renderCarruselSaga(window._sagaCache, color);
  else fetch(`/items`).then(r=>r.json()).then(todo => {
    window._sagaCache = todo.filter(i => i.saga===item.saga && (i.ordenPublicacion!=null||i.ordenCronologico!=null));
    renderCarruselSaga(window._sagaCache, color);
  });
}

// ── Episodios ─────────────────────────────────────────────

function buildSeccionEpisodios(color) {
  const sec = document.createElement("div");
  sec.className = "item-section"; sec.id = "sec-episodios";
  sec.innerHTML = buildEpisodiosInner(color, tabActual);
  return sec;
}

function buildEpisodiosInner(color, idx) {
  const temps = item.temporadas ?? [];
  const tabsHTML = temps.map((t, i) => {
    const label = t.tipo==="ova"?`OVA ${t.numero}`:t.tipo==="especial"?`ESP ${t.numero}`:t.tipo==="pelicula"?`PEL ${t.numero}`:t.tipo==="ona"?`ONA ${t.numero}`:`T${t.numero}`;
    const a = i===idx;
    return `<button class="item-tab ${a?"activo":""}" style="${a?`background:${color};border-color:${color};color:#000`:""}" onclick="cambiarTabTemp(${i})">${label} <span style="font-size:0.54rem;opacity:0.7"></span></button>`;
  }).join("");
  const temp = temps[idx] ?? temps[0];
  const dotsHTML = temp ? Array.from({length:temp.capitulos},(_,j)=>{
    const n=j+1;
    return `<div class="item-ep-dot" title="Ep ${n}">${n}</div>`;
  }).join("") : "";
  return `<div class="item-section-label">Temporadas</div>
    <div class="item-tabs">${tabsHTML}</div>
    ${temp?`<div style="font-family:'Bebas Neue',cursive;font-size:1.1rem;letter-spacing:1px;color:${color};margin-bottom:0.6rem">
      ${temp.tipo==="ova"?`OVA ${temp.numero}`:temp.tipo==="especial"?`Especial ${temp.numero}`:temp.tipo==="pelicula"?`Película ${temp.numero}`:temp.tipo==="ona"?`ONA ${temp.numero}`:`Temporada ${temp.numero}`}
      <span style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--muted);font-weight:400;margin-left:0.4rem"></span>
    </div><div class="item-eps-grid">${dotsHTML}</div>`:""}`;
}

function cambiarTabTemp(idx) {
  tabActual = idx;
  const sec = document.getElementById("sec-episodios");
  if (!sec) return;
  sec.innerHTML = buildEpisodiosInner(cfg.color??"#888", idx);
  sec.querySelectorAll(".item-ep-dot").forEach((el, i) => el.style.setProperty("--i", i));
}

// ── Manga / Tomos ─────────────────────────────────────────

function buildSeccionManga(color, tomoTabActual) {
  const tomos = item.tomos ?? [];
  const capActual = item.progresoManga?.capituloActual ?? 0;
  if (tomoTabActual === undefined) {
    tomoTabActual = tomos.findIndex(t => capActual >= t.capituloInicio && capActual <= t.capituloFin);
    if (tomoTabActual === -1) tomoTabActual = 0;
  }
  const sec = document.createElement("div");
  sec.className = "item-section"; sec.id = "sec-manga";
  sec.innerHTML = buildMangaInner(color, tomoTabActual);
  return sec;
}

function buildMangaInner(color, idx) {
  const tomos      = item.tomos ?? [];
  const tomoLabel  = cfg.tomoLabel     ?? "T";
  const tomoNombre = cfg.tomoLabel     ? "Volumen" : "Tomo";
  const capLabel   = cfg.capituloLabel ?? "Capitulos";
  const secLabel   = cfg.tomoLabel     ? "Volúmenes" : "Tomos";
  const ta = tomos[idx];
  const tabsHTML = tomos.map((t,i)=>{const a=i===idx;return `<button class="item-tab ${a?"activo":""}" style="${a?`background:${color};border-color:${color};color:#000`:""}" onclick="cambiarTabTomo(${i})">${tomoLabel}${t.numero} <span style="font-size:0.54rem;opacity:0.7"></span></button>`;}).join("");
  const dotsHTML = ta ? Array.from({length: ta.capituloFin-ta.capituloInicio+1},(_,i)=>{
    const n=ta.capituloInicio+i;
    return `<div class="item-ep-dot" title="${capLabel} ${n}">${n}</div>`;
  }).join("") : "";
  return `<div class="item-section-label">${secLabel}</div><div class="item-tabs">${tabsHTML}</div>${ta?`<div style="font-family:'Bebas Neue',cursive;font-size:1.1rem;letter-spacing:1px;color:${color};margin-bottom:0.6rem">${tomoNombre} ${ta.numero}<span style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--muted);font-weight:400;margin-left:0.4rem"><div>${capLabel}</div></span></div><div class="item-eps-grid">${dotsHTML}</div>`:""}`;
}

function cambiarTabTomo(idx) {
  const sec = document.getElementById("sec-manga");
  if (!sec) return;
  sec.innerHTML = buildMangaInner(cfg.color??"#888", idx);
  sec.querySelectorAll(".item-ep-dot").forEach((el, i) => el.style.setProperty("--i", i));
}

// ── Capítulos ─────────────────────────────────────────────

function buildSeccionCapitulos(color) {
  const sec = document.createElement("div");
  sec.className = "item-section"; sec.id = "sec-capitulos";
  sec.innerHTML = buildCapsInner(color, null);
  return sec;
}

function buildCapsInner(color, grupoIdx) {
  const total = item.capitulosTotales ?? 0;
  const GRUPO = 10, grupos = Math.ceil(total/GRUPO);
  const gi = grupoIdx ?? 0;
  const desde = gi*GRUPO+1, hasta = Math.min((gi+1)*GRUPO, total);
  const tabsHTML = grupos>1 ? Array.from({length:grupos},(_,i)=>{const d=i*GRUPO+1,h=Math.min((i+1)*GRUPO,total),a=i===gi;return `<button class="item-tab ${a?"activo":""}" style="${a?`background:${color};border-color:${color};color:#000`:""}" onclick="cambiarGrupoCaps(${i})">${d}–${h}</button>`;}).join("") : "";
  const dotsHTML = Array.from({length:hasta-desde+1},(_,i)=>{
    const n=desde+i;
    return `<div class="item-ep-dot" title="Cap. ${n}">${n}</div>`;
  }).join("");
  return `<div class="item-section-label">Capítulos — ${total} en total</div>${tabsHTML?`<div class="item-tabs">${tabsHTML}</div>`:""}<div class="item-eps-grid" id="caps-dots">${dotsHTML}</div>`;
}

function cambiarGrupoCaps(idx) {
  const sec = document.getElementById("sec-capitulos");
  if (sec) sec.innerHTML = buildCapsInner(cfg.color??"#888", idx);
}

// ── Páginas (libros) — solo número total ──────────────────

function buildSeccionPaginas(color) {
  const total = item.paginasTotales ?? 0;
  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.innerHTML = `
    <div class="item-section-label">Páginas</div>
    <div class="item-paginas-stat">
      <span style="font-family:'Bebas Neue',cursive;font-size:2.4rem;letter-spacing:1px;color:${color};line-height:1">${total}</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted)">páginas</span>
    </div>`;
  return sec;
}

// ── DLCs ─────────────────────────────────────────────────

function buildSeccionDlcs(color) {
  const visibles = item.dlcs.filter(d =>((d.estado??"").toLowerCase().trim()));
  const sec = document.createElement("div");
  sec.className = "item-section"; sec.id = "sec-dlcs";
  if (!visibles.length) { sec.style.display="none"; return sec; }
  const rows = visibles.map(d =>
    `<div class="item-dlc-row">
      <span class="item-dlc-tipo">${esc(d.tipo??"DLC")}</span>
      <span class="item-dlc-nombre">${esc(d.nombre)}</span>
    </div>`
  ).join("");
  sec.innerHTML = `<div class="item-section-label">DLCs / Ediciones</div>${rows}`;
  return sec;
}

// ── Relacionados ──────────────────────────────────────────

function buildSeccionRelacionados(color) {
  const sec = document.createElement("div");
  sec.className = "item-section"; sec.id = "sec-relacionados";
  sec.innerHTML = `
    <div class="item-section-label">Relacionados</div>
    <div class="item-rel-grid" id="rel-wrap">
      <div style="color:var(--muted);font-size:0.78rem;grid-column:1/-1">Cargando...</div>
    </div>`;

  fetch(`/items/bulk/${item.relacionados.join(",")}`)
    .then(r => r.json())
    .then(rels => {
      const wrap = document.getElementById("rel-wrap"); if (!wrap) return;
      if (!rels.length) { wrap.innerHTML=`<div style="color:var(--muted);font-size:0.78rem;grid-column:1/-1">Sin items relacionados</div>`; return; }
      wrap.innerHTML = rels.map(r => {
        const c2 = CONFIG[r.tipo], col2 = c2?.color??"#888";
        return `<div onclick="window.location.href='/pages/item.html?id=${r.id}'"
          style="display:flex;flex-direction:column;background:var(--bg);border:1px solid var(--border);border-radius:10px;overflow:hidden;cursor:pointer;transition:border-color 0.18s,transform 0.15s"
          onmouseover="this.style.borderColor='${col2}';this.style.transform='translateY(-3px)'"
          onmouseout="this.style.borderColor='var(--border)';this.style.transform=''">
          <div style="aspect-ratio:2/3;background:var(--surface2);overflow:hidden;position:relative;flex-shrink:0">
            ${r.imagen?`<img src="${esc(r.imagen)}" style="width:100%;height:100%;object-fit:cover;display:block">`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem">${c2?.label.split(" ")[0]??"?"}</div>`}
            <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:${col2}"></div>
          </div>
          <div style="padding:0.45rem 0.55rem">
            <div style="font-size:0.58rem;color:${col2};font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.12rem">${c2?.label.slice(2).trim()??r.tipo}</div>
            <div style="font-size:0.75rem;font-weight:600;line-height:1.2;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(r.titulo)}</div>
          </div>
        </div>`;
      }).join("");
    })
    .catch(() => { const w=document.getElementById("rel-wrap"); if(w) w.innerHTML=`<div style="color:var(--muted);font-size:0.78rem;grid-column:1/-1">Error cargando</div>`; });

  return sec;
}

// ── Dashboard ─────────────────────────────────────────────

async function agregarAlDashboard() {
  const _u = (() => { try { return JSON.parse(localStorage.getItem("nexus_user")) || JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
  if (!_u) return;
  const btn = document.getElementById("item-btn-dashboard"); if (btn) btn.disabled = true;
  try {
    const res = await fetch("/mi-dashboard", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId:_u.id,itemId:item.id}) });
    if (res.ok) {
      const wrap = document.getElementById("item-btn-dashboard-wrap");
      if (wrap) wrap.innerHTML = `<div style="padding:0.65rem 1rem;background:#22c55e0d;border:1px solid #22c55e35;border-radius:12px;color:#22c55e;font-size:0.8rem;display:flex;align-items:center;gap:0.5rem"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>Ya en tu dashboard</div>`;
    }
  } catch { if (btn) btn.disabled = false; }
}

document.addEventListener("DOMContentLoaded", cargarItem);