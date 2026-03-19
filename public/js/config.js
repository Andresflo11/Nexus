const CONFIG = {
    juegos: {
        label: "🎮 Juegos",
        color: "#7c5cfc",
        estados: ["Jugando", "Completado", "Abandonado", "Pausado", "Cierre de servidor", "Pendiente"],
        estadosCompletados: ["Completado"],
        usalogros: true,
        usaPlataforma: true,
        imagen: "vertical",
        usaEpisodios: false,
        usaEstadoSerie: false,
        usaCapitulos: false,
        usaPaginas: false
    },
    animes: {
        label: "⛩ Animes",
        color: "#2e51a2",
        estados: ["Viendo", "Vista", "Abandonado", "Pendiente", "Pausado"],
        estadosCompletados: ["Vista"],
        usalogros: false,
        usaPlataforma: true,
        imagen: "vertical",
        usaEpisodios: true,
        usaEstadoSerie: true,
        usaCapitulos: false,
        usaPaginas: false
    },
    peliculas: {
        label: "🎬 Películas",
        color: "#ed1c24",
        estados: ["Pendiente", "Vista"],
        estadosCompletados: ["Vista"],
        usalogros: false,
        usaPlataforma: true,
        imagen: "vertical",
        usaEpisodios: false,
        usaEstadoSerie: false,
        usaCapitulos: false,
        usaPaginas: false
    },
    series: {
        label: "📺 Series",
        color: "#00c030",
        estados: ["Viendo", "Vista", "Abandonado", "Pendiente", "Pausado"],
        estadosCompletados: ["Vista"],
        usalogros: false,
        usaPlataforma: true,
        imagen: "vertical",
        usaEpisodios: true,
        usaEstadoSerie: true,
        usaCapitulos: false,
        usaPaginas: false
    },
    comics: {
        label: "💥 Cómics",
        color: "#ff6b35",
        estados: ["Leyendo", "Leído", "Abandonado", "Pendiente", "Pausado"],
        estadosCompletados: ["Leído"],
        usalogros: false,
        usaPlataforma: false,
        imagen: "vertical",
        usaEpisodios: false,
        usaEstadoSerie: false,
        usaCapitulos: true,
        usaPaginas: false
    },
    libros: {
        label: "📚 Libros",
        color: "#c8a85e",
        estados: ["Leyendo", "Leído", "Abandonado", "Pendiente", "Pausado"],
        estadosCompletados: ["Leído"],
        usalogros: false,
        usaPlataforma: false,
        imagen: "vertical",
        usaEpisodios: false,
        usaEstadoSerie: false,
        usaCapitulos: false,
        usaPaginas: true
    },
    mangas: {
        label: "📕 Mangas",
        color: "#e91e63",
        estados: ["Leyendo", "Leído", "Abandonado", "Pendiente", "Pausado"],
        estadosCompletados: ["Leído"],
        usalogros: false,
        usaPlataforma: false,
        imagen: "vertical",
        usaEpisodios: false,
        usaEstadoSerie: true,
        usaCapitulos: true,
        usaPaginas: false
    }
};

// Helpers globales de valoración
function valoracionLabel(v) {
    return { 5: "Me Encanta", 4: "Me gustó", 3: "Indiferente", 2: "No me gustó", 1: "Pésimo", 0: "Evalúa" }[v] ?? "—";
}

function valoracionColor(v) {
    return { 5: "#00c853", 4: "#64dd17", 3: "#ffd600", 2: "#ff6d00", 1: "#d50000", 0: "#6b7280" }[v] ?? "#6b7280";
}

function tipoEmoji(tipo) {
    return { juegos:"🎮", peliculas:"🎬", series:"📺", animes:"⛩", mangas:"📕", comics:"💥", libros:"📚" }[tipo] ?? "📌";
}
