// ╔══════════════════════════════════════════════════════════╗
// ║  item.js — PÁGINA DE DETALLE DE UN ITEM                 ║
// ║  Carga un item por ID y muestra toda su información     ║
// ╚══════════════════════════════════════════════════════════╝

function esc(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function tipoSVGs() {
  return {
    juegos:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4"/><circle cx="16" cy="11" r="1" fill="currentColor"/><circle cx="18" cy="13" r="1" fill="currentColor"/></svg>`,
    peliculas:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5"/></svg>`,
    series:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>`,
    animes:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="6" x2="22" y2="6"/><line x1="4" y1="3" x2="20" y2="3"/><line x1="6" y1="6" x2="6" y2="20"/><line x1="18" y1="6" x2="18" y2="20"/><line x1="6" y1="9" x2="18" y2="9"/></svg>`,
    mangas:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    comics:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8M8 14h4"/></svg>`,
    libros:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  };
}

const params  = new URLSearchParams(window.location.search);
const itemId  = parseInt(params.get("id"));
let   item    = null;
let   cfg     = null;
let   tabActual = 0;

async function cargarItem() {
  try {
    const res = await fetch(`/items/id/${itemId}`);
    if (!res.ok) throw new Error("No encontrado");
    item = await res.json();
    cfg  = CONFIG[item.tipo];
    if (!cfg) throw new Error("Tipo inválido");
    renderItem();
  } catch(e) {
    document.getElementById("item-loading").innerHTML = `
      <div style="font-size:2.5rem">🔍</div>
      <div>Item no encontrado</div>
      <a href="/" style="color:var(--accent);font-size:0.82rem">← Volver al inicio</a>`;
  }
}

function renderItem() {
  const color = cfg.color ?? "#888";
  document.title = `NEXUS — ${item.titulo}`;

  const bg = document.getElementById("item-bg");
  if (item.imagen) { bg.style.backgroundImage = `url('${esc(item.imagen)}')`;  bg.style.opacity = "1"; }

  const ref = document.referrer;
  const backBtn = document.getElementById("back-btn");
  if (ref.includes("categoria.html")) {
    backBtn.href = ref;
    backBtn.querySelector("svg").insertAdjacentHTML("afterend", ` ${cfg.label.slice(2)}`);
  } else {
    backBtn.href = "/";
  }

  const poster = document.getElementById("item-poster");
  poster.style.borderColor = color;
  poster.innerHTML = item.imagen
    ? `<img src="${esc(item.imagen)}" alt="${esc(item.titulo)}">`
    : `<span style="font-size:3.5rem">${cfg.label.split(" ")[0]}</span>`;

  const selEstado = document.getElementById("item-estado");
  selEstado.innerHTML = cfg.estados.map(e =>
    `<option value="${e}" ${e === item.estado ? "selected" : ""}>${e}</option>`
  ).join("");
  selEstado.style.borderColor = color;

  document.getElementById("item-valoracion").value = item.valoracion ?? 0;

  const btn        = document.getElementById("item-btn-completar");
  const estadoComp = cfg.estadosCompletados?.[0];
  const yaCompleto = cfg.estadosCompletados?.includes(item.estado);
  btn.textContent      = yaCompleto ? "✓ Completado" : `Marcar como ${estadoComp}`;
  btn.style.background  = yaCompleto ? color : "transparent";
  btn.style.color       = yaCompleto ? "#000" : color;
  btn.style.borderColor = color;

  renderInfoCol(color);

  document.getElementById("item-loading").style.display = "none";
  document.getElementById("item-body").style.display    = "";
}

function renderInfoCol(color) {
  const col = document.getElementById("item-info-col");
  col.innerHTML = "";

  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const metaTags = [];
  if (item.fecha) {
    const [y,m,d] = item.fecha.split("-");
    metaTags.push(`<span class="me-tag me-tag-fecha">${parseInt(d)} ${meses[parseInt(m)-1]} ${y}</span>`);
  }
  if (item.plataforma && item.plataforma !== "null")
    metaTags.push(`<span class="me-tag" style="background:${color}15;border-color:${color}40;color:${color}">${esc(item.plataforma)}</span>`);
  if (item.estadoSerie && item.estadoSerie !== "null")
    metaTags.push(`<span class="me-tag me-tag-serie">${esc(item.estadoSerie)}</span>`);
  if (item.estado)
    metaTags.push(`<span class="me-tag me-tag-estado">${esc(item.estado)}</span>`);
  if (cfg.usalogros && item.logros) {
    const emoji = item.logros === "Todos completados" ? "🏆 " : "";
    metaTags.push(`<span class="me-tag">${emoji}${esc(item.logros)}</span>`);
  }

  col.insertAdjacentHTML("beforeend", `
    <div>
      <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;color:${color};opacity:0.7;font-size:0.8rem">
        ${tipoSVGs()[item.tipo] ?? ""}
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.68rem;letter-spacing:0.08em;text-transform:uppercase">${cfg.label.slice(2)}</span>
      </div>
      <h1 class="item-titulo">${esc(item.titulo)}</h1>
      <div class="item-meta" style="margin-top:0.6rem">${metaTags.join("")}</div>
    </div>
  `);

  if (cfg.usaEpisodios && item.temporadas?.length)   renderSeccionEpisodios(col, color);
  if (cfg.usaTomos && item.tomos?.length)             renderSeccionManga(col, color);
  if (cfg.usaCapitulos && item.capitulosTotales)      renderSeccionCapitulos(col, color);
  if (cfg.usaPaginas && item.paginasTotales)          renderSeccionPaginas(col, color);
  if (cfg.usaDlcs && item.dlcs?.length)               renderSeccionDlcs(col, color);
}

function renderSeccionEpisodios(col, color) {
  const temps = item.temporadas ?? [];
  const temp  = temps[tabActual] ?? temps[0];
  if (!temp) return;

  const epActual = item.progreso?.episodio ?? 0;
  const epTotal  = temp.episodios ?? 0;
  const pct      = epTotal > 0 ? Math.min(100, Math.round((epActual / epTotal) * 100)) : 0;

  const tabsHTML = temps.map((t, i) => `
    <button class="item-tab ${i === tabActual ? "activo" : ""}"
      style="${i === tabActual ? `background:${color};border-color:${color};color:#000` : ""}"
      onclick="cambiarTabTemp(${i})">${t.nombre ?? `T${i+1}`}</button>
  `).join("");

  const dots = Array.from({length: epTotal}, (_, i) => {
    const visto = i < epActual;
    return `<div class="item-ep-dot ${visto ? "visto" : ""}"
      style="${visto ? `background:${color};` : ""}"
      title="Ep ${i+1}">${i+1}</div>`;
  }).join("");

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.id = "sec-episodios";
  sec.innerHTML = `
    <div class="item-section-label">Progreso</div>
    <div class="item-progreso-header">
      <span>Temporada ${temp.nombre ?? tabActual+1} · Ep <span id="ep-num">${epActual}</span>/${epTotal}</span>
      <div class="item-prog-btns">
        <button class="item-prog-btn" onclick="cambiarEp(-1)" style="border-color:${color}">−</button>
        <span class="item-prog-num" id="ep-num-display">${epActual}</span>
        <button class="item-prog-btn" onclick="cambiarEp(1)" style="border-color:${color}">+</button>
      </div>
    </div>
    <div class="item-progress-wrap">
      <div class="item-progress-fill" id="ep-barra" style="width:${pct}%;background:${color}"></div>
    </div>
    <div class="item-tabs">${tabsHTML}</div>
    <div class="item-eps-grid" id="eps-grid">${dots}</div>
  `;
  col.appendChild(sec);
}

function cambiarTabTemp(idx) {
  tabActual = idx;
  const sec = document.getElementById("sec-episodios");
  if (sec) sec.remove();
  renderSeccionEpisodios(document.getElementById("item-info-col"), cfg.color);
}

function cambiarEp(delta) {
  const temp   = (item.temporadas ?? [])[tabActual];
  if (!temp) return;
  const max    = temp.episodios ?? 0;
  const actual = item.progreso?.episodio ?? 0;
  const nuevo  = Math.max(0, Math.min(max, actual + delta));
  if (nuevo === actual) return;
  if (!item.progreso) item.progreso = {};
  item.progreso.episodio  = nuevo;
  item.progreso.temporada = tabActual + 1;
  guardarCampo("progreso", item.progreso);
  const sec = document.getElementById("sec-episodios");
  if (sec) sec.remove();
  renderSeccionEpisodios(document.getElementById("item-info-col"), cfg.color);
}

function renderSeccionManga(col, color) {
  const tomos     = item.tomos ?? [];
  const capActual = item.progresoManga?.capituloActual ?? 0;
  const capMax    = tomos[tomos.length-1]?.capituloFin ?? 0;
  const pctGlobal = capMax > 0 ? Math.min(100, Math.round((capActual / capMax) * 100)) : 0;

  const tabsHTML = tomos.map((t) => {
    const esCurrent = capActual >= t.capituloInicio && capActual <= t.capituloFin;
    return `<button class="item-tab ${esCurrent ? "activo" : ""}"
      style="${esCurrent ? `background:${color};border-color:${color};color:#000` : ""}">T${t.numero}</button>`;
  }).join("");

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.innerHTML = `
    <div class="item-section-label">Progreso manga</div>
    <div class="item-progreso-header">
      <span>Cap. <span id="cap-manga-num">${capActual}</span> / ${capMax}</span>
      <div class="item-prog-btns">
        <button class="item-prog-btn" onclick="cambiarCap(-1)" style="border-color:${color}">−</button>
        <span class="item-prog-num">${capActual}</span>
        <button class="item-prog-btn" onclick="cambiarCap(1)" style="border-color:${color}">+</button>
      </div>
    </div>
    <div class="item-progress-wrap">
      <div class="item-progress-fill" style="width:${pctGlobal}%;background:${color}"></div>
    </div>
    <div class="item-tabs">${tabsHTML}</div>
  `;
  col.appendChild(sec);
}

function cambiarCap(delta) {
  const tomos  = item.tomos ?? [];
  const capMax = tomos[tomos.length-1]?.capituloFin ?? 0;
  const actual = item.progresoManga?.capituloActual ?? 0;
  const nuevo  = Math.max(0, Math.min(capMax, actual + delta));
  if (nuevo === actual) return;
  if (!item.progresoManga) item.progresoManga = {};
  item.progresoManga.capituloActual = nuevo;
  guardarCampo("progresoManga", item.progresoManga);
  renderInfoCol(cfg.color);
}

function renderSeccionCapitulos(col, color) {
  const actual = item.capituloActual ?? 0;
  const total  = item.capitulosTotales ?? 0;
  const pct    = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.innerHTML = `
    <div class="item-section-label">Progreso</div>
    <div class="item-progreso-header">
      <span>Capítulo <span>${actual}</span> / ${total}</span>
      <div class="item-prog-btns">
        <button class="item-prog-btn" onclick="cambiarCapSimple(-1)" style="border-color:${color}">−</button>
        <span class="item-prog-num">${actual}</span>
        <button class="item-prog-btn" onclick="cambiarCapSimple(1)" style="border-color:${color}">+</button>
      </div>
    </div>
    <div class="item-progress-wrap">
      <div class="item-progress-fill" style="width:${pct}%;background:${color}"></div>
    </div>
  `;
  col.appendChild(sec);
}

function cambiarCapSimple(delta) {
  const total = item.capitulosTotales ?? 0;
  const nuevo = Math.max(0, Math.min(total, (item.capituloActual ?? 0) + delta));
  item.capituloActual = nuevo;
  guardarCampo("capituloActual", nuevo);
  renderInfoCol(cfg.color);
}

function renderSeccionPaginas(col, color) {
  const actual = item.paginaActual ?? 0;
  const total  = item.paginasTotales ?? 0;
  const pct    = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.innerHTML = `
    <div class="item-section-label">Páginas</div>
    <div class="item-progreso-header">
      <span>Página <span>${actual}</span> / ${total}</span>
      <div class="item-prog-btns">
        <button class="item-prog-btn" onclick="cambiarPag(-1)" style="border-color:${color}">−</button>
        <span class="item-prog-num">${actual}</span>
        <button class="item-prog-btn" onclick="cambiarPag(1)" style="border-color:${color}">+</button>
      </div>
    </div>
    <div class="item-progress-wrap">
      <div class="item-progress-fill" style="width:${pct}%;background:${color}"></div>
    </div>
  `;
  col.appendChild(sec);
}

function cambiarPag(delta) {
  const total = item.paginasTotales ?? 0;
  const nuevo = Math.max(0, Math.min(total, (item.paginaActual ?? 0) + delta));
  item.paginaActual = nuevo;
  guardarCampo("paginaActual", nuevo);
  renderInfoCol(cfg.color);
}

function renderSeccionDlcs(col, color) {
  const rows = item.dlcs.map(d => `
    <div class="item-dlc-row">
      <span class="item-dlc-tipo">${esc(d.tipo ?? "DLC")}</span>
      <span class="item-dlc-nombre">${esc(d.nombre)}</span>
      <span class="me-tag tag-estado" style="font-size:0.62rem">${esc(d.estado ?? "")}</span>
      ${d.logros ? `<span class="me-tag" style="font-size:0.62rem">${d.logros === "Todos completados" ? "🏆 " : ""}${esc(d.logros)}</span>` : ""}
    </div>
  `).join("");

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.innerHTML = `<div class="item-section-label">DLCs / Ediciones</div>${rows}`;
  col.appendChild(sec);
}

function guardarCampo(campo, valor) {
  item[campo] = valor;
  fetch(`/items/${item.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  }).then(() => {
    if (campo === "estado" || campo === "valoracion") renderItem();
  }).catch(err => console.error("Error guardando:", err));
}

function completarRapido() {
  const yaCompleto  = cfg.estadosCompletados?.includes(item.estado);
  const nuevoEstado = yaCompleto
    ? (cfg.estados.find(e => !cfg.estadosCompletados.includes(e)) ?? cfg.estados[0])
    : cfg.estadosCompletados[0];
  document.getElementById("item-estado").value = nuevoEstado;
  guardarCampo("estado", nuevoEstado);
}

document.addEventListener("DOMContentLoaded", cargarItem);