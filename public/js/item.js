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

const params    = new URLSearchParams(window.location.search);
const itemId    = parseInt(params.get("id"));
let   item      = null;
let   cfg       = null;
let   tabActual = 0;

// ── Carga ─────────────────────────────────────────────────

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

// ── Render principal ──────────────────────────────────────

function renderItem() {
  const color = cfg.color ?? "#888";
  document.title = `NEXUS — ${item.titulo}`;

  const bg = document.getElementById("item-bg");
  if (item.imagen) { bg.style.backgroundImage = `url('${esc(item.imagen)}')`; bg.style.opacity = "1"; }

  const backBtn = document.getElementById("back-btn");
  const ref = document.referrer;
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

  // Botón dashboard para usuarios normales
  const _u = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
  const oldWrap = document.getElementById("item-btn-dashboard-wrap");
  if (oldWrap) oldWrap.remove();
  if (_u && _u.rol !== "admin") {
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

// ── Columna de info ───────────────────────────────────────

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

  if (cfg.usaEpisodios && item.temporadas?.length)  renderSeccionEpisodios(col, color);
  if (cfg.usaTomos && item.tomos?.length)            renderSeccionMangaConTab(col, color, undefined);
  if (cfg.usaCapitulos && item.capitulosTotales)     renderSeccionCapitulos(col, color);
  if (cfg.usaPaginas && item.paginasTotales)         renderSeccionPaginas(col, color);
  if (cfg.usaDlcs && item.dlcs?.length)              renderSeccionDlcs(col, color);
  if (item.relacionados?.length)                     renderSeccionRelacionados(col, color);
}

// ── Sección: Episodios / Temporadas ──────────────────────

function renderSeccionEpisodios(col, color) {
  const temps = item.temporadas ?? [];

  const tabsHTML = temps.map((t, i) => {
    const label = t.tipo === "ova"      ? `OVA ${t.numero}`
                : t.tipo === "especial" ? `ESP ${t.numero}`
                : `T${t.numero}`;
    const activo = i === tabActual;
    return `<button class="item-tab ${activo ? "activo" : ""}"
      style="${activo ? `background:${color};border-color:${color};color:#000` : ""}"
      onclick="cambiarTabTemp(${i})">${label} <span style="font-size:0.58rem;opacity:0.7">${t.capitulos}</span></button>`;
  }).join("");

  const temp = temps[tabActual] ?? temps[0];
  let dotsHTML = "";
  if (temp) {
    const capsVistas = item.progreso?.temporada - 1 === tabActual
      ? (item.progreso?.capitulo ?? 0)
      : (item.progreso?.temporada - 1 > tabActual ? temp.capitulos : 0);

    dotsHTML = Array.from({length: temp.capitulos}, (_, j) => {
      const n      = j + 1;
      const visto  = capsVistas >= n;
      const actual = capsVistas === n;
      return `<div class="item-ep-dot ${visto ? "visto" : ""}"
        style="${actual ? `background:${color};border-color:${color};color:#000;box-shadow:0 0 6px ${color}60` : visto ? `background:${color}30;border-color:${color}50;color:${color}` : ""}"
        title="Ep ${n}">${n}</div>`;
    }).join("");
  }

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.id = "sec-episodios";
  sec.innerHTML = `
    <div class="item-section-label">Temporadas</div>
    <div class="item-tabs" style="margin-bottom:1rem">${tabsHTML}</div>
    ${temp ? `
      <div style="font-family:'Bebas Neue',cursive;font-size:1rem;letter-spacing:1px;color:${color};margin-bottom:0.6rem">
        ${temp.tipo === "ova" ? `OVA ${temp.numero}` : temp.tipo === "especial" ? `Especial ${temp.numero}` : `Temporada ${temp.numero}`}
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--muted);font-weight:400;margin-left:0.5rem">${temp.capitulos} eps</span>
      </div>
      <div class="item-eps-grid">${dotsHTML}</div>
    ` : ""}
  `;
  col.appendChild(sec);
}

function cambiarTabTemp(idx) {
  tabActual = idx;
  const col = document.getElementById("item-info-col");
  const sec = document.getElementById("sec-episodios");

  // Crear la nueva sección
  const color = cfg.color ?? "#888";
  const temps = item.temporadas ?? [];
  const tabsHTML = temps.map((t, i) => {
    const label = t.tipo === "ova"      ? `OVA ${t.numero}`
                : t.tipo === "especial" ? `ESP ${t.numero}`
                : `T${t.numero}`;
    const activo = i === idx;
    return `<button class="item-tab ${activo ? "activo" : ""}"
      style="${activo ? `background:${color};border-color:${color};color:#000` : ""}"
      onclick="cambiarTabTemp(${i})">${label} <span style="font-size:0.58rem;opacity:0.7">${t.capitulos}</span></button>`;
  }).join("");

  const temp = temps[idx] ?? temps[0];
  let dotsHTML = "";
  if (temp) {
    const capsVistas = item.progreso?.temporada - 1 === idx
      ? (item.progreso?.capitulo ?? 0)
      : (item.progreso?.temporada - 1 > idx ? temp.capitulos : 0);
    dotsHTML = Array.from({length: temp.capitulos}, (_, j) => {
      const n = j + 1;
      const visto  = capsVistas >= n;
      const actual = capsVistas === n;
      return `<div class="item-ep-dot ${visto ? "visto" : ""}"
        style="${actual ? `background:${color};border-color:${color};color:#000;box-shadow:0 0 6px ${color}60` : visto ? `background:${color}30;border-color:${color}50;color:${color}` : ""}"
        title="Ep ${n}">${n}</div>`;
    }).join("");
  }

  const nuevaSec = document.createElement("div");
  nuevaSec.className = "item-section";
  nuevaSec.id = "sec-episodios";
  nuevaSec.innerHTML = `
    <div class="item-section-label">Temporadas</div>
    <div class="item-tabs" style="margin-bottom:1rem">${tabsHTML}</div>
    ${temp ? `
      <div style="font-family:'Bebas Neue',cursive;font-size:1rem;letter-spacing:1px;color:${color};margin-bottom:0.6rem">
        ${temp.tipo === "ova" ? `OVA ${temp.numero}` : temp.tipo === "especial" ? `Especial ${temp.numero}` : `Temporada ${temp.numero}`}
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--muted);font-weight:400;margin-left:0.5rem">${temp.capitulos} eps</span>
      </div>
      <div class="item-eps-grid">${dotsHTML}</div>
    ` : ""}
  `;

  // Reemplazar en el mismo lugar sin mover otras secciones
  if (sec) {
    col.replaceChild(nuevaSec, sec);
  } else {
    col.appendChild(nuevaSec);
  }

  tabActual = idx;
}

// ── Sección: Manga / Tomos ────────────────────────────────

function renderSeccionMangaConTab(col, color, tomoTabActual) {
  const tomos     = item.tomos ?? [];
  const capActual = item.progresoManga?.capituloActual ?? 0;

  if (tomoTabActual === undefined) {
    tomoTabActual = tomos.findIndex(t => capActual >= t.capituloInicio && capActual <= t.capituloFin);
    if (tomoTabActual === -1) tomoTabActual = 0;
  }
  const tomoActivo = tomos[tomoTabActual];

  const tabsHTML = tomos.map((t, i) => {
    const activo = i === tomoTabActual;
    return `<button class="item-tab ${activo ? "activo" : ""}"
      style="${activo ? `background:${color};border-color:${color};color:#000` : ""}"
      onclick="cambiarTabTomo(${i})">T${t.numero} <span style="font-size:0.58rem;opacity:0.7">${t.capituloFin - t.capituloInicio + 1}</span></button>`;
  }).join("");

  let dotsHTML = "";
  if (tomoActivo) {
    const total = tomoActivo.capituloFin - tomoActivo.capituloInicio + 1;
    dotsHTML = Array.from({length: total}, (_, i) => {
      const n      = tomoActivo.capituloInicio + i;
      const visto  = n <= capActual;
      const esAct  = n === capActual;
      return `<div class="item-ep-dot ${visto ? "visto" : ""}"
        style="${esAct ? `background:${color};border-color:${color};color:#000;box-shadow:0 0 6px ${color}60` : visto ? `background:${color}30;border-color:${color}50;color:${color}` : ""}"
        title="Cap. ${n}">${n}</div>`;
    }).join("");
  }

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.id = "sec-manga";
  sec.innerHTML = `
    <div class="item-section-label">Tomos</div>
    <div class="item-tabs" style="margin-bottom:1rem">${tabsHTML}</div>
    ${tomoActivo ? `
      <div style="font-family:'Bebas Neue',cursive;font-size:1rem;letter-spacing:1px;color:${color};margin-bottom:0.6rem">
        Tomo ${tomoActivo.numero}
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--muted);font-weight:400;margin-left:0.5rem">caps ${tomoActivo.capituloInicio}–${tomoActivo.capituloFin}</span>
      </div>
      <div class="item-eps-grid">${dotsHTML}</div>
    ` : ""}
  `;

  const ref = document.getElementById("sec-capitulos")
           ?? document.getElementById("sec-paginas")
           ?? document.getElementById("sec-dlcs")
           ?? document.getElementById("sec-relacionados")
           ?? null;
  ref ? col.insertBefore(sec, ref) : col.appendChild(sec);
}

function cambiarTabTomo(idx) {
  const sec = document.getElementById("sec-manga");
  if (sec) sec.remove();
  renderSeccionMangaConTab(document.getElementById("item-info-col"), cfg.color, idx);
}

// ── Sección: Capítulos ────────────────────────────────────

function renderSeccionCapitulos(col, color) {
  const actual = item.capituloActual ?? 0;
  const total  = item.capitulosTotales ?? 0;
  const pct    = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;

  const GRUPO  = 10;
  const grupos = Math.ceil(total / GRUPO);
  const tabsHTML = Array.from({length: grupos}, (_, i) => {
    const desde  = i * GRUPO + 1;
    const hasta  = Math.min((i + 1) * GRUPO, total);
    const activo = (actual >= desde && actual <= hasta) || (i === 0 && actual === 0);
    return `<button class="item-tab ${activo ? "activo" : ""}"
      style="${activo ? `background:${color};border-color:${color};color:#000` : ""}"
      onclick="cambiarGrupoCaps(${i})">${desde}–${hasta}</button>`;
  }).join("");

  const grupoActual = actual === 0 ? 0 : Math.max(0, Math.ceil(actual / GRUPO) - 1);
  const desde = grupoActual * GRUPO + 1;
  const hasta  = Math.min((grupoActual + 1) * GRUPO, total);

  const dotsHTML = Array.from({length: hasta - desde + 1}, (_, i) => {
    const n      = desde + i;
    const visto  = n <= actual;
    const esAct  = n === actual;
    return `<div class="item-ep-dot ${visto ? "visto" : ""}"
      style="${esAct ? `background:${color};border-color:${color};color:#000;box-shadow:0 0 6px ${color}60` : visto ? `background:${color}30;border-color:${color}50;color:${color}` : ""}"
      title="Cap. ${n}">${n}</div>`;
  }).join("");

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.id = "sec-capitulos";
  sec.innerHTML = `
    <div class="item-section-label">Capítulos — ${actual} / ${total} (${pct}%)</div>
    ${grupos > 1 ? `<div class="item-tabs" style="margin-bottom:1rem">${tabsHTML}</div>` : ""}
    <div class="item-eps-grid" id="caps-dots">${dotsHTML}</div>
  `;
  col.appendChild(sec);
}

function cambiarGrupoCaps(idx) {
  const total  = item.capitulosTotales ?? 0;
  const actual = item.capituloActual ?? 0;
  const color  = cfg.color ?? "#888";
  const GRUPO  = 10;
  const desde  = idx * GRUPO + 1;
  const hasta  = Math.min((idx + 1) * GRUPO, total);

  const dotsHTML = Array.from({length: hasta - desde + 1}, (_, i) => {
    const n     = desde + i;
    const visto = n <= actual;
    const esAct = n === actual;
    return `<div class="item-ep-dot ${visto ? "visto" : ""}"
      style="${esAct ? `background:${color};border-color:${color};color:#000;box-shadow:0 0 6px ${color}60` : visto ? `background:${color}30;border-color:${color}50;color:${color}` : ""}"
      title="Cap. ${n}">${n}</div>`;
  }).join("");

  document.getElementById("caps-dots").innerHTML = dotsHTML;
  document.querySelectorAll("#sec-capitulos .item-tab").forEach((btn, i) => {
    const activo = i === idx;
    btn.classList.toggle("activo", activo);
    btn.style.background  = activo ? color : "";
    btn.style.borderColor = activo ? color : "";
    btn.style.color       = activo ? "#000" : "";
  });
}

// ── Sección: Páginas ──────────────────────────────────────

function renderSeccionPaginas(col, color) {
  const actual = item.paginaActual ?? 0;
  const total  = item.paginasTotales ?? 0;

  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.innerHTML = `
    <div class="item-section-label">Páginas</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:0.85rem;color:var(--text)">
      <span style="color:${color};font-size:1.4rem;font-family:'Bebas Neue',cursive;letter-spacing:1px">${actual}</span>
      <span style="color:var(--muted);font-size:0.75rem"> / ${total} págs.</span>
    </div>
  `;
  col.appendChild(sec);
}

// ── Sección: DLCs ─────────────────────────────────────────

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
  sec.id = "sec-dlcs";
  sec.innerHTML = `<div class="item-section-label">DLCs / Ediciones</div>${rows}`;
  col.appendChild(sec);
}

// ── Sección: Relacionados ─────────────────────────────────

function renderSeccionRelacionados(col, color) {
  const sec = document.createElement("div");
  sec.className = "item-section";
  sec.id = "sec-relacionados";
  sec.innerHTML = `
    <div class="item-section-label">Relacionados</div>
    <div id="rel-cards-wrap" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:0.75rem;margin-top:0.25rem">
      <div style="color:var(--muted);font-size:0.78rem;grid-column:1/-1">Cargando...</div>
    </div>`;
  col.appendChild(sec);

  fetch(`/items/bulk/${item.relacionados.join(",")}`)
    .then(r => r.json())
    .then(rels => {
      const wrap = document.getElementById("rel-cards-wrap");
      if (!wrap) return;
      if (!rels.length) {
        wrap.innerHTML = `<div style="color:var(--muted);font-size:0.78rem;grid-column:1/-1">Sin items relacionados</div>`;
        return;
      }
      wrap.innerHTML = rels.map(r => {
        const cfg2 = CONFIG[r.tipo];
        const c2   = cfg2?.color ?? "#888";
        return `
          <div onclick="window.location.href='/pages/item.html?id=${r.id}'"
            style="display:flex;flex-direction:column;background:var(--bg,#080a0f);border:1px solid var(--border);border-radius:10px;overflow:hidden;cursor:pointer;transition:border-color 0.2s,transform 0.15s"
            onmouseover="this.style.borderColor='${c2}';this.style.transform='translateY(-3px)'"
            onmouseout="this.style.borderColor='var(--border)';this.style.transform=''">
            <div style="aspect-ratio:2/3;background:var(--surface);overflow:hidden;position:relative;flex-shrink:0">
              ${r.imagen
                ? `<img src="${esc(r.imagen)}" style="width:100%;height:100%;object-fit:cover;display:block">`
                : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem">${cfg2?.label.split(" ")[0] ?? "?"}</div>`}
              <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${c2}"></div>
            </div>
            <div style="padding:0.5rem 0.6rem;flex:1">
              <div style="font-size:0.65rem;color:${c2};font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.2rem">${cfg2?.label.slice(2) ?? r.tipo}</div>
              <div style="font-size:0.8rem;font-weight:600;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(r.titulo)}</div>
            </div>
          </div>`;
      }).join("");
    })
    .catch(() => {
      const wrap = document.getElementById("rel-cards-wrap");
      if (wrap) wrap.innerHTML = `<div style="color:var(--muted);font-size:0.78rem;grid-column:1/-1">Error cargando relacionados</div>`;
    });
}

// ── Dashboard ─────────────────────────────────────────────

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