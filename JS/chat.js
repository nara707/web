// ============================================
// CHAT FLOTANTE — chat.js
// ============================================
const usuario = JSON.parse(sessionStorage.getItem('usuario'));
if (!usuario) throw new Error('Sin sesión');

const socket = io();
let pedidoActivo = null;
let tabActiva = 'activo'; // 'activo' | 'completado'
let todasConversaciones = [];

// ── Inyectar HTML del chat en el body ──
const chatHTML = `
<div id="chat-fab" onclick="toggleChat()" title="Mensajes">
    <span class="material-symbols-outlined">chat_bubble</span>
    <span id="chat-badge" style="display:none">●</span>
</div>

<div id="chat-panel">
    <div id="chat-header">
        <div id="chat-header-left">
            <span class="material-symbols-outlined" id="btn-back-convs" onclick="volverConversaciones()" style="display:none;cursor:pointer">arrow_back</span>
            <span id="chat-titulo">Mensajes</span>
        </div>
        <div id="chat-header-right">
            <span class="material-symbols-outlined" onclick="toggleFullscreen()" title="Pantalla completa" style="cursor:pointer">open_in_full</span>
            <span class="material-symbols-outlined" onclick="toggleChat()" style="cursor:pointer">close</span>
        </div>
    </div>

    <!-- TABS de segmentación -->
    <div id="chat-tabs" style="display:flex">
        <button class="chat-tab active" data-tab="activo" onclick="cambiarTab('activo')">En proceso</button>
        <button class="chat-tab" data-tab="general" onclick="cambiarTab('general')">General</button>
        <button class="chat-tab" data-tab="completado" onclick="cambiarTab('completado')">Completado</button>
    </div>

    <div id="chat-body">
        <div id="lista-conversaciones"></div>
        <div id="ventana-mensajes" style="display:none;flex-direction:column;flex:1">
            <div id="mensajes-lista"></div>
            <div id="chat-input-area">
                <label id="btn-boceto" title="Adjuntar imagen">
                    <span class="material-symbols-outlined">image</span>
                    <input type="file" id="input-boceto" accept="image/*" style="display:none" onchange="previsualizarBoceto(this)">
                </label>
                <div id="boceto-preview" style="display:none;align-items:center;gap:6px">
                    <img id="boceto-img-preview" src="" style="height:40px;border-radius:6px;">
                    <span onclick="quitarBoceto()" style="cursor:pointer;color:#d899e8">✕</span>
                </div>
                <input type="text" id="chat-input" placeholder="Escribe un mensaje..." onkeydown="if(event.key==='Enter')enviarMensaje()">
                <button onclick="enviarMensaje()">
                    <span class="material-symbols-outlined">send</span>
                </button>
            </div>
        </div>
    </div>
</div>`;

document.body.insertAdjacentHTML('beforeend', chatHTML);

// ── Toggle chat ──
function toggleChat() {
    const panel = document.getElementById('chat-panel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
        document.getElementById('chat-badge').style.display = 'none';
        cargarConversaciones();
    }
}

function toggleFullscreen() {
    const panel = document.getElementById('chat-panel');
    panel.classList.toggle('fullscreen');
    const icon = document.querySelector('#chat-header-right .material-symbols-outlined:first-child');
    icon.textContent = panel.classList.contains('fullscreen') ? 'close_fullscreen' : 'open_in_full';
}

// ── Tabs ──
function cambiarTab(tab) {
    tabActiva = tab;
    document.querySelectorAll('.chat-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    renderConversaciones();
}

const estadosPorTab = {
    activo:     ['pendiente', 'aprobado', 'En proceso', 'Revision'],
    general:    ['pendiente', 'aprobado', 'En proceso', 'Revision', 'Completado', 'Cancelado'],
    completado: ['Completado', 'Cancelado']
};
// ── Conversaciones ──
async function cargarConversaciones() {
    if (pedidoActivo) return;
    try {
        const res = await fetch(`/chat/conversaciones?id_usuario=${usuario.id}`);
        todasConversaciones = await res.json();
        renderConversaciones();
    } catch (err) {
        console.error('Error cargando conversaciones:', err);
    }
}

function renderConversaciones() {
    const lista = document.getElementById('lista-conversaciones');
    lista.innerHTML = '';
    lista.style.display = 'block';

    const estados = estadosPorTab[tabActiva];
    const filtradas = todasConversaciones
        .filter(c => estados.includes(c.Estado))
        .sort((a, b) => {
            // Más reciente con mensajes primero, luego por fecha de pedido
            const fa = a.UltimaFecha ? new Date(a.UltimaFecha) : new Date(a.Fecha_Pedido);
            const fb = b.UltimaFecha ? new Date(b.UltimaFecha) : new Date(b.Fecha_Pedido);
            return fb - fa;
        });

    if (filtradas.length === 0) {
const labels = { activo: 'en proceso', general: 'disponibles', completado: 'completados' };
        lista.innerHTML = `<p style="text-align:center;padding:24px;color:#888;font-size:13px">
            No hay chats ${labels[tabActiva]} aún</p>`;
        return;
    }

    filtradas.forEach(c => {
        const esArtista = c.ID_Artista === usuario.id;
        const otroNombre = esArtista ? c.NombreCliente : c.NombreArtista;
        const otraFoto   = esArtista ? c.FotoCliente   : c.FotoArtista;

        const estadoBadge = {
            'pendiente':  { label: 'Pendiente',   color: '#888' },
            'aprobado':   { label: 'Aprobado',     color: '#7ab05a' },
            'En proceso': { label: 'En proceso',   color: '#b05ad0' },
            'Revision':   { label: 'Revisión',     color: '#d0a05a' },
            'Completado': { label: 'Completado',   color: '#5ab0a0' },
            'Cancelado':  { label: 'Cancelado',    color: '#d05a5a' },
        }[c.Estado] || { label: c.Estado, color: '#888' };

        const div = document.createElement('div');
        div.className = 'conv-item';
        div.onclick = () => abrirChat(c.ID_Pedido, otroNombre);
        div.innerHTML = `
            <div class="conv-avatar">${otraFoto
                ? `<img src="${otraFoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
                : '🌸'}</div>
            <div class="conv-info">
                <div class="conv-nombre">${otroNombre}</div>
                <div class="conv-obra">${c.TituloObra || 'Comisión'} · <span class="conv-estado" style="color:${estadoBadge.color}">${estadoBadge.label}</span></div>
                <div class="conv-ultimo">${c.UltimoMensaje || 'Sin mensajes aún'}</div>
            </div>`;
        lista.appendChild(div);
    });
}

// ── Abrir chat de un pedido ──
async function abrirChat(idPedido, nombreOtro) {
    pedidoActivo = idPedido;
    socket.emit('unirse_pedido', idPedido);

    document.getElementById('lista-conversaciones').style.display = 'none';
    document.getElementById('chat-tabs').style.display = 'none';
    const ventana = document.getElementById('ventana-mensajes');
    ventana.style.display = 'flex';
    document.getElementById('btn-back-convs').style.display = 'inline';
    document.getElementById('chat-titulo').textContent = nombreOtro || 'Chat';

    try {
        const res = await fetch(`/chat/mensajes/${idPedido}`);
        const msgs = await res.json();
        const lista = document.getElementById('mensajes-lista');
        lista.innerHTML = '';
        msgs.forEach(m => renderMensaje(m));
        lista.scrollTop = lista.scrollHeight;
    } catch (err) {
        console.error('Error cargando mensajes:', err);
    }
}

function volverConversaciones() {
    pedidoActivo = null;
    document.getElementById('ventana-mensajes').style.display = 'none';
    document.getElementById('lista-conversaciones').style.display = 'block';
    document.getElementById('chat-tabs').style.display = 'flex';
    document.getElementById('btn-back-convs').style.display = 'none';
    document.getElementById('chat-titulo').textContent = 'Mensajes';
    cargarConversaciones();
}

// ── Renderizar mensaje ──
function renderMensaje(m) {
    const esMio = m.ID_Emisor === usuario.id;
    const div = document.createElement('div');
    div.className = `msg-burbuja ${esMio ? 'mia' : 'otra'}`;

    const avatarHTML = !esMio ? `<div class="msg-avatar">${m.FotoEmisor
        ? `<img src="${m.FotoEmisor}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
        : '🌸'}</div>` : '';

    div.innerHTML = `
        ${avatarHTML}
        <div class="msg-contenido">
            ${!esMio ? `<div class="msg-nombre">${m.NombreEmisor}</div>` : ''}
            <div class="msg-texto">${m.Contenido}</div>
            <div class="boceto-slot"></div>
            <div class="msg-hora">${new Date(m.FechaEnvio).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
        </div>`;

    // Imagen del boceto — convertir base64 a blob para evitar ERR_INVALID_URL
    if (m.Boceto_URL) {
        try {
            const arr  = m.Boceto_URL.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            const blob = new Blob([u8arr], { type: mime });
            const img  = document.createElement('img');
            img.src    = URL.createObjectURL(blob);
            img.className = 'msg-boceto';
            img.onclick = () => window.open(img.src, '_blank');
            div.querySelector('.boceto-slot').appendChild(img);
        } catch (e) {
            console.error('Error renderizando boceto:', e);
        }
    }

    document.getElementById('mensajes-lista').appendChild(div);
}

// ── Enviar mensaje ──
async function enviarMensaje() {
    if (!pedidoActivo) return;
    const input   = document.getElementById('chat-input');
    const contenido = input.value.trim();
    if (!contenido) return;

    const formData = new FormData();
    formData.append('id_pedido', pedidoActivo);
    formData.append('id_emisor', usuario.id);
    formData.append('contenido', contenido);

    const boceto = document.getElementById('input-boceto').files[0];
    if (boceto) formData.append('boceto', boceto);

    input.value = '';
    quitarBoceto();

    try {
        await fetch('/chat/mensaje', { method: 'POST', body: formData });
    } catch (err) {
        console.error('Error enviando mensaje:', err);
    }
}

// ── Boceto preview ──
function previsualizarBoceto(input) {
    if (!input.files[0]) return;
    document.getElementById('boceto-img-preview').src = URL.createObjectURL(input.files[0]);
    document.getElementById('boceto-preview').style.display = 'flex';
}
function quitarBoceto() {
    document.getElementById('input-boceto').value = '';
    document.getElementById('boceto-preview').style.display = 'none';
    document.getElementById('boceto-img-preview').src = '';
}

// ── Socket: recibir mensajes en tiempo real ──
socket.on('nuevo_mensaje', (m) => {
    if (m.ID_Pedido === pedidoActivo) {
        renderMensaje(m);
        const lista = document.getElementById('mensajes-lista');
        lista.scrollTop = lista.scrollHeight;
    } else {
        document.getElementById('chat-badge').style.display = 'inline';
    }
});

// ── Abrir chat desde otra página (artwork, perfil) ──
window.abrirChatDesdePedido = function(idPedido, nombreOtro) {
    const panel = document.getElementById('chat-panel');
    if (!panel.classList.contains('open')) {
        panel.classList.add('open');
        document.getElementById('chat-badge').style.display = 'none';
    }
    abrirChat(idPedido, nombreOtro);
};