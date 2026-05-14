// Funcion para actualizar el navbar
function actualizarNavbar() {
    const usuario = sessionStorage.getItem('usuario');
    const navLinks = document.querySelector('.nav-links');
    if (usuario) {
        navLinks.innerHTML = `
      <a href="/landing">Explora</a>
      <a href="/landing#categorias">Categorías</a>
      <a href="/basket">Canasta</a>
      <a href="/mi-perfil">Perfil</a>
      <span class="nav-logout" onclick="cerrarSesion()" title="Cerrar sesión">
        <span class="material-symbols-outlined">logout</span>
      </span>
    `;
    }
}

actualizarNavbar();

let modoEdicion = false;
let tagsActuales = [];
let nuevaFotoBase64 = null; // guarda la foto nueva si se cambió

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
        const foto = data.foto || usuario.foto;
        if (avatar && foto) {
            avatar.style.backgroundImage = `url('${foto}')`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
        }

    } catch (err) {
        console.error('Error cargando perfil:', err);
    }
}

cargarPerfil();


// ============================================
// INICIO DEL IIFE
// ============================================
(function () {
    // ============================================
    // ESTRELLAS
    // ============================================
    const sc = ['#e8d87a', '#d899e8', '#ffffff', '#f0c8a0', '#b05ad0'];
    function rc() { return sc[Math.floor(Math.random() * sc.length)]; }
    function s4(r) { const p = []; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, rad = i % 2 === 0 ? r : r * .4; p.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`); } return p.join(' '); }
    function s6(r) { const p = []; for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6 - Math.PI / 2, rad = i % 2 === 0 ? r : r * .45; p.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`); } return p.join(' '); }
    const sh = [s => `<polygon points="${s4(s)}" fill="${rc()}" opacity=".6"/>`, s => `<polygon points="${s6(s)}" fill="${rc()}" opacity=".55"/>`, s => `<polygon points="0,${-s} ${s * .4},0 0,${s} ${-s * .4},0" fill="${rc()}" opacity=".7"/>`];
    [{ size: 10, left: 4, dur: '10s', delay: '0s' }, { size: 14, left: 14, dur: '13s', delay: '2s' }, { size: 8, left: 24, dur: '9s', delay: '5s' }, { size: 16, left: 36, dur: '12s', delay: '1s' }, { size: 10, left: 50, dur: '8s', delay: '3.5s' }, { size: 18, left: 62, dur: '15s', delay: '0.5s' }, { size: 11, left: 74, dur: '11s', delay: '7s' }, { size: 9, left: 85, dur: '9s', delay: '2.5s' }, { size: 13, left: 94, dur: '12s', delay: '4s' }].forEach(d => { const sv = sh[Math.floor(Math.random() * sh.length)]; const svg = `<svg viewBox="${-d.size} ${-d.size} ${d.size * 2} ${d.size * 2}" width="${d.size * 2}" height="${d.size * 2}">${sv(d.size)}</svg>`; const el = document.createElement('div'); el.className = 'star'; el.style.cssText = `left:${d.left}%;bottom:-${d.size * 2}px;--dur:${d.dur};--delay:${d.delay}`; el.innerHTML = svg; document.body.appendChild(el); });

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
        subfilterRow.style.display = 'flex';

        const todoChip = document.createElement('span');
        todoChip.className = 'chip-filter' + (currentPublicationsFilter === 'all' ? ' active' : '');
        todoChip.dataset.filter = 'all';
        todoChip.textContent = 'Todo';
        todoChip.addEventListener('click', () => {
            currentPublicationsFilter = 'all';
            buildSubfilterChipsPublications();
            renderPublications();
        });
        subfilterRow.appendChild(todoChip);

        categoriasFiltro.forEach(cat => {
            const chip = document.createElement('span');
            chip.className = 'chip-filter' + (currentPublicationsFilter === cat.id ? ' active' : '');
            chip.dataset.filter = cat.id;
            chip.textContent = cat.nombre;
            chip.addEventListener('click', () => {
                currentPublicationsFilter = cat.id;
                buildSubfilterChipsPublications();
                renderPublications();
            });
            subfilterRow.appendChild(chip);
        });
    }

    async function cargarPublicaciones() {
        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        if (!usuario || !usuario.id) return;

        try {
            const res = await fetch(`/api/publicaciones/${usuario.id}`);
            const data = await res.json();

            allCards = data.map(pub => ({
                id: pub.ID_Publicacion,
                title: pub.Titulo,
                artist: `@${usuario.nombre.replace(/\s+/g, '').toLowerCase()}`,
                category: pub.ID_Categoria,
                catLabel: pub.Categoria || 'Otro',
                price: `$${parseFloat(pub.Precio).toFixed(2)}`,
                date: pub.FechaPublicacion ? new Date(pub.FechaPublicacion).toISOString().slice(0, 10) : '—',
                likes: '0',
                image: pub.URL_Imagen ? `data:image/jpeg;base64,${pub.URL_Imagen}` : null
            }));

            const seen = new Set();
            categoriasFiltro = [];
            allCards.forEach(card => {
                if (!seen.has(card.category) && card.category) {
                    seen.add(card.category);
                    categoriasFiltro.push({ id: card.category, nombre: card.catLabel });
                }
            });

            buildSubfilterChipsPublications();
            renderPublications();
        } catch (err) {
            console.error('Error al cargar publicaciones:', err);
        }
    }

    function renderPublications() {
        let filtered = [...allCards];

        if (currentPublicationsFilter !== 'all') {
            filtered = filtered.filter(c => c.category == currentPublicationsFilter);
        }

        if (currentPublicationsSort === 'date') {
            filtered.sort((a, b) => {
                const da = new Date(a.date), db = new Date(b.date);
                return publicationsSortOrder === 'desc' ? db - da : da - db;
            });
        } else if (currentPublicationsSort === 'likes') {
            filtered.sort((a, b) => parseFloat(b.likes) - parseFloat(a.likes));
        }

        grid.className = 'cards-grid';

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
                        onclick="event.stopPropagation();this.classList.toggle('saved')">favorite</button>
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
                buildSubfilterChipsPublications();
                renderPublications();
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

    setActiveTab(tabPub);
})();