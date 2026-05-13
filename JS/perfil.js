/*// Funcion para actualizar el navbar
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

let modoEdicion = false;
let tagsActuales = [];
let nuevaFotoBase64 = null; // guarda la foto nueva si se cambió

async function cargarPerfil() {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    if (!usuario) { window.location.href = '/login'; return; }

    try {
        const res = await fetch(`/api/perfil?correo=${encodeURIComponent(usuario.correo)}`);
        const data = await res.json();

        // Nombre
        const labelNombre = document.getElementById('label-nombre');
        const nameInput = document.getElementById('nameInput');
        if (labelNombre) labelNombre.textContent = data.nombre || usuario.nombre;
        if (nameInput) nameInput.value = data.nombre || usuario.nombre;

        // Descripción
        const descDisplay = document.getElementById('desc-display');
        const descInput = document.getElementById('descriptionInput');
        const desc = usuario.descripcion || data.biografia || '';
        if (descDisplay) descDisplay.textContent = desc;
        if (descInput) descInput.value = desc;

        // Avatar
        const avatar = document.querySelector('.large-avatar');
        const foto = data.foto || usuario.foto;
        if (avatar && foto) {
            avatar.style.backgroundImage = `url('${foto}')`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
        }

        // Tags
        try {
            const resTags = await fetch(`/api/tags/${usuario.id}`);
            tagsActuales = (await resTags.json()).map(t => t.Nombre);
        } catch {
            tagsActuales = [];
        }
        renderTags();

    } catch (err) {
        console.error('Error cargando perfil:', err);
    }
}

function renderTags() {
    const group = document.getElementById('tag-group');
    if (!group) return;
    group.innerHTML = '';
    tagsActuales.forEach((tag, i) => {
        const span = document.createElement('span');
        span.className = 'filter-tag';
        span.innerHTML = tag + (modoEdicion
            ? `<button class="tag-remove" onclick="eliminarTag(${i})">×</button>`
            : '');
        group.appendChild(span);
    });
}

function eliminarTag(index) {
    tagsActuales.splice(index, 1);
    renderTags();
}

function agregarTag() {
    const input = document.getElementById('tagInput');
    const valor = input.value.trim();
    if (!valor) return;
    if (tagsActuales.includes(valor)) { input.value = ''; return; }
    if (tagsActuales.length >= 8) return;
    tagsActuales.push(valor);
    input.value = '';
    renderTags();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tagInput')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); agregarTag(); }
    });
});

function previewFoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        nuevaFotoBase64 = e.target.result; // guarda para enviar
        const avatar = document.querySelector('.large-avatar');
        if (avatar) {
            avatar.style.backgroundImage = `url('${nuevaFotoBase64}')`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
        }
    };
    reader.readAsDataURL(file);
}

function toggleEditar() {
    modoEdicion = !modoEdicion;
    const btn = document.getElementById('boton-editar');
    const labelNombre = document.getElementById('label-nombre');
    const nameInput = document.getElementById('nameInput');
    const descDisplay = document.getElementById('desc-display');
    const descInput = document.getElementById('descriptionInput');
    const tagAddRow = document.getElementById('tag-add-row');
    const btnFoto = document.getElementById('btn-cambiar-foto');

    if (modoEdicion) {
        // Entrar a modo edición
        labelNombre.classList.add('edit-field-hidden');
        nameInput.classList.remove('edit-field-hidden');

        descDisplay.classList.add('edit-field-hidden');
        descInput.classList.remove('edit-field-hidden');

        tagAddRow.classList.remove('edit-field-hidden');
        btnFoto.classList.remove('edit-field-hidden');

        btn.textContent = 'Guardar cambios';

    } else {
        // Salir de modo edición — validar y guardar
        const nuevoNombre = nameInput.value.trim();
        const nuevaDesc = descInput.value.trim();

        if (!nuevoNombre) {
            nameInput.style.border = '1.5px solid #e87a7a';
            nameInput.focus();
            modoEdicion = true; // no salir
            return;
        }
        nameInput.style.border = '';

        labelNombre.classList.remove('edit-field-hidden');
        nameInput.classList.add('edit-field-hidden');

        descDisplay.classList.remove('edit-field-hidden');
        descInput.classList.add('edit-field-hidden');

        tagAddRow.classList.add('edit-field-hidden');
        btnFoto.classList.add('edit-field-hidden');

        btn.textContent = 'Editar perfil';

        guardarCambios(nuevoNombre, nuevaDesc);
    }

    renderTags();
}

async function guardarCambios(nuevoNombre, nuevaDesc) {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    if (!usuario) return;

    const promesas = [];

    // Siempre guarda nombre y bio 
    promesas.push(
        fetch(`/api/perfil/${usuario.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nuevoNombre, biografia: nuevaDesc })
        })
    );

    // Tags
    promesas.push(
        fetch(`/api/tags/${usuario.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: tagsActuales })
        })
    );

    // Foto — solo si se cambió
    if (nuevaFotoBase64) {
        promesas.push(
            fetch(`/api/perfil/${usuario.id}/foto`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ foto: nuevaFotoBase64 })
            })
        );
    }

    try {
        await Promise.all(promesas);

        // Actualizar sessionStorage
        usuario.nombre = nuevoNombre;
        usuario.descripcion = nuevaDesc;
        if (nuevaFotoBase64) usuario.foto = nuevaFotoBase64;
        sessionStorage.setItem('usuario', JSON.stringify(usuario));
        nuevaFotoBase64 = null;

        // Actualizar UI de lectura
        document.getElementById('label-nombre').textContent = nuevoNombre;
        const descDisplay = document.getElementById('desc-display');
        if (descDisplay) descDisplay.textContent = nuevaDesc;

        await Swal.fire({
            icon: 'success',
            title: 'Cambios guardados',
            text: 'Tu perfil se actualizó con éxito.',
            timer: 2500,
            timerProgressBar: true,
            showConfirmButton: false,
            color: '#3a0a5a',
            iconColor: '#b05ad0',
            confirmButtonColor: '#b05ad0'
        });


    } catch (err) {
        console.error('Error al guardar:', err);
        await Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            text: 'Ocurrió un error al guardar los cambios. Por favor, intenta de nuevo.',
            timer: 2500,
            timerProgressBar: true,
            showConfirmButton: false,
            color: '#3a0a5a',
            iconColor: '#b05ad0',
            confirmButtonColor: '#b05ad0'
        });

    }
}


cargarPerfil();


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

    // ============================================
    // ELEMENTOS DOM
    // ============================================
    const grid = document.getElementById('cardsGrid');

    const mainChips = document.querySelectorAll('#filterChipsRow .chip-filter');
    const subfilterRow = document.getElementById('subfilterRow');

    const tabPub = document.getElementById('tab-publications');
    const tabSells = document.getElementById('tab-sells');
    const tabBasket = document.getElementById('tab-basket');


    //----SECCIONES DE PERFIL-----
    const sellsDashboard  = document.getElementById('sells-dashboard');
    const basketDashboard = document.getElementById('basket-dashboard');

    // Elementos del modal
    const modalMensaje = document.getElementById('modalMensaje');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalTexto = document.getElementById('modalTexto');
    const modalCerrarBtn = document.getElementById('modalCerrarBtn');

    // ============================================
    // FUNCIONES DEL MODAL
    // ============================================
    function mostrarModal(icono, titulo, texto, esError = false) {

        modalIcon.innerHTML = icono;
        modalTitulo.textContent = titulo;
        modalTexto.textContent = texto;

        if (esError) {
            modalCerrarBtn.style.background = 'linear-gradient(90deg, #d07070, #b05050)';
            modalCerrarBtn.style.color = 'white';
        } else {
            modalCerrarBtn.style.background = 'linear-gradient(90deg, #e8d87a, #f0e89a)';
            modalCerrarBtn.style.color = '#7a6010';
        }

        modalMensaje.classList.add('show');
        console.log("✅ Modal debería estar visible ahora");
    }
    function cerrarModal() {
        if (modalMensaje) {
            modalMensaje.classList.remove('show');
        }
    }

    // Configurar eventos del modal
    if (modalCerrarBtn) {
        modalCerrarBtn.addEventListener('click', cerrarModal);
    }
    if (modalMensaje) {
        modalMensaje.addEventListener('click', (e) => {
            if (e.target === modalMensaje) cerrarModal();
        });
    }

    // ============================================
    // ESTADO GENERAL
    // ============================================
    let currentTab = 'publications';

    // Estado para PUBLICACIONES
    let allCards = [];
    let categoriasFiltro = [];
    let currentPublicationsFilter = 'all';
    let currentPublicationsSort = null;
    let publicationsSortOrder = 'desc';

    // Estado para VENTAS
    let allVentas = [];
    let currentVentasFilter = 'all';
    let currentVentasSort = null;

    // Estado para COMPRAS
    let allCompras = [];
    let currentComprasFilter = 'all';
    let currentComprasSort = null;

    // Cache de categorías
    let cachedCategorias = [];

    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================
    function obtenerClaseEstado(estado) {
        switch (estado) {
            case 'pendiente': return 'estado-pendiente';
            case 'aprobado': return 'estado-aprobado';
            case 'En proceso': return 'estado-en-proceso';
            case 'Revision': return 'estado-revision';
            case 'Completado': return 'estado-completado';
            case 'Cancelado': return 'estado-cancelado';
            default: return 'estado-pendiente';
        }
    }

    async function obtenerCategorias() {
        if (cachedCategorias.length > 0) return cachedCategorias;
        try {
            const response = await fetch('/categorias');
            cachedCategorias = await response.json();
            return cachedCategorias;
        } catch (err) {
            console.error("Error al cargar categorías:", err);
            return [];
        }
    }

    // ============================================
    // SECCIÓN 1: PUBLICACIONES
    // ============================================
    function buildSubfilterChipsPublications() {
        if (!subfilterRow) return;
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

        // Un chip por cada categoría que tenga al menos una publicación
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
                        onclick="this.classList.toggle('saved')">favorite</button>
                </div>`;
        }).join('');
    }

    // ============================================
    // SECCIÓN 2: VENTAS
    // ============================================
    async function cargarVentas() {
        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        if (!usuario || !usuario.id) return [];

        try {
            const response = await fetch(`/pedidos/artista/${usuario.id}`);
            allVentas = await response.json();
            return allVentas;
        } catch (err) {
            console.error("Error al cargar ventas:", err);
            allVentas = [];
            return [];
        }
    }

    async function renderizarFiltrosCategoriasVentas() {
        if (!subfilterRow) return;
        const categorias = await obtenerCategorias();

        subfilterRow.innerHTML = `
            <span class="chip-filter ${currentVentasFilter === 'all' ? 'active' : ''}" data-filter="all">Todos</span>
            ${categorias.map(cat => `
                <span class="chip-filter ${currentVentasFilter === cat.ID_Categoria ? 'active' : ''}" 
                      data-filter="${cat.ID_Categoria}">
                    ${cat.Nombre}
                </span>
            `).join('')}
        `;

        document.querySelectorAll('#subfilterRow .chip-filter').forEach(chip => {
            chip.addEventListener('click', async () => {
                const filterValue = chip.dataset.filter;
                currentVentasFilter = filterValue === 'all' ? 'all' : parseInt(filterValue);
                await renderizarFiltrosCategoriasVentas();
                await renderizarVentas();
            });
        });
    }

    async function renderizarVentas() {
        await cargarVentas();

        grid.className = 'pedidos-container';

        if (allVentas.length === 0) {
            grid.innerHTML = '<div class="empty-message">✨ No tienes ventas aún. ✨</div>';
            return;
        }

        let filtered = [...allVentas];

        if (currentVentasFilter !== 'all') {
            filtered = filtered.filter(venta => venta.ID_Categoria == currentVentasFilter);
        }

        if (currentVentasSort === 'date') {
            filtered.sort((a, b) => new Date(b.Fecha_Pedido) - new Date(a.Fecha_Pedido));
        }

        grid.innerHTML = filtered.map(venta => {
            const estadoClass = obtenerClaseEstado(venta.Estado);
            const imgHTML = venta.Portada
                ? `<div class="pedido-imagen" style="background-image: url('data:image/jpeg;base64,${venta.Portada}');"></div>`
                : `<div class="pedido-imagen placeholder">🎨</div>`;

            return `
                <div class="pedido-card">
                    ${imgHTML}
                    <div class="pedido-contenido">
                        <div class="pedido-header">
                            <div>
                                <h3 class="pedido-cliente">${venta.ClienteNombre || 'Cliente'}</h3>
                                <p class="pedido-publicacion">${venta.PublicacionTitulo || 'Comisión personalizada'}</p>
                            </div>
                            <span class="pedido-estado ${estadoClass}">${venta.Estado}</span>
                        </div>
                        ${venta.Personalizacion ? `
                            <div class="pedido-personalizacion">
                                <strong>Personalización:</strong> ${venta.Personalizacion}
                            </div>
                        ` : ''}
                        <div class="pedido-footer">
                            <span class="pedido-precio">$${parseFloat(venta.Total).toFixed(2)} USD</span>
                            <span class="pedido-fecha">${new Date(venta.Fecha_Pedido).toLocaleDateString()}</span>
                        </div>
                        <div class="pedido-acciones">
                            ${venta.Estado === 'pendiente' ? `
                                <button class="btn-aprobar" data-id="${venta.ID_Pedido}">✓ Aprobar</button>
                                <button class="btn-rechazar" data-id="${venta.ID_Pedido}">✗ Rechazar</button>
                            ` : ''}
                            ${venta.Estado === 'aprobado' ? `
                                <button class="btn-iniciar" data-id="${venta.ID_Pedido}">▶ Iniciar trabajo</button>
                            ` : ''}
                            ${venta.Estado === 'En proceso' ? `
                                <button class="btn-revision" data-id="${venta.ID_Pedido}">🔄 Enviar a revisión</button>
                                <button class="btn-completar" data-id="${venta.ID_Pedido}">✅ Completar</button>
                            ` : ''}
                            ${venta.Estado === 'Revision' ? `
                                <button class="btn-retomar" data-id="${venta.ID_Pedido}">✏️ Retomar trabajo</button>
                                <button class="btn-completar" data-id="${venta.ID_Pedido}">✅ Completar</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.btn-aprobar').forEach(btn => {
            btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'aprobado', 'ventas'));
        });
        document.querySelectorAll('.btn-rechazar').forEach(btn => {
            btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'rechazar', 'ventas'));
        });
        document.querySelectorAll('.btn-iniciar, .btn-retomar').forEach(btn => {
            btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'En proceso', 'ventas'));
        });
        document.querySelectorAll('.btn-revision').forEach(btn => {
            btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'Revision', 'ventas'));
        });
        document.querySelectorAll('.btn-completar').forEach(btn => {
            btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'Completado', 'ventas'));
        });
    }

    // ============================================
    // SECCIÓN 3: COMPRAS
    // ============================================
    async function cargarCompras() {
        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        if (!usuario || !usuario.id) return [];

        try {
            const response = await fetch(`/pedidos/usuario/${usuario.id}`);
            allCompras = await response.json();
            return allCompras;
        } catch (err) {
            console.error("Error al cargar compras:", err);
            allCompras = [];
            return [];
        }
    }

    async function renderizarFiltrosCategoriasCompras() {
        if (!subfilterRow) return;
        const categorias = await obtenerCategorias();

        subfilterRow.innerHTML = `
            <span class="chip-filter ${currentComprasFilter === 'all' ? 'active' : ''}" data-filter="all">Todos</span>
            ${categorias.map(cat => `
                <span class="chip-filter ${currentComprasFilter === cat.ID_Categoria ? 'active' : ''}" 
                      data-filter="${cat.ID_Categoria}">
                    ${cat.Nombre}
                </span>
            `).join('')}
        `;

        document.querySelectorAll('#subfilterRow .chip-filter').forEach(chip => {
            chip.addEventListener('click', async () => {
                const filterValue = chip.dataset.filter;
                currentComprasFilter = filterValue === 'all' ? 'all' : parseInt(filterValue);
                await renderizarFiltrosCategoriasCompras();
                await renderizarCompras();
            });
        });
    }

    async function renderizarCompras() {
        await cargarCompras();

        grid.className = 'pedidos-container';

        if (allCompras.length === 0) {
            grid.innerHTML = '<div class="empty-message">✨ No has realizado compras aún. ✨</div>';
            return;
        }

        let filtered = [...allCompras];

        if (currentComprasFilter !== 'all') {
            filtered = filtered.filter(compra => compra.ID_Categoria == currentComprasFilter);
        }

        if (currentComprasSort === 'date') {
            filtered.sort((a, b) => new Date(b.Fecha_Pedido) - new Date(a.Fecha_Pedido));
        }

        grid.innerHTML = filtered.map(pedido => {
            const estadoClass = obtenerClaseEstado(pedido.Estado);
            const imgHTML = pedido.Portada
                ? `<div class="pedido-imagen" style="background-image: url('data:image/jpeg;base64,${pedido.Portada}');"></div>`
                : `<div class="pedido-imagen placeholder">🎨</div>`;

            return `
                <div class="pedido-card">
                    ${imgHTML}
                    <div class="pedido-contenido">
                        <div class="pedido-header">
                            <div>
                                <h3 class="pedido-artista">${pedido.ArtistaNombre || 'Artista'}</h3>
                                <p class="pedido-publicacion">${pedido.PublicacionTitulo || 'Comisión personalizada'}</p>
                            </div>
                            <span class="pedido-estado ${estadoClass}">${pedido.Estado}</span>
                        </div>
                        ${pedido.Personalizacion ? `
                            <div class="pedido-personalizacion">
                                <strong>Personalización:</strong> ${pedido.Personalizacion}
                            </div>
                        ` : ''}
                        <div class="pedido-footer">
                            <span class="pedido-precio">$${parseFloat(pedido.Total).toFixed(2)} USD</span>
                            <span class="pedido-fecha">${new Date(pedido.Fecha_Pedido).toLocaleDateString()}</span>
                        </div>
                        <div class="pedido-acciones">
                            ${pedido.Estado === 'Completado' ?
                    `<button class="btn-reseñar" data-id="${pedido.ID_Pedido}">⭐ Dejar reseña</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.btn-reseñar').forEach(btn => {
            btn.addEventListener('click', () => mostrarModal('⭐', 'Próximamente', 'Funcionalidad de reseña en desarrollo'));
        });
    }

    // ============================================
    // ACTUALIZAR ESTADO DE PEDIDO (con modal)
    // ============================================
    async function actualizarEstadoPedido(id, nuevoEstado, origen) {
        // Mostrar loading en el botón si se puede
        try {
            let url = `/pedidos/${id}/estado`;
            let body = { nuevoEstado };

            if (nuevoEstado === 'rechazar') {
                url = `/pedidos/${id}/rechazar`;
                body = {};
            } else if (nuevoEstado === 'aprobado') {
                url = `/pedidos/${id}/aprobar`;
                body = {};
            } else if (nuevoEstado === 'pagar') {
                url = `/pedidos/${id}/pagar`;
                body = {};
            } else {
                body = { nuevoEstado };
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                let mensaje = '';
                let icono = '✅';
                let titulo = '¡Éxito!';

                switch (nuevoEstado) {
                    case 'aprobado': mensaje = 'Pedido aprobado correctamente'; break;
                    case 'rechazar': mensaje = 'Pedido rechazado correctamente'; icono = '❌'; titulo = 'Pedido Rechazado'; break;
                    case 'En proceso': mensaje = 'Has iniciado el trabajo en este pedido'; break;
                    case 'Revision': mensaje = 'Has enviado el trabajo a revisión'; break;
                    case 'Completado': mensaje = '¡Has completado el pedido! El cliente podrá dejar una reseña'; icono = '🎉'; break;
                    default: mensaje = data.msg || 'Estado actualizado correctamente';
                }

                mostrarModal(icono, titulo, mensaje);

                if (origen === 'ventas') {
                    // Recargar después de 800ms (más rápido)
                    setTimeout(() => {
                        renderizarVentas();
                    }, 800);
                }
            } else {
                mostrarModal('⚠️', 'Error', data.msg || 'No se pudo actualizar el estado', true);
            }
        } catch (err) {
            console.error("Error:", err);
            mostrarModal('⚠️', 'Error de conexión', 'No se pudo conectar con el servidor', true);
        }
    }

    // ============================================
    // MANEJADOR DE CHIPS PRINCIPALES
    // ============================================
    function handleMainChipClick() {
        const filter = this.dataset.filter;

        if (currentTab === 'publications') {
            mainChips.forEach(chip => chip.classList.remove('active'));
            this.classList.add('active');

            if (filter === 'date') {
                if (currentPublicationsSort === 'date') {
                    publicationsSortOrder = publicationsSortOrder === 'desc' ? 'asc' : 'desc';
                } else {
                    currentPublicationsSort = 'date';
                    publicationsSortOrder = 'desc';
                }
                currentPublicationsFilter = 'all';
                subfilterRow.style.display = 'flex';
                buildSubfilterChipsPublications();
                renderPublications();
            } else if (filter === 'categories') {
                currentPublicationsSort = null;
                currentPublicationsFilter = 'all';
                subfilterRow.style.display = 'flex';
                buildSubfilterChipsPublications();
                renderPublications();
            } else if (filter === 'likes') {
                currentPublicationsSort = 'likes';
                currentPublicationsFilter = 'all';
                subfilterRow.style.display = 'flex';
                buildSubfilterChipsPublications();
                renderPublications();
            }
        }
        else if (currentTab === 'sells') {
            mainChips.forEach(chip => chip.classList.remove('active'));
            this.classList.add('active');

            if (filter === 'date') {
                currentVentasSort = currentVentasSort === 'date' ? null : 'date';
                subfilterRow.style.display = 'flex';
                renderizarFiltrosCategoriasVentas();
                renderizarVentas();
            } else if (filter === 'categories') {
                currentVentasSort = null;
                currentVentasFilter = 'all';
                subfilterRow.style.display = 'flex';
                renderizarFiltrosCategoriasVentas();
                renderizarVentas();
            }
        }
        else if (currentTab === 'basket') {
            mainChips.forEach(chip => chip.classList.remove('active'));
            this.classList.add('active');

            if (filter === 'date') {
                currentComprasSort = currentComprasSort === 'date' ? null : 'date';
                subfilterRow.style.display = 'flex';
                renderizarFiltrosCategoriasCompras();
                renderizarCompras();
            } else if (filter === 'categories') {
                currentComprasSort = null;
                currentComprasFilter = 'all';
                subfilterRow.style.display = 'flex';
                renderizarFiltrosCategoriasCompras();
                renderizarCompras();
            }
        }
    }

    // ============================================
    // MANEJADORES DE TABS
    // ============================================
    async function setActiveTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (tab === tabPub) {
            currentTab = 'publications';
            subfilterRow.style.display = 'flex';
            await cargarPublicaciones();
        } else if (tab === tabSells) {
            currentTab = 'sells';
            currentVentasSort = null;
            currentVentasFilter = 'all';
            subfilterRow.style.display = 'flex';
            await renderizarFiltrosCategoriasVentas();
            await renderizarVentas();
        } else if (tab === tabBasket) {
            currentTab = 'basket';
            currentComprasSort = null;
            currentComprasFilter = 'all';
            subfilterRow.style.display = 'flex';
            await renderizarFiltrosCategoriasCompras();
            await renderizarCompras();
        }
    }


    // ============================================
    // INICIALIZACIÓN
    // ============================================
    mainChips.forEach(chip => {
        chip.removeEventListener('click', handleMainChipClick);
        chip.addEventListener('click', handleMainChipClick);
    });

    tabPub.addEventListener('click', () => setActiveTab(tabPub));
    tabSells.addEventListener('click', () => setActiveTab(tabSells));
    tabBasket.addEventListener('click', () => setActiveTab(tabBasket));

    setActiveTab(tabPub);
})();*/

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
// EDICIÓN DE PERFIL
// ============================================
let modoEdicion = false;
let tagsActuales = [];
let nuevaFotoBase64 = null;

async function cargarPerfil() {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    if (!usuario) { window.location.href = '/login'; return; }

    try {
        const res = await fetch(`/api/perfil?correo=${encodeURIComponent(usuario.correo)}`);
        const data = await res.json();

        // Nombre
        const labelNombre = document.getElementById('label-nombre');
        const nameInput   = document.getElementById('nameInput');
        if (labelNombre) labelNombre.textContent = data.nombre || usuario.nombre;
        if (nameInput)   nameInput.value         = data.nombre || usuario.nombre;

        // Nombre en sidebar (basket/ventas view)
        const nombreEl = document.querySelector('.filter-card .filter-section h4');
        if (nombreEl) nombreEl.textContent = data.nombre;

        // Descripción
        const descDisplay = document.getElementById('desc-display');
        const descInput   = document.getElementById('descriptionInput');
        const desc        = usuario.descripcion || data.biografia || '';
        if (descDisplay) descDisplay.textContent = desc;
        if (descInput)   descInput.value         = desc;

        // Avatar
        const avatar = document.querySelector('.large-avatar');
        const foto   = data.foto || usuario.foto;
        if (avatar && foto) {
            avatar.style.backgroundImage    = `url('${foto}')`;
            avatar.style.backgroundSize     = 'cover';
            avatar.style.backgroundPosition = 'center';
        }

        // Tags
        try {
            const resTags = await fetch(`/api/tags/${usuario.id}`);
            tagsActuales  = (await resTags.json()).map(t => t.Nombre);
        } catch {
            tagsActuales = [];
        }
        renderTags();

    } catch (err) {
        console.error('Error cargando perfil:', err);
    }
}

function renderTags() {
    const group = document.getElementById('tag-group');
    if (!group) return;
    group.innerHTML = '';
    tagsActuales.forEach((tag, i) => {
        const span = document.createElement('span');
        span.className = 'filter-tag';
        span.innerHTML = tag + (modoEdicion
            ? `<button class="tag-remove" onclick="eliminarTag(${i})">×</button>`
            : '');
        group.appendChild(span);
    });
}

function eliminarTag(index) {
    tagsActuales.splice(index, 1);
    renderTags();
}

function agregarTag() {
    const input = document.getElementById('tagInput');
    const valor = input.value.trim();
    if (!valor) return;
    if (tagsActuales.includes(valor)) { input.value = ''; return; }
    if (tagsActuales.length >= 8) return;
    tagsActuales.push(valor);
    input.value = '';
    renderTags();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tagInput')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); agregarTag(); }
    });
});

function previewFoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        nuevaFotoBase64 = e.target.result;
        const avatar = document.querySelector('.large-avatar');
        if (avatar) {
            avatar.style.backgroundImage    = `url('${nuevaFotoBase64}')`;
            avatar.style.backgroundSize     = 'cover';
            avatar.style.backgroundPosition = 'center';
        }
    };
    reader.readAsDataURL(file);
}

function toggleEditar() {
    modoEdicion = !modoEdicion;
    const btn         = document.getElementById('boton-editar');
    const labelNombre = document.getElementById('label-nombre');
    const nameInput   = document.getElementById('nameInput');
    const descDisplay = document.getElementById('desc-display');
    const descInput   = document.getElementById('descriptionInput');
    const tagAddRow   = document.getElementById('tag-add-row');
    const btnFoto     = document.getElementById('btn-cambiar-foto');

    if (modoEdicion) {
        labelNombre.classList.add('edit-field-hidden');
        nameInput.classList.remove('edit-field-hidden');
        descDisplay.classList.add('edit-field-hidden');
        descInput.classList.remove('edit-field-hidden');
        tagAddRow.classList.remove('edit-field-hidden');
        btnFoto.classList.remove('edit-field-hidden');
        btn.textContent = 'Guardar cambios';
    } else {
        const nuevoNombre = nameInput.value.trim();
        const nuevaDesc   = descInput.value.trim();

        if (!nuevoNombre) {
            nameInput.style.border = '1.5px solid #e87a7a';
            nameInput.focus();
            modoEdicion = true;
            return;
        }
        nameInput.style.border = '';

        labelNombre.classList.remove('edit-field-hidden');
        nameInput.classList.add('edit-field-hidden');
        descDisplay.classList.remove('edit-field-hidden');
        descInput.classList.add('edit-field-hidden');
        tagAddRow.classList.add('edit-field-hidden');
        btnFoto.classList.add('edit-field-hidden');
        btn.textContent = 'Editar perfil';

        guardarCambios(nuevoNombre, nuevaDesc);
    }

    renderTags();
}

async function guardarCambios(nuevoNombre, nuevaDesc) {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    if (!usuario) return;

    const promesas = [];

    promesas.push(
        fetch(`/api/perfil/${usuario.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nuevoNombre, biografia: nuevaDesc })
        })
    );

    promesas.push(
        fetch(`/api/tags/${usuario.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: tagsActuales })
        })
    );

    if (nuevaFotoBase64) {
        promesas.push(
            fetch(`/api/perfil/${usuario.id}/foto`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ foto: nuevaFotoBase64 })
            })
        );
    }

    try {
        await Promise.all(promesas);

        usuario.nombre     = nuevoNombre;
        usuario.descripcion = nuevaDesc;
        if (nuevaFotoBase64) usuario.foto = nuevaFotoBase64;
        sessionStorage.setItem('usuario', JSON.stringify(usuario));
        nuevaFotoBase64 = null;

        document.getElementById('label-nombre').textContent = nuevoNombre;
        const descDisplay = document.getElementById('desc-display');
        if (descDisplay) descDisplay.textContent = nuevaDesc;

        await Swal.fire({
            icon: 'success', title: 'Cambios guardados',
            text: 'Tu perfil se actualizó con éxito.',
            timer: 2500, timerProgressBar: true, showConfirmButton: false,
            color: '#3a0a5a', iconColor: '#b05ad0', confirmButtonColor: '#b05ad0'
        });

    } catch (err) {
        console.error('Error al guardar:', err);
        await Swal.fire({
            icon: 'error', title: 'Error al guardar',
            text: 'Ocurrió un error al guardar los cambios. Por favor, intenta de nuevo.',
            timer: 2500, timerProgressBar: true, showConfirmButton: false,
            color: '#3a0a5a', iconColor: '#b05ad0', confirmButtonColor: '#b05ad0'
        });
    }
}

cargarPerfil();


// ============================================
// IIFE PRINCIPAL
// ============================================
(function () {

    // ── Estrellas ──
    const sc = ['#e8d87a', '#d899e8', '#ffffff', '#f0c8a0', '#b05ad0'];
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
    const modalMensaje   = document.getElementById('modalMensaje');
    const modalIcon      = document.getElementById('modalIcon');
    const modalTitulo    = document.getElementById('modalTitulo');
    const modalTexto     = document.getElementById('modalTexto');
    const modalCerrarBtn = document.getElementById('modalCerrarBtn');

    // ============================================
    // MODAL
    // ============================================
    function mostrarModal(icono, titulo, texto, esError = false) {
        modalIcon.innerHTML     = icono;
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
    let allCards          = [];
    let categoriasFiltro  = [];
    let currentFilter     = 'all';
    let currentMainFilter = 'categories';
    let currentSort       = null;
    let sortOrder         = 'desc';

    // Ventas / Compras
    let allVentas        = [];
    let allCompras       = [];
    let cachedCategorias = [];
    let basketInitialized = false;
    let chartGananciasInstance = null;

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
            const res    = await fetch('/categorias');
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
        todoChip.className      = 'chip-filter' + (currentFilter === 'all' ? ' active' : '');
        todoChip.dataset.filter = 'all';
        todoChip.textContent    = 'Todo';
        todoChip.addEventListener('click', () => { currentFilter = 'all'; buildSubfilterChips(); renderGrid(); });
        subfilterRow.appendChild(todoChip);

        categoriasFiltro.forEach(cat => {
            const chip = document.createElement('span');
            chip.className      = 'chip-filter' + (currentFilter === cat.id ? ' active' : '');
            chip.dataset.filter = cat.id;
            chip.textContent    = cat.nombre;
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

        if (currentFilter !== 'all')      filtered = filtered.filter(c => c.category == currentFilter);
        if (currentSort === 'date')       filtered.sort((a, b) => sortOrder === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));
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
    // SECCIÓN 2: VENTAS — Dashboard + Cards
    // ============================================
    async function cargarEstadisticasVentas() {
        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        if (!usuario || !usuario.id) return;

        let ventas = [];
        try {
            const res = await fetch(`/pedidos/artista/${usuario.id}`);
            const raw = await res.json();

            ventas = raw.map(v => ({
                id:        v.ID_Pedido,
                titulo:    v.PublicacionTitulo || 'Comisión personalizada',
                categoria: v.CategoriaNombre || 'Ilustración',
                cliente:   v.ClienteNombre || 'Cliente',
                fecha:     v.Fecha_Pedido,
                monto:     parseFloat(v.Total) || 0,
                portada:   v.Portada || null,
                rawEstado: v.Estado,
                estado:    v.Estado === 'Completado' ? 'Completada'
                         : v.Estado === 'Cancelado'  ? 'Cancelada'
                         : 'En proceso',
                // Campos originales para las cards del archivo 1
                ClienteNombre:     v.ClienteNombre,
                PublicacionTitulo: v.PublicacionTitulo,
                Estado:            v.Estado,
                Personalizacion:   v.Personalizacion,
                Total:             v.Total,
                Fecha_Pedido:      v.Fecha_Pedido,
                Portada:           v.Portada,
                ID_Pedido:         v.ID_Pedido,
            }));
        } catch (err) {
            console.error('Error cargando ventas:', err);
            ventas = [];
        }

        allVentas = ventas;

        // ── KPIs ──
        const completadas   = ventas.filter(v => v.estado === 'Completada');
        const canceladas    = ventas.filter(v => v.estado === 'Cancelada');
        const totalIngresos = completadas.reduce((s, v) => s + v.monto, 0);
        const promedio      = completadas.length ? totalIngresos / completadas.length : 0;

        document.getElementById('kpi-total').textContent         = `$${totalIngresos.toFixed(2)}`;
        document.getElementById('kpi-ventas').textContent        = completadas.length;
        document.getElementById('kpi-cancelaciones').textContent = canceladas.length;
        document.getElementById('kpi-promedio').textContent      = `$${promedio.toFixed(2)}`;

        // ── Gráfica de ganancias por mes ──
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

        if (chartGananciasInstance) { chartGananciasInstance.destroy(); chartGananciasInstance = null; }

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

        // ── Tabla resumen (archivo 2) ──
        const tbody = document.getElementById('tablaVentasBody');
        if (tbody) {
            if (!ventas.length) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:2rem;">No tienes ventas aún ✨</td></tr>';
            } else {
                const recientes = [...ventas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 20);
                const estadosPermitidos = ['pendiente', 'aprobado', 'En proceso', 'Revision', 'Completado', 'Cancelado'];
                tbody.innerHTML = recientes.map((v, i) => {
                    const opciones = estadosPermitidos.map(est =>
                        `<option value="${est}" ${v.rawEstado === est ? 'selected' : ''}>${est}</option>`
                    ).join('');
                    const selectEstado = `<select class="estado-select" data-id="${v.id}" style="background:rgba(26,20,48,0.9);color:#e0d8f0;border:1px solid #6a5a88;border-radius:20px;padding:0.2rem 0.6rem;font-size:0.8rem;cursor:pointer;outline:none;">${opciones}</select>`;
                    const fecha     = new Date(v.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
                    const tipoIcon  = !v.portada ? '🎨 ' : '';
                    return `<tr>
                        <td style="color:#6a5a88">${i + 1}</td>
                        <td><strong>${tipoIcon}${v.titulo}</strong></td>
                        <td style="color:#d899e8;font-size:.8rem">${v.cliente}</td>
                        <td>${v.categoria}</td>
                        <td>${fecha}</td>
                        <td style="color:#e8d87a;font-weight:700">$${v.monto.toFixed(2)}</td>
                        <td>${selectEstado}</td>
                    </tr>`;
                }).join('');

                document.querySelectorAll('.estado-select').forEach(select => {
                    select.dataset.previousValue = select.value;
                    select.addEventListener('change', (e) => {
                        const id          = e.target.dataset.id;
                        const nuevoEstado = e.target.value;
                        if (confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) {
                            actualizarEstadoPedido(id, nuevoEstado, 'ventas');
                        } else {
                            e.target.value = e.target.dataset.previousValue;
                        }
                    });
                });
            }
        }

        // ── Cards individuales de pedidos (archivo 1) ──
        renderVentasCards(ventas);
    }

    function renderVentasCards(ventas) {
        const container = document.getElementById('ventasCardsContainer');
        if (!container) return;

        if (!ventas.length) {
            container.innerHTML = '<div class="empty-message">✨ No tienes ventas aún. ✨</div>';
            return;
        }

        container.className  = 'pedidos-container';
        container.innerHTML  = ventas.map(venta => {
            const estadoClass = obtenerClaseEstado(venta.Estado);
            const imgHTML     = venta.Portada
                ? `<div class="pedido-imagen" style="background-image: url('data:image/jpeg;base64,${venta.Portada}');"></div>`
                : `<div class="pedido-imagen placeholder">🎨</div>`;

            return `
                <div class="pedido-card">
                    ${imgHTML}
                    <div class="pedido-contenido">
                        <div class="pedido-header">
                            <div>
                                <h3 class="pedido-cliente">${venta.ClienteNombre || 'Cliente'}</h3>
                                <p class="pedido-publicacion">${venta.PublicacionTitulo || 'Comisión personalizada'}</p>
                            </div>
                            <span class="pedido-estado ${estadoClass}">${venta.Estado}</span>
                        </div>
                        ${venta.Personalizacion ? `
                            <div class="pedido-personalizacion">
                                <strong>Personalización:</strong> ${venta.Personalizacion}
                            </div>
                        ` : ''}
                        <div class="pedido-footer">
                            <span class="pedido-precio">$${parseFloat(venta.Total).toFixed(2)} USD</span>
                            <span class="pedido-fecha">${new Date(venta.Fecha_Pedido).toLocaleDateString()}</span>
                        </div>
                        <div class="pedido-acciones">
                            ${venta.Estado === 'pendiente' ? `
                                <button class="btn-aprobar" data-id="${venta.ID_Pedido}">✓ Aprobar</button>
                                <button class="btn-rechazar" data-id="${venta.ID_Pedido}">✗ Rechazar</button>
                            ` : ''}
                            ${venta.Estado === 'aprobado' ? `
                                <button class="btn-iniciar" data-id="${venta.ID_Pedido}">▶ Iniciar trabajo</button>
                            ` : ''}
                            ${venta.Estado === 'En proceso' ? `
                                <button class="btn-revision" data-id="${venta.ID_Pedido}">🔄 Enviar a revisión</button>
                                <button class="btn-completar" data-id="${venta.ID_Pedido}">✅ Completar</button>
                            ` : ''}
                            ${venta.Estado === 'Revision' ? `
                                <button class="btn-retomar" data-id="${venta.ID_Pedido}">✏️ Retomar trabajo</button>
                                <button class="btn-completar" data-id="${venta.ID_Pedido}">✅ Completar</button>
                            ` : ''}
                        </div>
                    </div>
                </div>`;
        }).join('');

        // Botones de acción de las cards
        container.querySelectorAll('.btn-aprobar').forEach(btn =>
            btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'aprobado', 'ventas')));
        container.querySelectorAll('.btn-rechazar').forEach(btn =>
            btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'rechazar', 'ventas')));
        container.querySelectorAll('.btn-iniciar, .btn-retomar').forEach(btn =>
            btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'En proceso', 'ventas')));
        container.querySelectorAll('.btn-revision').forEach(btn =>
            btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'Revision', 'ventas')));
        container.querySelectorAll('.btn-completar').forEach(btn =>
            btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'Completado', 'ventas')));
    }

    // ============================================
    // SECCIÓN 3: CANASTA — Dashboard + Cards
    // ============================================
    async function cargarCanasta() {
        const usuario = JSON.parse(sessionStorage.getItem('usuario'));
        if (!usuario || !usuario.id) return;

        let pedidos = [];
        try {
            const res = await fetch(`/pedidos/usuario/${usuario.id}`);
            const raw = await res.json();

            pedidos = raw.map(p => ({
                id:              p.ID_Pedido,
                titulo:          p.PublicacionTitulo || 'Comisión personalizada',
                artista:         p.ArtistaNombre ? `@${p.ArtistaNombre.replace(/\s+/g,'').toLowerCase()}` : 'Artista',
                categoria:       p.CategoriaNombre || 'Ilustración',
                fecha:           p.Fecha_Pedido,
                precio:          parseFloat(p.Total) || 0,
                estado:          p.Estado === 'Completado' ? 'Entregado'
                               : p.Estado === 'Cancelado'  ? 'Cancelado'
                               : p.Estado === 'En proceso' ? 'En proceso'
                               : 'Pendiente',
                personalizacion: p.Personalizacion || null,
                rawEstado:       p.Estado,
                // Campos originales para las cards
                ArtistaNombre:     p.ArtistaNombre,
                PublicacionTitulo: p.PublicacionTitulo,
                Estado:            p.Estado,
                Personalizacion:   p.Personalizacion,
                Total:             p.Total,
                Fecha_Pedido:      p.Fecha_Pedido,
                Portada:           p.Portada,
                ID_Pedido:         p.ID_Pedido,
            }));
        } catch (err) {
            console.error('Error cargando canasta:', err);
            pedidos = [];
        }

        allCompras = pedidos;

        // ── KPIs ──
        const cancelados = pedidos.filter(p => p.estado === 'Cancelado').length;
        const entregados = pedidos.filter(p => p.estado === 'Entregado').length;
        const gastado    = pedidos.filter(p => p.estado !== 'Cancelado').reduce((s, p) => s + p.precio, 0);

        document.getElementById('bkpi-total').textContent      = pedidos.length;
        document.getElementById('bkpi-proceso').textContent    = cancelados;
        document.getElementById('bkpi-entregados').textContent = entregados;
        document.getElementById('bkpi-gastado').textContent    = `$${gastado.toFixed(2)}`;

        // ── Tabla resumen (archivo 2) ──
        const tbody = document.getElementById('tablaCanasta');
        if (tbody) {
            if (!pedidos.length) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:2rem;">No has pedido comisiones aún 🎨</td></tr>';
            } else {
                const ordenados = [...pedidos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                tbody.innerHTML = ordenados.map((p, i) => {
                    const badge =
                        p.estado === 'Entregado'  ? `<span class="badge-completada">✓ Entregado</span>`  :
                        p.estado === 'En proceso' ? `<span class="badge-pendiente">⏳ En proceso</span>`  :
                        p.estado === 'Cancelado'  ? `<span class="badge-cancelada">✕ Cancelado</span>`   :
                                                   `<span class="badge-pendiente">📋 Pendiente</span>`;
                    const fecha    = new Date(p.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
                    const accionHTML = p.estado === 'Entregado'
                        ? `<button class="btn-reseñar" data-id="${p.id}" style="background:none;border:1px solid #d899e8;color:#d899e8;border-radius:20px;padding:.2rem .7rem;cursor:pointer;font-size:.75rem;">⭐ Reseñar</button>`
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

                tbody.querySelectorAll('.btn-reseñar').forEach(btn =>
                    btn.addEventListener('click', () =>
                        mostrarModal('⭐', 'Próximamente', 'La funcionalidad de reseñas estará disponible pronto.')
                    )
                );
            }
        }

        // ── Cards individuales de compras (archivo 1) ──
        renderComprasCards(pedidos);
    }

    function renderComprasCards(pedidos) {
        const container = document.getElementById('comprasCardsContainer');
        if (!container) return;

        if (!pedidos.length) {
            container.innerHTML = '<div class="empty-message">✨ No has realizado compras aún. ✨</div>';
            return;
        }

        container.className = 'pedidos-container';
        container.innerHTML = pedidos.map(pedido => {
            const estadoClass = obtenerClaseEstado(pedido.Estado);
            const imgHTML     = pedido.Portada
                ? `<div class="pedido-imagen" style="background-image: url('data:image/jpeg;base64,${pedido.Portada}');"></div>`
                : `<div class="pedido-imagen placeholder">🎨</div>`;

            return `
                <div class="pedido-card">
                    ${imgHTML}
                    <div class="pedido-contenido">
                        <div class="pedido-header">
                            <div>
                                <h3 class="pedido-artista">${pedido.ArtistaNombre || 'Artista'}</h3>
                                <p class="pedido-publicacion">${pedido.PublicacionTitulo || 'Comisión personalizada'}</p>
                            </div>
                            <span class="pedido-estado ${estadoClass}">${pedido.Estado}</span>
                        </div>
                        ${pedido.Personalizacion ? `
                            <div class="pedido-personalizacion">
                                <strong>Personalización:</strong> ${pedido.Personalizacion}
                            </div>
                        ` : ''}
                        <div class="pedido-footer">
                            <span class="pedido-precio">$${parseFloat(pedido.Total).toFixed(2)} USD</span>
                            <span class="pedido-fecha">${new Date(pedido.Fecha_Pedido).toLocaleDateString()}</span>
                        </div>
                        <div class="pedido-acciones">
                            ${pedido.Estado === 'Completado' ? `
                                <button class="btn-reseñar" data-id="${pedido.ID_Pedido}">⭐ Dejar reseña</button>
                            ` : ''}
                        </div>
                    </div>
                </div>`;
        }).join('');

        container.querySelectorAll('.btn-reseñar').forEach(btn =>
            btn.addEventListener('click', () =>
                mostrarModal('⭐', 'Próximamente', 'Funcionalidad de reseña en desarrollo')
            )
        );
    }

    // ============================================
    // ACTUALIZAR ESTADO DE PEDIDO
    // ============================================
    async function actualizarEstadoPedido(id, nuevoEstado, origen) {
        try {
            let url  = `/pedidos/${id}/estado`;
            let body = { nuevoEstado };

            if (nuevoEstado === 'rechazar') {
                url  = `/pedidos/${id}/rechazar`;
                body = {};
            } else if (nuevoEstado === 'aprobado') {
                url  = `/pedidos/${id}/aprobar`;
                body = {};
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();

            if (response.ok) {
                const msgs = {
                    'pendiente':  ['⏳', 'Pendiente',   'Pedido puesto en pendiente'],
                    'aprobado':   ['✅', 'Aprobado',    'Pedido aprobado'],
                    'rechazar':   ['❌', 'Rechazado',   'Pedido rechazado correctamente'],
                    'En proceso': ['🔄', 'En proceso',  'Has iniciado el trabajo'],
                    'Revision':   ['🔍', 'En revisión', 'Trabajo enviado a revisión'],
                    'Completado': ['🎉', 'Completado',  '¡Pedido completado!'],
                    'Cancelado':  ['❌', 'Cancelado',   'Pedido cancelado']
                };
                const [icono, titulo, mensaje] = msgs[nuevoEstado] || ['✅', 'Actualizado', data.msg || 'Estado actualizado'];
                mostrarModal(icono, titulo, mensaje);

                if (origen === 'ventas') {
                    setTimeout(() => cargarEstadisticasVentas(), 800);
                }
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
        cargarEstadisticasVentas();
    }

    function showBasketUI() {
        filterChipsRow.style.display  = 'none';
        subfilterRow.style.display    = 'none';
        grid.style.display            = 'none';
        sellsDashboard.style.display  = 'none';
        basketDashboard.style.display = 'block';
        cargarCanasta();
    }

    function setActiveTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab === tabPub ? 'publications' : tab === tabSells ? 'sells' : 'basket';
        if (currentTab === 'sells')       showSellsUI();
        else if (currentTab === 'basket') showBasketUI();
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

})();