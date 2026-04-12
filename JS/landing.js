const usuario = JSON.parse(sessionStorage.getItem("usuario"));
console.log(usuario.nombre);

actualizarNavbar();// Navbar dinámico
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

document.addEventListener("DOMContentLoaded", () => {
  actualizarNavbar();
  cargarHero();
  cargarCategorias();
  renderGrid('all');
});

// ── Estrellas ──
const sc = ['#e8d87a', '#d899e8', '#ffffff', '#f0c8a0', '#b05ad0'];
function rc() { return sc[Math.floor(Math.random() * sc.length)]; }
function s4(r) { const p = []; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, rad = i % 2 === 0 ? r : r * .4; p.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`); } return p.join(' '); }
function s6(r) { const p = []; for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6 - Math.PI / 2, rad = i % 2 === 0 ? r : r * .45; p.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`); } return p.join(' '); }
const sh = [s => `<polygon points="${s4(s)}" fill="${rc()}" opacity=".6"/>`, s => `<polygon points="${s6(s)}" fill="${rc()}" opacity=".55"/>`, s => `<polygon points="0,${-s} ${s * .4},0 0,${s} ${-s * .4},0" fill="${rc()}" opacity=".7"/>`];
[{ size: 10, left: 4, dur: '10s', delay: '0s' }, { size: 14, left: 14, dur: '13s', delay: '2s' }, { size: 8, left: 24, dur: '9s', delay: '5s' }, { size: 16, left: 36, dur: '12s', delay: '1s' }, { size: 10, left: 50, dur: '8s', delay: '3.5s' }, { size: 18, left: 62, dur: '15s', delay: '0.5s' }, { size: 11, left: 74, dur: '11s', delay: '7s' }, { size: 9, left: 85, dur: '9s', delay: '2.5s' }, { size: 13, left: 94, dur: '12s', delay: '4s' }].forEach(d => { const sv = sh[Math.floor(Math.random() * sh.length)]; const svg = `<svg viewBox="${-d.size} ${-d.size} ${d.size * 2} ${d.size * 2}" width="${d.size * 2}" height="${d.size * 2}">${sv(d.size)}</svg>`; const el = document.createElement('div'); el.className = 'star'; el.style.cssText = `left:${d.left}%;bottom:-${d.size * 2}px;--dur:${d.dur};--delay:${d.delay}`; el.innerHTML = svg; document.body.appendChild(el); });

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

async function renderGrid(categoria = 'all') {
  const grid = document.getElementById('grid');
  grid.innerHTML = 'Cargando...';

  try {
    const res = await fetch(`/publicaciones/categoria/${categoria}`);
    const data = await res.json();

    grid.innerHTML = '';

    data.forEach(pub => {
      grid.innerHTML += `
        <div class="art-card">
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
    grid.innerHTML = 'Error al cargar';
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
  renderGrid(cat);
}


