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
// FUNCIONES DEL MODAL
// ============================================

function mostrarModal(icono, titulo, texto, esError = false) {
    const modalMensaje = document.getElementById('modalMensaje');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalTexto = document.getElementById('modalTexto');
    const modalCerrarBtn = document.getElementById('modalCerrarBtn');
    
    if (!modalMensaje) {
        console.error("Modal no encontrado en el DOM");
        return;  // Solo log en consola, sin alert
    }
    
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
    
    // Auto-cerrar después de 2 segundos
    setTimeout(() => {
        if (modalMensaje) modalMensaje.classList.remove('show');
    }, 2000);
}

function cerrarModal() {
    const modalMensaje = document.getElementById('modalMensaje');
    if (modalMensaje) {
        modalMensaje.classList.remove('show');
    }
}

// Estado para filtros
let todosLosPedidos = [];
let filtroActual = 'todos';

// Mapea estado del backend a clase CSS del badge/fondo
function estadoToClass(estado) {
    if (!estado) return 'estado-pendiente';
    return 'estado-' + estado.toLowerCase().replace(/\s+/g, '-');
}

// Cargar pedidos del usuario
async function cargarPedidos() {
    const usuarioRaw = sessionStorage.getItem('usuario');
    if (!usuarioRaw) {
        window.location.href = '/login';
        return;
    }
    const usuario = JSON.parse(usuarioRaw);

    try {
        const response = await fetch(`/pedidos/usuario/${usuario.id}`);
        const pedidos = await response.json();
        todosLosPedidos = pedidos;

        renderizarFiltros();
        renderizarPedidos();
    } catch (err) {
        console.error("Error al cargar pedidos:", err);
        const container = document.querySelector('.basket-container');
        if (container) {
            container.innerHTML = '<div class="empty-state">Error al cargar tus pedidos</div>';
        }
    }
}

// Renderizar botones de filtro
function renderizarFiltros() {
    const filtrosContainer = document.getElementById('filtrosContainer');
    if (!filtrosContainer) return;

    const filtros = [
        { id: 'todos',       nombre: 'Todos' },
        { id: 'pendiente',   nombre: 'Pendientes' },
        { id: 'aprobado',    nombre: 'Aprobados' },
        { id: 'En proceso',  nombre: 'En proceso' },
        { id: 'Revision',    nombre: 'En revisión' },
        { id: 'Completado',  nombre: 'Completados' },
        { id: 'Cancelado',   nombre: 'Cancelados' }
    ];

    filtrosContainer.innerHTML = filtros.map(f => `
        <button class="chip-filter ${filtroActual === f.id ? 'active' : ''}"
                data-filtro="${f.id}">
            ${f.nombre}
        </button>
    `).join('');

    document.querySelectorAll('.chip-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            filtroActual = btn.dataset.filtro;
            renderizarFiltros();
            renderizarPedidos();
        });
    });
}

// Determinar si un pedido puede cancelarse
function puedeCancelar(estado) {
    return estado === 'pendiente' || estado === 'aprobado';
}
// Determinar si un pedido puede pagarse
function puedePagar(estado) {
    return estado === 'aprobado';
}

// Renderizar lista de pedidos
function renderizarPedidos() {
    const container = document.querySelector('.basket-container');
    if (!container) return;

    let pedidosFiltrados = todosLosPedidos;
    if (filtroActual !== 'todos') {
        pedidosFiltrados = todosLosPedidos.filter(p => p.Estado === filtroActual);
    }

    if (pedidosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                ✨ No hay pedidos en esta categoría ✨
            </div>
        `;
        return;
    }

    container.innerHTML = pedidosFiltrados.map(pedido => {
        const puedeCancel = puedeCancelar(pedido.Estado);
        const puedePag    = puedePagar(pedido.Estado);
        const estadoCls   = estadoToClass(pedido.Estado);

        const imgHTML = pedido.Portada
            ? `<img src="data:image/jpeg;base64,${pedido.Portada}" alt="${pedido.PublicacionTitulo || 'Comisión'}">`
            : `<div class="basket-item-placeholder">🎨</div>`;

        const totalFmt = parseFloat(pedido.Total || 0).toFixed(2);

        return `
            <div class="basket-item">
                <section>${imgHTML}</section>
                <aside>
                    <h2>${pedido.ArtistaNombre || 'Artista'}</h2>
                    <h4>${pedido.PublicacionTitulo || 'Comisión personalizada'}</h4>
                    <p class="item-detail"><strong>Personalización:</strong> ${pedido.Personalizacion || 'Sin detalles adicionales'}</p>
                    <p class="item-detail"><strong>Método de pago:</strong> ${pedido.MetodoPago || 'No especificado'}</p>

                    <div class="item-price-row">
                        <span class="item-price">$${totalFmt} USD</span>
                        <span class="item-status-badge ${estadoCls}">${pedido.Estado}</span>
                    </div>

                    <div class="item-actions">
                        ${puedePag ? `
                            <button class="pagar-btn" data-id="${pedido.ID_Pedido}">
                                <span class="material-symbols-outlined">payment</span> Pagar
                            </button>` : ''}
                        ${puedeCancel ? `
                            <button class="cancelar-btn" data-id="${pedido.ID_Pedido}">
                                <span class="material-symbols-outlined">delete</span> Cancelar
                            </button>` : ''}
                        ${pedido.Estado === 'Completado' ? `
                            <button class="reseñar-btn" data-id="${pedido.ID_Pedido}">
                                <span class="material-symbols-outlined">star</span> Dejar reseña
                            </button>` : ''}
                    </div>
                </aside>
            </div>
        `;
    }).join('');

    // Event listeners
    document.querySelectorAll('.pagar-btn').forEach(btn => {
        btn.addEventListener('click', () => pagarPedido(btn.dataset.id));
    });
    document.querySelectorAll('.cancelar-btn').forEach(btn => {
        btn.addEventListener('click', () => cancelarPedido(btn.dataset.id));
    });
    document.querySelectorAll('.reseñar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            mostrarModal('⭐', 'Próximamente', 'Funcionalidad de reseña en desarrollo');
        });
    });
}

// Pagar pedido
async function pagarPedido(id) {
    const btn = document.querySelector(`.pagar-btn[data-id="${id}"]`);
    if (btn) btn.disabled = true;

    try {
        const response = await fetch(`/pedidos/${id}/pagar`, { method: 'PUT' });
        const data = await response.json();

        if (response.ok) {
            mostrarModal('✅', '¡Pago realizado!', data.msg || 'El pedido está en proceso');
            setTimeout(() => {
                cargarPedidos();
            }, 1500);
        } else {
            mostrarModal('⚠️', 'Error', data.msg || 'Error al procesar el pago', true);
            if (btn) btn.disabled = false;
        }
    } catch (err) {
        console.error("Error al pagar:", err);
        mostrarModal('⚠️', 'Error de conexión', 'No se pudo conectar con el servidor', true);
        if (btn) btn.disabled = false;
    }
}

// Cancelar pedido
async function cancelarPedido(id) {
    mostrarModalConfirmacion(id);
}

function mostrarModalConfirmacion(id) {
    const modalMensaje = document.getElementById('modalMensaje');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalTexto = document.getElementById('modalTexto');
    const modalCerrarBtn = document.getElementById('modalCerrarBtn');
    
    if (!modalMensaje) return;
    
    modalIcon.innerHTML = '⚠️';
    modalTitulo.textContent = 'Confirmar cancelación';
    modalTexto.textContent = '¿Estás seguro de que quieres cancelar este pedido?';
    
    // Cambiar botón para que tenga dos opciones
    modalCerrarBtn.textContent = 'Cancelar pedido';
    modalCerrarBtn.style.background = 'linear-gradient(90deg, #d07070, #b05050)';
    modalCerrarBtn.style.color = 'white';
    
    // Guardar el ID para usarlo en la confirmación
    modalCerrarBtn.dataset.id = id;
    
    // Remover event listener anterior y agregar nuevo
    const newBtn = modalCerrarBtn.cloneNode(true);
    modalCerrarBtn.parentNode.replaceChild(newBtn, modalCerrarBtn);
    
    newBtn.addEventListener('click', async () => {
        await ejecutarCancelacion(id);
        cerrarModal();
    });
    
    // También cerrar si se clickea fuera
    const cerrarHandler = (e) => {
        if (e.target === modalMensaje) {
            cerrarModal();
            modalMensaje.removeEventListener('click', cerrarHandler);
        }
    };
    modalMensaje.addEventListener('click', cerrarHandler);
    
    // Restaurar botón original después de cerrar
    const restoreBtn = () => {
        const btn = document.getElementById('modalCerrarBtn');
        if (btn) {
            btn.textContent = 'Aceptar';
            btn.style.background = 'linear-gradient(90deg, #e8d87a, #f0e89a)';
            btn.style.color = '#7a6010';
            btn.dataset.id = '';
        }
    };
    
    modalMensaje.classList.add('show');
    
    // Auto-cerrar después de 5 segundos si no responde
    setTimeout(() => {
        if (modalMensaje.classList.contains('show')) {
            cerrarModal();
            restoreBtn();
        }
    }, 5000);
}

async function ejecutarCancelacion(id) {
    const btn = document.querySelector(`.cancelar-btn[data-id="${id}"]`);
    if (btn) btn.disabled = true;

    try {
        const response = await fetch(`/pedidos/${id}/cancelar`, { method: 'PUT' });
        const data = await response.json();

        if (response.ok) {
            mostrarModal('✅', 'Pedido cancelado', 'El pedido se canceló correctamente');
            setTimeout(() => {
                cargarPedidos();
            }, 1500);
        } else {
            mostrarModal('⚠️', 'Error', data.msg || 'No se puede cancelar este pedido', true);
            if (btn) btn.disabled = false;
        }
    } catch (err) {
        console.error("Error al cancelar:", err);
        mostrarModal('⚠️', 'Error de conexión', 'No se pudo conectar con el servidor', true);
        if (btn) btn.disabled = false;
    }
}
// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarPedidos();

    // Configurar evento de cierre del modal
    const modalCerrarBtn = document.getElementById('modalCerrarBtn');
    const modalMensaje = document.getElementById('modalMensaje');
    
    if (modalCerrarBtn) {
        modalCerrarBtn.addEventListener('click', cerrarModal);
    }
    if (modalMensaje) {
        modalMensaje.addEventListener('click', (e) => {
            if (e.target === modalMensaje) cerrarModal();
        });
    }

    // Modal de pago existente
    const modal = document.getElementById('paymentModal');
    const acceptBtn = document.getElementById('modalAcceptBtn');

    if (acceptBtn && modal) {
        acceptBtn.addEventListener('click', () => modal.classList.remove('show'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
    }
});