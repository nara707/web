const params = new URLSearchParams(window.location.search);
const usuarioParam = params.get('usuario');

if (usuarioParam) {
  const info = JSON.parse(decodeURIComponent(usuarioParam));
  sessionStorage.setItem('usuario', JSON.stringify(info));
  // Limpiar el ?usuario=... de la URL sin recargar la página
  window.history.replaceState({}, document.title, window.location.pathname);
}

function actualizarNavbar() {
  const usuario = sessionStorage.getItem('usuario');
  const navLinks = document.querySelector('.nav-links');

  if (usuario) {
    navLinks.innerHTML = `
      <a href="/landing">Explora</a>
      <a href="/landing#categorias">Categorías</a>
      <a href="/basket">Canasta</a>
      <a href="/mi-perfil">Perfil</a>
    `;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  actualizarNavbar();
  await Promise.all([cargarHero(), cargarCategorias()]);
  renderGrid('all');
});

// ── Estrellas ──
const sc = ['#e8d87a', '#d899e8', '#ffffff', '#f0c8a0', '#b05ad0'];
function rc() { return sc[Math.floor(Math.random() * sc.length)]; }
function s4(r) { const p = []; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, rad = i % 2 === 0 ? r : r * .4; p.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`); } return p.join(' '); }
function s6(r) { const p = []; for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6 - Math.PI / 2, rad = i % 2 === 0 ? r : r * .45; p.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`); } return p.join(' '); }
const sh = [s => `<polygon points="${s4(s)}" fill="${rc()}" opacity=".6"/>`, s => `<polygon points="${s6(s)}" fill="${rc()}" opacity=".55"/>`, s => `<polygon points="0,${-s} ${s * .4},0 0,${s} ${-s * .4},0" fill="${rc()}" opacity=".7"/>`];
[{ size: 10, left: 4, dur: '10s', delay: '0s' }, { size: 14, left: 14, dur: '13s', delay: '2s' }, { size: 8, left: 24, dur: '9s', delay: '5s' }, { size: 16, left: 36, dur: '12s', delay: '1s' }, { size: 10, left: 50, dur: '8s', delay: '3.5s' }, { size: 18, left: 62, dur: '15s', delay: '0.5s' }, { size: 11, left: 74, dur: '11s', delay: '7s' }, { size: 9, left: 85, dur: '9s', delay: '2.5s' }, { size: 13, left: 94, dur: '12s', delay: '4s' }].forEach(d => { const sv = sh[Math.floor(Math.random() * sh.length)]; const svg = `<svg viewBox="${-d.size} ${-d.size} ${d.size * 2} ${d.size * 2}" width="${d.size * 2}" height="${d.size * 2}">${sv(d.size)}</svg>`; const el = document.createElement('div'); el.className = 'star'; el.style.cssText = `left:${d.left}%;bottom:-${d.size * 2}px;--dur:${d.dur};--delay:${d.delay}`; el.innerHTML = svg; document.body.appendChild(el); });

// ── Estado de búsqueda global ──
let busquedaActual = '';
let categoriaActual = 'all';

// ── Conectar el input del navbar ──
document.addEventListener("DOMContentLoaded", async () => {
    actualizarNavbar();
    await Promise.all([cargarHero(), cargarCategorias()]);
    renderGrid();

    // Búsqueda con debounce
    const inputBusqueda = document.querySelector('.nav-search input');
    if (inputBusqueda) {
        let debounceTimer;
        inputBusqueda.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            busquedaActual = e.target.value.trim();
            debounceTimer = setTimeout(() => {
                // Scroll suave a la sección de resultados
                document.querySelector('.cats-section')?.scrollIntoView({ behavior: 'smooth' });
                renderGrid();
            }, 350);
        });
    }
});


async function cargarHero() {
  const res = await fetch('/publicaciones/random');
  const data = await res.json();

  const hero = document.querySelector('.hero-visual');
  hero.innerHTML = '';

  data.forEach(pub => {
    hero.innerHTML += `
      <div class="hero-card">
        <div class="hero-card-bg"
          style="background-image:url('data:image/jpeg;base64,${pub.URL_Imagen}')">
        </div>
        <div class="hero-card-info">
          <div class="hero-card-name">${pub.Titulo}</div>
          <div class="hero-card-tag">$${pub.Precio}</div>
        </div>
      </div>
    `;
  });
}

async function cargarCategorias() {
  const res = await fetch('/categorias');
  const categorias = await res.json();

  console.log("CATEGORIAS:", categorias);

  const container = document.querySelector('.cats-row');
  container.innerHTML = '';

  // botón "todo"
  container.innerHTML += `
    <div class="cat-chip active" onclick="filterCat(this, 'all')">
      Todo
    </div>
  `;

  categorias.forEach(cat => {
    container.innerHTML += `
      <div class="cat-chip" onclick="filterCat(this, ${cat.ID_Categoria})">
        ${cat.Nombre}
      </div>
    `;
  });
}


const saved = {};

async function renderGrid() {
  const grid = document.getElementById('grid');

  // Encabezado de resultados
  const seccion = document.querySelector('.grid-section');
  let titulo = seccion.querySelector('.grid-titulo');
  if (!titulo) {
    titulo = document.createElement('p');
    titulo.className = 'grid-titulo section-eyebrow';
    titulo.style.cssText = 'text-align:center;margin-bottom:1rem;';
    seccion.querySelector('.grid-inner').prepend(titulo);
  }

  grid.innerHTML = `<div class="grid-loading">Buscando...</div>`;

  try {
    const params = new URLSearchParams();
    if (busquedaActual) params.set('q', busquedaActual);
    if (categoriaActual !== 'all') params.set('id_categoria', categoriaActual);

    const res = await fetch(`/publicaciones/buscar?${params.toString()}`);
    const data = await res.json();

    // Actualizar título
    if (busquedaActual) {
      titulo.textContent = `Resultados para "${busquedaActual}" — ${data.length} encontrados`;
    } else {
      titulo.textContent = 'Explorando todo';
    }

    grid.innerHTML = '';

    if (data.length === 0) {
      grid.innerHTML = `<div class="grid-empty">
                <span style="font-size:2rem">🎨</span>
                <p>No encontramos resultados. Prueba con otro término o categoría.</p>
            </div>`;
      return;
    }

    data.forEach(pub => {
      grid.innerHTML += `
                <div class="art-card" style="cursor:pointer;" onclick="window.location.href='/artwork?id=${pub.ID_Publicacion}'">
                    <div class="art-card-ph"
                        style="height:200px;
                        background-image:url('data:image/jpeg;base64,${pub.URL_Imagen}');
                        background-size:cover;
                        background-position:center;">
                    </div>
                    <div class="art-card-overlay">
                        <div class="art-card-artist">${pub.Titulo}</div>
                        <div class="art-card-cat">Categoría ${pub.ID_Categoria}</div>
                    </div>
                    <div class="art-card-price">$${pub.Precio}</div>
                </div>
            `;
    });

  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div class="grid-empty">Error al cargar resultados.</div>';
  }
}

function toggleSave(e, id) {
  e.stopPropagation();
  saved[id] = !saved[id];
  e.currentTarget.classList.toggle('saved');
  e.currentTarget.textContent = saved[id] ? '♥' : '♡';
}

function filterCat(el, cat) {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    categoriaActual = cat;
    renderGrid();
}


