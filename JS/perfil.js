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

        const nombreEl = document.querySelector('.filter-card .filter-section h4');
        if (nombreEl) nombreEl.textContent = data.nombre;

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

// ============================================
// INICIO DEL IIFE
// ============================================
(function () {
    // ============================================
    // ESTRELLAS
    // ============================================
    const sc = ['#e8d87a','#d899e8','#ffffff','#f0c8a0','#b05ad0'];
    function rc(){return sc[Math.floor(Math.random()*sc.length)];}
    function s4(r){const p=[];for(let i=0;i<8;i++){const a=(i*Math.PI)/4-Math.PI/2,rad=i%2===0?r:r*.4;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    function s6(r){const p=[];for(let i=0;i<12;i++){const a=(i*Math.PI)/6-Math.PI/2,rad=i%2===0?r:r*.45;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    const sh=[s=>`<polygon points="${s4(s)}" fill="${rc()}" opacity=".6"/>`,s=>`<polygon points="${s6(s)}" fill="${rc()}" opacity=".55"/>`,s=>`<polygon points="0,${-s} ${s*.4},0 0,${s} ${-s*.4},0" fill="${rc()}" opacity=".7"/>`];
    [{size:10,left:4,dur:'10s',delay:'0s'},{size:14,left:14,dur:'13s',delay:'2s'},{size:8,left:24,dur:'9s',delay:'5s'},{size:16,left:36,dur:'12s',delay:'1s'},{size:10,left:50,dur:'8s',delay:'3.5s'},{size:18,left:62,dur:'15s',delay:'0.5s'},{size:11,left:74,dur:'11s',delay:'7s'},{size:9,left:85,dur:'9s',delay:'2.5s'},{size:13,left:94,dur:'12s',delay:'4s'}].forEach(d=>{const sv=sh[Math.floor(Math.random()*sh.length)];const svg=`<svg viewBox="${-d.size} ${-d.size} ${d.size*2} ${d.size*2}" width="${d.size*2}" height="${d.size*2}">${sv(d.size)}</svg>`;const el=document.createElement('div');el.className='star';el.style.cssText=`left:${d.left}%;bottom:-${d.size*2}px;--dur:${d.dur};--delay:${d.delay}`;el.innerHTML=svg;document.body.appendChild(el);});

    // ============================================
    // ELEMENTOS DOM
    // ============================================
    const grid = document.getElementById('cardsGrid');
    const mainChips = document.querySelectorAll('#filterChipsRow .chip-filter');
    const subfilterRow = document.getElementById('subfilterRow');
    const tabPub = document.getElementById('tab-publications');
    const tabSells = document.getElementById('tab-sells');
    const tabBasket = document.getElementById('tab-basket');

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
        switch(estado) {
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
                
                switch(nuevoEstado) {
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
})();