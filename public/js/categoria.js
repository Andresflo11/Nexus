const params = new URLSearchParams(window.location.search);
const tipo = params.get('tipo');
const config = CONFIG[tipo];
const titulo = document.getElementById('titulo-categoria');

titulo.textContent = tipo.toUpperCase();

let idAEliminar = null;
let dataOriginal = [];

function cargarItems() {
    fetch(`/items/${tipo}`)
        .then(res => res.json())
        .then(data => {
            dataOriginal = data;
            crearFormulario();
            crearFiltros();
            mostrar(dataOriginal);
        })
        .catch(err => console.error("Error al cargar items:", err));
}

function actualizarItem(item) {
    fetch(`/items/${item.id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(item)
    })
    .then(res => res.json())
    .then(() => cargarItems())
    .catch(err => console.error("Error al cargar items:", err));
}

function guardarEdicionCompleta(id) {
    const actualizado = {
        titulo: document.getElementById(`input-titulo-${id}`).value,
        estado: document.getElementById(`input-estado-${id}`).value,
        fecha: document.getElementById(`edit-fecha-${id}`).value,
        imagen: document.getElementById(`input-imagen-${id}`).value,
        valoracion: parseInt(document.getElementById(`input-valoracion-${id}`).value)
    };

    if (config.usaPlataforma) {
        actualizado.plataforma = document.getElementById(`input-plataforma-${id}`).value;
    }

    if (config.usalogros) {
        actualizado.logros = document.getElementById(`input-logros-${id}`).checked;
    }
    if (config.usaEstadoSerie) {
        actualizado.estadoSerie = document.getElementById(`estadoSerie-${id}`).value;
    }
    if (config.usaEpisodios) {

        const caps = document
            .getElementById(`input-capitulosPorTemporada-${id}`)
            .value.split(",")
            .map(c => parseInt(c.trim()));

        actualizado.temporadas =
            caps.map((c, i) => ({ numero: i + 1, capitulos: c }));

        actualizado.progreso = {
            temporada: parseInt(
                document.getElementById(`input-temporadaActual-${id}`).value
            ),
            capitulo: parseInt(
                document.getElementById(`input-capituloActual-${id}`).value
            )
        };
    }
    if (config.usaCapitulos) {
        actualizado.capitulosTotales = parseInt(document.getElementById(`capitulosTotales-${id}`).value);
        actualizado.capituloActual = parseInt(document.getElementById(`capituloActual-${id}`).value);
    }
    if (config.usaPaginas) {
        actualizado.paginasTotales = parseInt(document.getElementById(`paginasTotales-${id}`).value);
        actualizado.paginaActual = parseInt(document.getElementById(`paginaActual-${id}`).value);
    }

    actualizado.id = id;
    actualizarItem(actualizado)
        document.getElementById("modal-edicion").classList.add("oculto");
}


function agregarItem(e) {
    e.preventDefault();

    const form = e.target;

    const nuevo = {
        tipo: tipo,
        titulo: form.titulo.value,
        estado: form.estado.value,
        fecha: form.fecha.value,
        imagen: form.imagen.value || null,
        valoracion: parseInt(form.valoracion.value)
    };

    if (config.usaPlataforma) {
        nuevo.plataforma = form.plataforma.value;
    }
    
    if (config.usalogros) {
        nuevo.logros = form.logros.checked;
    }

    if (config.usaEpisodios) {
        const caps = form.capitulosPorTemporada.value
            .split(",")
            .map(c => parseInt(c.trim()));
        nuevo.temporadas = caps.map((c, i) => ({ numero: i + 1, capitulos: c }));
        nuevo.progreso = {
            temporada: parseInt(form.temporadaActual.value),
            capitulo: parseInt(form.capituloActualEp.value)
        };
    }

    if (config.usaEstadoSerie) {
        nuevo.estadoSerie = form.estadoSerie.value;
    }

    if (config.usaCapitulos) {
            nuevo.capitulosTotales = parseInt(form.capitulosTotales.value);
            nuevo.capituloActual = parseInt(form.capituloActual.value);
        }
    
    if (config.usaPaginas) {
            nuevo.paginasTotales = parseInt(form.paginasTotales.value);
            nuevo.paginaActual = parseInt(form.paginaActual.value);
    }

    fetch("/items", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(nuevo)
    })
    .then(res => res.json())
    .then(() => {
        form.reset();
        cargarItems();
    })
    .catch(err => console.error("Error al cargar items:", err));
}

function eliminarItem(id) {

    idAEliminar = id;
    document.getElementById("modalConfirmacion").classList.remove("oculto");
}

document.addEventListener("DOMContentLoaded", () => {
    // botones del modal
    const btnConfirmar = document.getElementById("btnConfirmar");
    const btnCancelar = document.getElementById("btnCancelar");

    if(btnConfirmar){
       btnConfirmar.addEventListener("click", () => {
           if (!idAEliminar) return;
           fetch(`/items/${idAEliminar}`, {method: "DELETE"})
               .then(res => res.json())
               .then(() => {
                   idAEliminar = null;
                   document.getElementById("modalConfirmacion").classList.add("oculto");
                   cargarItems();
               })
               .catch(err => console.error("Error al cargar items:", err));
      });
    }
    if (btnCancelar){
        btnCancelar.addEventListener("click", () => {
           idAEliminar = null;
           document.getElementById("modalConfirmacion").classList.add("oculto");
        });
    }
    // inicio
    cargarItems();
});

function mostrar(lista) {
    const contenedor = document.getElementById("lista");
    contenedor.innerHTML = "";

    lista.forEach(item => {
        const card = document.createElement("article");
        card.className = "card";

        const tipoImagen = config.imagen;
        card.id = `card-${item.id}`
        let html = `
            <div class=card>
            <div class="imagen ${tipoImagen}">
                <img src="${item.imagen}" alt="${item.titulo}">
            </div>
            <div class="info">
            <h3>${item.titulo}</h3>
            <p>Estado: ${item.estado}</p>
            <p>Agregado: ${item.fecha}</p>
        `;

        if (config.usaEstadoSerie) {
            html += `<p>Estado de la serie: ${item.estadoSerie}</p>`;
        }

        if (config.usaPlataforma && item.plataforma) {
            html += `<p>Plataforma: ${item.plataforma}</p>`;
        }

        if (config.usalogros) {
            html += `
            <label>
            <input type="checkbox" ${item.logros ? "checked" : ""}>
            Logros Completados
            </label>
            `;
        }

        if (config.usaEpisodios && item.temporadas?.length) {
            const ultima = item.temporadas[item.temporadas.length - 1];
            html += `<p>Ultima temporada: T${ultima.numero}
            (${ultima.capitulos} capítulos)</p>`;
        }

        if (config.usaEpisodios) {
            html +=`
            <p>Progreso: T${item.progreso.temporada} · 
            Ep ${item.progreso.capitulo} </p>`;
        }

        if (config.usaEpisodios) {
            html +=`
            <div class="progreso">
            <button class="menos">-</button>
            <button class="mas">+</button>
            </div>
            `;
        }


        if (config.usaCapitulos) {
            const porcentaje = Math.floor((item.capituloActual / item.capitulosTotales) * 100);
            
            html += `<p>Progreso: Capítulo ${item.capituloActual} de ${item.capitulosTotales}
        (${porcentaje}%)</p>
        <div class="barra">
        <div class="barra-interna" style="width: ${porcentaje}%"></div>
        </div>

        <div class="progreso-capitulo">
        <button class="menos">-</button>
        <button class="mas">+</button>
        </div>
        `;

    
        }

        if (config.usaPaginas) {
            const porcentaje = Math.floor((item.paginaActual / item.paginasTotales) * 100);

            html += `<p> Pagina: ${item.paginaActual} / ${item.paginasTotales}
        (${porcentaje}%)</p>
        
        <div class="barra">
        <div class="barra-interna" style="width: ${porcentaje}%"></div>
        </div>
        <div class="progreso-libro">
        <button class="menos">-</button>
        <button class="mas">+</button>
        </div>
        `;
        }

        html += `</div>
                 <select class="select-valoracion">
                    <option value="5" ${item.valoracion == 5 ? "selected" : ""}>Me Encanta</option>
                    <option value="4" ${item.valoracion == 4 ? "selected" : ""}>Me gustó</option>
                    <option value="3" ${item.valoracion == 3 ? "selected" : ""}>Indiferente</option>
                    <option value="2" ${item.valoracion == 2 ? "selected" : ""}>No me gustó</option>
                    <option value="1" ${item.valoracion == 1 ? "selected" : ""}>Pésimo</option>
                    <option value="0" ${item.valoracion == 0 ? "selected" : ""}>Evalúa</option>
                 </select>
                 <button onclick="activarEdicion(${item.id})">Editar</button>
                 <button onclick="eliminarItem(${item.id})">Eliminar</button>
                 </div>`;
        card.innerHTML = html;
        const selectValoracion = card.querySelector(".select-valoracion");
// Aplicar color inicial
selectValoracion.style.backgroundColor = obtenerColorValoracion(item.valoracion);
// Cuando cambie
selectValoracion.addEventListener("change", () => {
    item.valoracion = parseInt(selectValoracion.value);
    selectValoracion.style.backgroundColor = obtenerColorValoracion(item.valoracion);
    actualizarItem(item);
});

        if (config.usalogros) {
            const checkbox = card.querySelector("input[type='checkbox']");
            checkbox.addEventListener("change", () => {
                item.logros = checkbox.checked;
                actualizarItem(item);
            });
        }
         if (config.usaEpisodios) {
            const btnMas = card.querySelector(".mas");
            const btnMenos = card.querySelector(".menos");

            btnMas.onclick = () => {
              if (item.progreso.capitulo < item.temporadas[item.progreso.temporada - 1].capitulos) {
                item.progreso.capitulo++;
                actualizarItem(item);
                mostrar(dataOriginal);
                }
            };
            btnMenos.onclick = () => {
                if (item.progreso.capitulo > 1) {
                    item.progreso.capitulo--;
                    actualizarItem(item);
                    mostrar(dataOriginal);
                }
            };
        }
        if (config.usaPaginas)  {
            const btnMas = card.querySelector(".progreso-libro .mas");
            const btnMenos = card.querySelector(".progreso-libro .menos");
            btnMas.onclick = () => {
                if (item.paginaActual < item.paginasTotales) {
                    item.paginaActual++;
                    actualizarItem(item);
                    mostrar(dataOriginal);
                }
            };
            btnMenos.onclick = () => {
                if (item.paginaActual > 1) {
                    item.paginaActual--;
                    actualizarItem(item);
                    mostrar(dataOriginal);
                }
            };
        }

        if (config.usaCapitulos)  {
            const btnMas = card.querySelector(".progreso-capitulo .mas");
            const btnMenos = card.querySelector(".progreso-capitulo .menos");

            btnMas.onclick = () => {
                if (item.capituloActual < item.capitulosTotales) {
                    item.capituloActual++;
                    actualizarItem(item);
                    mostrar(dataOriginal);
                }
            };
            btnMenos.onclick = () => {
                if (item.capituloActual > 0) {
                    item.capituloActual--;
                    actualizarItem(item);
                    mostrar(dataOriginal);
                }
            };
        }
        

        contenedor.appendChild(card);
    }) ;
}

function crearFormulario() {
    const form = document.getElementById("formulario");
    form.innerHTML = "";
    //titulo
    form.innerHTML +=`<input type="text" id="titulo" placeholder="Título" required>`;
    //estado
    const selectEstado = document.createElement("select");
    selectEstado.name = "estado";
    config.estados.forEach(estado => {
        const option = document.createElement("option");
        option.value = estado;
        option.textContent = estado;
        selectEstado.appendChild(option);
    });
    form.appendChild(selectEstado);
    //fecha
    form.innerHTML += `<input type="date" id="fecha" required>`;
    // imagen
    form.innerHTML += `<input type="text" id="imagen" placeholder="URL de la imagen">`;
    //Valoración
    form.innerHTML += `<select name="valoracion" id="valoracion">
                          <option value="5">Me Encanta</option>
                          <option value="4">Me gustó</option>
                          <option value="3">Indiferente</option>
                          <option value="2">No me gustó</option>
                          <option value="1">Pésimo</option>
                          <option value="0">Evalúa</option>
                       </select>`;
    // plataforma
    if (config.usaPlataforma) {
        form.innerHTML += `<input type="text" id="plataforma" placeholder="Plataforma">`;
    }
    // logros
    if (config.usalogros) {
        form.innerHTML += `<label class="labelFormulario">Logros Completados<input type="checkbox" id="logros"></label>`;
    }
    // Episodios
    if (config.usaEpisodios) {
        form.innerHTML += `
        <input type="number" id="temporadasTotal" placeholder="Cantidad de Temporadas" min="1">
        <input type="text" id="capitulosPorTemporada" placeholder="Capítulo por temporada (ej: 12,15,24)" min="1">
        <input type="number" id="temporadaActual" placeholder="Temporada actual" min="1">
        <input type="number" id="capituloActualEp" placeholder="Capítulo actual" min="1">
        `;
    }
    // Estado de la serie
    if (config.usaEstadoSerie) {
        const selectEstadoSerie = document.createElement("select");
        selectEstadoSerie.name = "estadoSerie";
        ["En emisión", "Finalizada", "Temporada confirmada", "Cancelada", "Temporada sin confirmar", "publicación"]
            .forEach(e => {
                const opt = document.createElement("option");
                opt.value = e;
                opt.textContent = e;
                selectEstadoSerie.appendChild(opt);
            });
            form.appendChild(selectEstadoSerie);
        }
    // Capítulos
    if (config.usaCapitulos) {
        form.innerHTML += `
        <input type="number" id="capitulosTotales" placeholder="Capítulos totales" min="1" required>
        <input type="number" id="capituloActual" placeholder="Capítulo actual" min="0" required>
        `;
    }
    // Paginas
    if (config.usaPaginas) {
        form.innerHTML += `
        <input type="number" id="paginasTotales" placeholder="Paginas totales" min="1" required>
        <input type="number" id="paginaActual" placeholder="Página actual" min="0" required>
        `;
    }
    // botón de submit
    form.innerHTML += `<button type="submit">Agregar</button>`;
    form.addEventListener("submit", agregarItem);
}

function crearFiltros() {
    const filtrosDiv = document.getElementById("filtros");
    filtrosDiv.innerHTML = "";

    const btnTodos = document.createElement("button");
    btnTodos.textContent = "Todos";
    btnTodos.onclick = () => mostrar(dataOriginal);
    filtrosDiv.appendChild(btnTodos);

    config.estados.forEach(estado => {
        const btn = document.createElement("button");
        btn.textContent = estado;
        btn.onclick = () =>
            mostrar(dataOriginal.filter(i => i.estado === estado));
        filtrosDiv.appendChild(btn);
    });
}

function activarEdicion(id) {
    const item = dataOriginal.find(i => i.id === id);

    const modal = document.getElementById("modal-edicion");
    const contenido = document.getElementById("modal-contenido");

    modal.classList.remove("oculto");

    let camposExtra = "";

    if (config.usaPlataforma) {
        camposExtra += `<input type="text" id="input-plataforma-${item.id}" value="${item.plataforma || ""}">`;
    }
    if (config.usalogros) {
        camposExtra += `<label><input type="checkbox" id="input-logros-${item.id}" ${item.logros ? "checked" : ""}> Logros Completados</label>`;
    }
    if (config.usaEpisodios) {
        camposExtra += `
        <input type="text" id="input-capitulosPorTemporada-${id}" placeholder="Capítulos por temporada (ej: 12,15,24)"
        value="${item.temporadas.map(t => t.capitulos).join(",")}">

        <input type="number" id="input-temporadaActual-${id}" 
        value="${item.progreso.temporada}">

        <input type="number" id="input-capituloActual-${id}" 
        value="${item.progreso.capitulo}">
        `;
    }

    if (config.usaEstadoSerie) {
        const estados = ["En emisión", "Finalizada", "Temporada confirmada", "Cancelada", "Temporada sin confirmar", "Publicación"];
        camposExtra += `<select id="estadoSerie-${item.id}">`;
        estados.forEach(e => {
            camposExtra += `<option value="${e}" ${e === item.estadoSerie ? "selected" : ""}>${e}</option>`;
        });
        camposExtra += `</select>`;
    }
    if (config.usaCapitulos) {
        camposExtra += `
        <input type="number" id="capitulosTotales-${item.id}" value="${item.capitulosTotales}" placeholder="Capítulos totales" min="1">
        <input type="number" id="capituloActual-${item.id}" value="${item.capituloActual}" placeholder="Capítulo actual" min="0">
        `;
    }
    if (config.usaPaginas) {
        camposExtra += `
        <input type="number" id="paginasTotales-${item.id}" value="${item.paginasTotales}" placeholder="Paginas totales" min="1">
        <input type="number" id="paginaActual-${item.id}" value="${item.paginaActual}" placeholder="Página actual" min="0">
        `;
    }

    contenido.innerHTML = `
    <input type="text" id="input-titulo-${id}" value="${item.titulo}">

    <select id="input-estado-${id}">
    ${config.estados.map(e => `<option value="${e}" ${e === item.estado ? "selected" : ""}>${e}</option>`).join("")}
    </select>

    <input type="date" id="edit-fecha-${id}" value="${item.fecha || ""}">

    <input type="text" id="input-imagen-${id}" value="${item.imagen || ""}" placeholder="URL de la imagen">

    <select id="input-valoracion-${id}">
     <option value="5" ${item.valoracion == 5 ? "selected" : ""}>Me Encanta</option>
     <option value="4" ${item.valoracion == 4 ? "selected" : ""}>Me gustó</option>
     <option value="3" ${item.valoracion == 3 ? "selected" : ""}>Indiferente</option>
     <option value="2" ${item.valoracion == 2 ? "selected" : ""}>No me gustó</option>
     <option value="1" ${item.valoracion == 1 ? "selected" : ""}>Pésimo</option>
     <option value="0" ${item.valoracion == 0 ? "selected" : ""}>Evalúa</option>
    </select>

    ${camposExtra}

    <button onclick="guardarEdicionCompleta(${id})">Guardar</button>
    <button type="button" onclick="cerrarModalEdicion()">Cancelar</button>`;
}

function cerrarModalEdicion() {
    const modal = document.getElementById("modal-edicion");
    const contenido = document.getElementById("modal-contenido");
     modal.classList.add("oculto");
     contenido.innerHTML = "";
}


document.getElementById("modal-edicion").addEventListener("click", function(e){
    if(e.target.id === "modal-edicion"){
        this.classList.add("oculto");
    }
});


function obtenerColorValoracion(valor) {
    const colores = {
        5: "#00c853",   // verde fuerte
        4: "#64dd17",   // verde claro
        3: "#ffd600",   // amarillo
        2: "#ff6d00",   // naranja
        1: "#d50000",    // rojo
        0: "#a7a7a7"    // gris
    };

    return colores[valor] || "#999";
}


const toggleBtn = document.getElementById("toggle-form");
const formContainer = document.getElementById("form-container");

toggleBtn.addEventListener("click", () => {
    const visible = !formContainer.classList.contains("oculto");

    if (visible) {
        formContainer.classList.add("oculto");
        toggleBtn.textContent = "Agregar nuevo";
    } else {
        formContainer.classList.remove("oculto");
        toggleBtn.textContent = "Cerrar formulario";
    }
});