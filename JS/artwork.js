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

// ── Cargar datos de la publicación ──
async function cargarPublicacion() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) return; // si no hay ID, deja el HTML estático tal cual

  try {
    const res = await fetch(`/api/publicacion/${id}`);
    if (!res.ok) return;
    const pub = await res.json();

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
    // Pasar id_publicacion, id_artista y precio por URL
    btnComisionar.onclick = () => {
        window.location.href = `/comisionar?pub=${pub.ID_Publicacion}&artista=${pub.ID_Usuario_Artista}&precio=${pub.Precio}&metodo=${encodeURIComponent(pub.MetodoPago || '')}`;
    };
}
// Ocultar botón de enviar mensaje si es arte propio
const btnmensaje = document.querySelector('.btn-mensaje');
if (btnmensaje && esPropio) {
    btnmensaje.style.display = 'none';
}

  } catch (err) {
    console.error('Error al cargar publicación:', err);
  }
}

document.addEventListener('DOMContentLoaded', cargarPublicacion);