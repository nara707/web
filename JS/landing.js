    // ── Estrellas ──
    const sc=['#e8d87a','#d899e8','#ffffff','#f0c8a0','#b05ad0'];
    function rc(){return sc[Math.floor(Math.random()*sc.length)];}
    function s4(r){const p=[];for(let i=0;i<8;i++){const a=(i*Math.PI)/4-Math.PI/2,rad=i%2===0?r:r*.4;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    function s6(r){const p=[];for(let i=0;i<12;i++){const a=(i*Math.PI)/6-Math.PI/2,rad=i%2===0?r:r*.45;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    const sh=[s=>`<polygon points="${s4(s)}" fill="${rc()}" opacity=".6"/>`,s=>`<polygon points="${s6(s)}" fill="${rc()}" opacity=".55"/>`,s=>`<polygon points="0,${-s} ${s*.4},0 0,${s} ${-s*.4},0" fill="${rc()}" opacity=".7"/>`];
    [{size:10,left:4,dur:'10s',delay:'0s'},{size:14,left:14,dur:'13s',delay:'2s'},{size:8,left:24,dur:'9s',delay:'5s'},{size:16,left:36,dur:'12s',delay:'1s'},{size:10,left:50,dur:'8s',delay:'3.5s'},{size:18,left:62,dur:'15s',delay:'0.5s'},{size:11,left:74,dur:'11s',delay:'7s'},{size:9,left:85,dur:'9s',delay:'2.5s'},{size:13,left:94,dur:'12s',delay:'4s'}].forEach(d=>{const sv=sh[Math.floor(Math.random()*sh.length)];const svg=`<svg viewBox="${-d.size} ${-d.size} ${d.size*2} ${d.size*2}" width="${d.size*2}" height="${d.size*2}">${sv(d.size)}</svg>`;const el=document.createElement('div');el.className='star';el.style.cssText=`left:${d.left}%;bottom:-${d.size*2}px;--dur:${d.dur};--delay:${d.delay}`;el.innerHTML=svg;document.body.appendChild(el);});

    // ── Datos del grid ──
    const artists = [
      {id:0, artist:'@valeria.draws',  cat:'ilustracion', label:'Ilustración', price:'Desde $45',  h:220, c1:'#d899e8', c2:'#5a1a7a'},
      {id:1, artist:'@sofía.mural',    cat:'murales',     label:'Murales',     price:'Desde $200', h:160, c1:'#e8d87a', c2:'#b05ad0'},
      {id:2, artist:'@karim.fashion',  cat:'moda',        label:'Moda',        price:'Desde $120', h:260, c1:'#f0c8a0', c2:'#c87ce8'},
      {id:3, artist:'@inkbymarcelo',   cat:'tatuajes',    label:'Tatuajes',    price:'Desde $80',  h:180, c1:'#3a0a5a', c2:'#e8a8d8'},
      {id:4, artist:'@luna.design',    cat:'diseno',      label:'Diseño',      price:'Desde $60',  h:200, c1:'#b05ad0', c2:'#f5dca0'},
      {id:5, artist:'@foto.bynadia',   cat:'fotografia',  label:'Fotografía',  price:'Desde $95',  h:150, c1:'#e8a8d8', c2:'#3a0a5a'},
      {id:6, artist:'@drew.ink',       cat:'ilustracion', label:'Ilustración', price:'Desde $55',  h:240, c1:'#c87ce8', c2:'#e8d87a'},
      {id:7, artist:'@urbanwalls',     cat:'murales',     label:'Murales',     price:'Desde $350', h:170, c1:'#5a1a7a', c2:'#f0c8a0'},
      {id:8, artist:'@style.haus',     cat:'moda',        label:'Moda',        price:'Desde $140', h:190, c1:'#f5dca0', c2:'#d899e8'},
      {id:9, artist:'@needleart',      cat:'tatuajes',    label:'Tatuajes',    price:'Desde $100', h:230, c1:'#b05ad0', c2:'#e8d87a'},
      {id:10,artist:'@pixelstudio',    cat:'diseno',      label:'Diseño',      price:'Desde $75',  h:155, c1:'#d899e8', c2:'#3a0a5a'},
      {id:11,artist:'@lensbyomar',     cat:'fotografia',  label:'Fotografía',  price:'Desde $110', h:210, c1:'#e8d87a', c2:'#c87ce8'},
      {id:12,artist:'@artbycamila',    cat:'ilustracion', label:'Ilustración', price:'Desde $40',  h:175, c1:'#e8a8d8', c2:'#5a1a7a'},
      {id:13,artist:'@graffik.co',     cat:'murales',     label:'Murales',     price:'Desde $280', h:245, c1:'#c87ce8', c2:'#f5dca0'},
      {id:14,artist:'@threadsbymei',   cat:'moda',        label:'Moda',        price:'Desde $160', h:165, c1:'#3a0a5a', c2:'#d899e8'},
      {id:15,artist:'@skinwork',       cat:'tatuajes',    label:'Tatuajes',    price:'Desde $90',  h:195, c1:'#f0c8a0', c2:'#b05ad0'},
      {id:16,artist:'@glyphlab',       cat:'diseno',      label:'Diseño',      price:'Desde $85',  h:225, c1:'#b09ac0', c2:'#e8d87a'},
      {id:17,artist:'@framesbyrosa',   cat:'fotografia',  label:'Fotografía',  price:'Desde $130', h:150, c1:'#5a1a7a', c2:'#f0c8a0'},
      {id:18,artist:'@sketchy.co',     cat:'ilustracion', label:'Ilustración', price:'Desde $50',  h:215, c1:'#f5dca0', c2:'#b05ad0'},
      {id:19,artist:'@muralista.mx',   cat:'murales',     label:'Murales',     price:'Desde $240', h:180, c1:'#d899e8', c2:'#e8d87a'},
    ];

    const saved = {};

    function renderGrid(filter='all') {
      const grid = document.getElementById('grid');
      grid.innerHTML = '';
      const list = filter === 'all' ? artists : artists.filter(a => a.cat === filter);
      list.forEach(a => {
        const card = document.createElement('div');
        card.className = 'art-card';
        card.innerHTML = `
          <div class="art-card-ph" style="height:${a.h}px;background:linear-gradient(145deg,${a.c1},${a.c2})"></div>
          <div class="art-card-overlay">
            <div class="art-card-artist">${a.artist}</div>
            <div class="art-card-cat">${a.label}</div>
          </div>
          <div class="art-card-price">${a.price}</div>
          <button class="art-card-save ${saved[a.id]?'saved':''}" onclick="toggleSave(event,${a.id})">${saved[a.id]?'♥':'♡'}</button>
        `;
        grid.appendChild(card);
      });
    }

    function toggleSave(e, id) {
      e.stopPropagation();
      saved[id] = !saved[id];
      e.currentTarget.classList.toggle('saved');
      e.currentTarget.textContent = saved[id] ? '♥' : '♡';
    }

    function filterCat(el, cat) {
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      renderGrid(cat);
    }

    renderGrid();
