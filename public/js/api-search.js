// ╔══════════════════════════════════════════════════════════╗
// ║  api-search.js — BÚSQUEDA AUTOMÁTICA POR APIS EXTERNAS  ║
// ╠══════════════════════════════════════════════════════════╣
// ║  Inyecta autocompletado en los formularios de NEXUS.    ║
// ║  Al escribir el título, sugiere resultados reales y     ║
// ║  rellena automáticamente todos los campos.              ║
// ║                                                          ║
// ║  APIs usadas (todas gratuitas, sin key o key pública):  ║
// ║  · Juegos    → RAWG.io (requiere API key gratuita)      ║
// ║  · Animes    → Jikan (MyAnimeList, sin key)             ║
// ║  · Mangas    → Jikan (MyAnimeList, sin key)             ║
// ║  · Películas → TMDB (requiere API key gratuita)         ║
// ║  · Series    → TMDB (requiere API key gratuita)         ║
// ║  · Libros    → Open Library (sin key)                   ║
// ║  · Cómics    → Open Library (sin key)                   ║
// ╠══════════════════════════════════════════════════════════╣
// ║  CONFIGURACIÓN DE KEYS:                                  ║
// ║  Edita el objeto API_KEYS de abajo con tus propias keys  ║
// ╚══════════════════════════════════════════════════════════╝

// ── Configura tus API keys aquí ──────────────────────────────
const API_KEYS = {
    rawg: "",
    tmdb: ""
};

// ── Estado interno ────────────────────────────────────────────
let _apiSearchTimer   = null;
let _apiDropdowns     = {};      // { formId: dropdownElement }
let _apiAbortCtrl     = {};      // AbortControllers por formId

// ── Estilos del dropdown ──────────────────────────────────────
const API_DROPDOWN_CSS = `
#api-search-style { display: none }
.api-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #141720;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    z-index: 99999;
    max-height: 360px;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
}
.api-dropdown::-webkit-scrollbar { width: 4px }
.api-dropdown::-webkit-scrollbar-track { background: transparent }
.api-dropdown::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px }
.api-result-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.85rem;
    cursor: pointer;
    transition: background 0.12s;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}
.api-result-item:last-child { border-bottom: none }
.api-result-item:hover, .api-result-item.selected { background: rgba(255,255,255,0.06) }
.api-result-poster {
    width: 36px;
    height: 52px;
    border-radius: 5px;
    object-fit: cover;
    background: #1b2030;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.api-result-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 5px;
}
.api-result-poster-placeholder {
    font-size: 1.1rem;
    opacity: 0.4;
}
.api-result-info {
    flex: 1;
    min-width: 0;
}
.api-result-titulo {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    color: #f0f2f7;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.api-result-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    color: #6b7280;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.api-result-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.58rem;
    padding: 2px 7px;
    border-radius: 99px;
    border: 1px solid;
    flex-shrink: 0;
    white-space: nowrap;
}
.api-search-loading {
    padding: 0.85rem 1rem;
    text-align: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: #6b7280;
}
.api-search-empty {
    padding: 0.85rem 1rem;
    text-align: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: #6b7280;
}
.api-search-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    display: flex;
    align-items: center;
    transition: color 0.15s;
    z-index: 10;
}
.api-search-btn:hover { color: #f0f2f7 }
.api-search-btn.loading { animation: api-spin 0.8s linear infinite }
@keyframes api-spin { to { transform: translateY(-50%) rotate(360deg) } }
.api-titulo-wrap {
    position: relative;
}
`;

// Inyectar estilos una sola vez
(function injectStyles() {
    if (document.getElementById("api-search-style")) return;
    const style = document.createElement("style");
    style.id = "api-search-style";
    style.textContent = API_DROPDOWN_CSS;
    document.head.appendChild(style);
})();

// ═══════════════════════════════════════════════════════════════
// ── ADAPTADORES POR TIPO ────────────────────────────────────────
// Cada adaptador tiene: buscar(query) → [{...dataNormalizada}]
// ═══════════════════════════════════════════════════════════════

const API_ADAPTERS = {

    // ── JUEGOS → RAWG ──────────────────────────────────────────
    juegos: {
    color: "#7c5cfc",
    emoji: "🎮",
    async buscar(query, signal) {
        const url = `/api/rawg?search=${encodeURIComponent(query)}`;
        const r   = await fetch(url, { signal });
        const d   = await r.json();
        return (d.results || []).map(g => ({
                titulo:   g.name,
                imagen:   g.background_image || null,
                anio:     g.released ? parseInt(g.released.split("-")[0]) : null,
                creador:  g.developers?.[0]?.name || null,
                generos:  (g.genres || []).map(x => x.name),
                plataformas: (g.platforms || []).map(p => _mapPlatformRawg(p.platform.name)),
                duracion: null,
                meta:     `${g.released?.split("-")[0] || "—"} · ⭐ ${g.rating?.toFixed(1) || "—"}`,
                badge:    g.released?.split("-")[0] || null,
                rawData:  g
            }));
        }
    },

    // ── ANIMES → JIKAN ─────────────────────────────────────────
    animes: {
        color: "#2e51a2",
        emoji: "⛩",
        async buscar(query, signal) {
            const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`;
            const r   = await fetch(url, { signal });
            const d   = await r.json();
            return (d.data || []).map(a => ({
                titulo:     a.title_spanish || a.title_english || a.title,
                imagen:     a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || null,
                anio:       a.year || (a.aired?.from ? new Date(a.aired.from).getFullYear() : null),
                creador:    a.studios?.[0]?.name || null,
                generos:    (a.genres || []).map(x => _mapGenreAnime(x.name)),
                estadoSerie: _mapStatusAnime(a.status),
                temporadas: _buildTemporadasAnime(a),
                duracion:   a.episodes ? `${a.episodes} eps` : null,
                meta:       `${a.type || "TV"} · ${a.episodes ? a.episodes + " eps" : "—"} · ⭐ ${a.score?.toFixed(1) || "—"}`,
                badge:      a.type || null,
                rawData:    a
            }));
        }
    },

    // ── PELÍCULAS → TMDB ───────────────────────────────────────
    peliculas: {
    color: "#ed1c24",
    emoji: "🎬",
    async buscar(query, signal) {
        const url = `/api/tmdb/movie?search=${encodeURIComponent(query)}`;
            const r   = await fetch(url, { signal });
            const d   = await r.json();
            const res = await Promise.all(
                (d.results || []).slice(0, 8).map(m => _tmdbMovieDetails(m, signal))
            );
            return res.filter(Boolean);
        }
    },

    // ── SERIES → TMDB ──────────────────────────────────────────
    series: {
    color: "#00c030",
    emoji: "📺",
    async buscar(query, signal) {
        const url = `/api/tmdb/tv?search=${encodeURIComponent(query)}`;
const r   = await fetch(url, { signal });
            const d   = await r.json();
            const res = await Promise.all(
                (d.results || []).slice(0, 8).map(s => _tmdbTVDetails(s, signal))
            );
            return res.filter(Boolean);
        }
    },

    // ── MANGAS → JIKAN ─────────────────────────────────────────
    mangas: {
        color: "#e91e63",
        emoji: "📕",
        async buscar(query, signal) {
            const url = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=8&sfw=true`;
            const r   = await fetch(url, { signal });
            const d   = await r.json();
            return (d.data || []).map(m => ({
                titulo:     m.title_spanish || m.title_english || m.title,
                imagen:     m.images?.jpg?.large_image_url || m.images?.jpg?.image_url || null,
                anio:       m.published?.from ? new Date(m.published.from).getFullYear() : null,
                creador:    m.authors?.[0]?.name || null,
                generos:    (m.genres || []).map(x => _mapGenreManga(x.name)),
                estadoSerie: _mapStatusManga(m.status),
                tomos:      _buildTomosManga(m),
                duracion:   m.volumes ? `${m.volumes} vols.` : (m.chapters ? `${m.chapters} caps.` : null),
                meta:       `${m.type || "Manga"} · ${m.volumes ? m.volumes + " vols" : "—"} · ⭐ ${m.score?.toFixed(1) || "—"}`,
                badge:      m.type || null,
                rawData:    m
            }));
        }
    },

    // ── LIBROS → OPEN LIBRARY ──────────────────────────────────
    libros: {
        color: "#c8a85e",
        emoji: "📚",
        async buscar(query, signal) {
            const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,first_publish_year,cover_i,subject,number_of_pages_median,edition_count,language`;
            const r   = await fetch(url, { signal });
            const d   = await r.json();
            return (d.docs || []).slice(0, 8).map(b => ({
                titulo:      b.title,
                imagen:      b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg` : null,
                anio:        b.first_publish_year || null,
                creador:     b.author_name?.[0] || null,
                generos:     _mapGenresLibro(b.subject || []),
                paginasTotales: b.number_of_pages_median || null,
                duracion:    b.number_of_pages_median ? `${b.number_of_pages_median} págs.` : null,
                meta:        `${b.first_publish_year || "—"} · ${b.author_name?.[0] || "Autor desconocido"}`,
                badge:       b.first_publish_year || null,
                rawData:     b
            }));
        }
    },

    // ── CÓMICS → OPEN LIBRARY ──────────────────────────────────
    comics: {
        color: "#ff6b35",
        emoji: "💥",
        async buscar(query, signal) {
            const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&subject=comics&limit=8&fields=key,title,author_name,first_publish_year,cover_i,subject,number_of_pages_median`;
            const r   = await fetch(url, { signal });
            const d   = await r.json();
            return (d.docs || []).slice(0, 8).map(c => ({
                titulo:   c.title,
                imagen:   c.cover_i ? `https://covers.openlibrary.org/b/id/${c.cover_i}-L.jpg` : null,
                anio:     c.first_publish_year || null,
                creador:  c.author_name?.[0] || null,
                generos:  _mapGenresComic(c.subject || []),
                duracion: null,
                meta:     `${c.first_publish_year || "—"} · ${c.author_name?.[0] || "Autor desconocido"}`,
                badge:    c.first_publish_year || null,
                rawData:  c
            }));
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// ── HELPERS DE TRANSFORMACIÓN ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════

// RAWG sin key → usa DuckDuckGo RAWG endpoint (fallback básico)
async function _rawgFallback(query, signal) {
    // Sin key, RAWG no funciona. Devolvemos aviso vacío.
    return [];
}

// TMDB sin key → fallback vacío
async function _tmdbFallback(type, query, signal) {
    return [];
}

// TMDB detalle película
async function _tmdbMovieDetails(m, signal) {
    try {
        const genreMap = await _tmdbGenreMap("movie");
        return {
            titulo:   m.title || m.original_title,
            imagen:   m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
            anio:     m.release_date ? parseInt(m.release_date.split("-")[0]) : null,
            creador:  null,
            generos:  (m.genre_ids || []).map(id => genreMap[id]).filter(Boolean),
            duracion: null,
            meta:     `${m.release_date?.split("-")[0] || "—"} · ⭐ ${m.vote_average?.toFixed(1) || "—"}`,
            badge:    m.release_date?.split("-")[0] || null,
            rawData:  m
        };
    } catch { return null; }
}

// TMDB detalle serie
async function _tmdbTVDetails(s, signal) {
    try {
        const genreMap = await _tmdbGenreMap("tv");
        return {
            titulo:     s.name || s.original_name,
            imagen:     s.poster_path ? `https://image.tmdb.org/t/p/w342${s.poster_path}` : null,
            anio:       s.first_air_date ? parseInt(s.first_air_date.split("-")[0]) : null,
            creador:    null,
            generos:    (s.genre_ids || []).map(id => genreMap[id]).filter(Boolean),
            estadoSerie: null,
            temporadas: null,
            duracion:   null,
            meta:       `${s.first_air_date?.split("-")[0] || "—"} · ⭐ ${s.vote_average?.toFixed(1) || "—"}`,
            badge:      s.first_air_date?.split("-")[0] || null,
            rawData:    s
        };
    } catch { return null; }
}

// Cache de géneros TMDB para no repetir llamada
const _tmdbGenreCache = {};
async function _tmdbGenreMap(type) {
    if (_tmdbGenreCache[type]) return _tmdbGenreCache[type];
    if (!API_KEYS.tmdb || API_KEYS.tmdb === "TU_KEY_TMDB_AQUI") return {};
    try {
        const r = await fetch(`/api/tmdb/genres/${type}`);
        const d = await r.json();
        const map = {};
        (d.genres || []).forEach(g => { map[g.id] = g.name; });
        _tmdbGenreCache[type] = map;
        return map;
    } catch { return {}; }
}

// Mapeo de plataformas RAWG → nombres del proyecto
function _mapPlatformRawg(name) {
    const map = {
        "PC":                  "PC",
        "Nintendo":            "Nintendo",
        "Xbox":                "Xbox",
        "PlayStation":         "PlayStation",
        "PlayStation 5":       "PlayStation 5",
        "PlayStation 4":       "PlayStation 4",
        "PlayStation 3":       "Otro",
        "Xbox Series X":       "Xbox Series X/S",
        "Xbox One":            "Xbox One",
        "Nintendo Switch":     "Nintendo Switch",
        "iOS":                 "iOS",
        "Android":             "Android",
        "Steam Deck":          "Steam Deck"
    };
    return map[name] || "Otro";
}

// Mapeo de géneros Jikan (anime) → géneros del proyecto
function _mapGenreAnime(name) {
    const map = {
        "Action":           "Acción",
        "Adventure":        "Aventura",
        "Comedy":           "Comedia",
        "Drama":            "Drama",
        "Fantasy":          "Fantasía",
        "Sci-Fi":           "Ciencia Ficción",
        "Science Fiction":  "Ciencia Ficción",
        "Romance":          "Romance",
        "Terror":           "Terror",
        "Horror":           "Horror",
        "Mystery":          "Misterio",
        "Slice of Life":    "Slice of Life",
        "Sports":           "Deportes",
        "Mecha":            "Mecha",
        "Isekai":           "Isekai",
        "Shounen":          "Shounen",
        "Shoujo":           "Shoujo",
        "Seinen":           "Seinen",
        "Josei":            "Josei",
        "Ecchi":            "Ecchi",
        "Magic":            "Magia",
        "Suspenso":         "Suspenso",
        "Sobrenatural":     "Sobrenatural",
        "Mahou Shoujo":     "Mahou Shoujo"
    };
    return map[name] || name;
}

function _mapGenreManga(name) {
    return _mapGenreAnime(name);
}

// Estado de serie Jikan → estado del proyecto
function _mapStatusAnime(status) {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s.includes("currently airing") || s.includes("publishing")) return "En emisión";
    if (s.includes("finished"))   return "Finalizada";
    if (s.includes("not yet"))    return "Temporada confirmada";
    return "En emisión";
}

function _mapStatusManga(status) {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s.includes("publishing") || s.includes("ongoing")) return "Publicación";
    if (s.includes("finished") || s.includes("complete"))  return "Finalizada";
    if (s.includes("hiatus"))    return "Temporada sin confirmar";
    return "Publicación";
}

// Construir estructura de temporadas desde anime Jikan
function _buildTemporadasAnime(a) {
    if (!a.episodes) return null;
    return [{
        tipo:      "Temporada",
        nombre:    a.title_spanish || a.title_english || a.title,
        episodios: a.episodes
    }];
}

// Construir estructura básica de tomos desde manga Jikan
function _buildTomosManga(m) {
    if (!m.volumes) return null;
    const tomos = [];
    for (let i = 1; i <= Math.min(m.volumes, 50); i++) {
        tomos.push({
            nombre:     `Vol. ${i}`,
            capitulos:  m.chapters ? Math.ceil(m.chapters / m.volumes) : null
        });
    }
    return tomos;
}

// Géneros libros Open Library
function _mapGenresLibro(subjects) {
    const allowed = ["Novela","Fantasía","Ciencia Ficción","Terror","Horror","Thriller","Misterio","Romance","Historia","Biografía","Ensayo","Autoayuda","Poesía","Infantil","Young Adult","Clásico","Distopía","Novela ligera","Comedia","Ficcion"];
    const map = {
        "fantasy":          "Fantasía",
        "science fiction":  "Ciencia Ficción",
        "Terror":           "Terror",
        "Horror":           "Horror",
        "thriller":         "Thriller",
        "mystery":          "Misterio",
        "romance":          "Romance",
        "history":          "Historia",
        "biography":        "Biografía",
        "essays":           "Ensayo",
        "self-help":        "Autoayuda",
        "poetry":           "Poesía",
        "children":         "Infantil",
        "young adult":      "Young Adult",
        "classic":          "Clásico",
        "dystopia":         "Distopía",
        "humor":            "Comedia",
        "fiction":          "Ficcion",
        "novel":            "Novela"
    };
    const result = [];
    for (const s of subjects) {
        const low = s.toLowerCase();
        for (const [k, v] of Object.entries(map)) {
            if (low.includes(k) && !result.includes(v)) {
                result.push(v);
                if (result.length >= 4) return result;
            }
        }
    }
    return result;
}

function _mapGenresComic(subjects) {
    const map = {
        "superhero":    "Superhéroes",
        "action":       "Acción",
        "adventure":    "Aventura",
        "science fiction": "Ciencia Ficción",
        "fantasy":      "Fantasía",
        "Terror":       "Terror",
        "Horror":       "Horror",
        "drama":        "Drama",
        "humor":        "Humor",
        "thriller":     "Thriller",
        "historical":   "Histórico",
        "indie":        "Indie"
    };
    const result = [];
    for (const s of subjects) {
        const low = s.toLowerCase();
        for (const [k, v] of Object.entries(map)) {
            if (low.includes(k) && !result.includes(v)) {
                result.push(v);
                if (result.length >= 3) return result;
            }
        }
    }
    return result;
}

// ═══════════════════════════════════════════════════════════════
// ── MOTOR DE AUTOCOMPLETADO ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

/**
 * Inyecta el autocompletado de API en un campo de título.
 *
 * @param {HTMLInputElement} inputEl  - El input de título
 * @param {string}           tipo     - Tipo de categoría (juegos, animes, etc.)
 * @param {string}           formId   - ID único del formulario
 * @param {Function}         fillFn   - Función(data) que rellena los campos del form
 */
function apiSearchAttach(inputEl, tipo, formId, fillFn) {
    if (!inputEl || !API_ADAPTERS[tipo]) return;

    const adapter = API_ADAPTERS[tipo];

    // Envolver el input en un wrapper relativo
    const parent = inputEl.parentElement;
    if (!parent.classList.contains("api-titulo-wrap")) {
        const wrap = document.createElement("div");
        wrap.className = "api-titulo-wrap";
        wrap.style.position = "relative";
        parent.insertBefore(wrap, inputEl);
        wrap.appendChild(inputEl);
    }

    const wrap = inputEl.parentElement;

    // Crear botón de búsqueda con ícono
    const btn = document.createElement("button");
    btn.type      = "button";
    btn.className = "api-search-btn";
    btn.title     = "Buscar en base de datos";
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${adapter.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>`;
    wrap.appendChild(btn);

    // Crear dropdown
    const dropdown = document.createElement("div");
    dropdown.className = "api-dropdown";
    dropdown.style.display = "none";
    wrap.appendChild(dropdown);
    _apiDropdowns[formId] = dropdown;

    // Ajustar padding del input para el botón
    inputEl.style.paddingRight = "32px";

    let selectedIdx = -1;

    function cerrarDropdown() {
        dropdown.style.display = "none";
        selectedIdx = -1;
    }

    async function buscar(query) {
        if (query.length < 2) { cerrarDropdown(); return; }

        // Cancelar búsqueda anterior
        if (_apiAbortCtrl[formId]) { _apiAbortCtrl[formId].abort(); }
        _apiAbortCtrl[formId] = new AbortController();

        // Mostrar loading
        dropdown.style.display = "block";
        dropdown.innerHTML = `<div class="api-search-loading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${adapter.color}" stroke-width="2.5" stroke-linecap="round" style="animation:api-spin 0.8s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Buscando...
        </div>`;
        btn.classList.add("loading");

        try {
            const resultados = await adapter.buscar(query, _apiAbortCtrl[formId].signal);
            btn.classList.remove("loading");

            if (!resultados || resultados.length === 0) {
                dropdown.innerHTML = `<div class="api-search-empty">Sin resultados para "<strong>${query}</strong>"</div>`;
                return;
            }

            dropdown.innerHTML = "";
            selectedIdx = -1;
            const items = [];

            resultados.forEach((r, i) => {
                const item = document.createElement("div");
                item.className = "api-result-item";
                item.setAttribute("data-idx", i);

                const posterHTML = r.imagen
                    ? `<div class="api-result-poster"><img src="${r.imagen}" loading="lazy" onerror="this.style.display='none'"></div>`
                    : `<div class="api-result-poster"><span class="api-result-poster-placeholder">${adapter.emoji}</span></div>`;

                const badgeHTML = r.badge
                    ? `<span class="api-result-badge" style="color:${adapter.color};border-color:${adapter.color}40">${r.badge}</span>`
                    : "";

                item.innerHTML = `
                    ${posterHTML}
                    <div class="api-result-info">
                        <div class="api-result-titulo">${r.titulo}</div>
                        <div class="api-result-meta">${r.meta || ""}</div>
                    </div>
                    ${badgeHTML}
                `;

                item.addEventListener("click", () => {
                    inputEl.value = r.titulo;
                    cerrarDropdown();
                    fillFn(r);
                });
                item.addEventListener("mouseenter", () => {
                    selectedIdx = i;
                    items.forEach((el, j) => el.classList.toggle("selected", j === i));
                });

                dropdown.appendChild(item);
                items.push(item);
            });

        } catch (err) {
            btn.classList.remove("loading");
            if (err.name !== "AbortError") {
                dropdown.innerHTML = `<div class="api-search-empty">Error al buscar. Intenta de nuevo.</div>`;
            }
        }
    }

    // Eventos del input
    inputEl.addEventListener("input", () => {
        clearTimeout(_apiSearchTimer);
        const q = inputEl.value.trim();
        if (q.length < 2) { cerrarDropdown(); return; }
        _apiSearchTimer = setTimeout(() => buscar(q), 400);
    });

    // Teclado: flechas y Enter
    inputEl.addEventListener("keydown", (e) => {
        const items = dropdown.querySelectorAll(".api-result-item");
        if (dropdown.style.display === "none" || !items.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
            items.forEach((el, j) => el.classList.toggle("selected", j === selectedIdx));
            items[selectedIdx]?.scrollIntoView({ block: "nearest" });
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIdx = Math.max(selectedIdx - 1, 0);
            items.forEach((el, j) => el.classList.toggle("selected", j === selectedIdx));
            items[selectedIdx]?.scrollIntoView({ block: "nearest" });
        } else if (e.key === "Enter" && selectedIdx >= 0) {
            e.preventDefault();
            items[selectedIdx]?.click();
        } else if (e.key === "Escape") {
            cerrarDropdown();
        }
    });

    // Botón de búsqueda manual
    btn.addEventListener("click", () => {
        const q = inputEl.value.trim();
        if (q.length >= 2) buscar(q);
    });

    // Cerrar al hacer click afuera
    document.addEventListener("click", (e) => {
        if (!wrap.contains(e.target)) cerrarDropdown();
    }, true);
}

// ═══════════════════════════════════════════════════════════════
// ── FUNCIONES DE RELLENO POR TIPO ────────────────────────────────
// Cada función recibe los datos normalizados y los mete
// en los campos del formulario correcto.
// ═══════════════════════════════════════════════════════════════

/**
 * Rellena campos comunes a todos los formularios.
 * Soporta tanto cat-forms (categoria.html) como form-modal (index.html).
 *
 * @param {Object} data     - Datos normalizados del adaptador
 * @param {string} formId   - "inline" | "fmm" | "new"
 * @param {string} tipo     - Tipo de categoría
 */
function _fillCamposComunes(data, formId, tipo) {
    const form = formId === "fmm"
        ? document.getElementById("form-modal-campos")
        : document.getElementById("formulario");

    if (!form) return;

    // Imagen
    const imgInput = form.querySelector('[name="imagen"]');
    if (imgInput && data.imagen) imgInput.value = data.imagen;

    // Año
    const anioInput = form.querySelector('[name="anio"]');
    if (anioInput && data.anio) anioInput.value = data.anio;

    // Creador
    const creadorInput = form.querySelector('[name="creador"]');
    if (creadorInput && data.creador) creadorInput.value = data.creador;

    // Duración
    const durInput = form.querySelector('[name="duracion"]');
    if (durInput && data.duracion) durInput.value = data.duracion;

    // Géneros: seleccionar chips que coincidan
    if (data.generos?.length) {
        const chipsContainer = document.getElementById("generos-chips");
        if (chipsContainer) {
            chipsContainer.querySelectorAll(".genero-chip").forEach(chip => {
                const genero = chip.getAttribute("data-genero");
                const selec  = data.generos.includes(genero);
                if (selec) {
                    chip.style.background   = CONFIG[tipo]?.color || "#e8ff47";
                    chip.style.color        = "#000";
                    chip.style.borderColor  = CONFIG[tipo]?.color || "#e8ff47";
                    chip.setAttribute("data-seleccionado", "true");
                } else {
                    chip.style.background   = "transparent";
                    chip.style.color        = "var(--muted)";
                    chip.style.borderColor  = "var(--border2)";
                    chip.removeAttribute("data-seleccionado");
                }
            });
            // Actualizar hidden input si existe
            const hidden = form.querySelector('[name="generos"]');
            if (hidden) hidden.value = data.generos.join(",");
        }
    }

    // Estado de serie
    if (data.estadoSerie) {
        const selEst = form.querySelector('[name="estadoSerie"]');
        if (selEst) {
            for (const opt of selEst.options) {
                if (opt.value === data.estadoSerie) { selEst.value = data.estadoSerie; break; }
            }
        }
    }

    // Páginas totales (libros)
    if (data.paginasTotales) {
        const pagInput = form.querySelector('[name="paginasTotales"]');
        if (pagInput) pagInput.value = data.paginasTotales;
    }
}

/** Rellena temporadas (series/animes) */
function _fillTemporadas(temporadas, prefix) {
    if (!temporadas?.length) return;
    // Esperar a que el DOM esté listo y luego agregar filas
    const suffix = prefix === "fmm" ? "new" : prefix;
    const cont = document.getElementById(`temporadas-container-${suffix}`);
    if (!cont) return;
    cont.innerHTML = "";
    if (typeof temporadaContador !== "undefined") window.temporadaContador = 0;

    temporadas.forEach(t => {
        if (typeof agregarFilaTemporada === "function") {
            agregarFilaTemporada(suffix);
            const idx = (window.temporadaContador || 1) - 1;
            // Rellenar campos de la fila
            const tipoSel = document.getElementById(`temporada-tipo-${idx}-${suffix}`);
            const nomInput = document.getElementById(`temporada-nombre-${idx}-${suffix}`);
            const epInput  = document.getElementById(`temporada-eps-${idx}-${suffix}`);
            if (tipoSel)  tipoSel.value  = t.tipo  || "Temporada";
            if (nomInput) nomInput.value = t.nombre || "";
            if (epInput)  epInput.value  = t.episodios || "";
        }
    });
}

/** Rellena tomos (mangas/comics) */
function _fillTomos(tomos, prefix) {
    if (!tomos?.length) return;
    const suffix = prefix === "fmm" ? "new" : prefix;
    const cont = document.getElementById(`tomos-container-${suffix}`);
    if (!cont) return;
    cont.innerHTML = "";
    if (typeof tomoContador !== "undefined") window.tomoContador = 0;

    // Solo añadir hasta 20 tomos para no colapsar el form
    const limit = Math.min(tomos.length, 20);
    for (let i = 0; i < limit; i++) {
        const t = tomos[i];
        if (typeof agregarFilaTomo === "function") {
            agregarFilaTomo(suffix);
            const idx = (window.tomoContador || 1) - 1;
            const nomInput = document.getElementById(`tomo-nombre-${idx}-${suffix}`);
            const capInput = document.getElementById(`tomo-capitulos-${idx}-${suffix}`);
            if (nomInput) nomInput.value = t.nombre || `Vol. ${i+1}`;
            if (capInput && t.capitulos) capInput.value = t.capitulos;
        }
    }
}

/** Rellena plataformas (juegos/animes/peliculas/series) */
function _fillPlataformas(plataformas, formId) {
    if (!plataformas?.length) return;
    const suffix = formId === "fmm" ? "fmm" : formId;

    plataformas.forEach(p => {
        if (p === "Otro" || !p) return;
        const sel = document.getElementById(`plat-sel-${suffix}`);
        if (!sel) return;
        // Seleccionar en el select y hacer click en "Añadir"
        sel.value = p;
        if (formId === "fmm" && typeof fmmAgregarPlataforma === "function") {
            fmmAgregarPlataforma();
        } else if (typeof agregarPlataforma === "function") {
            // Para cat-forms pasamos el ID del item (null en create)
            // Simulamos click del botón de plataforma
            const btn = sel.parentElement?.querySelector("button");
            if (btn) btn.click();
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// ── INTEGRACIÓN CON LOS FORMULARIOS ──────────────────────────────
// ═══════════════════════════════════════════════════════════════

/**
 * Inyecta el autocompletado en el form-modal (index.html y categoria.html).
 * Se llama después de buildFormModalCampos().
 */
function apiSearchInyectarEnFormModal(tipo) {
    const form    = document.getElementById("form-modal-campos");
    if (!form) return;

    const inputEl = form.querySelector('[name="titulo"]');
    if (!inputEl) return;

    const formId  = "fmm";

    apiSearchAttach(inputEl, tipo, formId, (data) => {
        _fillCamposComunes(data, formId, tipo);

        // Temporadas (series/animes)
        if (data.temporadas) {
            setTimeout(() => _fillTemporadas(data.temporadas, formId), 50);
        }
        // Tomos (mangas/comics)
        if (data.tomos) {
            setTimeout(() => _fillTomos(data.tomos, formId), 50);
        }
        // Plataformas (juegos/animes/series/peliculas)
        if (data.plataformas?.length) {
            setTimeout(() => _fillPlataformas(data.plataformas, formId), 80);
        }

        _mostrarToast(`✓ Datos de "${data.titulo}" cargados automáticamente`, CONFIG[tipo]?.color);
    });
}

/**
 * Inyecta el autocompletado en cat-forms (categoria.html).
 * Se llama después de crearFormulario().
 */
function apiSearchInyectarEnCatForm(tipo) {
    const form    = document.getElementById("formulario");
    if (!form) return;

    const inputEl = form.querySelector('[name="titulo"]');
    if (!inputEl) return;

    const formId  = "inline";

    apiSearchAttach(inputEl, tipo, formId, (data) => {
        _fillCamposComunes(data, formId, tipo);

        if (data.temporadas) {
            setTimeout(() => _fillTemporadas(data.temporadas, formId), 50);
        }
        if (data.tomos) {
            setTimeout(() => _fillTomos(data.tomos, formId), 50);
        }
        if (data.plataformas?.length) {
            setTimeout(() => _fillPlataformas(data.plataformas, formId), 80);
        }

        _mostrarToast(`✓ Datos de "${data.titulo}" cargados automáticamente`, CONFIG[tipo]?.color);
    });
}

// ── Toast de confirmación ─────────────────────────────────────
function _mostrarToast(msg, color = "#e8ff47") {
    const prev = document.getElementById("api-toast");
    if (prev) prev.remove();

    const toast = document.createElement("div");
    toast.id    = "api-toast";
    toast.style.cssText = `
        position: fixed;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        background: #141720;
        border: 1px solid ${color}40;
        color: ${color};
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        padding: 0.6rem 1.1rem;
        border-radius: 8px;
        z-index: 999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        opacity: 0;
        transition: opacity 0.2s, transform 0.2s;
        pointer-events: none;
        white-space: nowrap;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity   = "1";
        toast.style.transform = "translateX(-50%) translateY(0)";
    });

    setTimeout(() => {
        toast.style.opacity   = "0";
        toast.style.transform = "translateX(-50%) translateY(10px)";
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════
// ── MONKEY-PATCH: HOOKING AUTOMÁTICO ────────────────────────────
// Sobrescribimos buildFormModalCampos y crearFormulario para
// que el autocomplete se inyecte automáticamente al construir
// el form, sin tocar los archivos originales.
// ═══════════════════════════════════════════════════════════════

(function hookForms() {
    // Hook buildFormModalCampos (form-modal.js)
    const _origBuild = window.buildFormModalCampos;
    if (typeof _origBuild === "function") {
        window.buildFormModalCampos = function(t) {
            _origBuild.call(this, t);
            // Esperar al siguiente tick para que el DOM esté construido
            setTimeout(() => apiSearchInyectarEnFormModal(t), 0);
        };
    } else {
        // Si aún no está cargado, esperamos
        document.addEventListener("DOMContentLoaded", () => {
            const _orig = window.buildFormModalCampos;
            if (typeof _orig === "function") {
                window.buildFormModalCampos = function(t) {
                    _orig.call(this, t);
                    setTimeout(() => apiSearchInyectarEnFormModal(t), 0);
                };
            }
        });
    }

    // Hook crearFormulario (cat-forms.js)
    const _origCrear = window.crearFormulario;
    if (typeof _origCrear === "function") {
        window.crearFormulario = function() {
            _origCrear.call(this);
            const t = window.tipo || new URLSearchParams(window.location.search).get("tipo");
            if (t) setTimeout(() => apiSearchInyectarEnCatForm(t), 0);
        };
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            const _orig = window.crearFormulario;
            if (typeof _orig === "function") {
                window.crearFormulario = function() {
                    _orig.call(this);
                    const t = window.tipo || new URLSearchParams(window.location.search).get("tipo");
                    if (t) setTimeout(() => apiSearchInyectarEnCatForm(t), 0);
                };
            }
        });
    }
})();