
const colors = ['#e8d87a', '#d899e8', '#ffffff', '#f0c8a0', '#b05ad0'];
function rc() { return colors[Math.floor(Math.random() * colors.length)]; }
function star4(r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.4;
    pts.push(`${rad * Math.cos(angle)},${rad * Math.sin(angle)}`);
  }
  return pts.join(' ');
}
function star6(r) {
  const pts = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${rad * Math.cos(angle)},${rad * Math.sin(angle)}`);
  }
  return pts.join(' ');
}
const starShapes = [
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
  const shape = starShapes[Math.floor(Math.random() * starShapes.length)];
  const svg = `<svg viewBox="${-d.size} ${-d.size} ${d.size * 2} ${d.size * 2}" width="${d.size * 2}" height="${d.size * 2}">${shape(d.size)}</svg>`;
  const el = document.createElement('div');
  el.className = 'star';
  el.style.cssText = `left:${d.left}%;bottom:-${d.size * 2}px;--dur:${d.dur};--delay:${d.delay}`;
  el.innerHTML = svg;
  document.body.appendChild(el);
});

function validateEmail() {
  const field = document.getElementById('field-email');
  const val = document.getElementById('email').value.trim();
  const icon = document.getElementById('icon-email');
  if (!val) { field.className = 'field'; return false; }
  const ok = val.length > 2;
  field.className = 'field ' + (ok ? 'valid' : 'invalid');
  icon.textContent = ok ? '✓' : '✗';
  return ok;
}
function validatePassword() {
  const field = document.getElementById('field-password');
  const val = document.getElementById('password').value;
  if (!val) { field.className = 'field'; return false; }
  const ok = val.length >= 6;
  field.className = 'field ' + (ok ? 'valid' : 'invalid');
  return ok;
}
function togglePassword() {
  const input = document.getElementById('password');
  input.type = input.type === 'password' ? 'text' : 'password';
}

async function handleLogin() {
  const emailOk = validateEmail();
  const passOk = validatePassword();
  if (!emailOk || !passOk) { shake(); return; }

  const correo = document.getElementById('email').value.trim();
  const contrasena = document.getElementById('password').value;

  const btn = document.getElementById('btn');
  btn.classList.add('loading');

  try {
    const response = await fetch('/usuario/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    });

    const data = await response.json();

    btn.classList.remove('loading');

    if (data.msg === 'Registrado') {
      
      // Guardar info del usuario en sessionStorage para usarla después
      sessionStorage.setItem("usuario", JSON.stringify(data.info));

      document.getElementById('success').classList.add('show');
      console.log("DATA:", data);
      setTimeout(() => { window.location.href = '/landing'; }, 1500);

    } else if (data.msg === 'No encontrado') {
      showError('Correo o contraseña incorrectos');
      shake();

    } else if (data.msg === 'Error: Campos incompletos') {
      showError('Por favor completa todos los campos');
      shake();

    } else {
      showError('Error al iniciar sesión. Intenta de nuevo.');
      shake();
    }

  } catch (err) {
    btn.classList.remove('loading');
    console.error('Error de red:', err);
    showError('No se pudo conectar con el servidor');
    shake();
  }
}

function showError(mensaje) {
  const el = document.getElementById('error-msg');
  if (!el) return;
  el.textContent = mensaje;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
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
document.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
