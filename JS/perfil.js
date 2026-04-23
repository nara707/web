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

actualizarNavbar();

// -- Cargar nombre y foto del perfil --
async function cargarPerfil() {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));

    if (!usuario) {
        window.location.href = '/login';
        return;
    }

    try {
        const res = await fetch(`/api/perfil?correo=${encodeURIComponent(usuario.correo)}`);
        const data = await res.json();

        // Nombre en el sidebar
        const nombreEl = document.querySelector('.filter-card .filter-section h4');
        if (nombreEl) nombreEl.textContent = data.nombre;

        // Foto en el banner
        const avatar = document.querySelector('.large-avatar');
        if (avatar && data.foto) {
            avatar.style.backgroundImage = `url('${data.foto}')`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
        }

    } catch (err) {
        console.error('Error cargando perfil:', err);
    }
}

cargarPerfil();

(function () {
    // ── Estrellas ──
    const sc = ['#e8d87a','#d899e8','#ffffff','#f0c8a0','#b05ad0'];
    function rc(){return sc[Math.floor(Math.random()*sc.length)];}
    function s4(r){const p=[];for(let i=0;i<8;i++){const a=(i*Math.PI)/4-Math.PI/2,rad=i%2===0?r:r*.4;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    function s6(r){const p=[];for(let i=0;i<12;i++){const a=(i*Math.PI)/6-Math.PI/2,rad=i%2===0?r:r*.45;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    const sh=[s=>`<polygon points="${s4(s)}" fill="${rc()}" opacity=".6"/>`,s=>`<polygon points="${s6(s)}" fill="${rc()}" opacity=".55"/>`,s=>`<polygon points="0,${-s} ${s*.4},0 0,${s} ${-s*.4},0" fill="${rc()}" opacity=".7"/>`];
    [{size:10,left:4,dur:'10s',delay:'0s'},{size:14,left:14,dur:'13s',delay:'2s'},{size:8,left:24,dur:'9s',delay:'5s'},{size:16,left:36,dur:'12s',delay:'1s'},{size:10,left:50,dur:'8s',delay:'3.5s'},{size:18,left:62,dur:'15s',delay:'0.5s'},{size:11,left:74,dur:'11s',delay:'7s'},{size:9,left:85,dur:'9s',delay:'2.5s'},{size:13,left:94,dur:'12s',delay:'4s'}].forEach(d=>{const sv=sh[Math.floor(Math.random()*sh.length)];const svg=`<svg viewBox="${-d.size} ${-d.size} ${d.size*2} ${d.size*2}" width="${d.size*2}" height="${d.size*2}">${sv(d.size)}</svg>`;const el=document.createElement('div');el.className='star';el.style.cssText=`left:${d.left}%;bottom:-${d.size*2}px;--dur:${d.dur};--delay:${d.delay}`;el.innerHTML=svg;document.body.appendChild(el);});

    // ----- ESTADO -----
    const grid = document.getElementById('cardsGrid');
    let allCards = [];
    let categoriasFiltro = [];   // se llenan dinámicamente desde la BD
    let currentFilter = 'all';
    let currentMainFilter = 'categories';
    let currentSort = null;
    let sortOrder = 'desc';
    let currentTab = 'publications';

    // ----- ELEMENTOS DOM -----
    const mainChips = document.querySelectorAll('#filterChipsRow .chip-filter');
    const subfilterRow = document.getElementById('subfilterRow');
    const tabPub = document.getElementById('tab-publications');
    const tabSells = document.getElementById('tab-sells');
    const tabBasket = document.getElementById('tab-basket');

    // ----- PARSEAR LIKES -----
    function parseLikes(likesStr) {
        if (!likesStr) return 0;
        const num = parseFloat(String(likesStr).replace('k', ''));
        return String(likesStr).includes('k') ? num * 1000 : num;
    }

    // ----- CONSTRUIR SUBFILTER CHIPS DINÁMICAMENTE -----
    function buildSubfilterChips() {
        subfilterRow.innerHTML = '';

        // Chip "Todo"
        const todoChip = document.createElement('span');
        todoChip.className = 'chip-filter' + (currentFilter === 'all' ? ' active' : '');
        todoChip.dataset.filter = 'all';
        todoChip.textContent = 'Todo';
        todoChip.addEventListener('click', () => {
            currentFilter = 'all';
            buildSubfilterChips();
            renderGrid();
        });
        subfilterRow.appendChild(todoChip);

        // Un chip por cada categoría que tenga al menos una publicación
        categoriasFiltro.forEach(cat => {
            const chip = document.createElement('span');
            chip.className = 'chip-filter' + (currentFilter === cat.id ? ' active' : '');
            chip.dataset.filter = cat.id;
            chip.textContent = cat.nombre;
            chip.addEventListener('click', () => {
                currentFilter = cat.id;
                buildSubfilterChips();
                renderGrid();
            });
            subfilterRow.appendChild(chip);
        });
    }

    // ----- CARGAR PUBLICACIONES DESDE LA BD -----
    async function cargarPublicaciones() {
        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        if (!usuario || !usuario.id) {
            console.warn('No hay usuario en sesión o falta el ID');
            return;
        }

        try {
            const res = await fetch(`/api/publicaciones/${usuario.id}`);
            const data = await res.json();

            // Mapear al formato que usa renderGrid
            allCards = data.map(pub => ({
                id: pub.ID_Publicacion,
                title: pub.Titulo,
                artist: `@${usuario.nombre.replace(/\s+/g, '').toLowerCase()}`,
                category: pub.ID_Categoria,          // número, para filtrar
                catLabel: pub.Categoria || 'Otro',   // nombre legible
                price: `$${parseFloat(pub.Precio).toFixed(2)}`,
                date: pub.FechaPublicacion
                    ? new Date(pub.FechaPublicacion).toISOString().slice(0, 10)
                    : '—',
                likes: '0',
                image: pub.URL_Imagen
                    ? `data:image/jpeg;base64,${pub.URL_Imagen}`
                    : null
            }));

            // Construir lista de categorías únicas para los chips
            const seen = new Set();
            categoriasFiltro = [];
            allCards.forEach(card => {
                if (!seen.has(card.category)) {
                    seen.add(card.category);
                    categoriasFiltro.push({ id: card.category, nombre: card.catLabel });
                }
            });

            buildSubfilterChips();
            renderGrid();

        } catch (err) {
            console.error('Error al cargar publicaciones:', err);
        }
    }

    // ----- RENDERIZADO -----
    function renderGrid() {
        let filtered = [...allCards];

        // Filtrar por categoría
        if (currentFilter !== 'all') {
            filtered = filtered.filter(c => c.category == currentFilter);
        }

        // Ordenar
        if (currentSort === 'date') {
            filtered.sort((a, b) => {
                const da = new Date(a.date), db = new Date(b.date);
                return sortOrder === 'desc' ? db - da : da - db;
            });
        } else if (currentSort === 'likes') {
            filtered.sort((a, b) => parseLikes(b.likes) - parseLikes(a.likes));
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="color:#888; padding:2rem;">No hay publicaciones aún.</p>';
            return;
        }

        grid.innerHTML = filtered.map(card => {
            const bg = card.image
                ? `background-image:url('${card.image}');background-size:cover;background-position:center;`
                : `background:linear-gradient(145deg,#c87ce8,#e8d87a);`;
            return `
    <div class="art-card" data-category="${card.category}" style="cursor:pointer;"
         onclick="window.location.href='/artwork?id=${card.id}'">
                    <div class="art-card-ph" style="${bg}"></div>
                    <div class="art-card-overlay">
                        <div class="art-card-likes">💗 ${card.likes}</div>
                        <div class="art-card-artist">${card.artist}</div>
                        <div class="art-card-cat">${card.catLabel}</div>
                        <div class="art-card-date">${card.date}</div>
                    </div>
                    <div class="art-card-price">${card.price}</div>
                    <button class="art-card-save material-symbols-outlined"
                        onclick="this.classList.toggle('saved')">favorite</button>
                </div>`;
        }).join('');
    }

    // ----- MAIN CHIPS -----
    function setActiveMainChip(filterValue) {
        mainChips.forEach(chip => chip.classList.toggle('active', chip.dataset.filter === filterValue));
    }

    mainChips.forEach(chip => {
        chip.addEventListener('click', function () {
            const filter = this.dataset.filter;

            // Doble clic en fecha invierte orden
            if (filter === currentMainFilter && filter === 'date') {
                sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
                renderGrid();
                return;
            }

            currentMainFilter = filter;
            setActiveMainChip(filter);
            subfilterRow.style.display = 'none';

            if (filter === 'categories') {
                currentSort = null;
                subfilterRow.style.display = 'flex';
                renderGrid();
            } else if (filter === 'date') {
                currentSort = 'date';
                sortOrder = 'desc';
                renderGrid();
            } else if (filter === 'likes') {
                currentSort = 'likes';
                renderGrid();
            }
        });
    });

    // ----- TABS -----
    function setActiveTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab === tabPub ? 'publications' : tab === tabSells ? 'sells' : 'basket';
        renderGrid();
    }

    tabPub.addEventListener('click', () => setActiveTab(tabPub));
    tabSells.addEventListener('click', () => setActiveTab(tabSells));
    tabBasket.addEventListener('click', () => setActiveTab(tabBasket));

    // ----- INICIALIZACIÓN -----
    setActiveMainChip('categories');
    subfilterRow.style.display = 'flex';
    cargarPublicaciones();   // carga real desde la BD
})();