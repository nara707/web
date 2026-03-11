(function() {
          // ── Estrellas ──
    const sc=['#e8d87a','#d899e8','#ffffff','#f0c8a0','#b05ad0'];
    function rc(){return sc[Math.floor(Math.random()*sc.length)];}
    function s4(r){const p=[];for(let i=0;i<8;i++){const a=(i*Math.PI)/4-Math.PI/2,rad=i%2===0?r:r*.4;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    function s6(r){const p=[];for(let i=0;i<12;i++){const a=(i*Math.PI)/6-Math.PI/2,rad=i%2===0?r:r*.45;p.push(`${rad*Math.cos(a)},${rad*Math.sin(a)}`);}return p.join(' ');}
    const sh=[s=>`<polygon points="${s4(s)}" fill="${rc()}" opacity=".6"/>`,s=>`<polygon points="${s6(s)}" fill="${rc()}" opacity=".55"/>`,s=>`<polygon points="0,${-s} ${s*.4},0 0,${s} ${-s*.4},0" fill="${rc()}" opacity=".7"/>`];
    [{size:10,left:4,dur:'10s',delay:'0s'},{size:14,left:14,dur:'13s',delay:'2s'},{size:8,left:24,dur:'9s',delay:'5s'},{size:16,left:36,dur:'12s',delay:'1s'},{size:10,left:50,dur:'8s',delay:'3.5s'},{size:18,left:62,dur:'15s',delay:'0.5s'},{size:11,left:74,dur:'11s',delay:'7s'},{size:9,left:85,dur:'9s',delay:'2.5s'},{size:13,left:94,dur:'12s',delay:'4s'}].forEach(d=>{const sv=sh[Math.floor(Math.random()*sh.length)];const svg=`<svg viewBox="${-d.size} ${-d.size} ${d.size*2} ${d.size*2}" width="${d.size*2}" height="${d.size*2}">${sv(d.size)}</svg>`;const el=document.createElement('div');el.className='star';el.style.cssText=`left:${d.left}%;bottom:-${d.size*2}px;--dur:${d.dur};--delay:${d.delay}`;el.innerHTML=svg;document.body.appendChild(el);});


      // ----- DATOS DE LAS CARDS  -----
      const allCards = [
        { title: 'Chibi comfy', artist: '@valeria.draws', category: 'ilustracion', price: '$45', catLabel: 'Ilustración' , date: '2023-10-01', likes:'1.3k' ,  h:220, c1:'#d899e8', c2:'#5a1a7a'},
        { title: 'Retrato anime', artist: '@mikan.art', category: 'ilustracion', price: '$60', catLabel: 'Ilustración',date: '2023-10-02', likes: '2.1k', h:240, c1:'#c87ce8', c2:'#e8d87a'},
        { title: 'Diseño de moda', artist: '@modabykarim', category: 'moda', price: '$120', catLabel: 'Moda', date: '2023-10-03', likes: '1.8k', h:244, c1:'#c87ce8', c2:'#e8d87a'},
        { title: 'Sketch tatuaje', artist: '@inkbymarcelo', category: 'tatuajes', price: '$80', catLabel: 'Tatuajes' , date: '2023-10-04', likes: '1.5k', h:227, c1:'#d899e8', c2:'#5a1a7a'},
        { title: 'Fotografía conceptual', artist: '@luz.foto', category: 'foto', price: '$150', catLabel: 'Fotografía', date: '2023-10-05', likes: '1.2k', h:242, c1:'#c87ce8', c2:'#e8d87a' },
        { title: 'Logo diseño', artist: '@graphic.nova', category: 'diseno', price: '$95', catLabel: 'Diseño',  date: '2023-10-06', likes: '1.1k', h:267, c1:'#c87ce8', c2:'#e8d87a' },
        { title: 'Ilustración mural', artist: '@sofía.mural', category: 'ilustracion', price: '$200', catLabel: 'Ilustración' , date: '2023-10-07', likes: '1.4k', h:230, c1:'#d899e8', c2:'#5a1a7a'},
        { title: 'Emotes cutesy', artist: '@pixel.puff', category: 'ilustracion', price: '$35', catLabel: 'Ilustración', date: '2023-10-08', likes: '1.6k', h:232, c1:'#c87ce8', c2:'#e8d87a' },
        { title: 'Bocetos moda', artist: '@line.draw', category: 'moda', price: '$70', catLabel: 'Moda' , date: '2023-10-09', likes: '1.9k', h:212, c1:'#d899e8', c2:'#5a1a7a'},
      ];

      
 // ----- ESTADO -----
  const grid = document.getElementById('cardsGrid');
  let currentFilter = 'all';               // categoría activa (para subfiltro)
  let currentMainFilter = 'categories';     // 'categories', 'date', 'likes'
  let currentSort = null;                   // 'date' o 'likes'
  let sortOrder = 'desc';                    // 'desc' = más reciente / más likes, 'asc' = más antiguo
  let currentTab = 'publications';           // publications / sells / basket

  // ----- ELEMENTOS DOM -----
  const mainChips = document.querySelectorAll('#filterChipsRow .chip-filter');
  const subfilterRow = document.getElementById('subfilterRow');
  const subfilterChips = document.querySelectorAll('#subfilterRow .chip-filter');
  const tabPub = document.getElementById('tab-publications');
  const tabSells = document.getElementById('tab-likes');
  const tabBasket = document.getElementById('tab-basket');

  // ----- FUNCIÓN PARA CONVERTIR LIKES  -----
  function parseLikes(likesStr) {
    const num = parseFloat(likesStr.replace('k', ''));
    return likesStr.includes('k') ? num * 1000 : num;
  }

  // ----- RENDERIZADO (con filtrado y ordenamiento) -----
  function renderGrid() {
    // 1. filtrar por categoría
    let filtered = allCards;
    if (currentFilter !== 'all') {
      filtered = allCards.filter(c => c.category === currentFilter);
    }

    // 2. ordenar según currentSort
    if (currentSort === 'date') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    } else if (currentSort === 'likes') {
      filtered.sort((a, b) => parseLikes(b.likes) - parseLikes(a.likes));
    }

    // 3. ajustar precios según la pestaña 
    if (currentTab === 'likes') {
      filtered = filtered.map(c => ({ ...c, price: '$' + (parseInt(c.price.slice(1)) + 20) }));
    } else if (currentTab === 'basket') {
      filtered = filtered.map(c => ({ ...c, price: '$' + (parseInt(c.price.slice(1)) + 5) }));
    }

    // 4. generar HTML de las cards
    let html = '';
    filtered.forEach(card => {
      html += `
        <div class="art-card" data-category="${card.category}">
          <div class="art-card-ph" style="background: linear-gradient(145deg, #c87ce8, #e8d87a);"></div>
          <div class="art-card-overlay">
            <div class="art-card-likes"> 💗${card.likes}</div>
            <div class="art-card-artist">${card.artist}</div>
            <div class="art-card-cat">${card.catLabel}</div>
            <div class="art-card-date">${card.date}</div>
          </div>
          <div class="art-card-price">${card.price}</div>
          <button class="art-card-save material-symbols-outlined" onclick="this.classList.toggle('saved')">favorite</button>
        </div>
      `;
    });
    grid.innerHTML = html;
  }

  // ----- CLASES ACTIVAS EN MAIN CHIPS -----
  function setActiveMainChip(filterValue) {
    mainChips.forEach(chip => {
      if (chip.dataset.filter === filterValue) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // ----- CLASES ACTIVAS EN SUBFILTER CHIPS -----
  function setActiveSubfilterChip(filterValue) {
    subfilterChips.forEach(chip => {
      if (chip.dataset.filter === filterValue) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // ----- MANEJADORES DE MAIN CHIPS -----
  mainChips.forEach(chip => {
    chip.addEventListener('click', function(e) {
      const filter = this.dataset.filter;

      // ya está activo? (para fecha permite alternar orden)
      if (filter === currentMainFilter) {
        if (filter === 'date') {
          // toggle orden
          sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
          currentSort = 'date';
          renderGrid();
        }
        return;
      }

      // cambiar filtro principal
      currentMainFilter = filter;
      setActiveMainChip(filter);

      // ocultar subfilter row por defecto
      subfilterRow.style.display = 'none';

      // resetear sort si no es date o likes
      if (filter === 'categories') {
        currentSort = null;
        subfilterRow.style.display = 'flex';  // mostramos fila de categorías
        // asegurar que el subfiltro activo corresponde a currentFilter
        setActiveSubfilterChip(currentFilter);
        renderGrid();
      } else if (filter === 'date') {
        currentSort = 'date';
        sortOrder = 'desc';  // por defecto más reciente
        renderGrid();
      } else if (filter === 'likes') {
        currentSort = 'likes';
        sortOrder = 'desc';  // siempre descendente
        renderGrid();
      }
    });
  });

  // ----- MANEJADORES DE SUBFILTER CHIPS (categorías) -----
  subfilterChips.forEach(chip => {
    chip.addEventListener('click', function(e) {
      // solo si el main filter es categorias (fila visible)
      if (currentMainFilter !== 'categories') return;

      const filter = this.dataset.filter;
      currentFilter = filter;
      setActiveSubfilterChip(filter);
      renderGrid();
    });
  });


       // ----- TABS  -----
  function setActiveTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (tab === tabPub) currentTab = 'publications';
    else if (tab === tabSells) currentTab = 'likes';
    else if (tab === tabBasket) currentTab = 'basket';
    renderGrid();
  }

  tabPub.addEventListener('click', () => setActiveTab(tabPub));
  tabSells.addEventListener('click', () => setActiveTab(tabSells));
  tabBasket.addEventListener('click', () => setActiveTab(tabBasket));

  // ----- INICIALIZACIÓN -----
  currentMainFilter = 'categories';
  currentSort = null;
  currentFilter = 'all';
  setActiveMainChip('categories');
  subfilterRow.style.display = 'flex';  // mostrar subfiltro
  setActiveSubfilterChip('all');
  renderGrid();

    })();