// ╔══════════════════════════════════════════════════════════╗
// ║  datePicker.js — SELECTOR DE FECHA PERSONALIZADO        ║
// ╠══════════════════════════════════════════════════════════╣
// ║  Reemplaza el input[type="date"] nativo del navegador   ║
// ║  por un calendario con estilo propio de NEXUS.          ║
// ║                                                          ║
// ║  Cómo funciona:                                          ║
// ║  1. initDatePickers() busca todos los input[type="date"]║
// ║  2. Por cada uno crea un objeto DatePicker               ║
// ║  3. El DatePicker esconde el input original y pone      ║
// ║     encima un div visual con el calendario desplegable  ║
// ║  4. Al seleccionar fecha, escribe el valor en el input  ║
// ║     oculto en formato YYYY-MM-DD (lo que espera la BD)  ║
// ║                                                          ║
// ║  Cosas que puedes ajustar:                              ║
// ║  · Nombres de meses: array MESES                        ║
// ║  · Nombres de días:  array DIAS_SEMANA                  ║
// ║  · Años disponibles: bucle en _renderAños (±30 años)    ║
// ╚══════════════════════════════════════════════════════════╝

// Nombres de meses en español
const MESES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

// Abreviaturas de días de la semana, empezando en lunes
const DIAS_SEMANA = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

// ── Clase principal del DatePicker ────────────────────────
class DatePicker {

    // inputOculto → el <input type="date"> original que se va a esconder
    // placeholder → texto cuando no hay fecha seleccionada
    constructor(inputOculto, placeholder = "Seleccionar fecha") {
        this.input       = inputOculto;
        this.placeholder = placeholder;
        this.abierto     = false;
        this.vista       = "dias"; // puede ser "dias", "meses" o "años"

        // Si el input ya tenía una fecha guardada, parsearla
        const val = this.input.value;
        if (val) {
            const [y, m, d] = val.split("-").map(Number);
            this.selAño = y;
            this.selMes = m - 1; // los meses en JS van de 0 a 11
            this.selDia = d;
        } else {
            this.selAño = null;
            this.selMes = null;
            this.selDia = null;
        }

        // El mes/año que se está viendo en el calendario
        // (puede diferir del seleccionado al navegar)
        const hoy = new Date();
        this.viewMes = this.selMes ?? hoy.getMonth();
        this.viewAño = this.selAño ?? hoy.getFullYear();

        this._construir();
    }

    // ── Construir los elementos visuales en el DOM ────────────
    _construir() {
        // Contenedor que envuelve todo
        this.wrap = document.createElement("div");
        this.wrap.className = "date-picker-wrap";

        // El "input" visual (div clickeable que muestra la fecha)
        this.display = document.createElement("div");
        this.display.className = "date-picker-input";
        this.display.innerHTML = `<span class="dp-texto">${this._textoDisplay()}</span><span class="date-picker-icon"></span>`;
        this.display.addEventListener("click", () => this.toggle());

        // El dropdown del calendario (empieza oculto)
        this.dropdown = document.createElement("div");
        this.dropdown.className = "date-picker-dropdown";
        this.dropdown.style.display = "none";
        this.dropdown.addEventListener("click", e => e.stopPropagation()); // evita que se cierre al hacer click dentro
        this._renderDropdown();

        this.wrap.appendChild(this.display);
        this.wrap.appendChild(this.dropdown);

        // Insertar el wrap antes del input original y ocultarlo
        this.input.parentNode.insertBefore(this.wrap, this.input);
        this.input.style.display = "none";

        // Cerrar al hacer click fuera del calendario
        document.addEventListener("click", (e) => {
            if (!this.wrap.contains(e.target)) this.cerrar();
        });
    }

    // ── Texto que muestra el display ──────────────────────────
    // Sin fecha: "Seleccionar fecha"  |  Con fecha: "05 / 03 / 2024"
    _textoDisplay() {
        if (this.selDia === null) return this.placeholder;
        return `${String(this.selDia).padStart(2,"0")} / ${String(this.selMes+1).padStart(2,"0")} / ${this.selAño}`;
    }

    // ── Renderizar el dropdown según la vista activa ──────────
    _renderDropdown() {
        this.dropdown.innerHTML = "";
        if      (this.vista === "dias")  this._renderDias();
        else if (this.vista === "meses") this._renderMeses();
        else if (this.vista === "años")  this._renderAños();
    }

    // ── Vista de días (calendario mensual) ───────────────────
    _renderDias() {
        const hoy      = new Date();
        const primerDia = new Date(this.viewAño, this.viewMes, 1).getDay();
        const offset   = (primerDia + 6) % 7; // offset para que la semana empiece en lunes
        const diasMes  = new Date(this.viewAño, this.viewMes + 1, 0).getDate();

        // Header: flechas ‹ › y título clickeable (mes + año)
        const header = document.createElement("div");
        header.className = "dp-header";
        header.innerHTML = `
            <button class="dp-nav" data-dir="-1">‹</button>
            <span class="dp-mes-año">${MESES[this.viewMes]} ${this.viewAño}</span>
            <button class="dp-nav" data-dir="1">›</button>`;

        // Click en el título → ir a la vista de meses
        header.querySelector(".dp-mes-año").addEventListener("click", () => {
            this.vista = "meses";
            this._renderDropdown();
        });

        // Flechas ‹ › para navegar entre meses
        header.querySelectorAll(".dp-nav").forEach(btn => {
            btn.addEventListener("click", () => {
                this.viewMes += parseInt(btn.dataset.dir);
                if (this.viewMes > 11) { this.viewMes = 0;  this.viewAño++; } // dic → ene del año siguiente
                if (this.viewMes < 0)  { this.viewMes = 11; this.viewAño--; } // ene → dic del año anterior
                this._renderDropdown();
            });
        });

        // Fila de abreviaturas: Lu Ma Mi Ju Vi Sá Do
        const semana = document.createElement("div");
        semana.className = "dp-dias-semana";
        DIAS_SEMANA.forEach(d => {
            const el = document.createElement("div");
            el.className = "dp-dia-label";
            el.textContent = d;
            semana.appendChild(el);
        });

        // Grid con los días del mes
        const grid = document.createElement("div");
        grid.className = "dp-dias";

        // Celdas vacías al inicio para alinear el primer día
        for (let i = 0; i < offset; i++) {
            const vacio = document.createElement("div");
            vacio.className = "dp-dia dp-dia-vacio";
            grid.appendChild(vacio);
        }

        // Un botón por cada día del mes
        for (let d = 1; d <= diasMes; d++) {
            const btn = document.createElement("button");
            btn.type = "button"; // ← evita que haga submit del formulario
            btn.className = "dp-dia";
            btn.textContent = d;

            const esHoy = d === hoy.getDate() && this.viewMes === hoy.getMonth() && this.viewAño === hoy.getFullYear();
            const esSel = d === this.selDia   && this.viewMes === this.selMes    && this.viewAño === this.selAño;

            if (esHoy && !esSel) btn.classList.add("dp-dia-hoy"); // borde amarillo = hoy
            if (esSel)           btn.classList.add("dp-dia-sel"); // relleno amarillo = seleccionado

            btn.addEventListener("click", () => this._seleccionarDia(d));
            grid.appendChild(btn);
        }

        // Footer con accesos rápidos
        const footer = document.createElement("div");
        footer.className = "dp-footer";
        footer.innerHTML = `<button type="button" class="dp-hoy-btn">Hoy</button><button type="button" class="dp-limpiar-btn">Limpiar</button>`;

        // "Hoy" → selecciona la fecha de hoy
        footer.querySelector(".dp-hoy-btn").addEventListener("click", () => {
            this._seleccionarDia(hoy.getDate(), hoy.getMonth(), hoy.getFullYear());
        });

        // "Limpiar" → borra la fecha seleccionada
        footer.querySelector(".dp-limpiar-btn").addEventListener("click", () => {
            this.selDia = this.selMes = this.selAño = null;
            this.input.value = "";
            this.display.querySelector(".dp-texto").textContent = this.placeholder;
            this.cerrar();
        });

        this.dropdown.appendChild(header);
        this.dropdown.appendChild(semana);
        this.dropdown.appendChild(grid);
        this.dropdown.appendChild(footer);
    }

    // ── Vista de meses (grid 3x4) ─────────────────────────────
    // Aparece al hacer click en el título "Enero 2024"
    _renderMeses() {
        const header = document.createElement("div");
        header.className = "dp-header";
        header.innerHTML = `
            <button class="dp-nav" data-dir="-1">‹</button>
            <span class="dp-mes-año">${this.viewAño}</span>
            <button class="dp-nav" data-dir="1">›</button>`;

        // Click en el año → ir a vista de años
        header.querySelector(".dp-mes-año").addEventListener("click", () => {
            this.vista = "años";
            this._renderDropdown();
        });

        // Flechas para cambiar de año estando en la vista de meses
        header.querySelectorAll(".dp-nav").forEach(btn => {
            btn.addEventListener("click", () => {
                this.viewAño += parseInt(btn.dataset.dir);
                this._renderDropdown();
            });
        });

        const grid = document.createElement("div");
        grid.className = "dp-meses";

        MESES.forEach((mes, i) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "dp-mes-btn" + (i === this.viewMes ? " sel" : "");
            btn.textContent = mes.slice(0, 3); // abreviatura: "Ene", "Feb"...
            btn.addEventListener("click", () => {
                this.viewMes = i;
                this.vista = "dias"; // al elegir mes, volver a la vista de días
                this._renderDropdown();
            });
            grid.appendChild(btn);
        });

        this.dropdown.appendChild(header);
        this.dropdown.appendChild(grid);
    }

    // ── Vista de años (lista scrollable) ─────────────────────
    // Aparece al hacer click en el año dentro de la vista de meses
    _renderAños() {
        const añoActual = new Date().getFullYear();
        const años = [];

        // Desde año actual +1 hasta 30 años atrás
        // Cambia el -30 para mostrar más o menos años
        for (let y = añoActual + 1; y >= añoActual - 10; y--) años.push(y);

        const header = document.createElement("div");
        header.className = "dp-header";
        header.innerHTML = `<span class="dp-mes-año" style="cursor:default">Selecciona año</span>`;

        const grid = document.createElement("div");
        grid.className = "dp-años";

        años.forEach(y => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "dp-año-btn" + (y === this.viewAño ? " sel" : "");
            btn.textContent = y;
            btn.addEventListener("click", () => {
                this.viewAño = y;
                this.vista = "meses"; // al elegir año, ir a vista de meses
                this._renderDropdown();
            });
            grid.appendChild(btn);
        });

        this.dropdown.appendChild(header);
        this.dropdown.appendChild(grid);

        // Scroll automático al año seleccionado
        setTimeout(() => {
            const sel = grid.querySelector(".sel");
            if (sel) sel.scrollIntoView({ block: "center" });
        }, 0);
    }

    // ── Guardar la fecha seleccionada ─────────────────────────
    // Actualiza el display visual y escribe en el input oculto
    _seleccionarDia(d, m, y) {
        this.selDia = d;
        this.selMes = m ?? this.viewMes;
        this.selAño = y ?? this.viewAño;
        this.viewMes = this.selMes;
        this.viewAño = this.selAño;

        // Escribir en el input oculto en formato YYYY-MM-DD
        const mes = String(this.selMes + 1).padStart(2, "0");
        const dia = String(this.selDia).padStart(2, "0");
        this.input.value = `${this.selAño}-${mes}-${dia}`;

        this.display.querySelector(".dp-texto").textContent = this._textoDisplay();
        this.cerrar();
    }

    // ── Abrir / cerrar ────────────────────────────────────────
    toggle() { this.abierto ? this.cerrar() : this.abrir(); }

    abrir() {
        this.abierto = true;
        this.vista   = "dias";
        this.display.classList.add("open");
        this.dropdown.style.display = "block";
        this._renderDropdown();
    }

    cerrar() {
        this.abierto = false;
        this.display.classList.remove("open");
        this.dropdown.style.display = "none";
    }

    // ── Resetear a vacío ─────────────────────────────────────
    // Se llama después de guardar un formulario para dejarlo limpio
    reset() {
        this.selDia = null;
        this.selMes = null;
        this.selAño = null;
        this.input.value = "";
        this.display.querySelector(".dp-texto").textContent = this.placeholder;
        this.cerrar();
    }
}

// ── Resetear todos los date pickers de la página ─────────
// Necesario después de form.reset() porque ese método limpia
// el input oculto pero no actualiza el display visual del picker
function resetDatePickers() {
    document.querySelectorAll(".date-picker-wrap").forEach(wrap => {
        const texto = wrap.querySelector(".dp-texto");
        const input = wrap.querySelector("input[type='date']");
        if (texto) texto.textContent = "Seleccionar fecha";
        if (input) input.value = "";
    });
}

// ── Inicializar todos los inputs de fecha de la página ────
// Busca input[type="date"] sin inicializar y les aplica el DatePicker.
// Se llama desde crearFormulario() y activarEdicionEnModal().
function initDatePickers() {
    document.querySelectorAll("input[type='date']:not(.dp-init)").forEach(input => {
        input.classList.add("dp-init"); // marcar para no inicializar dos veces
        new DatePicker(input);
    });
}
