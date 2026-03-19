// ── Búsqueda global ──────────────────────────────────────────────────────────
(function () {
    const buscador   = document.getElementById("buscadorGlobal");
    const contenedor = document.getElementById("resultadosBusqueda");
    if (!buscador || !contenedor) return;

    let debounceTimer;

    buscador.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        const texto = this.value.trim();

        if (texto.length < 2) {
            contenedor.innerHTML = "";
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const res  = await fetch(`/items?search=${encodeURIComponent(texto)}`);
                const data = await res.json();
                mostrarResultados(data);
            } catch (e) {
                console.error("Error en búsqueda global:", e);
            }
        }, 220);
    });

    // Cerrar al hacer clic fuera
    document.addEventListener("click", (e) => {
        if (!buscador.contains(e.target) && !contenedor.contains(e.target)) {
            contenedor.innerHTML = "";
        }
    });

    function mostrarResultados(items) {
        contenedor.innerHTML = "";
        if (!items.length) {
            contenedor.innerHTML = `<div class="resultado-item" style="color:var(--muted);cursor:default">Sin resultados</div>`;
            return;
        }

        // Máximo 8 resultados en el dropdown
        items.slice(0, 8).forEach(item => {
            const div = document.createElement("div");
            div.classList.add("resultado-item");

            const emoji = tipoEmoji(item.tipo);
            const color = CONFIG[item.tipo]?.color ?? "#888";
            const val   = item.valoracion != null ? `<span class="list-rating" style="background:${valoracionColor(item.valoracion)}20;color:${valoracionColor(item.valoracion)}">${valoracionLabel(item.valoracion)}</span>` : "";

            div.innerHTML = `
                <span style="font-size:1rem">${emoji}</span>
                <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.titulo}</span>
                <small style="color:${color}">${item.tipo}</small>
                ${val}
            `;

            div.addEventListener("click", () => {
                contenedor.innerHTML = "";
                buscador.value = "";
                window.location.href = `/pages/categoria.html?tipo=${item.tipo}`;
            });

            contenedor.appendChild(div);
        });
    }
})();
