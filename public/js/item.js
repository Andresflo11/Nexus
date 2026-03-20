// ╔══════════════════════════════════════════════════════════╗
// ║  item.js — PÁGINA DE DETALLE DE UN ITEM                 ║
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

  // Botón añadir al dashboard para usuarios normales
  const _u = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
  const btnWrap = document.getElementById("item-btn-dashboard-wrap");
  if (btnWrap) btnWrap.remove();
  if (_u && _u.rol !== "admin") {
    // Verificar si ya está en el dashboard
    fetch(`/mi-dashboard/${_u.id}`)
      .then(r => r.json())
      .then(dashItems => {
        const yaAgregado = dashItems.some(d => d.id === item.id);
        const wrap = document.createElement("div");
        wrap.id = "item-btn-dashboard-wrap";
        wrap.style.cssText = "margin-top:1rem";
        if (yaAgregado) {
          wrap.innerHTML = `
            <div style="width:100%;padding:0.65rem 1rem;background:#22c55e10;border:1px solid #22c55e40;border-radius:8px;color:#22c55e;font-size:0.85rem;display:flex;align-items:center;justify-content:center;gap:0.5rem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              Ya en tu dashboard
            </div>`;
        } else {
          wrap.innerHTML = `
            <button id="item-btn-dashboard" onclick="agregarAlDashboard()"
              style="width:100%;padding:0.65rem 1rem;background:transparent;border:1px solid ${color}40;border-radius:8px;color:${color};cursor:pointer;font-size:0.85rem;display:flex;align-items:center;justify-content:center;gap:0.5rem;transition:background 0.2s"
              onmouseover="this.style.background='${color}15'" onmouseout="this.style.background='transparent'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Añadir a mi dashboard
            </button>`;
        }
        poster.insertAdjacentElement("afterend", wrap);
      });
  }

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

  const tabsHTML = temps.map((t, i) => {
    const label = t.tipo === "ova"      ? `OVA ${t.numero}`
                : t.tipo === "especial" ? `ESP ${t.numero}`
                : `T${t.numero}`;
    return `<button class="item-tab ${i === tabActual ? "activo" : ""}"
      style="${i === tabActual ? `background:${color};border-color:${color};color:#000` : ""}"
      onclick="cambiarTabTemp(${i})">${label}</button>`;
  }).join("");

  // Mostrar capítulos de todas las temporadas
  const todasTempsHTML = temps.map((t, i) => {
    const esActual = i === (item.progreso?.temporada ? item.progreso.temporada - 1 : 0);
    const capsVistas = esActual
      ? (item.progreso?.capitulo ?? 0)
      : (item.progreso?.temporada - 1 > i ? t.capitulos : 0);
    const label = t.tipo === "ova"      ? `OVA ${t.numero}`
                : t.tipo === "especial" ? `Especial ${t.numero}`
                : `Temporada ${t.numero}`;
    const dots = Array.from({length: t.capitulos}, (_, j) => {
      const n      = j + 1;
      const visto  = capsVistas >= n;
      const actual = esActual && (item.progreso?.capitulo ?? 0) === n;
      return `<div class="item-ep-dot ${visto ? "visto" : ""} ${actual ? "actual" : ""}"
        style="${actual ? `background:${color};border-color:${color};color:#000` : visto ? `background:${color}25;border-color:${color}40` : ""}"
        title="Ep ${n}">${n}</div>`;
    }).join("");

    return `
      <div style="margin-bottom:1.25rem">
        <div style="font-family:'Bebas Neue',cursive;font-size:1rem;letter-spacing:1px;color:${color};margin-bottom:0.5rem">${label} <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);font-weight:400">${t.capitulos} caps</span></div>
        <div class="item-eps-grid">${dots}</div>
      </div>`;
  }).join("");

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.id = "sec-episodios";
  sec.innerHTML = `
    <div class="item-section-label">Temporadas</div>
    ${todasTempsHTML}
  `;
  col.appendChild(sec);
}

function cambiarTabTemp(idx) {
  tabActual = idx;
  const sec = document.getElementById("sec-episodios");
  if (sec) sec.remove();
  renderSeccionEpisodios(document.getElementById("item-info-col"), cfg.color);
}

function renderSeccionManga(col, color) {
  const tomos     = item.tomos ?? [];
  const capActual = item.progresoManga?.capituloActual ?? 0;
  const capMax    = tomos[tomos.length-1]?.capituloFin ?? 0;

  const tomosHTML = tomos.map(t => {
    const esCurrent = capActual >= t.capituloInicio && capActual <= t.capituloFin;
    const total = t.capituloFin - t.capituloInicio + 1;
    const dots  = Array.from({length: total}, (_, i) => {
      const n      = t.capituloInicio + i;
      const visto  = n <= capActual;
      const actual = n === capActual;
      return `<div class="item-ep-dot ${visto ? "visto" : ""} ${actual ? "actual" : ""}"
        style="${actual ? `background:${color};border-color:${color};color:#000` : visto ? `background:${color}25;border-color:${color}40` : ""}"
        title="Cap. ${n}">${n}</div>`;
    }).join("");

    return `
      <div style="margin-bottom:1.25rem">
        <div style="font-family:'Bebas Neue',cursive;font-size:1rem;letter-spacing:1px;color:${esCurrent ? color : "var(--muted)"};margin-bottom:0.5rem">
          Tomo ${t.numero} <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);font-weight:400">caps ${t.capituloInicio}–${t.capituloFin}</span>
          ${esCurrent ? `<span style="font-size:0.65rem;color:${color};margin-left:0.5rem">← actual</span>` : ""}
        </div>
        <div class="item-eps-grid">${dots}</div>
      </div>`;
  }).join("");

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.innerHTML = `
    <div class="item-section-label">Tomos y capítulos</div>
    ${tomosHTML}
  `;
  col.appendChild(sec);
}

function renderSeccionCapitulos(col, color) {
  const actual = item.capituloActual ?? 0;
  const total  = item.capitulosTotales ?? 0;
  const pct    = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;

  const dots = Array.from({length: total}, (_, i) => {
    const n     = i + 1;
    const visto = n <= actual;
    return `<div class="item-ep-dot ${visto ? "visto" : ""}"
      style="${visto ? `background:${color}25;border-color:${color}40` : ""}"
      title="Cap. ${n}">${n}</div>`;
  }).join("");

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.innerHTML = `
    <div class="item-section-label">Capítulos</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--muted);margin-bottom:0.75rem">Cap. ${actual} / ${total} (${pct}%)</div>
    <div class="item-eps-grid">${dots}</div>
  `;
  col.appendChild(sec);
}

function renderSeccionPaginas(col, color) {
  const actual = item.paginaActual ?? 0;
  const total  = item.paginasTotales ?? 0;
  const pct    = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.innerHTML = `
    <div class="item-section-label">Páginas</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--muted);margin-bottom:0.5rem">Página ${actual} / ${total} (${pct}%)</div>
    <div class="item-progress-wrap">
      <div class="item-progress-fill" style="width:${pct}%;background:${color}"></div>
    </div>
  `;
  col.appendChild(sec);
}

function renderSeccionDlcs(col, color) {
  const rows = item.dlcs.map(d => `
    <div class="item-dlc-row">
      <span class="item-dlc-tipo">${esc(d.tipo ?? "DLC")}</span>
      <span class="item-dlc-nombre">${esc(d.nombre)}</span>
      <span class="me-tag tag-estado" style="font-size:0.62rem">${esc(d.estado ?? "")}</span>
    </div>
  `).join("");

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.innerHTML = `<div class="item-section-label">DLCs / Ediciones</div>${rows}`;
  col.appendChild(sec);
}

async function agregarAlDashboard() {
  const _u = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
  if (!_u) return;
  const btn = document.getElementById("item-btn-dashboard");
  if (btn) btn.disabled = true;
  try {
    const res = await fetch("/mi-dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: _u.id, itemId: item.id })
    });
    if (res.ok) {
      const wrap = document.getElementById("item-btn-dashboard-wrap");
      const color = cfg.color ?? "#888";
      if (wrap) wrap.innerHTML = `
        <div style="width:100%;padding:0.65rem 1rem;background:#22c55e10;border:1px solid #22c55e40;border-radius:8px;color:#22c55e;font-size:0.85rem;display:flex;align-items:center;justify-content:center;gap:0.5rem">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          Ya en tu dashboard
        </div>`;
    }
  } catch { if (btn) btn.disabled = false; }
}

function guardarCampo(campo, valor) {
  item[campo] = valor;
  fetch(`/items/${item.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  }).catch(err => console.error("Error guardando:", err));
}

document.addEventListener("DOMContentLoaded", cargarItem);