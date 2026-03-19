// ╔══════════════════════════════════════════════════════════╗
// ║  config.js — CONFIGURACIÓN DE CATEGORÍAS                ║
// ╠══════════════════════════════════════════════════════════╣
// ║  Aquí defines cómo se comporta cada categoría.          ║
// ║  Si quieres añadir una categoría nueva, copia un        ║
// ║  bloque y cambia los valores.                           ║
// ║                                                          ║
// ║  Cada categoría tiene estas propiedades:                 ║
// ║  · label            → nombre con emoji (aparece en UI)  ║
// ║  · color            → color hex de la categoría         ║
// ║  · estados          → lista de estados posibles         ║
// ║  · estadosCompletados → cuáles cuentan como "terminado" ║
// ║  · usalogros        → true si tiene casilla de logros   ║
// ║  · usaPlataforma    → true si tiene campo plataforma    ║
// ║  · usaEpisodios     → true si tiene temporadas/eps      ║
// ║  · usaEstadoSerie   → true si tiene "En emisión" etc.   ║
// ║  · usaCapitulos     → true si tiene capítulos (cómics)  ║
// ║  · usaPaginas       → true si tiene páginas (libros)    ║
// ╚══════════════════════════════════════════════════════════╝

const CONFIG = {

    // ── Juegos ───────────────────────────────────────────────
    // Único tipo con logros. La plataforma sería Steam, PS5, etc.
    juegos: {
        label:  "🎮 Juegos",
        color:  "#7c5cfc",   // ← morado
        estados: ["Jugando", "Completado", "Abandonado", "Pausado", "Cierre de servidor", "Pendiente"],
        estadosCompletados: ["Completado"],
        usalogros:      true,   // ← muestra casilla de logros
        opcionesLogros: ["Todos completados", "Algunos completados", "En proceso", "No se completan", "No tiene logros"],
        usaPlataforma:  true,
        usaDlcs: true,
        estadosDlc: ["Pendiente", "Jugando", "Completado", "Abandonado", "Pausado"],
        tiposDlc: ["DLC", "Expansión", "Edición", "Contenido de temporada"],
        imagen:         "vertical",
        usaEpisodios:   false,
        usaEstadoSerie: false,
        usaCapitulos:   false,
        usaPaginas:     false
    },

    // ── Animes ───────────────────────────────────────────────
    // Tiene seguimiento de episodios por temporada y estado de emisión.
    animes: {
        label:  "⛩ Animes",
        color:  "#2e51a2",   // ← azul
        estados: ["Viendo", "Vista", "Abandonado", "Pendiente", "Pausado", "Esperando"],
        estadosCompletados: ["Vista"],
        usalogros:      false,
        usaPlataforma:  true,
        imagen:         "vertical",
        usaEpisodios:   true,   // ← activa grid de episodios y temporadas
        usaEstadoSerie: true,   // ← activa select "En emisión", "Finalizada"...
        usaCapitulos:   false,
        usaPaginas:     false
    },

    // ── Películas ────────────────────────────────────────────
    // Solo dos estados: Pendiente o Vista. Sin progreso.
    peliculas: {
        label:  "🎬 Películas",
        color:  "#ed1c24",   // ← rojo
        estados: ["Pendiente", "Vista"],
        estadosCompletados: ["Vista"],
        usalogros:      false,
        usaPlataforma:  true,
        imagen:         "vertical",
        usaEpisodios:   false,
        usaEstadoSerie: false,
        usaCapitulos:   false,
        usaPaginas:     false
    },

    // ── Series ───────────────────────────────────────────────
    // Igual que animes: episodios por temporada + estado de emisión.
    series: {
        label:  "📺 Series",
        color:  "#00c030",   // ← verde
        estados: ["Viendo", "Vista", "Abandonado", "Pendiente", "Pausado", "Esperando"],
        estadosCompletados: ["Vista"],
        usalogros:      false,
        usaPlataforma:  true,
        imagen:         "vertical",
        usaEpisodios:   true,
        usaEstadoSerie: true,
        usaCapitulos:   false,
        usaPaginas:     false
    },

    // ── Cómics ───────────────────────────────────────────────
    // Seguimiento de capítulos (no episodios). Sin plataforma.
    comics: {
        label:  "💥 Cómics",
        color:  "#ff6b35",   // ← naranja
        estados: ["Leyendo", "Leído", "Abandonado", "Pendiente", "Pausado"],
        estadosCompletados: ["Leído"],
        usalogros:      false,
        usaPlataforma:  false,
        imagen:         "vertical",
        usaEpisodios:   false,
        usaEstadoSerie: false,
        usaCapitulos:   true,   // ← activa barra de capítulos
        usaPaginas:     false
    },

    // ── Libros ───────────────────────────────────────────────
    // Seguimiento de páginas. Sin plataforma.
    libros: {
        label:  "📚 Libros",
        color:  "#c8a85e",   // ← dorado
        estados: ["Leyendo", "Leído", "Abandonado", "Pendiente", "Pausado"],
        estadosCompletados: ["Leído"],
        usalogros:      false,
        usaPlataforma:  false,
        imagen:         "vertical",
        usaEpisodios:   false,
        usaEstadoSerie: false,
        usaCapitulos:   false,
        usaPaginas:     true   // ← activa barra de páginas
    },

    // ── Mangas ───────────────────────────────────────────────
    // Capítulos + estado de publicación (En emisión, Finalizado...).
    mangas: {
        label:  "📕 Mangas",
        color:  "#e91e63",   // ← rosa
        estados: ["Leyendo", "Leído", "Abandonado", "Pendiente", "Pausado"],
        estadosCompletados: ["Leído"],
        usalogros:      false,
        usaPlataforma:  false,
        imagen:         "vertical",
        usaEpisodios:   false,
        usaTomos:      true,   // ← nuevo
        usaEstadoSerie: true,   // ← "En emisión", "Finalizada"...
        usaCapitulos:   false,
        usaPaginas:     false
    }
};

// ── Helpers globales ──────────────────────────────────────
// Estas funciones las usan todos los archivos JS.
// Convierten un número (0–5) en texto o en color.

// Texto de la valoración: 5 → "Me Encanta", 0 → "Evalúa"
function valoracionLabel(v) {
    return {
        5: "Me Encanta",
        4: "Me gustó",
        3: "Indiferente",
        2: "No me gustó",
        1: "Pésimo",
        0: "Evalúa"
    }[v] ?? "—";
}

function claseLogros(valor) {
    if (valor === "Todos completados")    return "tag-logros-si";
    if (valor === "Algunos completados")  return "tag-logros-algunos";
    if (valor === "En proceso")           return "tag-logros-proceso";
    if (valor === "Sin completar")        return "tag-logros-no";
    return "tag-logros-ninguno"; // "No tiene logros"
}

// Color de la valoración: 5 → verde brillante, 1 → rojo
function valoracionColor(v) {
    return {
        5: "#00c853",
        4: "#64dd17",
        3: "#ffd600",
        2: "#ff6d00",
        1: "#d50000",
        0: "#6b7280"
    }[v] ?? "#6b7280";
}

// Emoji del tipo: "juegos" → "🎮", "peliculas" → "🎬"...
function tipoEmoji(tipo) {
    return {
        juegos:    "🎮",
        peliculas: "🎬",
        series:    "📺",
        animes:    "⛩",
        mangas:    "📕",
        comics:    "💥",
        libros:    "📚"
    }[tipo] ?? "📌";
}
