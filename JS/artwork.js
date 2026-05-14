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

// ── Estrellas ──
const sc=['#e8d87a','#d899e8','#ffffff','#f0c8a0','#b05ad0'];
function rc(){return sc[Math.floor(Math.random()*sc.length)];}
function s4(r){const p=[];for(let i=0;i<8;i++){const a=(i*Math.PI)/4-Math.PI/2,rad=i%2===0?r:r*.4;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
function s6(r){const p=[];for(let i=0;i<12;i++){const a=(i*Math.PI)/6-Math.PI/2,rad=i%2===0?r:r*.45;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
const sh=[s=>`<polygon points="${s4(s)}" fill="${rc()}" opacity=".6"/>`,s=>`<polygon points="${s6(s)}" fill="${rc()}" opacity=".55"/>`,s=>`<polygon points="0,${-s} ${s*.4},0 0,${s} ${-s*.4},0" fill="${rc()}" opacity=".7"/>`];
[{size:10,left:4,dur:'10s',delay:'0s'},{size:14,left:14,dur:'13s',delay:'2s'},{size:8,left:24,dur:'9s',delay:'5s'},{size:16,left:36,dur:'12s',delay:'1s'},{size:10,left:50,dur:'8s',delay:'3.5s'},{size:18,left:62,dur:'15s',delay:'0.5s'},{size:11,left:74,dur:'11s',delay:'7s'},{size:9,left:85,dur:'9s',delay:'2.5s'}].forEach(d=>{const sv=sh[Math.floor(Math.random()*sh.length)];const svg=`<svg viewBox="${-d.size} ${-d.size} ${d.size*2} ${d.size*2}" width="${d.size*2}" height="${d.size*2}">${sv(d.size)}</svg>`;const el=document.createElement('div');el.className='star';el.style.cssText=`left:${d.left}%;bottom:-${d.size*2}px;--dur:${d.dur};--delay:${d.delay}`;el.innerHTML=svg;document.body.appendChild(el);});

// ── Like ──
let liked = false;
let count = 248;
function toggleLike() {
  liked = !liked;
  count += liked ? 1 : -1;
  document.getElementById('likesCount').textContent = count;
  document.getElementById('likeBtn').classList.toggle('liked', liked);
}

// ── Leer más ──
let expanded = false;
function toggleDesc() {
  expanded = !expanded;
  const t = document.getElementById('descText');
  const b = document.getElementById('readMore');
  t.classList.toggle('collapsed', !expanded);
  b.textContent = expanded ? 'Leer menos' : 'Leer más';
}

// ============================================
// VARIABLES GLOBALES PARA EDICIÓN
// ============================================
let publicacionActual = null;
let categoriasLista = [];

// ============================================
// MODAL DE MENSAJES (feedback)
// ============================================
function mostrarModalMensaje(icono, titulo, texto, esError = false) {
    let modal = document.getElementById('modalMensajeTemp');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalMensajeTemp';
        modal.className = 'modal-mensaje-overlay';
        modal.innerHTML = `
            <div class="modal-mensaje-box">
                <div class="modal-mensaje-icon" id="modalIconTemp">🌸</div>
                <h3 class="modal-mensaje-titulo" id="modalTituloTemp">Éxito</h3>
                <p class="modal-mensaje-texto" id="modalTextoTemp">Operación realizada</p>
                <button class="modal-mensaje-boton" id="modalCerrarTemp">Aceptar</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const modalIcon = document.getElementById('modalIconTemp');
    const modalTitulo = document.getElementById('modalTituloTemp');
    const modalTexto = document.getElementById('modalTextoTemp');
    const modalCerrarBtn = document.getElementById('modalCerrarTemp');
    
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
    
    modal.classList.add('show');
    
    const cerrar = () => {
        modal.classList.remove('show');
        modalCerrarBtn.removeEventListener('click', cerrar);
    };
    
    modalCerrarBtn.addEventListener('click', cerrar);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrar();
    });
    
    setTimeout(() => {
        if (modal.classList.contains('show')) cerrar();
    }, 2500);
}

// ============================================
// FUNCIONES DE EDICIÓN
// ============================================

// Cargar categorías para el select del modal
async function cargarCategoriasParaEdit() {
    try {
        const response = await fetch('/categorias');
        categoriasLista = await response.json();
        
        const select = document.getElementById('editCategoria');
        if (select && select.children.length <= 1) {
            select.innerHTML = '<option value="">Selecciona una categoría</option>';
            categoriasLista.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.ID_Categoria;
                option.textContent = cat.Nombre;
                select.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Error al cargar categorías:", err);
    }
}

// Mostrar modal de edición
async function mostrarModalEdicion(pub) {
    await cargarCategoriasParaEdit();
    
    document.getElementById('editTitulo').value = pub.Titulo || '';
    document.getElementById('editDescripcion').value = pub.Descripcion || '';
    document.getElementById('editTerminos').value = pub.TerminosCondiciones || '';
    document.getElementById('editPrecio').value = pub.Precio || '';
    document.getElementById('editMetodoPago').value = pub.MetodoPago || '';
    
    const selectCategoria = document.getElementById('editCategoria');
    if (selectCategoria && pub.ID_Categoria) {
        selectCategoria.value = pub.ID_Categoria;
    }
    
    document.getElementById('editModal').classList.add('show');
}

// Cerrar modal de edición
function cerrarModalEdicion() {
    document.getElementById('editModal').classList.remove('show');
}

// ============================================
// MODAL DE CONFIRMACIÓN
// ============================================

let confirmacionCallback = null;

function mostrarModalConfirmacion(icono, titulo, texto, onConfirm) {
    const modal = document.getElementById('modalConfirmacion');
    const iconEl = document.getElementById('confirmIcon');
    const tituloEl = document.getElementById('confirmTitulo');
    const textoEl = document.getElementById('confirmTexto');
    const btnAceptar = document.getElementById('btnAceptarConfirmacion');
    const btnCancelar = document.getElementById('btnCancelarConfirmacion');
    
    iconEl.innerHTML = icono;
    tituloEl.textContent = titulo;
    textoEl.textContent = texto;
    
    // Guardar callback
    confirmacionCallback = onConfirm;
    
    // Configurar eventos temporales
    const aceptarHandler = () => {
        modal.classList.remove('show');
        if (confirmacionCallback) confirmacionCallback(true);
        limpiarEventos();
    };
    
    const cancelarHandler = () => {
        modal.classList.remove('show');
        if (confirmacionCallback) confirmacionCallback(false);
        limpiarEventos();
    };
    
    const cerrarExterno = (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            if (confirmacionCallback) confirmacionCallback(false);
            limpiarEventos();
        }
    };
    
    function limpiarEventos() {
        btnAceptar.removeEventListener('click', aceptarHandler);
        btnCancelar.removeEventListener('click', cancelarHandler);
        modal.removeEventListener('click', cerrarExterno);
        confirmacionCallback = null;
    }
    
    btnAceptar.addEventListener('click', aceptarHandler);
    btnCancelar.addEventListener('click', cancelarHandler);
    modal.addEventListener('click', cerrarExterno);
    
    modal.classList.add('show');
}

// ============================================
// GUARDAR EDICIÓN CON CONFIRMACIÓN
// ============================================

async function guardarEdicion() {
    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    if (!usuario) {
        window.location.href = '/login';
        return;
    }
    
    const id = new URLSearchParams(window.location.search).get('id');
    
    const precioNuevo = parseFloat(document.getElementById('editPrecio').value);
    const precioAnterior = publicacionActual?.Precio != null ? parseFloat(publicacionActual.Precio) : null;

    const datos = {
        titulo: document.getElementById('editTitulo').value.trim(),
        descripcion: document.getElementById('editDescripcion').value.trim(),
        terminos: document.getElementById('editTerminos').value.trim(),
        precio: precioNuevo,
        id_categoria: document.getElementById('editCategoria').value,
        metodo_pago: document.getElementById('editMetodoPago').value,
        id_usuario: usuario.id
    };
    
    if (!datos.titulo || !datos.descripcion || !datos.precio || !datos.id_categoria) {
        mostrarModalMensaje('⚠️', 'Campos incompletos', 'Por favor completa todos los campos', true);
        return;
    }
    
    // Si va a cambiar el precio, mostrar confirmación
  if (precioAnterior !== null && precioNuevo.toFixed(2) !== precioAnterior.toFixed(2)) {
        const mensajeConfirmacion = `⚠️ Estás cambiando el precio de $${precioAnterior.toFixed(2)} a $${precioNuevo.toFixed(2)}.\n\nSi hay pedidos activos (aprobados, en proceso o en revisión), NO se podrá cambiar el precio.\n\n¿Deseas continuar?`;
        
        mostrarModalConfirmacion('💰', 'Confirmar cambio de precio', mensajeConfirmacion, async (confirmado) => {
            if (confirmado) {
                await ejecutarGuardado(datos, id);
            }
        });
    } else {
        await ejecutarGuardado(datos, id);
    }
}

async function ejecutarGuardado(datos, id) {
    console.log("🚀 ejecutarGuardado llamado con id:", id, "datos:", datos);  // ← agrega esto
        console.log("🌐 Haciendo fetch a:", `/api/publicacion/${id}`);
    const btnGuardar = document.getElementById('btnGuardarEditar');
    const originalText = btnGuardar.textContent;
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';
    
const response = await fetch(`/api/publicacion/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
});

console.log("📡 Response status:", response.status); // ← agrega esto
const data = await response.json();
console.log("📡 Response data:", data); // ← agrega esto

    try {
        const response = await fetch(`/api/publicacion/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarModalMensaje('✅', '¡Publicación actualizada!', 'Los cambios se han guardado correctamente');
            cerrarModalEdicion();
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            let mensajeError = data.msg || 'No se pudo actualizar';
            mostrarModalMensaje('⚠️', 'Error', mensajeError, true);
            btnGuardar.disabled = false;
            btnGuardar.textContent = originalText;
        }
    } catch (err) {
        console.error("Error al guardar:", err);
        mostrarModalMensaje('⚠️', 'Error de conexión', 'No se pudo conectar con el servidor', true);
        btnGuardar.disabled = false;
        btnGuardar.textContent = originalText;
    }
}



// ============================================
// CARGAR DATOS DE LA PUBLICACIÓN
// ============================================
async function cargarPublicacion() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) return;

  try {
    const res = await fetch(`/api/publicacion/${id}`);
    if (!res.ok) return;
    const pub = await res.json();
    
    // Guardar publicación actual para edición
    publicacionActual = pub;

    // Imagen principal
    const artImg = document.querySelector('.artwork-img');
    if (artImg && pub.URL_Imagen) {
      artImg.style.backgroundImage = `url('data:image/jpeg;base64,${pub.URL_Imagen}')`;
      artImg.style.backgroundSize = 'cover';
      artImg.style.backgroundPosition = 'center';
    }

    // Título
    const titulo = document.querySelector('.artwork-title');
    if (titulo) titulo.textContent = pub.Titulo;

    // Breadcrumb — categoría
    const breadcrumbLinks = document.querySelectorAll('.breadcrumb a');
    if (breadcrumbLinks[1]) breadcrumbLinks[1].textContent = pub.Categoria || 'Categoría';
    const breadcrumbSpan = document.querySelector('.breadcrumb span:last-child');
    if (breadcrumbSpan) breadcrumbSpan.textContent = pub.Titulo;

    // Tag de categoría
    const catTag = document.querySelector('.tag.cat-tag');
    if (catTag) catTag.textContent = `✏️ ${pub.Categoria || 'Arte'}`;

    // Artista
    const artistName = document.querySelector('.artist-name');
    if (artistName) artistName.textContent = pub.NombreArtista || 'Artista';
    const artistHandle = document.querySelector('.artist-handle');
    if (artistHandle) artistHandle.textContent = `@${(pub.NombreArtista || '').replace(/\s+/g, '').toLowerCase()}`;

    // Foto del artista
    const artistAv = document.querySelector('.artist-avatar');
    if (artistAv && pub.FotoArtista) {
      artistAv.innerHTML = `<img src="${pub.FotoArtista}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    }

    // Descripción
    const descText = document.getElementById('descText');
    if (descText) descText.textContent = pub.Descripcion || '';

    // Precio
    const priceAmount = document.querySelector('.price-amount');
    if (priceAmount) priceAmount.textContent = `$${parseFloat(pub.Precio).toFixed(2)} USD`;

    // Método de pago en la nota
    const priceNote = document.querySelector('.price-note');
    if (priceNote && pub.MetodoPago) {
      priceNote.textContent = `Método de pago: ${pub.MetodoPago} · Términos: ${pub.TerminosCondiciones || 'Ver descripción'}`;
    }

    // ── Redirigir la tarjeta del artista al perfil correcto ──
    const usuarioSesion = JSON.parse(sessionStorage.getItem('usuario'));
    const esPropio = usuarioSesion && usuarioSesion.correo === pub.CorreoArtista;

    // Link de la tarjeta del artista
    const artistCard = document.querySelector('.artist-card');
    if (artistCard) {
        if (esPropio) {
            artistCard.href = '/mi-perfil';
        } else {
            artistCard.href = `/perfil-usuario?id=${pub.ID_Usuario_Artista}`;
        }
    }

    // Ocultar botón de comisionar si es arte propio
    const btnComisionar = document.querySelector('.btn-comisionar');
    if (btnComisionar && esPropio) {
        btnComisionar.style.display = 'none';
    } else if (btnComisionar) {
        btnComisionar.onclick = () => {
            window.location.href = `/comisionar?pub=${pub.ID_Publicacion}&artista=${pub.ID_Usuario_Artista}&precio=${pub.Precio}&metodo=${encodeURIComponent(pub.MetodoPago || '')}`;
        };
    }
    
    // Ocultar botón de enviar mensaje si es arte propio
   const btnmensaje = document.querySelector('.btn-mensaje');
if (btnmensaje && esPropio) {
    btnmensaje.style.display = 'none';
} else if (btnmensaje) {
    btnmensaje.onclick = async () => {
        // Buscar si ya existe un pedido entre ambos para esta publicación
        const res = await fetch(`/chat/conversaciones?id_usuario=${usuarioSesion.id}`);
        const convs = await res.json();
        const conv = convs.find(c => c.ID_Artista === pub.ID_Usuario_Artista);
        if (conv) {
            window.abrirChatDesdePedido(conv.ID_Pedido, pub.NombreArtista);
        } else {
            alert('Primero realiza una comisión para poder chatear con el artista.');
        }
    };
}
    // ── Mostrar botón de editar si es el propietario ──
    const btnEditar = document.getElementById('btnEditar');
    if (btnEditar && esPropio) {
        btnEditar.style.display = 'flex';
        btnEditar.style.alignItems = 'center';
        btnEditar.style.justifyContent = 'center';
        btnEditar.style.gap = '8px';
        btnEditar.style.background = '#2a0a3a';
        btnEditar.style.color = 'white';
        btnEditar.style.border = 'none';
        btnEditar.style.borderRadius = '50px';
        btnEditar.style.padding = '14px';
        btnEditar.style.fontFamily = "'Bricolage Grotesque', sans-serif";
        btnEditar.style.fontWeight = '800';
        btnEditar.style.cursor = 'pointer';
        btnEditar.style.transition = 'transform 0.15s';
        btnEditar.onclick = () => {
            mostrarModalEdicion(pub);
        };
    }

 // Cargar y mostrar reseñas
await cargarResenas(id, pub.ID_Usuario_Artista);

} catch (err) {
    console.error('Error al cargar publicación:', err);
  }
}

async function cargarResenas(idPublicacion, idArtista) {
    try {
        const res = await fetch(`/resenas/publicacion/${idPublicacion}`);
        const resenas = await res.json();

        // Crear sección de reseñas si no existe
        let seccion = document.getElementById('seccion-resenas');
        if (!seccion) {
            seccion = document.createElement('div');
            seccion.id = 'seccion-resenas';
            seccion.style.cssText = 'margin-top:24px;';
            document.querySelector('.artwork-right').appendChild(seccion);
        }

        if (!resenas.length) {
            seccion.innerHTML = '<p style="color:#888;font-size:13px">Aún no hay reseñas para esta obra.</p>';
            return;
        }

        const promedio = (resenas.reduce((s, r) => s + r.Puntuacion, 0) / resenas.length).toFixed(1);
        const estrellasPromedio = '★'.repeat(Math.round(promedio)) + '☆'.repeat(5 - Math.round(promedio));

        seccion.innerHTML = `
            <div class="divider"></div>
            <p class="block-label">Reseñas <span style="color:#e8d87a">${estrellasPromedio} ${promedio}</span></p>
            <div id="lista-resenas">
                ${resenas.map(r => `
                    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:flex-start">
                        <div style="width:36px;height:36px;border-radius:50%;background:#b05ad033;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:18px">
                            ${r.FotoCliente ? `<img src="${r.FotoCliente}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : '🌸'}
                        </div>
                        <div>
                            <div style="font-weight:700;font-size:13px">${r.NombreCliente}</div>
                            <div style="color:#e8d87a;font-size:14px">${'★'.repeat(r.Puntuacion)}${'☆'.repeat(5 - r.Puntuacion)}</div>
                            ${r.Comentario ? `<p style="font-size:13px;color:#ccc;margin:4px 0 0">${r.Comentario}</p>` : ''}
                            <div style="font-size:11px;color:#666;margin-top:4px">${new Date(r.Fecha_Reseña).toLocaleDateString()}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Error cargando reseñas:', err);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
   console.log("🔍 btnGuardarEditar encontrado:", document.getElementById('btnGuardarEditar')); // ← agrega esto
    actualizarNavbar(); 
   cargarPublicacion();
    
    // Configurar eventos del modal de edición
    const btnCancelarEditar = document.getElementById('btnCancelarEditar');
    const btnGuardarEditar = document.getElementById('btnGuardarEditar');
    const editModal = document.getElementById('editModal');
    
    if (btnCancelarEditar) {
        btnCancelarEditar.addEventListener('click', cerrarModalEdicion);
    }
    if (btnGuardarEditar) {
        btnGuardarEditar.addEventListener('click', guardarEdicion);
    }
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) cerrarModalEdicion();
        });
    }
});