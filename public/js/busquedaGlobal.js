const buscador = document.getElementById("buscadorGlobal");
const contenedor = document.getElementById("resultadosBusqueda");

buscador.addEventListener("input", async function() {

    const texto = this.value.trim();

    if (texto.length < 2) {
        contenedor.innerHTML = "";
        return;
    }

    const res = await fetch(`/items?search=${texto}`);
    const data = await res.json();

    mostrarResultados(data);
});

function mostrarResultados(items) {
    contenedor.innerHTML = "";

    items.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("resultado-item");

        div.innerHTML = `
            <strong>${item.titulo}</strong> 
            <small>(${item.tipo})</small>
        `;

        div.addEventListener("click", () => {
            window.location.href = `/pages/categoria.html?tipo=${item.tipo}`;
        });

        contenedor.appendChild(div);
    });
}