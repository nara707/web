// ── Estrellas ──
const colors = ['#e8d87a', '#d899e8', '#ffffff', '#f0c8a0', '#b05ad0'];
function rc() { return colors[Math.floor(Math.random() * colors.length)]; }
function star4(r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.4;
    pts.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`);
  }
  return pts.join(' ');
}
function star6(r) {
  const pts = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`);
  }
  return pts.join(' ');
}
const shapes = [
  s => `<polygon points="${star4(s)}" fill="${rc()}" opacity="0.85"/>`,
  s => `<polygon points="${star6(s)}" fill="${rc()}" opacity="0.75"/>`,
  s => `<polygon points="0,${-s} ${s * 0.4},0 0,${s} ${-s * 0.4},0" fill="${rc()}" opacity="0.9"/>`,
];
[
  { size: 10, left: 4, dur: '10s', delay: '0s' },
  { size: 16, left: 11, dur: '14s', delay: '2s' },
  { size: 8, left: 20, dur: '9s', delay: '5s' },
  { size: 14, left: 30, dur: '12s', delay: '1s' },
  { size: 10, left: 42, dur: '8s', delay: '3.5s' },
  { size: 18, left: 55, dur: '15s', delay: '0.5s' },
  { size: 12, left: 63, dur: '11s', delay: '7s' },
  { size: 9, left: 72, dur: '9s', delay: '2.5s' },
  { size: 15, left: 82, dur: '13s', delay: '4s' },
  { size: 11, left: 91, dur: '10s', delay: '6s' },
].forEach(d => {
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const svg = `<svg viewBox="${-d.size} ${-d.size} ${d.size * 2} ${d.size * 2}" width="${d.size * 2}" height="${d.size * 2}">${shape(d.size)}</svg>`;
  const el = document.createElement('div');
  el.className = 'star';
  el.style.cssText = `left:${d.left}%;bottom:-${d.size * 2}px;--dur:${d.dur};--delay:${d.delay}`;
  el.innerHTML = svg;
  document.body.appendChild(el);
});

// ── Preview en tiempo real ──
document.getElementById('nombre').addEventListener('input', function () {
  const val = this.value.trim();
  document.getElementById('previewName').textContent = val || 'Tu nombre';
});
document.getElementById('correo').addEventListener('input', function () {
  const val = this.value.trim();
  document.getElementById('previewEmail').textContent = val || 'tu@correo.com';
});

// ── Foto ──
function handleFoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const src = ev.target.result;
    // thumb en upload area
    document.getElementById('thumbImg').src = src;
    document.getElementById('thumbImg').style.display = 'block';
    document.getElementById('thumbIcon').style.display = 'none';
    document.getElementById('uploadLabel').textContent = file.name.length > 22 ? file.name.slice(0, 22) + '…' : file.name;
    document.getElementById('uploadSub').textContent = (file.size / 1024).toFixed(0) + ' KB';
    // preview panel izquierdo
    document.getElementById('avatarPreviewImg').src = src;
    document.getElementById('avatarPreviewImg').style.display = 'block';
    document.getElementById('avatarPlaceholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ── Validaciones ──
function validateNombre() {
  const f = document.getElementById('field-nombre');
  const v = document.getElementById('nombre').value.trim();
  const i = document.getElementById('icon-nombre');
  if (!v) { f.className = 'field field-full'; return false; }
  const ok = v.split(' ').length >= 2 && v.length >= 4;
  f.className = 'field field-full ' + (ok ? 'valid' : 'invalid');
  i.textContent = ok ? '✓' : '✗';
  return ok;
}
function validateCorreo() {
  const f = document.getElementById('field-correo');
  const v = document.getElementById('correo').value.trim();
  const i = document.getElementById('icon-correo');
  if (!v) { f.className = 'field'; return false; }
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  f.className = 'field ' + (ok ? 'valid' : 'invalid');
  i.textContent = ok ? '✓' : '✗';
  return ok;
}
function validateFecha() {
  const f = document.getElementById('field-fecha');
  const v = document.getElementById('fecha').value;
  const i = document.getElementById('icon-fecha');
  if (!v) { f.className = 'field'; return false; }
  const age = (new Date() - new Date(v)) / (1000 * 60 * 60 * 24 * 365.25);
  const ok = age >= 13;
  f.className = 'field ' + (ok ? 'valid' : 'invalid');
  i.textContent = ok ? '✓' : '✗';
  return ok;
}
function validatePass() {
  const f = document.getElementById('field-pass');
  const v = document.getElementById('pass').value;
  if (!v) { f.className = 'field field-full'; return false; }
  const ok = v.length >= 6;
  f.className = 'field field-full ' + (ok ? 'valid' : 'invalid');
  return ok;
}
function togglePassword() {
  const inp = document.getElementById('pass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}



async function handleRegister() {
  //Validaciones visuales
  const n = validateNombre();
  const c = validateCorreo();
  const f = validateFecha();
  const p = validatePass();
  
  if (!n || !c || !f || !p) { 
    shake(); 
    return; 
  }

  const btn = document.getElementById('btn');
  btn.classList.add('loading');

  // Preparar datos (FormData es necesario para enviar la imagen)
  const formData = new FormData();
  formData.append('nombre', document.getElementById('nombre').value);
  formData.append('correo', document.getElementById('correo').value);
  formData.append('contrasena', document.getElementById('pass').value);
  formData.append('fecha_nacimiento', document.getElementById('fecha').value);
  formData.append('biografia', 'Nueva cuenta de Stylo.io'); 
  formData.append('foto', document.getElementById('fotoInput').files[0]);

  try {
    // Petición al servidor
    const response = await fetch('http://localhost:3001/usuario/registrar', {
      method: 'POST',
      body: formData 
    });

    const data = await response.json();

    if (data.msg === "Registrado") {
      // Mostrar éxito y Redirigir
      document.getElementById('successMsg').textContent = `¡Bienvenid@, ${data.info.nombre}!`;
      document.getElementById('success').classList.add('show');
    
      setTimeout(() => {
        window.location.href = '/landing'; // Ruta  definida en rutas.js
      }, 2000);

    } else {
     Swal.fire({
        title: 'Error',
        text: data.msg || 'Hubo un problema al registrar',
        icon: 'error'
      });
    }
  } catch (error) {
   console.error("Error:", error);
    Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
  
  } finally {
    btn.classList.remove('loading');
  }
}

function shake() {
  const panel = document.querySelector('.right');
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    const p = (ts - start) / 400;
    if (p < 1) {
      panel.style.transform = `translateX(${8 * Math.sin(p * Math.PI * 6) * (1 - p)}px)`;
      requestAnimationFrame(step);
    } else { panel.style.transform = 'translateX(0)'; }
  }
  requestAnimationFrame(step);
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') handleRegister(); });
