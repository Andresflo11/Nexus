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
    const buscador   = document.getElementById("buscadorGlobal");
    const contenedor = document.getElementById("resultadosBusqueda");

    // Si no existen en la página actual, no hacer nada
    if (!buscador || !contenedor) return;

    let debounceTimer; // guarda el temporizador para cancelarlo si el usuario sigue escribiendo

    // ── Escuchar cada pulsación de tecla ─────────────────────
    buscador.addEventListener("input", function () {
        clearTimeout(debounceTimer); // cancelar búsqueda anterior si el usuario sigue escribiendo

        const texto = this.value.trim();

        // No buscar si hay menos de 2 caracteres
        if (texto.length < 2) {
            contenedor.innerHTML = "";
            return;
        }

        // Esperar 220ms después de la última tecla antes de buscar
        // Esto evita hacer una petición por cada letra que se escribe
        debounceTimer = setTimeout(async () => {
            try {
                const res  = await fetch(`/items?search=${encodeURIComponent(texto)}`);
                const data = await res.json();
                mostrarResultados(data);
            } catch (e) {
                console.error("Error en búsqueda global:", e);
            }
        }, 220); // ← puedes aumentar este número si quieres que espere más
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

            const emoji    = tipoEmoji(item.tipo);
            const color    = CONFIG[item.tipo]?.color ?? "#888";
            const valColor = valoracionColor(item.valoracion);
            const valLabel = valoracionLabel(item.valoracion);

            // Badge de valoración (solo si tiene valoración)
            const val = item.valoracion != null
                ? `<span class="list-rating" style="background:${valColor}20;color:${valColor}">${valLabel}</span>`
                : "";

            div.innerHTML = `
                <span style="font-size:1rem">${emoji}</span>
                <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.titulo}</span>
                <small style="color:${color}">${item.tipo}</small>
                ${val}
            `;

            // Al hacer click en un resultado, ir a esa categoría
            div.addEventListener("click", () => {
                contenedor.innerHTML = "";
                buscador.value = "";
                window.location.href = `/pages/categoria.html?tipo=${item.tipo}`;
            });

            contenedor.appendChild(div);
        });
    }
})();
