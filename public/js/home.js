// ╔══════════════════════════════════════════════════════════╗
// ║  home.js — PÁGINA DE INICIO (nuevo index)               ║
// ║  Carga todos los items y los muestra por categoría      ║
// ╚══════════════════════════════════════════════════════════╝

const HOME_TIPOS = ["juegos","peliculas","series","animes","mangas","comics","libros"];

async function cargarHome() {
  try {
    const res   = await fetch("/items");
    const items = await res.json();
    renderHomeCategories(items);
  } catch(e) {
    console.error("Error cargando home:", e);
  }
}

function renderHomeCategories(items) {
  const wrap = document.getElementById("home-categorias");
  wrap.innerHTML = "";

  HOME_TIPOS.forEach(tipo => {
    const cfg   = CONFIG[tipo];
    const lista = shuffleArray(items.filter(i => i.tipo === tipo)).slice(0, 55);

    const bloque = document.createElement("div");
    bloque.className = "home-cat-bloque";
    bloque.style.opacity = "0";
    bloque.style.transform = "translateY(16px)";
    bloque.style.transition = "opacity 0.5s ease, transform 0.5s ease";

    const svgIcon = tipoSVG(tipo, 18);

    bloque.innerHTML = `
      <div class="home-cat-titulo" style="--cat-color:${cfg.color}">
        ${svgIcon}
        <a href="/pages/categoria-index.html?tipo=${tipo}">${cfg.label.slice(2).toUpperCase()}</a>
      </div>
      ${lista.length === 0
        ? `<div class="home-cat-empty">Sin elementos todavía — <a href="#" onclick="abrirFormModal()" style="color:var(--accent);text-decoration:none">añadir</a></div>`
        : ``
      }
    `;

    wrap.appendChild(bloque);

    const delay = 100 + HOME_TIPOS.indexOf(tipo) * 80;
    setTimeout(() => {
      bloque.style.opacity = "1";
      bloque.style.transform = "translateY(0)";
    }, delay);

    if (lista.length > 0) {
      const trackWrap = document.createElement("div");
      trackWrap.className = "home-carrusel-wrap";
      bloque.appendChild(trackWrap);

      const track = document.createElement("div");
      track.className = "home-carrusel-track";
      trackWrap.appendChild(track);

      lista.forEach(it => {
        const card = document.createElement("div");
        card.className = "home-item-card";
        card.onclick = () => window.location.href = `/pages/item.html?id=${it.id}`;
        const posterHTML = it.imagen
          ? `<img src="${it.imagen}" alt="${it.titulo}" loading="lazy"/>`
          : cfg.label.split(' ')[0];
        card.innerHTML = `
          <div class="home-item-poster">${posterHTML}</div>
          <div class="home-item-info"><div class="home-item-titulo">${it.titulo}</div></div>
        `;
        track.appendChild(card);
      });

      const btnLeft = document.createElement("button");
      btnLeft.className = "home-scroll-btn home-scroll-btn-left";
      btnLeft.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
      let scrolleando = false;

      btnLeft.onclick = () => {
        if (scrolleando) return;
        scrolleando = true;
        track.scrollBy({ left: -1600, behavior: "smooth" });
        setTimeout(() => { scrolleando = false; }, 600);
      };
      trackWrap.insertBefore(btnLeft, track);

      const btnRight = document.createElement("button");
      btnRight.className = "home-scroll-btn home-scroll-btn-right";
      btnRight.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
      btnRight.onclick = () => {
        if (scrolleando) return;
        scrolleando = true;
        track.scrollBy({ left: 1600, behavior: "smooth" });
        setTimeout(() => { scrolleando = false; }, 600);
      };
      trackWrap.appendChild(btnRight);

      track.addEventListener("scroll", () => {
        btnLeft.classList.toggle("visible", track.scrollLeft > 0);
        const alFinal = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        btnRight.classList.toggle("al-final", alFinal);
      });
    }
  });

  const todasImagenes = items.filter(i => i.imagen).map(i => i.imagen);
  renderFondoBlur(shuffleArray(todasImagenes));
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderFondoBlur(imagenes) {
  const fondo = document.getElementById("home-fondo-blur");
  if (!fondo || !imagenes.length) return;

  const grid = document.createElement("div");
  grid.className = "home-fondo-grid";
  fondo.appendChild(grid);

  const NUM_FILAS = 5;
  const tracks    = [];

  for (let f = 0; f < NUM_FILAS; f++) {
    const fila = document.createElement("div");
    fila.className = "home-fondo-fila";
    grid.appendChild(fila);

    const imgs = shuffleArray(imagenes);
    [...imgs, ...imgs, ...imgs].forEach(src => {
      const div = document.createElement("div");
      div.className = "home-fondo-card";
      div.style.backgroundImage = `url('${src}')`;
      fila.appendChild(div);
    });

    tracks.push({ el: fila, posX: 0, dir: f % 2 === 0 ? -1 : 1 });
  }

  const cardW    = 300 + 12;
  const setWidth = imagenes.length * cardW;

  // Ajustar altura del fondo al contenedor padre dinámicamente
  function ajustarAltura() {
    const padre = fondo.parentElement;
    if (!padre) return;

    const primerTitulo = document.querySelector(".home-cat-titulo");
    const padreRect    = padre.getBoundingClientRect();
    const tituloRect   = primerTitulo?.getBoundingClientRect();
    const offsetTop    = primerTitulo
      ? tituloRect.bottom - padreRect.top + window.scrollY
      : 0;

    fondo.style.top    = `${offsetTop}px`;
    fondo.style.bottom = "0";
    fondo.style.height = "auto";
  }

  // Ajustar al cargar y cuando el contenido cambie de tamaño
  requestAnimationFrame(() => {
    ajustarAltura();
    // Observar cambios de tamaño del contenedor
    const ro = new ResizeObserver(ajustarAltura);
    ro.observe(fondo.parentElement);
  });

  function animar() {
    tracks.forEach(t => {
      t.posX += t.dir * 0.3;
      if (t.dir === -1 && Math.abs(t.posX) >= setWidth) t.posX = 0;
      if (t.dir ===  1 && t.posX >= 0) t.posX = -setWidth;
      t.el.style.transform = `translateX(${t.posX}px)`;
    });
    requestAnimationFrame(animar);
  }

  requestAnimationFrame(animar);
}

document.addEventListener("DOMContentLoaded", cargarHome);