// ╔══════════════════════════════════════════════════════════╗
// ║  busquedaGlobal.js — BUSCADOR DEL HEADER                ║
// ╠══════════════════════════════════════════════════════════╣
// ║  El buscador que aparece en la barra superior.          ║
// ║  Busca en tiempo real mientras escribes.                ║
// ║                                                          ║
// ║  Cosas que puedes ajustar:                              ║
// ║  · Espera antes de buscar: debounceTimer (220ms)        ║
// ║  · Mínimo de letras para buscar: texto.length < 2       ║
// ║  · Máximo de resultados mostrados: items.slice(0, 8)    ║
// ╚══════════════════════════════════════════════════════════╝

(function () {
    // Obtener los elementos del DOM necesarios
    // DESPUÉS
const buscador   = document.getElementById("buscadorGlobal");
const contenedor = document.getElementById("resultadosBusqueda");
const filtroWrap    = document.getElementById("filtroBusqueda");
const filtroTexto   = document.getElementById("filtroBusqueda-texto");
const filtroDropdown = document.getElementById("filtroBusqueda-dropdown");
let   filtroValor   = "";

// Abrir/cerrar dropdown del filtro
filtroWrap?.addEventListener("click", (e) => {
    e.stopPropagation();
    const abierto = !filtroDropdown.classList.contains("oculto");
    filtroDropdown.classList.toggle("oculto");
    buscador.classList.toggle("expandido", !abierto);
    if (!abierto) posicionarDropdown();
});

// Reposicionar cuando el input termine su animación de expansión
buscador.addEventListener("transitionstart", () => {
    if (!filtroDropdown.classList.contains("oculto")) {
        // Actualizar posición continuamente durante la animación
        const intervalo = setInterval(() => {
            if (!filtroDropdown.classList.contains("oculto")) {
                posicionarDropdown();
            } else {
                clearInterval(intervalo);
            }
        }, 10);
        setTimeout(() => clearInterval(intervalo), 300); // parar tras 300ms (duración de la transición)
    }
});

function posicionarDropdown() {
    const rect = filtroWrap.getBoundingClientRect();
    filtroDropdown.style.top  = `${rect.bottom + 8}px`;
    filtroDropdown.style.left = `${rect.left}px`;
}

// Seleccionar opción
filtroDropdown?.querySelectorAll(".search-filtro-opt").forEach(opt => {
    opt.addEventListener("click", (e) => {
        e.stopPropagation();
        filtroValor = opt.dataset.value;
        const svg   = opt.querySelector("svg")?.outerHTML ?? "";
const label = opt.querySelector("span")?.textContent?.trim() ?? opt.textContent.trim();
filtroTexto.innerHTML = label === "Todo"
    ? "Filtrar"
    : `${svg} ${label}`;

        // Marcar activo
        filtroDropdown.querySelectorAll(".search-filtro-opt").forEach(o => o.classList.remove("activo"));
        opt.classList.add("activo");

        filtroDropdown.classList.add("oculto");
        ejecutarBusqueda();
    });
});

// Cerrar al hacer click fuera
document.addEventListener("click", () => {
    filtroDropdown?.classList.add("oculto");
    buscador.classList.remove("expandido");
});

filtroDropdown?.addEventListener("mousedown", (e) => {
    e.preventDefault();
});

filtroWrap?.addEventListener("mousedown", (e) => {
    e.preventDefault();
});

if (!buscador || !contenedor) return;

let debounceTimer;

// Función central de búsqueda reutilizada por input y focus
async function ejecutarBusqueda() {
    const texto = buscador.value.trim();
    const tipo = filtroValor;
    if (texto.length < 2) { contenedor.innerHTML = ""; return; }
    try {
        const url = tipo
            ? `/items?search=${encodeURIComponent(texto)}&tipo=${encodeURIComponent(tipo)}`
            : `/items?search=${encodeURIComponent(texto)}`;
        const res  = await fetch(url);
        const data = await res.json();
        // Filtrar por tipo en el frontend si el backend no lo soporta aún
        const filtrados = tipo ? data.filter(i => i.tipo === tipo) : data;
        mostrarResultados(filtrados);
    } catch (e) {
        console.error("Error en búsqueda global:", e);
    }
}

buscador.addEventListener("focus", ejecutarBusqueda);

buscador.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(ejecutarBusqueda, 220);
});


    // ── Cerrar resultados al hacer click fuera ────────────────
    document.addEventListener("click", (e) => {
        if (!buscador.contains(e.target) && !contenedor.contains(e.target)) {
            contenedor.innerHTML = "";
        }
    });

    // ── Mostrar los resultados en el dropdown ─────────────────
    function mostrarResultados(items) {
        contenedor.innerHTML = "";

        // Si no hay resultados, mostrar mensaje
        if (!items.length) {
            contenedor.innerHTML = `<div class="resultado-item" style="color:var(--muted);cursor:default">Sin resultados</div>`;
            return;
        }

        // Mostrar máximo 8 resultados en el dropdown
        items.slice(0, 8).forEach(item => { // ← cambia 8 para mostrar más o menos resultados
            const div = document.createElement("div");
            div.classList.add("resultado-item");

            const color    = CONFIG[item.tipo]?.color ?? "#888";
            const valColor = valoracionColor(item.valoracion);
            const valLabel = valoracionLabel(item.valoracion);

            // Badge de valoración (solo si tiene valoración)
            const val = item.valoracion != null
                ? `<span class="list-rating" style="background:${valColor}20;color:${valColor}">${valLabel}</span>`
                : "";

            div.innerHTML = `
                 <span style="display:inline-flex;align-items:center">${tipoSVG(item.tipo, 14)}</span>
                <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.titulo}</span>
                <small style="color:${color}">${item.tipo}</small>
                ${val}
            `;

            // Al hacer click en un resultado, ir a esa categoría
            div.addEventListener("click", () => {
    contenedor.innerHTML = "";
    buscador.value = "";
    const tipoActual = new URLSearchParams(window.location.search).get("tipo");
    if (tipoActual === item.tipo) {
        window.location.hash = `card-${item.id}`;
    } else {
        window.location.href = `/pages/categoria.html?tipo=${item.tipo}#card-${item.id}`;
    }
});

            contenedor.appendChild(div);
        });
    }
})();