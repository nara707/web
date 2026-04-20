    // ── Estrellas ──
    const sc=['#e8d87a','#d899e8','#ffffff','#f0c8a0','#b05ad0'];
    function rc(){return sc[Math.floor(Math.random()*sc.length)];}
    function s4(r){const p=[];for(let i=0;i<8;i++){const a=(i*Math.PI)/4-Math.PI/2,rad=i%2===0?r:r*.4;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    function s6(r){const p=[];for(let i=0;i<12;i++){const a=(i*Math.PI)/6-Math.PI/2,rad=i%2===0?r:r*.45;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    const sh=[s=>`<polygon points="${s4(s)}" fill="${rc()}" opacity=".7"/>`,s=>`<polygon points="${s6(s)}" fill="${rc()}" opacity=".6"/>`,s=>`<polygon points="0,${-s} ${s*.4},0 0,${s} ${-s*.4},0" fill="${rc()}" opacity=".8"/>`];
    [{size:10,left:4,dur:'10s',delay:'0s'},{size:14,left:15,dur:'13s',delay:'2s'},{size:8,left:26,dur:'9s',delay:'5s'},{size:16,left:40,dur:'12s',delay:'1s'},{size:10,left:54,dur:'8s',delay:'3.5s'},{size:18,left:66,dur:'15s',delay:'0.5s'},{size:11,left:78,dur:'11s',delay:'7s'},{size:9,left:90,dur:'9s',delay:'2.5s'}].forEach(d=>{const sv=sh[Math.floor(Math.random()*sh.length)];const svg=`<svg viewBox="${-d.size} ${-d.size} ${d.size*2} ${d.size*2}" width="${d.size*2}" height="${d.size*2}">${sv(d.size)}</svg>`;const el=document.createElement('div');el.className='star';el.style.cssText=`left:${d.left}%;bottom:-${d.size*2}px;--dur:${d.dur};--delay:${d.delay}`;el.innerHTML=svg;document.body.appendChild(el);});

    // ── Validación ──
    function validateField(fieldId, inputId) {
      const field = document.getElementById(fieldId);
      const val   = document.getElementById(inputId).value.trim();
      if (!val) { field.className = field.className.replace(/ valid| invalid/g,''); return false; }
      const ok = inputId === 'precio' ? Number(val) > 0 : val.length > 0;
      field.className = field.className.replace(/ valid| invalid/g,'') + (ok ? ' valid' : ' invalid');
      return ok;
    }

    function handleSubmit() {
      const e = validateField('field-estilo','estilo');
      const f = validateField('field-formato','formato');
      const p = validateField('field-precio','precio');
      const d = validateField('field-desc','desc');
      if (!e || !f || !p || !d) { shake(); return; }
      const btn = document.getElementById('submitBtn');
      btn.classList.add('loading');
      setTimeout(() => {
        btn.classList.remove('loading');
        document.getElementById('success').classList.add('show');
      }, 1800);
    }

    function shake() {
      const m = document.querySelector('.modal');
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const p = (ts-start)/400;
        if (p<1) { m.style.transform=`translateX(${8*Math.sin(p*Math.PI*6)*(1-p)}px)`; requestAnimationFrame(step); }
        else { m.style.transform='translateX(0)'; }
      }
      requestAnimationFrame(step);
    }

    document.addEventListener('keydown', e => { if (e.key==='Enter') handleSubmit(); });
