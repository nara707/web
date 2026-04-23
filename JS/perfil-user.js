//Funcion para actualizar el navbar
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

async function cargarPerfilUsuario() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    try {
        const res = await fetch(`/api/perfil-publico?id=${id}`);
        const data = await res.json();

        // Nombre en sidebar
        const nombreEl = document.querySelector('.filter-card .filter-section h4');
        if (nombreEl) nombreEl.textContent = data.nombre;

        // Foto en banner
        const avatar = document.querySelector('.large-avatar');
        if (avatar && data.foto) {
            avatar.style.backgroundImage = `url('${data.foto}')`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
        }

        // Descripción en sidebar
        const descEl = document.querySelector('.description-text');
        if (descEl && data.biografia) descEl.textContent = `"${data.biografia}"`;

    } catch (err) {
        console.error('Error cargando perfil:', err);
    }
}

document.addEventListener('DOMContentLoaded', cargarPerfilUsuario);

(function() {
          // ── Estrellas ──
    const sc=['#e8d87a','#d899e8','#ffffff','#f0c8a0','#b05ad0'];
    function rc(){return sc[Math.floor(Math.random()*sc.length)];}
    function s4(r){const p=[];for(let i=0;i<8;i++){const a=(i*Math.PI)/4-Math.PI/2,rad=i%2===0?r:r*.4;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    function s6(r){const p=[];for(let i=0;i<12;i++){const a=(i*Math.PI)/6-Math.PI/2,rad=i%2===0?r:r*.45;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    const sh=[s=>`<polygon points="${s4(s)}" fill="${rc()}" opacity=".6"/>`,s=>`<polygon points="${s6(s)}" fill="${rc()}" opacity=".55"/>`,s=>`<polygon points="0,${-s} ${s*.4},0 0,${s} ${-s*.4},0" fill="${rc()}" opacity=".7"/>`];
    [{size:10,left:4,dur:'10s',delay:'0s'},{size:14,left:14,dur:'13s',delay:'2s'},{size:8,left:24,dur:'9s',delay:'5s'},{size:16,left:36,dur:'12s',delay:'1s'},{size:10,left:50,dur:'8s',delay:'3.5s'},{size:18,left:62,dur:'15s',delay:'0.5s'},{size:11,left:74,dur:'11s',delay:'7s'},{size:9,left:85,dur:'9s',delay:'2.5s'},{size:13,left:94,dur:'12s',delay:'4s'}].forEach(d=>{const sv=sh[Math.floor(Math.random()*sh.length)];const svg=`<svg viewBox="${-d.size} ${-d.size} ${d.size*2} ${d.size*2}" width="${d.size*2}" height="${d.size*2}">${sv(d.size)}</svg>`;const el=document.createElement('div');el.className='star';el.style.cssText=`left:${d.left}%;bottom:-${d.size*2}px;--dur:${d.dur};--delay:${d.delay}`;el.innerHTML=svg;document.body.appendChild(el);});


      // ----- DATOS DE LAS CARDS  -----
  let allCards = [];

  async function cargarPublicaciones() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    try {
        const res = await fetch(`/api/publicaciones/${id}`);
        const data = await res.json();

        allCards = data.map(pub => ({
            id: pub.ID_Publicacion,
            title: pub.Titulo,
            artist: `@${pub.Categoria || 'artista'}`,
            category: pub.ID_Categoria,
            catLabel: pub.Categoria || 'Otro',
            price: `$${parseFloat(pub.Precio).toFixed(2)}`,
            date: pub.FechaPublicacion
                ? new Date(pub.FechaPublicacion).toISOString().slice(0, 10)
                : '—',
            likes: '0',
            image: pub.URL_Imagen
                ? `data:image/jpeg;base64,${pub.URL_Imagen}`
                : null
        }));

        renderGrid();

    } catch (err) {
        console.error('Error al cargar publicaciones:', err);
    }
}
      
 // ----- ESTADO -----
  const grid = document.getElementById('cardsGrid');
  let currentFilter = 'all';               // categoría activa (para subfiltro)
  let currentMainFilter = 'categories';     // 'categories', 'date', 'likes'
  let currentSort = null;                   // 'date' o 'likes'
  let sortOrder = 'desc';                    // 'desc' = más reciente / más likes, 'asc' = más antiguo
  let currentTab = 'publications';           // publications / sells / basket

  // ----- ELEMENTOS DOM -----
  const mainChips = document.querySelectorAll('#filterChipsRow .chip-filter');
  const subfilterRow = document.getElementById('subfilterRow');
  const subfilterChips = document.querySelectorAll('#subfilterRow .chip-filter');
  const tabPub = document.getElementById('tab-publications');
  const tabSells = document.getElementById('tab-likes');
  const tabBasket = document.getElementById('tab-basket');

  // ----- FUNCIÓN PARA CONVERTIR LIKES  -----
  function parseLikes(likesStr) {
    const num = parseFloat(likesStr.replace('k', ''));
    return likesStr.includes('k') ? num * 1000 : num;
  }

  // ----- RENDERIZADO (con filtrado y ordenamiento) -----
  function renderGrid() {
    // 1. filtrar por categoría
    let filtered = allCards;
    if (currentFilter !== 'all') {
      filtered = allCards.filter(c => c.category === currentFilter);
    }

    // 2. ordenar según currentSort
    if (currentSort === 'date') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    } else if (currentSort === 'likes') {
      filtered.sort((a, b) => parseLikes(b.likes) - parseLikes(a.likes));
    }

    // 3. ajustar precios según la pestaña 
    if (currentTab === 'likes') {
      filtered = filtered.map(c => ({ ...c, price: '$' + (parseInt(c.price.slice(1)) + 20) }));
    } else if (currentTab === 'basket') {
      filtered = filtered.map(c => ({ ...c, price: '$' + (parseInt(c.price.slice(1)) + 5) }));
    }

    // 4. generar HTML de las cards
    let html = '';
 filtered.forEach(card => {
    const bg = card.image
        ? `background-image:url('${card.image}');background-size:cover;background-position:center;`
        : `background:linear-gradient(145deg,#c87ce8,#e8d87a);`;
    html += `
        <div class="art-card" data-category="${card.category}" style="cursor:pointer;"
             onclick="window.location.href='/artwork?id=${card.id}'">
            <div class="art-card-ph" style="${bg}"></div>
            <div class="art-card-overlay">
                <div class="art-card-likes">💗 ${card.likes}</div>
                <div class="art-card-artist">${card.title}</div>
                <div class="art-card-cat">${card.catLabel}</div>
                <div class="art-card-date">${card.date}</div>
            </div>
            <div class="art-card-price">${card.price}</div>
            <button class="art-card-save material-symbols-outlined" 
                onclick="event.stopPropagation(); this.classList.toggle('saved')">favorite</button>
        </div>
    `;
});
    grid.innerHTML = html;
  }

  // ----- CLASES ACTIVAS EN MAIN CHIPS -----
  function setActiveMainChip(filterValue) {
    mainChips.forEach(chip => {
      if (chip.dataset.filter === filterValue) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // ----- CLASES ACTIVAS EN SUBFILTER CHIPS -----
  function setActiveSubfilterChip(filterValue) {
    subfilterChips.forEach(chip => {
      if (chip.dataset.filter === filterValue) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // ----- MANEJADORES DE MAIN CHIPS -----
  mainChips.forEach(chip => {
    chip.addEventListener('click', function(e) {
      const filter = this.dataset.filter;

      // ya está activo? (para fecha permite alternar orden)
      if (filter === currentMainFilter) {
        if (filter === 'date') {
          // toggle orden
          sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
          currentSort = 'date';
          renderGrid();
        }
        return;
      }

      // cambiar filtro principal
      currentMainFilter = filter;
      setActiveMainChip(filter);

      // ocultar subfilter row por defecto
      subfilterRow.style.display = 'none';

      // resetear sort si no es date o likes
      if (filter === 'categories') {
        currentSort = null;
        subfilterRow.style.display = 'flex';  // mostramos fila de categorías
        // asegurar que el subfiltro activo corresponde a currentFilter
        setActiveSubfilterChip(currentFilter);
        renderGrid();
      } else if (filter === 'date') {
        currentSort = 'date';
        sortOrder = 'desc';  // por defecto más reciente
        renderGrid();
      } else if (filter === 'likes') {
        currentSort = 'likes';
        sortOrder = 'desc';  // siempre descendente
        renderGrid();
      }
    });
  });

  // ----- MANEJADORES DE SUBFILTER CHIPS (categorías) -----
  subfilterChips.forEach(chip => {
    chip.addEventListener('click', function(e) {
      // solo si el main filter es categorias (fila visible)
      if (currentMainFilter !== 'categories') return;

      const filter = this.dataset.filter;
      currentFilter = filter;
      setActiveSubfilterChip(filter);
      renderGrid();
    });
  });


       // ----- TABS  -----
  function setActiveTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (tab === tabPub) currentTab = 'publications';
    else if (tab === tabSells) currentTab = 'likes';
    else if (tab === tabBasket) currentTab = 'basket';
    renderGrid();
  }

  tabPub.addEventListener('click', () => setActiveTab(tabPub));
  tabSells.addEventListener('click', () => setActiveTab(tabSells));
  tabBasket.addEventListener('click', () => setActiveTab(tabBasket));

  // ----- INICIALIZACIÓN -----
  currentMainFilter = 'categories';
  currentSort = null;
  currentFilter = 'all';
  setActiveMainChip('categories');
  subfilterRow.style.display = 'flex';  // mostrar subfiltro
  setActiveSubfilterChip('all');
  cargarPublicaciones();

    })();