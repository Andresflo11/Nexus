const CONFIG = {
    juegos: {
        estados : ["Jugando", "Completado", "Abandonado","Pausado", "Cierre de servidor", "Pendiente"],
        usalogros: true,
        usaPlataforma: true,
        imagen:"vertical",
        usaEpisodios: false,
        usaEstadoSerie: false,
        usaCapitulos: false,
        usaPaginas: false
    },
    animes: {
        estados : ["Viendo", "Vista", "Abandonado", "Pendiente","Pausado","Esperando"],
        usalogros: false,
        usaPlataforma: true,
        imagen:"vertical",
        usaEpisodios: true,
        usaEstadoSerie: true,
        usaCapitulos: false,
        usaPaginas: false
    },
    peliculas: {
        estados : ["Pendiente", "Vista"],
        usalogros: false,
        usaPlataforma: true,
        imagen:"vertical",
        usaEpisodios: false,
        usaEstadoSerie: false,
        usaCapitulos: false,
        usaPaginas: false
    },
    series: {
        estados : ["Viendo", "Vista", "Abandonado","Pendiente","Pausado","Esperando"],
        usalogros: false,
        usaPlataforma: true,
        imagen:"vertical",
        usaEpisodios: true,
        usaEstadoSerie: true,
        usaCapitulos: false,
        usaPaginas: false
    },
    comics: {
        estados : ["Leyendo", "Leído", "Abandonado","Pendiente","Pausado"],
        usalogros: false,
        usaPlataforma: false,
        imagen:"vertical",
        usaEpisodios: false,
        usaEstadoSerie: false,
        usaCapitulos: true,
        usaPaginas: false
    },
    libros: {
        estados : ["Leyendo", "Leído", "Abandonado","Pendiente","Pausado"],
        usalogros: false,
        usaPlataforma: false,
        imagen:"vertical",
        usaEpisodios: false,
        usaEstadoSerie: false,
        usaCapitulos: false,
        usaPaginas: true
    },
    mangas: {
        estados : ["Leyendo", "Leído", "Abandonado","Pendiente","Pausado"],
        usalogros: false,
        usaPlataforma: false,
        imagen:"vertical",
        usaEpisodios: false,
        usaEstadoSerie: true,
        usaCapitulos: true,
        usaPaginas: false
    }
};