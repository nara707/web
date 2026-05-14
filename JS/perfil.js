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

function cerrarSesion() {
    sessionStorage.removeItem('usuario');
    window.location.href = '/login';
}

actualizarNavbar();

// ============================================
// EDICIÓN DE PERFIL (código de compañera)
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

        const labelNombre = document.getElementById('label-nombre');
        const nameInput = document.getElementById('nameInput');
        if (labelNombre) labelNombre.textContent = data.nombre || usuario.nombre;
        if (nameInput) nameInput.value = data.nombre || usuario.nombre;

        const descDisplay = document.getElementById('desc-display');
        const descInput = document.getElementById('descriptionInput');
        const desc = usuario.descripcion || data.biografia || '';
        if (descDisplay) descDisplay.textContent = desc;
        if (descInput) descInput.value = desc;

        const avatar = document.querySelector('.large-avatar');
        const foto = data.foto || usuario.foto;
        if (avatar && foto) {
            avatar.style.backgroundImage = `url('${foto}')`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
        }

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
        nuevaFotoBase64 = e.target.result;
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
        labelNombre.classList.add('edit-field-hidden');
        nameInput.classList.remove('edit-field-hidden');
        descDisplay.classList.add('edit-field-hidden');
        descInput.classList.remove('edit-field-hidden');
        tagAddRow.classList.remove('edit-field-hidden');
        btnFoto.classList.remove('edit-field-hidden');
        btn.textContent = 'Guardar cambios';
    } else {
        const nuevoNombre = nameInput.value.trim();
        const nuevaDesc = descInput.value.trim();

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

        usuario.nombre = nuevoNombre;
        usuario.descripcion = nuevaDesc;
        if (nuevaFotoBase64) usuario.foto = nuevaFotoBase64;
        sessionStorage.setItem('usuario', JSON.stringify(usuario));
        nuevaFotoBase64 = null;

        document.getElementById('label-nombre').textContent = nuevoNombre;
        const descDisplay = document.getElementById('desc-display');
        if (descDisplay) descDisplay.textContent = nuevaDesc;

        if (typeof Swal !== 'undefined') {
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
        }

    } catch (err) {
        console.error('Error al guardar:', err);
        if (typeof Swal !== 'undefined') {
            await Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: 'Ocurrió un error al guardar los cambios.',
                timer: 2500,
                timerProgressBar: true,
                showConfirmButton: false,
                color: '#3a0a5a',
                iconColor: '#b05ad0',
                confirmButtonColor: '#b05ad0'
            });
        }
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

    // ── Elementos DOM ──
    const grid = document.getElementById('cardsGrid');
    const mainChips = document.querySelectorAll('#filterChipsRow .chip-filter');
    const subfilterRow = document.getElementById('subfilterRow');
    const tabPub = document.getElementById('tab-publications');
    const tabSells = document.getElementById('tab-sells');
    const tabBasket = document.getElementById('tab-basket');
    const sellsDashboard = document.getElementById('sells-dashboard');
    const basketDashboard = document.getElementById('basket-dashboard');

    const modalMensaje = document.getElementById('modalMensaje');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalTexto = document.getElementById('modalTexto');
    const modalCerrarBtn = document.getElementById('modalCerrarBtn');

    // ── Modal de feedback ──
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
    }

    function cerrarModal() { if (modalMensaje) modalMensaje.classList.remove('show'); }
    if (modalCerrarBtn) modalCerrarBtn.addEventListener('click', cerrarModal);
    if (modalMensaje) modalMensaje.addEventListener('click', (e) => { if (e.target === modalMensaje) cerrarModal(); });

    // ── Estado general ──
    let currentTab = 'publications';
    let allCards = [];
    let categoriasFiltro = [];
    let currentPublicationsFilter = 'all';
    let currentPublicationsSort = null;
    let publicationsSortOrder = 'desc';
    let allVentas = [];
    let currentVentasFilter = 'all';
    let currentVentasSort = null;
    let allCompras = [];
    let currentComprasFilter = 'all';
    let currentComprasSort = null;
    let cachedCategorias = [];

    function obtenerClaseEstado(estado) {
        const map = {
            'pendiente': 'estado-pendiente',
            'aprobado': 'estado-aprobado',
            'En proceso': 'estado-en-proceso',
            'Revision': 'estado-revision',
            'Completado': 'estado-completado',
            'Cancelado': 'estado-cancelado',
        };
        return map[estado] || 'estado-pendiente';
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
    // MODAL DE REVISIÓN — imagen obligatoria
    // ============================================
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
            setTimeout(() => renderizarVentas(), 900);
        };

        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    // ============================================
    // MODAL DE COMPLETAR — imagen obligatoria
    // ============================================
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
            setTimeout(() => renderizarVentas(), 900);
        };

        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    // ============================================
    // MODAL DE RESEÑA
    // ============================================
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
                <div style="display:flex;gap:8px;justify-content:center;margin:16px 0;font-size:32px;cursor:pointer">
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

        const estrellas = modal.querySelectorAll('.estrella');
        estrellas.forEach(estrella => {
            estrella.onmouseover = () => estrellas.forEach(e => e.textContent = e.dataset.val <= estrella.dataset.val ? '★' : '☆');
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
            if (!puntuacion) { mostrarModal('⚠️', 'Selecciona estrellas', 'Por favor selecciona una puntuación.', true); return; }
            const usuario = JSON.parse(sessionStorage.getItem('usuario'));
            const comentario = document.getElementById('comentario-resena').value.trim();

            const res = await fetch('/resenas/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_pedido: idPedido, id_usuario: usuario.id, id_artista: idArtista, puntuacion, comentario })
            });
            const data = await res.json();
            modal.remove();
            if (res.ok) mostrarModal('🌸', '¡Gracias!', 'Tu reseña fue publicada correctamente.');
            else mostrarModal('⚠️', 'Error', data.msg, true);
        };

        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
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
        todoChip.addEventListener('click', () => { currentPublicationsFilter = 'all'; buildSubfilterChipsPublications(); renderPublications(); });
        subfilterRow.appendChild(todoChip);

        categoriasFiltro.forEach(cat => {
            const chip = document.createElement('span');
            chip.className = 'chip-filter' + (currentPublicationsFilter === cat.id ? ' active' : '');
            chip.dataset.filter = cat.id;
            chip.textContent = cat.nombre;
            chip.addEventListener('click', () => { currentPublicationsFilter = cat.id; buildSubfilterChipsPublications(); renderPublications(); });
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
        if (currentPublicationsFilter !== 'all') filtered = filtered.filter(c => c.category == currentPublicationsFilter);
        if (currentPublicationsSort === 'date') {
            filtered.sort((a, b) => { const da = new Date(a.date), db = new Date(b.date); return publicationsSortOrder === 'desc' ? db - da : da - db; });
        } else if (currentPublicationsSort === 'likes') {
            filtered.sort((a, b) => parseFloat(b.likes) - parseFloat(a.likes));
        }

        grid.className = 'cards-grid';
        if (filtered.length === 0) { grid.innerHTML = '<p style="color:#888; padding:2rem;">No hay publicaciones aún.</p>'; return; }

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
                <span class="chip-filter ${currentVentasFilter === cat.ID_Categoria ? 'active' : ''}" data-filter="${cat.ID_Categoria}">${cat.Nombre}</span>
            `).join('')}
        `;
        document.querySelectorAll('#subfilterRow .chip-filter').forEach(chip => {
            chip.addEventListener('click', async () => {
                currentVentasFilter = chip.dataset.filter === 'all' ? 'all' : parseInt(chip.dataset.filter);
                await renderizarFiltrosCategoriasVentas();
                await renderizarVentas();
            });
        });
    }

    async function renderizarVentas() {
        await cargarVentas();
        grid.className = 'pedidos-container';

        if (allVentas.length === 0) { grid.innerHTML = '<div class="empty-message">✨ No tienes ventas aún. ✨</div>'; return; }

        let filtered = [...allVentas];
        if (currentVentasFilter !== 'all') filtered = filtered.filter(v => v.ID_Categoria == currentVentasFilter);
        if (currentVentasSort === 'date') filtered.sort((a, b) => new Date(b.Fecha_Pedido) - new Date(a.Fecha_Pedido));

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
                        ${venta.Personalizacion ? `<div class="pedido-personalizacion"><strong>Personalización:</strong> ${venta.Personalizacion}</div>` : ''}
                        <div class="pedido-footer">
                            <span class="pedido-precio">$${parseFloat(venta.Total).toFixed(2)} USD</span>
                            <span class="pedido-fecha">${new Date(venta.Fecha_Pedido).toLocaleDateString()}</span>
                        </div>
                        <div class="pedido-acciones">
                            <button class="btn-chat-pedido" data-id="${venta.ID_Pedido}" data-nombre="${venta.ClienteNombre || 'Cliente'}">💬 Chat</button>
                            ${venta.Estado === 'pendiente' ? `
                                <button class="btn-aprobar" data-id="${venta.ID_Pedido}">✓ Aprobar</button>
                                <button class="btn-rechazar" data-id="${venta.ID_Pedido}">✗ Rechazar</button>
                            ` : ''}
                            ${venta.Estado === 'aprobado' ? `<button class="btn-iniciar" data-id="${venta.ID_Pedido}">▶ Iniciar trabajo</button>` : ''}
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

        document.querySelectorAll('.btn-aprobar').forEach(btn => btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'aprobado', 'ventas')));
        document.querySelectorAll('.btn-rechazar').forEach(btn => btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'rechazar', 'ventas')));
        document.querySelectorAll('.btn-iniciar, .btn-retomar').forEach(btn => btn.addEventListener('click', () => actualizarEstadoPedido(btn.dataset.id, 'En proceso', 'ventas')));
        document.querySelectorAll('.btn-revision').forEach(btn => btn.addEventListener('click', () => mostrarModalRevision(btn.dataset.id)));
        document.querySelectorAll('.btn-completar').forEach(btn => btn.addEventListener('click', () => mostrarModalCompletar(btn.dataset.id)));
        document.querySelectorAll('.btn-chat-pedido').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.abrirChatDesdePedido) window.abrirChatDesdePedido(parseInt(btn.dataset.id), btn.dataset.nombre);
                else mostrarModal('💬', 'Chat', 'El chat no está disponible.', true);
            });
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
                <span class="chip-filter ${currentComprasFilter === cat.ID_Categoria ? 'active' : ''}" data-filter="${cat.ID_Categoria}">${cat.Nombre}</span>
            `).join('')}
        `;
        document.querySelectorAll('#subfilterRow .chip-filter').forEach(chip => {
            chip.addEventListener('click', async () => {
                currentComprasFilter = chip.dataset.filter === 'all' ? 'all' : parseInt(chip.dataset.filter);
                await renderizarFiltrosCategoriasCompras();
                await renderizarCompras();
            });
        });
    }

    async function renderizarCompras() {
        await cargarCompras();
        grid.className = 'pedidos-container';

        if (allCompras.length === 0) { grid.innerHTML = '<div class="empty-message">✨ No has realizado compras aún. ✨</div>'; return; }

        let filtered = [...allCompras];
        if (currentComprasFilter !== 'all') filtered = filtered.filter(c => c.ID_Categoria == currentComprasFilter);
        if (currentComprasSort === 'date') filtered.sort((a, b) => new Date(b.Fecha_Pedido) - new Date(a.Fecha_Pedido));

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
                        ${pedido.Personalizacion ? `<div class="pedido-personalizacion"><strong>Personalización:</strong> ${pedido.Personalizacion}</div>` : ''}
                        <div class="pedido-footer">
                            <span class="pedido-precio">$${parseFloat(pedido.Total).toFixed(2)} USD</span>
                            <span class="pedido-fecha">${new Date(pedido.Fecha_Pedido).toLocaleDateString()}</span>
                        </div>
                        <div class="pedido-acciones">
                            <button class="btn-chat-pedido" data-id="${pedido.ID_Pedido}" data-nombre="${pedido.ArtistaNombre || 'Artista'}">💬 Chat</button>
                            ${pedido.Estado === 'Completado' ? `<button class="btn-reseñar" data-id="${pedido.ID_Pedido}" data-artista="${pedido.ID_Artista || ''}">⭐ Dejar reseña</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.btn-reseñar').forEach(btn => btn.addEventListener('click', () => mostrarModalResena(btn.dataset.id, btn.dataset.artista)));
        document.querySelectorAll('.btn-chat-pedido').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.abrirChatDesdePedido) window.abrirChatDesdePedido(parseInt(btn.dataset.id), btn.dataset.nombre);
                else mostrarModal('💬', 'Chat', 'El chat no está disponible.', true);
            });
        });
    }

    // ============================================
    // ACTUALIZAR ESTADO DE PEDIDO
    // ============================================
    async function actualizarEstadoPedido(id, nuevoEstado, origen) {
        try {
            let url = `/pedidos/${id}/estado`;
            let body = { nuevoEstado };

            if (nuevoEstado === 'rechazar') { url = `/pedidos/${id}/rechazar`; body = {}; }
            else if (nuevoEstado === 'aprobado') { url = `/pedidos/${id}/aprobar`; body = {}; }
            else if (nuevoEstado === 'pagar') { url = `/pedidos/${id}/pagar`; body = {}; }

            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                const usuario = JSON.parse(sessionStorage.getItem('usuario'));

                // Mensajes automáticos al chat
                const mensajes = {
                    'aprobado':   '✅ El artista ha aceptado tu comisión. Pronto iniciará el trabajo.',
                    'rechazar':   '❌ El artista ha rechazado la comisión.',
                    'En proceso': '🎨 El artista ha iniciado el trabajo en tu comisión.',
                };

                if (mensajes[nuevoEstado]) {
                    await fetch('/chat/mensaje', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_pedido: id, id_emisor: usuario.id, contenido: mensajes[nuevoEstado] })
                    });
                }

                let mensaje = data.msg || 'Estado actualizado';
                let icono = '✅', titulo = '¡Éxito!';
                switch (nuevoEstado) {
                    case 'aprobado': mensaje = 'Pedido aprobado correctamente'; break;
                    case 'rechazar': mensaje = 'Pedido rechazado'; icono = '❌'; titulo = 'Pedido Rechazado'; break;
                    case 'En proceso': mensaje = 'Has iniciado el trabajo en este pedido'; break;
                }

                mostrarModal(icono, titulo, mensaje);
                if (origen === 'ventas') setTimeout(() => renderizarVentas(), 800);
            } else {
                mostrarModal('⚠️', 'Error', data.msg || 'No se pudo actualizar el estado', true);
            }
        } catch (err) {
            console.error("Error:", err);
            mostrarModal('⚠️', 'Error de conexión', 'No se pudo conectar con el servidor', true);
        }
    }

    // ============================================
    // CHIPS Y TABS
    // ============================================
    function handleMainChipClick() {
        const filter = this.dataset.filter;
        mainChips.forEach(chip => chip.classList.remove('active'));
        this.classList.add('active');

        if (currentTab === 'publications') {
            if (filter === 'date') {
                if (currentPublicationsSort === 'date') publicationsSortOrder = publicationsSortOrder === 'desc' ? 'asc' : 'desc';
                else { currentPublicationsSort = 'date'; publicationsSortOrder = 'desc'; }
                buildSubfilterChipsPublications(); renderPublications();
            } else if (filter === 'categories') {
                currentPublicationsSort = null; currentPublicationsFilter = 'all';
                buildSubfilterChipsPublications(); renderPublications();
            } else if (filter === 'likes') {
                currentPublicationsSort = 'likes';
                buildSubfilterChipsPublications(); renderPublications();
            }
        } else if (currentTab === 'sells') {
            if (filter === 'date') { currentVentasSort = currentVentasSort === 'date' ? null : 'date'; }
            else if (filter === 'categories') { currentVentasSort = null; currentVentasFilter = 'all'; }
            renderizarFiltrosCategoriasVentas(); renderizarVentas();
        } else if (currentTab === 'basket') {
            if (filter === 'date') { currentComprasSort = currentComprasSort === 'date' ? null : 'date'; }
            else if (filter === 'categories') { currentComprasSort = null; currentComprasFilter = 'all'; }
            renderizarFiltrosCategoriasCompras(); renderizarCompras();
        }
    }

    async function setActiveTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Ocultar dashboards por defecto
        if (sellsDashboard) sellsDashboard.style.display = 'none';
        if (basketDashboard) basketDashboard.style.display = 'none';
        grid.style.display = '';

        if (tab === tabPub) {
            currentTab = 'publications';
            subfilterRow.style.display = 'flex';
            await cargarPublicaciones();
        } else if (tab === tabSells) {
            currentTab = 'sells';
            currentVentasSort = null; currentVentasFilter = 'all';
            subfilterRow.style.display = 'flex';
            await renderizarFiltrosCategoriasVentas();
            await renderizarVentas();
        } else if (tab === tabBasket) {
            currentTab = 'basket';
            currentComprasSort = null; currentComprasFilter = 'all';
            subfilterRow.style.display = 'flex';
            await renderizarFiltrosCategoriasCompras();
            await renderizarCompras();
        }
    }

    mainChips.forEach(chip => chip.addEventListener('click', handleMainChipClick));
    tabPub.addEventListener('click', () => setActiveTab(tabPub));
    tabSells.addEventListener('click', () => setActiveTab(tabSells));
    tabBasket.addEventListener('click', () => setActiveTab(tabBasket));

    setActiveTab(tabPub);
})();