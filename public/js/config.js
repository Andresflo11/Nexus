// ╔══════════════════════════════════════════════════════════╗
// ║  config.js — CONFIGURACIÓN DE CATEGORÍAS                ║
// ╠══════════════════════════════════════════════════════════╣
// ║  Aquí defines cómo se comporta cada categoría.          ║
// ║  Si quieres añadir una categoría nueva, copia un        ║
// ║  bloque y cambia los valores.                           ║
// ║                                                          ║
// ║  Cada categoría tiene estas propiedades:                 ║
// ║  · label            → nombre sin emoji (aparece en UI)  ║
// ║  · color            → color hex de la categoría         ║
// ║  · estados          → lista de estados posibles         ║
// ║  · estadosCompletados → cuáles cuentan como "terminado" ║
// ║  · usalogros        → true si tiene casilla de logros   ║
// ║  · usaPlataforma    → true si tiene campo plataforma    ║
// ║  · usaEpisodios     → true si tiene temporadas/eps      ║
// ║  · usaEstadoSerie   → true si tiene "En emisión" etc.   ║
// ║  · usaCapitulos     → true si tiene capítulos (cómics)  ║
// ║  · usaPaginas       → true si tiene páginas (libros)    ║
// ║  · usaTomos         → true si tiene sistema de tomos    ║
// ╚══════════════════════════════════════════════════════════╝

const CONFIG = {

    // ── Juegos ───────────────────────────────────────────────
    juegos: {
        label:  "  Juegos",
        color:  "#7c5cfc",
        estados: ["Jugando", "Completado", "Abandonado", "Pausado", "Cierre de servidor", "Pendiente"],
        estadosCompletados: ["Completado"],
        usalogros:      true,
        opcionesLogros: ["Todos completados", "Algunos completados", "En proceso", "No se completan", "No tiene logros"],
        usaPlataforma:  true,
        usaDlcs:        true,
        estadosDlc:     ["Pendiente", "Jugando", "Completado", "Abandonado", "Pausado"],
        tiposDlc:       ["DLC", "Expansión", "Edición", "Contenido de temporada"],
        imagen:         "vertical",
        usaEpisodios:   false,
        usaEstadoSerie: false,
        usaCapitulos:   false,
        usaPaginas:     false,
        usaTomos:       false
    },

    // ── Animes ───────────────────────────────────────────────
    animes: {
        label:  "  Animes",
        color:  "#2e51a2",
        estados: ["Viendo", "Vista", "Abandonado", "Pendiente", "Pausado", "Esperando"],
        estadosCompletados: ["Vista"],
        usalogros:      false,
        usaPlataforma:  true,
        imagen:         "vertical",
        usaEpisodios:   true,
        usaEstadoSerie: true,
        usaCapitulos:   false,
        usaPaginas:     false,
        usaTomos:       false
    },

    // ── Películas ────────────────────────────────────────────
    peliculas: {
        label:  "  Películas",
        color:  "#ed1c24",
        estados: ["Pendiente", "Vista"],
        estadosCompletados: ["Vista"],
        usalogros:      false,
        usaPlataforma:  true,
        imagen:         "vertical",
        usaEpisodios:   false,
        usaEstadoSerie: false,
        usaCapitulos:   false,
        usaPaginas:     false,
        usaTomos:       false
    },

    // ── Series ───────────────────────────────────────────────
    series: {
        label:  "  Series",
        color:  "#00c030",
        estados: ["Viendo", "Vista", "Abandonado", "Pendiente", "Pausado", "Esperando"],
        estadosCompletados: ["Vista"],
        usalogros:      false,
        usaPlataforma:  true,
        imagen:         "vertical",
        usaEpisodios:   true,
        usaEstadoSerie: true,
        usaCapitulos:   false,
        usaPaginas:     false,
        usaTomos:       false
    },

    // ── Cómics ───────────────────────────────────────────────
    comics: {
        label:  "  Cómics",
        color:  "#ff6b35",
        estados: ["Leyendo", "Leído", "Abandonado", "Pendiente", "Pausado"],
        estadosCompletados: ["Leído"],
        usalogros:      false,
        usaPlataforma:  false,
        imagen:         "vertical",
        usaEpisodios:   false,
        usaEstadoSerie: false,
        usaCapitulos:   true,
        usaPaginas:     false,
        usaTomos:       false
    },

    // ── Libros ───────────────────────────────────────────────
    libros: {
        label:  "  Libros",
        color:  "#c8a85e",
        estados: ["Leyendo", "Leído", "Abandonado", "Pendiente", "Pausado"],
        estadosCompletados: ["Leído"],
        usalogros:      false,
        usaPlataforma:  false,
        imagen:         "vertical",
        usaEpisodios:   false,
        usaEstadoSerie: false,
        usaCapitulos:   false,
        usaPaginas:     true,
        usaTomos:       false
    },

    // ── Mangas ───────────────────────────────────────────────
    mangas: {
        label:  "  Mangas",
        color:  "#e91e63",
        estados: ["Leyendo", "Leído", "Abandonado", "Pendiente", "Pausado"],
        estadosCompletados: ["Leído"],
        usalogros:      false,
        usaPlataforma:  false,
        imagen:         "vertical",
        usaEpisodios:   false,
        usaEstadoSerie: true,
        usaCapitulos:   false,
        usaPaginas:     false,
        usaTomos:       true
    }
};

// ── Helpers globales ──────────────────────────────────────

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

// Clase CSS de logros según el valor
function claseLogros(valor) {
    if (valor === "Todos completados")   return "tag-logros-si";
    if (valor === "Algunos completados") return "tag-logros-algunos";
    if (valor === "En proceso")          return "tag-logros-proceso";
    if (valor === "Sin completar")       return "tag-logros-no";
    return "tag-logros-ninguno";
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

// Emoji del tipo — se mantiene para placeholders del modal y otros usos
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

// SVG del tipo con el color de su categoría
// Uso: tipoSVG("juegos")     → SVG de 16px
//      tipoSVG("juegos", 32) → SVG de 32px
function tipoSVG(tipo, size = 16) {
    const color = CONFIG[tipo]?.color ?? "#888";
    const svgs = {
        juegos:    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4"/><circle cx="16" cy="11" r="1" fill="${color}"/><circle cx="18" cy="13" r="1" fill="${color}"/></svg>`,
        peliculas: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5"/></svg>`,
        series:    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>`,
        animes:    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="6" x2="22" y2="6"/><line x1="4" y1="3" x2="20" y2="3"/><line x1="6" y1="6" x2="6" y2="20"/><line x1="18" y1="6" x2="18" y2="20"/><line x1="6" y1="9" x2="18" y2="9"/></svg>`,
        mangas:    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
        comics:    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8M8 14h4"/></svg>`,
        libros:    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
    };
    return svgs[tipo] ?? "";
}
