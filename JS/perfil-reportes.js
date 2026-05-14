// ============================================
// NAVBAR
// ============================================
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

// ============================================
// CARGAR PERFIL (nombre + foto)
// ============================================
async function cargarPerfil() {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    if (!usuario) { window.location.href = '/login'; return; }

    try {
        const res  = await fetch(`/api/perfil?correo=${encodeURIComponent(usuario.correo)}`);
        const data = await res.json();

        const nombreEl = document.querySelector('.filter-card .filter-section h4');
        if (nombreEl) nombreEl.textContent = data.nombre;

        const avatar = document.querySelector('.large-avatar');
        if (avatar && data.foto) {
            avatar.style.backgroundImage  = `url('${data.foto}')`;
            avatar.style.backgroundSize   = 'cover';
            avatar.style.backgroundPosition = 'center';
        }
    } catch (err) {
        console.error('Error cargando perfil:', err);
    }
}
cargarPerfil();

// ============================================
// IIFE PRINCIPAL
// ============================================
(function () {

    // ── Estrellas ──
    const sc = ['#e8d87a','#d899e8','#ffffff','#f0c8a0','#b05ad0'];
    function rc() { return sc[Math.floor(Math.random() * sc.length)]; }
    function s4(r) { const p = []; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, rad = i % 2 === 0 ? r : r * .4; p.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`); } return p.join(' '); }
    function s6(r) { const p = []; for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6 - Math.PI / 2, rad = i % 2 === 0 ? r : r * .45; p.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`); } return p.join(' '); }
    const sh = [s => `<polygon points="${s4(s)}" fill="${rc()}" opacity=".6"/>`, s => `<polygon points="${s6(s)}" fill="${rc()}" opacity=".55"/>`, s => `<polygon points="0,${-s} ${s * .4},0 0,${s} ${-s * .4},0" fill="${rc()}" opacity=".7"/>`];
    [{ size: 10, left: 4, dur: '10s', delay: '0s' }, { size: 14, left: 14, dur: '13s', delay: '2s' }, { size: 8, left: 24, dur: '9s', delay: '5s' }, { size: 16, left: 36, dur: '12s', delay: '1s' }, { size: 10, left: 50, dur: '8s', delay: '3.5s' }, { size: 18, left: 62, dur: '15s', delay: '0.5s' }, { size: 11, left: 74, dur: '11s', delay: '7s' }, { size: 9, left: 85, dur: '9s', delay: '2.5s' }, { size: 13, left: 94, dur: '12s', delay: '4s' }].forEach(d => { const sv = sh[Math.floor(Math.random() * sh.length)]; const svg = `<svg viewBox="${-d.size} ${-d.size} ${d.size * 2} ${d.size * 2}" width="${d.size * 2}" height="${d.size * 2}">${sv(d.size)}</svg>`; const el = document.createElement('div'); el.className = 'star'; el.style.cssText = `left:${d.left}%;bottom:-${d.size * 2}px;--dur:${d.dur};--delay:${d.delay}`; el.innerHTML = svg; document.body.appendChild(el); });

    // ============================================
    // ELEMENTOS DOM
    // ============================================
    const grid           = document.getElementById('cardsGrid');
    const mainChips      = document.querySelectorAll('#filterChipsRow .chip-filter');
    const subfilterRow   = document.getElementById('subfilterRow');
    const filterChipsRow = document.getElementById('filterChipsRow');
    const sellsDashboard  = document.getElementById('sells-dashboard');
    const basketDashboard = document.getElementById('basket-dashboard');
    const tabPub    = document.getElementById('tab-publications');
    const tabSells  = document.getElementById('tab-sells');
    const tabBasket = document.getElementById('tab-basket');

    // Modal
    const modalMensaje  = document.getElementById('modalMensaje');
    const modalIcon     = document.getElementById('modalIcon');
    const modalTitulo   = document.getElementById('modalTitulo');
    const modalTexto    = document.getElementById('modalTexto');
    const modalCerrarBtn = document.getElementById('modalCerrarBtn');
    //ventas
    const ventasGrid      = document.getElementById('ventasGrid');
    const ventasChipsRow  = document.getElementById('ventasChipsRow');
    // ============================================
    // MODAL
    // ============================================
    function mostrarModal(icono, titulo, texto, esError = false) {
        modalIcon.innerHTML    = icono;
        modalTitulo.textContent = titulo;
        modalTexto.textContent  = texto;
        modalCerrarBtn.style.background = esError
            ? 'linear-gradient(90deg,#d07070,#b05050)'
            : 'linear-gradient(90deg,#e8d87a,#f0e89a)';
        modalCerrarBtn.style.color = esError ? 'white' : '#7a6010';
        modalMensaje.classList.add('show');
    }
    function cerrarModal() { modalMensaje && modalMensaje.classList.remove('show'); }
    if (modalCerrarBtn) modalCerrarBtn.addEventListener('click', cerrarModal);
    if (modalMensaje)   modalMensaje.addEventListener('click', e => { if (e.target === modalMensaje) cerrarModal(); });

    // ============================================
    // ESTADO GENERAL
    // ============================================
    let currentTab = 'publications';

    // Publicaciones
    let allCards              = [];
    let categoriasFiltro      = [];
    let currentFilter         = 'all';
    let currentMainFilter     = 'categories';
    let currentSort           = null;
    let sortOrder             = 'desc';

    // Ventas / Compras
    let allVentas       = [];
    let currentVentasFilter = 'all';   // 'all' o ID_Categoria
    let currentVentasSort   = null;    // 'date' u otro
    let allCompras      = [];
    let cachedCategorias = [];
    let chartsVentasInicializados = false;
    let basketInitialized = false;
    let chartGananciasInstance  = null;

    // ============================================
    // HELPERS
    // ============================================
    function parseLikes(likesStr) {
        if (!likesStr) return 0;
        const num = parseFloat(String(likesStr).replace('k', ''));
        return String(likesStr).includes('k') ? num * 1000 : num;
    }

    function obtenerClaseEstado(estado) {
        const map = {
            'pendiente':  'estado-pendiente',
            'aprobado':   'estado-aprobado',
            'En proceso': 'estado-en-proceso',
            'Revision':   'estado-revision',
            'Completado': 'estado-completado',
            'Cancelado':  'estado-cancelado',
        };
        return map[estado] || 'estado-pendiente';
    }

    async function obtenerCategorias() {
        if (cachedCategorias.length > 0) return cachedCategorias;
        try {
            const res = await fetch('/categorias');
            cachedCategorias = await res.json();
            return cachedCategorias;
        } catch (err) {
            console.error('Error al cargar categorías:', err);
            return [];
        }
    }

    // ============================================
    // SECCIÓN 1: PUBLICACIONES
    // ============================================
    function buildSubfilterChips() {
        subfilterRow.innerHTML = '';

        const todoChip = document.createElement('span');
        todoChip.className     = 'chip-filter' + (currentFilter === 'all' ? ' active' : '');
        todoChip.dataset.filter = 'all';
        todoChip.textContent   = 'Todo';
        todoChip.addEventListener('click', () => { currentFilter = 'all'; buildSubfilterChips(); renderGrid(); });
        subfilterRow.appendChild(todoChip);

        categoriasFiltro.forEach(cat => {
            const chip = document.createElement('span');
            chip.className     = 'chip-filter' + (currentFilter === cat.id ? ' active' : '');
            chip.dataset.filter = cat.id;
            chip.textContent   = cat.nombre;
            chip.addEventListener('click', () => { currentFilter = cat.id; buildSubfilterChips(); renderGrid(); });
            subfilterRow.appendChild(chip);
        });
    }

    async function cargarPublicaciones() {
        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        if (!usuario || !usuario.id) return;

        try {
            const res  = await fetch(`/api/publicaciones/${usuario.id}`);
            const data = await res.json();

            allCards = data.map(pub => ({
                id:       pub.ID_Publicacion,
                title:    pub.Titulo,
                artist:   `@${usuario.nombre.replace(/\s+/g, '').toLowerCase()}`,
                category: pub.ID_Categoria,
                catLabel: pub.Categoria || 'Otro',
                price:    `$${parseFloat(pub.Precio).toFixed(2)}`,
                date:     pub.FechaPublicacion ? new Date(pub.FechaPublicacion).toISOString().slice(0, 10) : '—',
                likes:    pub.Likes || '0',
                image:    pub.URL_Imagen ? `data:image/jpeg;base64,${pub.URL_Imagen}` : null
            }));

            const seen = new Set();
            categoriasFiltro = [];
            allCards.forEach(card => {
                if (!seen.has(card.category) && card.category) {
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

    function renderGrid() {
        let filtered = [...allCards];

        if (currentFilter !== 'all')   filtered = filtered.filter(c => c.category == currentFilter);
        if (currentSort === 'date')    filtered.sort((a, b) => sortOrder === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));
        else if (currentSort === 'likes') filtered.sort((a, b) => parseLikes(b.likes) - parseLikes(a.likes));

        grid.className = 'cards-grid';

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="color:#888;padding:2rem;">No hay publicaciones aún.</p>';
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

    // ============================================
    // CHIPS PRINCIPALES
    // ============================================
    function setActiveMainChip(filterValue) {
        mainChips.forEach(chip => chip.classList.toggle('active', chip.dataset.filter === filterValue));
    }

    mainChips.forEach(chip => {
        chip.addEventListener('click', function () {
            const filter = this.dataset.filter;

            if (currentTab === 'publications') {
                if (filter === currentMainFilter && filter === 'date') {
                    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
                    renderGrid();
                    return;
                }
                currentMainFilter = filter;
                setActiveMainChip(filter);
                subfilterRow.style.display = filter === 'categories' ? 'flex' : 'none';
                if (filter === 'categories') { currentSort = null; buildSubfilterChips(); }
                else if (filter === 'date')  { currentSort = 'date'; sortOrder = 'desc'; }
                else if (filter === 'likes') { currentSort = 'likes'; }
                renderGrid();
            }
        });
    });

    // ============================================
    // SECCIÓN 2: VENTAS — Dashboard real desde BD
    // ============================================
    async function cargarEstadisticasVentas() {
        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        if (!usuario || !usuario.id) return;

        let ventas = [];
        try {
            // Endpoint real: pedidos donde el usuario es el artista
            const res = await fetch(`/pedidos/artista/${usuario.id}`);
            const raw = await res.json();

            // Normalizar campos — contempla publicaciones Y comisiones sin publicación
ventas = raw.map(v => ({
                id:        v.ID_Pedido,
                titulo:    v.PublicacionTitulo || 'Comisión personalizada',
                // CategoriaNombre llega cuando agregues el JOIN en el backend
                // Si no existe, detecta si es comisión pura (sin ID_Publicacion)
                categoria: v.CategoriaNombre || 'Ilustración',
                cliente:   v.ClienteNombre || 'Cliente',
                fecha:     v.Fecha_Pedido,
                monto:     parseFloat(v.Total) || 0,
                portada:   v.Portada || null,
                rawEstado: v.Estado,
                // Para gráficas: Completado/Cancelado/todo lo demás (activos)
                estado:    v.Estado === 'Completado' ? 'Completada'
                         : v.Estado === 'Cancelado'  ? 'Cancelada'
                         : 'En proceso'
            }));
        } catch (err) {
            console.error('Error cargando ventas:', err);
            ventas = [];
        }

        allVentas = ventas;

        const completadas  = ventas.filter(v => v.estado === 'Completada');
        const canceladas   = ventas.filter(v => v.estado === 'Cancelada');
        const enProceso    = ventas.filter(v => v.estado === 'En proceso');
        const totalIngresos = completadas.reduce((s, v) => s + v.monto, 0);
        const promedio      = completadas.length ? totalIngresos / completadas.length : 0;

        // KPIs — todos los pedidos cuentan, no solo publicaciones
        document.getElementById('kpi-total').textContent         = `$${totalIngresos.toFixed(2)}`;
        document.getElementById('kpi-ventas').textContent        = completadas.length;
        document.getElementById('kpi-cancelaciones').textContent = canceladas.length;
        document.getElementById('kpi-promedio').textContent      = `$${promedio.toFixed(2)}`;

        // ── Gráfica: Ganancias por mes ──
        const mesesNombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const porMes = {};
        completadas.forEach(v => {
            const d   = new Date(v.fecha);
            const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
            porMes[key] = (porMes[key] || 0) + v.monto;
        });
        const mesesOrdenados = Object.keys(porMes).sort();
        const labelesMes     = mesesOrdenados.map(k => { const [y, m] = k.split('-'); return `${mesesNombres[parseInt(m)]} ${y}`; });
        const datosMes       = mesesOrdenados.map(k => porMes[k]);

        // Destruir instancia previa si existe (al recargar el tab)
        if (chartGananciasInstance)  { chartGananciasInstance.destroy();  chartGananciasInstance  = null; }

        const ctxBar = document.getElementById('chartGanancias').getContext('2d');
        chartGananciasInstance = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labelesMes,
                datasets: [{
                    label: 'Ganancias ($)',
                    data: datosMes,
                    backgroundColor: 'rgba(216,153,232,0.55)',
                    borderColor: '#d899e8',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    hoverBackgroundColor: 'rgba(232,216,122,0.65)',
                    hoverBorderColor: '#e8d87a',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(20,14,36,0.92)',
                        titleColor: '#e8d87a',
                        bodyColor: '#e8e0f8',
                        borderColor: '#d899e8',
                        borderWidth: 1,
                        callbacks: { label: ctx => ` $${ctx.parsed.y.toFixed(2)}` }
                    }
                },
                scales: {
                    x: { ticks: { color: '#b0a8c8', font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#b0a8c8', font: { family: 'DM Sans', size: 11 }, callback: v => `$${v}` }, grid: { color: 'rgba(255,255,255,0.07)' } }
                }
            }
        });

        // ── Tabla de ventas recientes ──
        const tbody = document.getElementById('tablaVentasBody');
        if (!ventas.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:2rem;">No tienes ventas aún ✨</td></tr>';
            return;
        }
        const recientes = [...ventas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 20);
        tbody.innerHTML = recientes.map((v, i) => {
            // Badge usa rawEstado para mostrar el estado real exacto de la BD
            // const badgeMap = {
            //     'Completado': `<span class="badge-completada">✓ Completado</span>`,
            //     'Cancelado':  `<span class="badge-cancelada">✕ Cancelado</span>`,
            //     'En proceso': `<span class="badge-pendiente">🔄 En proceso</span>`,
            //     'Revision':   `<span class="badge-pendiente">🔍 Revisión</span>`,
            //     'aprobado':   `<span class="badge-pendiente">✅ Aprobado</span>`,
            //     'pendiente':  `<span class="badge-pendiente">⏳ Pendiente</span>`,
            // };
            // const badge = badgeMap[v.rawEstado] || `<span class="badge-pendiente">⏳ ${v.rawEstado}</span>`;

            // Lista de estados permitidos (mismo orden que quieras mostrar)
const botonesEstado = `
    <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${v.rawEstado === 'pendiente' ? `
            <button class="btn-accion btn-aprobar" data-id="${v.id}">✓ Aprobar</button>
            <button class="btn-accion btn-rechazar" data-id="${v.id}">✗ Rechazar</button>
        ` : ''}
        ${v.rawEstado === 'aprobado' ? `
            <button class="btn-accion btn-iniciar" data-id="${v.id}">▶ Iniciar</button>
        ` : ''}
        ${v.rawEstado === 'En proceso' ? `
            <button class="btn-accion btn-revision" data-id="${v.id}">🔄 Revisión</button>
            <button class="btn-accion btn-completar" data-id="${v.id}">✅ Completar</button>
        ` : ''}
        ${v.rawEstado === 'Revision' ? `
            <button class="btn-accion btn-retomar" data-id="${v.id}">✏️ Retomar</button>
            <button class="btn-accion btn-completar" data-id="${v.id}">✅ Completar</button>
        ` : ''}
        ${v.rawEstado === 'Completado' ? `<span class="badge-completada">✓ Completado</span>` : ''}
        ${v.rawEstado === 'Cancelado' ? `<span class="badge-cancelada">✕ Cancelado</span>` : ''}
    </div>
`;
            const fecha = new Date(v.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
            // Indicador visual si es comisión sin publicación
            const tipoIcon = !v.portada ? '🎨 ' : '';
            return `<tr>
                <td style="color:#6a5a88">${i + 1}</td>
                <td><strong>${tipoIcon}${v.titulo}</strong></td>
                <td style="color:#d899e8;font-size:.8rem">${v.cliente}</td>
                <td>${v.categoria}</td>
                <td>${fecha}</td>
                <td style="color:#e8d87a;font-weight:700">$${v.monto.toFixed(2)}</td>
                <td>${botonesEstado}</td>
            </tr>`;
        }).join('');
                // Escuchar cambios en los selects de estado de ventas
      document.querySelectorAll('.btn-aprobar').forEach(btn => {
    btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'aprobado', 'ventas'));
});
document.querySelectorAll('.btn-rechazar').forEach(btn => {
    btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'Cancelado', 'ventas'));
});
document.querySelectorAll('.btn-iniciar, .btn-retomar').forEach(btn => {
    btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'En proceso', 'ventas'));
});
document.querySelectorAll('.btn-revision').forEach(btn => {
    btn.addEventListener('click', () => mostrarModalRevision(btn.dataset.id));
});
document.querySelectorAll('.btn-completar').forEach(btn => {
    btn.addEventListener('click', () => mostrarModalCompletar(btn.dataset.id));
});
    }

    // ============================================
    // SECCIÓN 3: CANASTA — Dashboard real desde BD
    // ============================================
    async function cargarCanasta() {
        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        if (!usuario || !usuario.id) return;

        let pedidos = [];
        try {
            // Endpoint real: pedidos donde el usuario es el comprador
            const res = await fetch(`/pedidos/usuario/${usuario.id}`);
            const raw = await res.json();

            // Normalizar campos del backend
pedidos = raw.map(p => ({
                id:        p.ID_Pedido,
                idArtista: p.ID_Artista,  
                titulo:    p.PublicacionTitulo || 'Comisión personalizada',
                artista:   p.ArtistaNombre    ? `@${p.ArtistaNombre.replace(/\s+/g,'').toLowerCase()}` : 'Artista',
                categoria: p.CategoriaNombre || 'Ilustración',
                fecha:     p.Fecha_Pedido,
                precio:    parseFloat(p.Total) || 0,
                estado:    p.Estado === 'Completado' ? 'Entregado'
                         : p.Estado === 'Cancelado'  ? 'Cancelado'
                         : p.Estado === 'En proceso' ? 'En proceso'
                         : 'Pendiente',
                personalizacion: p.Personalizacion || null,
                rawEstado: p.Estado
            }));
        } catch (err) {
            console.error('Error cargando canasta:', err);
            pedidos = [];
        }

        allCompras = pedidos;

        // KPIs
              // KPIs
        const cancelados = pedidos.filter(p => p.estado === 'Cancelado').length;
        const entregados = pedidos.filter(p => p.estado === 'Entregado').length;
        const gastado    = pedidos.filter(p => p.estado !== 'Cancelado').reduce((s, p) => s + p.precio, 0);

        document.getElementById('bkpi-total').textContent      = pedidos.length;
        document.getElementById('bkpi-proceso').textContent    = cancelados;
        document.getElementById('bkpi-entregados').textContent = entregados;
        document.getElementById('bkpi-gastado').textContent    = `$${gastado.toFixed(2)}`;
        // Tabla
        const tbody = document.getElementById('tablaCanasta');
        if (!pedidos.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:2rem;">No has pedido comisiones aún 🎨</td></tr>';
            return;
        }

        const ordenados = [...pedidos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        tbody.innerHTML = ordenados.map((p, i) => {
            const badge =
                p.estado === 'Entregado'  ? `<span class="badge-completada">✓ Entregado</span>`  :
                p.estado === 'En proceso' ? `<span class="badge-pendiente">⏳ En proceso</span>`  :
                p.estado === 'Cancelado'  ? `<span class="badge-cancelada">✕ Cancelado</span>`   :
                                           `<span class="badge-pendiente">📋 Pendiente</span>`;
            const fecha = new Date(p.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

            // Botón de reseña solo si fue entregado
            const accionHTML = p.estado === 'Entregado'
                ? `<button class="btn-reseñar" data-id="${p.id}" data-artista="${p.idArtista || ''}" style=...>⭐ Reseñar</button>`
                : '';

            return `<tr>
                <td style="color:#6a5a88">${i + 1}</td>
                <td><strong>${p.titulo}</strong></td>
                <td style="color:#d899e8">${p.artista}</td>
                <td>${p.categoria}</td>
                <td>${fecha}</td>
                <td style="color:#e8d87a;font-weight:700">$${p.precio.toFixed(2)}</td>
                <td>${badge} ${accionHTML}</td>
            </tr>`;
        }).join('');


        document.querySelectorAll('.btn-reseñar').forEach(btn => {
    btn.addEventListener('click', () => mostrarModalResena(btn.dataset.id, btn.dataset.artista));
});
    }

    // ============================================
    // ACTUALIZAR ESTADO DE PEDIDO
    // ============================================
  async function actualizarEstadoPedido(id, nuevoEstado, origen) {
    try {
        // Siempre usamos el endpoint genérico, enviando el estado deseado
        const response = await fetch(`/pedidos/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevoEstado })
        });
        const data = await response.json();

      if (response.ok) {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const mensajes = {
        'aprobado':   '✅ El artista ha aceptado tu comisión. Pronto iniciará el trabajo.',
        'Cancelado':  '❌ El artista ha rechazado la comisión.',
        'En proceso': '🎨 El artista ha iniciado el trabajo en tu comisión.',
        'Completado': '🎉 ¡Comisión completada! Puedes dejar una reseña.',
    };
 if (mensajes[nuevoEstado]) {
        await fetch('/chat/mensaje', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_pedido: id,
                id_emisor: usuario.id,
                contenido: mensajes[nuevoEstado]
            })
        });
    }

    const msgs = {
        'pendiente':  ['⏳', 'Pendiente',   'Pedido puesto en pendiente'],
        'aprobado':   ['✅', 'Aprobado',    'Pedido aprobado'],
        'En proceso': ['🔄', 'En proceso',  'Has iniciado el trabajo'],
        'Revision':   ['🔍', 'En revisión', 'Trabajo enviado a revisión'],
        'Completado': ['🎉', 'Completado',  '¡Pedido completado!'],
        'Cancelado':  ['❌', 'Cancelado',   'Pedido cancelado']
    };
    const [icono, titulo, mensaje] = msgs[nuevoEstado] || ['✅', 'Actualizado', data.msg || 'Estado actualizado'];
    mostrarModal(icono, titulo, mensaje);

    if (origen === 'ventas') setTimeout(() => cargarEstadisticasVentas(), 800);

    } else {
        mostrarModal('⚠️', 'Error', data.msg || 'No se pudo actualizar el estado', true);
    }
    } catch (err) {
        console.error('Error:', err);
        mostrarModal('⚠️', 'Error de conexión', 'No se pudo conectar con el servidor', true);
    }
}

    // ============================================
    // MOSTRAR / OCULTAR PANELES POR TAB
    // ============================================
    function showPublicationsUI() {
        filterChipsRow.style.display  = 'flex';
        subfilterRow.style.display    = currentMainFilter === 'categories' ? 'flex' : 'none';
        grid.style.display            = '';
        sellsDashboard.style.display  = 'none';
        basketDashboard.style.display = 'none';
    }

    function showSellsUI() {
        filterChipsRow.style.display  = 'none';
        subfilterRow.style.display    = 'none';
        grid.style.display            = 'none';
        sellsDashboard.style.display  = 'block';
        basketDashboard.style.display = 'none';
        // Siempre recargar para reflejar cambios de estado
        cargarEstadisticasVentas();
    }

    function showBasketUI() {
        filterChipsRow.style.display  = 'none';
        subfilterRow.style.display    = 'none';
        grid.style.display            = 'none';
        sellsDashboard.style.display  = 'none';
        basketDashboard.style.display = 'block';
        if (!basketInitialized) { basketInitialized = true; cargarCanasta(); }
        else cargarCanasta(); // Recargar siempre para datos frescos
    }

    function setActiveTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab === tabPub ? 'publications' : tab === tabSells ? 'sells' : 'basket';
        if (currentTab === 'sells')        showSellsUI();
        else if (currentTab === 'basket')  showBasketUI();
        else { showPublicationsUI(); renderGrid(); }
    }

    tabPub.addEventListener('click',    () => setActiveTab(tabPub));
    tabSells.addEventListener('click',  () => setActiveTab(tabSells));
    tabBasket.addEventListener('click', () => setActiveTab(tabBasket));

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    setActiveMainChip('categories');
    subfilterRow.style.display = 'flex';
    cargarPublicaciones();

function mostrarModalResena(idPedido, idArtista) {
    const modalViejo = document.getElementById('modalResena');
    if (modalViejo) modalViejo.remove();

    const modal = document.createElement('div');
    modal.id = 'modalResena';
    modal.className = 'modal-mensaje-overlay';
    modal.innerHTML = `
        <div class="modal-mensaje-box" style="max-width:420px">
            <div class="modal-mensaje-icon">⭐</div>
            <h3 class="modal-mensaje-titulo">Dejar reseña</h3>
            <p class="modal-mensaje-texto">¿Cómo fue tu experiencia con este artista?</p>
            <div id="estrellas-input" style="display:flex;gap:8px;justify-content:center;margin:16px 0;font-size:32px;cursor:pointer">
                <span class="estrella" data-val="1">☆</span>
                <span class="estrella" data-val="2">☆</span>
                <span class="estrella" data-val="3">☆</span>
                <span class="estrella" data-val="4">☆</span>
                <span class="estrella" data-val="5">☆</span>
            </div>
            <input type="hidden" id="puntuacion-val" value="0">
            <textarea id="comentario-resena" placeholder="Cuéntanos sobre tu experiencia (opcional)..."
                style="width:100%;background:#2a1040;border:1px solid #ffffff15;border-radius:10px;
                padding:10px;color:white;font-family:'DM Sans',sans-serif;font-size:13px;
                resize:vertical;min-height:80px;margin-bottom:14px;box-sizing:border-box"></textarea>
            <div style="display:flex;gap:10px;justify-content:center">
                <button id="btnCancelarResena" class="modal-mensaje-boton" style="background:#333;color:white">Cancelar</button>
                <button id="btnEnviarResena" class="modal-mensaje-boton">Publicar reseña</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.classList.add('show');
    document.getElementById('puntuacion-val').value = '0';
    document.getElementById('comentario-resena').value = '';

    const estrellas = document.querySelectorAll('.estrella');
    estrellas.forEach(estrella => {
        estrella.onmouseover = () => {
            estrellas.forEach(e => e.textContent = e.dataset.val <= estrella.dataset.val ? '★' : '☆');
        };
        estrella.onmouseout = () => {
            const val = document.getElementById('puntuacion-val').value;
            estrellas.forEach(e => e.textContent = e.dataset.val <= val ? '★' : '☆');
        };
        estrella.onclick = () => {
            document.getElementById('puntuacion-val').value = estrella.dataset.val;
            estrellas.forEach(e => e.textContent = e.dataset.val <= estrella.dataset.val ? '★' : '☆');
        };
    });

    document.getElementById('btnCancelarResena').onclick = () => modal.remove();

    document.getElementById('btnEnviarResena').onclick = async () => {
        const puntuacion = parseInt(document.getElementById('puntuacion-val').value);
        if (!puntuacion) {
            mostrarModal('⚠️', 'Selecciona estrellas', 'Por favor selecciona una puntuación.', true);
            return;
        }
        const usuario    = JSON.parse(sessionStorage.getItem('usuario'));
        const comentario = document.getElementById('comentario-resena').value.trim();

        const res = await fetch('/resenas/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_pedido:  idPedido,
                id_usuario: usuario.id,
                id_artista: idArtista,
                puntuacion,
                comentario
            })
        });

        const data = await res.json();
        modal.remove();

        if (res.ok) {
            mostrarModal('🌸', '¡Gracias!', 'Tu reseña fue publicada correctamente.');
        } else {
            mostrarModal('⚠️', 'Error', data.msg, true);
        }
    };

    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function mostrarModalRevision(idPedido) {
    const modalViejo = document.getElementById('modalRevision');
    if (modalViejo) modalViejo.remove();

    const modal = document.createElement('div');
    modal.id = 'modalRevision';
    modal.className = 'modal-mensaje-overlay';
    modal.innerHTML = `
        <div class="modal-mensaje-box" style="max-width:420px">
            <div class="modal-mensaje-icon">🖼️</div>
            <h3 class="modal-mensaje-titulo">Enviar a revisión</h3>
            <p class="modal-mensaje-texto">Adjunta una imagen del avance para que el cliente pueda aprobar o sugerir cambios.</p>
            <label style="display:flex;flex-direction:column;gap:6px;margin:14px 0;text-align:left;font-size:13px;color:#aaa;cursor:pointer">
                Imagen del avance (obligatoria)
                <input type="file" id="inputImagenRevision" accept="image/*" style="font-size:13px;color:white;cursor:pointer">
            </label>
            <div id="previewRevision" style="display:none;margin-bottom:12px;text-align:center">
                <img id="imgPreviewRevision" style="max-width:100%;border-radius:10px;max-height:160px;object-fit:cover;">
            </div>
            <div style="display:flex;gap:10px;justify-content:center;margin-top:8px">
                <button id="btnCancelarRevision" class="modal-mensaje-boton" style="background:#333;color:white">Cancelar</button>
                <button id="btnEnviarRevision" class="modal-mensaje-boton">Enviar revisión</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('show');

    const inputImg = document.getElementById('inputImagenRevision');
    inputImg.onchange = () => {
        if (inputImg.files[0]) {
            document.getElementById('imgPreviewRevision').src = URL.createObjectURL(inputImg.files[0]);
            document.getElementById('previewRevision').style.display = 'block';
        }
    };

    document.getElementById('btnCancelarRevision').onclick = () => modal.remove();

    document.getElementById('btnEnviarRevision').onclick = async () => {
        const file = inputImg.files[0];
        if (!file) { mostrarModal('⚠️', 'Imagen requerida', 'Debes adjuntar una imagen del avance.', true); return; }

        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        const res = await fetch(`/pedidos/${idPedido}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevoEstado: 'Revision' })
        });
        if (!res.ok) { mostrarModal('⚠️', 'Error', 'No se pudo actualizar el estado.', true); return; }

        const formData = new FormData();
        formData.append('id_pedido', idPedido);
        formData.append('id_emisor', usuario.id);
        formData.append('contenido', '🖼️ He enviado el avance a revisión. Por favor revisa la imagen y dime si hay cambios o si lo apruebas.');
        formData.append('boceto', file);
        await fetch('/chat/mensaje', { method: 'POST', body: formData });

        modal.remove();
        mostrarModal('✅', '¡Enviado a revisión!', 'El cliente recibirá tu avance en el chat.');
        setTimeout(() => cargarEstadisticasVentas(), 900);
    };

    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function mostrarModalCompletar(idPedido) {
    const modalViejo = document.getElementById('modalCompletar');
    if (modalViejo) modalViejo.remove();

    const modal = document.createElement('div');
    modal.id = 'modalCompletar';
    modal.className = 'modal-mensaje-overlay';
    modal.innerHTML = `
        <div class="modal-mensaje-box" style="max-width:420px">
            <div class="modal-mensaje-icon">🎉</div>
            <h3 class="modal-mensaje-titulo">Completar comisión</h3>
            <p class="modal-mensaje-texto">Adjunta la imagen final de la obra para que el cliente pueda verla y dejar una reseña.</p>
            <label style="display:flex;flex-direction:column;gap:6px;margin:14px 0;text-align:left;font-size:13px;color:#aaa;cursor:pointer">
                Obra final (obligatoria)
                <input type="file" id="inputImagenCompletar" accept="image/*" style="font-size:13px;color:white;cursor:pointer">
            </label>
            <div id="previewCompletar" style="display:none;margin-bottom:12px;text-align:center">
                <img id="imgPreviewCompletar" style="max-width:100%;border-radius:10px;max-height:160px;object-fit:cover;">
            </div>
            <div style="display:flex;gap:10px;justify-content:center;margin-top:8px">
                <button id="btnCancelarCompletar" class="modal-mensaje-boton" style="background:#333;color:white">Cancelar</button>
                <button id="btnEnviarCompletar" class="modal-mensaje-boton" style="background:linear-gradient(90deg,#5ab05a,#3a803a);color:white">Completar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('show');

    const inputImg = document.getElementById('inputImagenCompletar');
    inputImg.onchange = () => {
        if (inputImg.files[0]) {
            document.getElementById('imgPreviewCompletar').src = URL.createObjectURL(inputImg.files[0]);
            document.getElementById('previewCompletar').style.display = 'block';
        }
    };

    document.getElementById('btnCancelarCompletar').onclick = () => modal.remove();

    document.getElementById('btnEnviarCompletar').onclick = async () => {
        const file = inputImg.files[0];
        if (!file) { mostrarModal('⚠️', 'Imagen requerida', 'Debes adjuntar la imagen final de la obra.', true); return; }

        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        const res = await fetch(`/pedidos/${idPedido}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevoEstado: 'Completado' })
        });
        if (!res.ok) { mostrarModal('⚠️', 'Error', 'No se pudo completar el pedido.', true); return; }

        const formData = new FormData();
        formData.append('id_pedido', idPedido);
        formData.append('id_emisor', usuario.id);
        formData.append('contenido', '🎉 ¡Comisión completada! Aquí está tu obra final. Espero que te encante.');
        formData.append('boceto', file);
        await fetch('/chat/mensaje', { method: 'POST', body: formData });

        modal.remove();
        mostrarModal('🎉', '¡Completado!', 'La obra fue enviada al cliente.');
        setTimeout(() => cargarEstadisticasVentas(), 900);
    };

    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

})();