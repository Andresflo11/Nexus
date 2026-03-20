// ╔══════════════════════════════════════════════════════════╗
// ║  categoria-index.js — Vista grid de categoría           ║
// ║  Lee ?tipo=X, carga items y los muestra en grid         ║
// ╚══════════════════════════════════════════════════════════╝

const params = new URLSearchParams(location.search);
const TIPO   = params.get("tipo") || "juegos";
const CFG    = CONFIG[TIPO] || {};

document.documentElement.style.setProperty("--cat-color", CFG.color || "var(--accent)");
document.title = `NEXUS — ${CFG.label || TIPO}`;

const ESTADOS_COLOR = {
  "completado":  "#22c55e",
  "en-progreso": "#e8ff47",
  "pendiente":   "#6b7280",
  "abandonado":  "#ef4444",
  "en-curso":    "#e8ff47",
  "jugando":     "#e8ff47",
  "viendo":      "#e8ff47",
  "leyendo":     "#e8ff47",
};

const RATINGS = ["","★","★★","★★★","★★★★","♥"];

let todosItems = [];

async function cargar() {
  try {
    const res   = await fetch("/items");
    const items = await res.json();
    todosItems  = items.filter(i => i.tipo === TIPO);
    renderizar();
  } catch(e) {
    console.error(e);
  }
}

function renderizar() {
  const q      = document.getElementById("catidx-buscar").value.toLowerCase();
  const estado = document.getElementById("catidx-estado").value;
  const orden  = document.getElementById("catidx-orden").value;

  let lista = todosItems.filter(it => {
    const matchQ = !q || it.titulo?.toLowerCase().includes(q);
    const matchE = !estado || it.estado === estado;
    return matchQ && matchE;
  });

  if (orden === "titulo")       lista.sort((a,b) => (a.titulo||"").localeCompare(b.titulo||""));
  if (orden === "rating-desc")  lista.sort((a,b) => (b.valoracion||0) - (a.valoracion||0));
  if (orden === "rating-asc")   lista.sort((a,b) => (a.valoracion||0) - (b.valoracion||0));

  document.getElementById("catidx-titulo").textContent = (CFG.label||TIPO).slice(2).toUpperCase();
  document.getElementById("catidx-count").textContent  = `${lista.length} elemento${lista.length !== 1 ? "s" : ""}`;

  const grid = document.getElementById("catidx-grid");
  grid.innerHTML = "";

  if (lista.length === 0) {
    grid.innerHTML = `<div class="catidx-empty">No hay elementos${q || estado ? " con estos filtros" : " en esta categoría"}.</div>`;
    return;
  }

  lista.forEach(it => {
    const card = document.createElement("div");
    card.className = "catidx-card";
    card.onclick = () => window.location.href = `/pages/item.html?id=${it.id}`;

    const posterHTML = it.imagen
      ? `<img src="${it.imagen}" alt="${it.titulo}" loading="lazy">`
      : (CFG.label?.split(" ")[0] || "?");

    const dotColor = ESTADOS_COLOR[it.estado] || "#6b7280";
    const rating   = it.valoracion ? RATINGS[it.valoracion] || "" : "";

    const user = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
    const mostrarBtn = user && user.rol !== "admin";

    const btnAgregar = document.createElement("button");
    btnAgregar.className = "catidx-add-btn";
    btnAgregar.title = "Agregar a mi dashboard";
    btnAgregar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
    btnAgregar.onclick = async (e) => {
        e.stopPropagation();
        const user = (() => { try { return JSON.parse(sessionStorage.getItem("nexus_user")); } catch { return null; } })();
        if (!user) { alert("Debes iniciar sesión para agregar items a tu dashboard"); return; }
        try {
            const res = await fetch("/mi-dashboard", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, itemId: it.id })
            });
            if (res.ok) {
                btnAgregar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>`;
                btnAgregar.style.borderColor = "#22c55e40";
                setTimeout(() => {
                    btnAgregar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
                    btnAgregar.style.borderColor = "";
                }, 1500);
            }
        } catch { alert("Error al agregar"); }
    };

    card.innerHTML = `
      <div class="catidx-poster">${posterHTML}</div>
      <div class="catidx-info">
        <div class="catidx-nombre">${it.titulo || "Sin título"}</div>
      </div>
    `;
    if (mostrarBtn) card.appendChild(btnAgregar);
    grid.appendChild(card);
  });
}

document.getElementById("catidx-buscar").addEventListener("input", renderizar);
document.getElementById("catidx-estado").addEventListener("change", renderizar);
document.getElementById("catidx-orden").addEventListener("change", renderizar);

cargar();