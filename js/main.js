document.addEventListener('DOMContentLoaded', async () => {

  /* ---------------- Carrega dados ao vivo do Supabase (se configurado) ---------------- */
  /* Se o Supabase não estiver configurado ainda, ou a leitura falhar, o site
     continua funcionando normalmente com os dados padrão de js/menu-data.js. */
  if (window.loadSiteData) {
    try { await window.loadSiteData(); }
    catch (e) { console.warn('Usando dados locais (Supabase indisponível):', e); }
  }

  /* ---------------- Helpers ---------------- */
  const fmt = (v) => v == null ? null : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Pedido pelo site desligado (chave só do super admin, em Configurações ->
  // Super Admin): vira cardápio de vitrine só - some cadastro, carrinho e preço.
  const orderingOn = PLATFORM.orderingEnabled;
  if (!orderingOn) {
    document.getElementById('cartBtn').style.display = 'none';
    document.getElementById('accountBtn').style.display = 'none';
  }

  /* ---------------- Textos editáveis (sobrescreve o HTML padrão se vier do admin) ---------------- */
  const setTextIfPresent = (id, value) => {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  setTextIfPresent('heroTitleMain', BUSINESS.heroTitle);
  setTextIfPresent('heroTitleAccent', BUSINESS.heroTitleAccent);
  setTextIfPresent('heroLeadText', BUSINESS.heroLead);
  setTextIfPresent('aboutLeadText', BUSINESS.aboutText);
  setTextIfPresent('ctaTitleText', BUSINESS.ctaTitle);
  setTextIfPresent('ctaBodyText', BUSINESS.ctaText);

  /* ---------------- Header scroll state ---------------- */
  const header = document.getElementById('header');
  const backToTop = document.getElementById('backToTop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 30);
    backToTop.classList.toggle('show', y > 700);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------------- Mobile nav ---------------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
    navToggle.classList.toggle('open');
  });
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mainNav.classList.remove('open')));

  /* ---------------- Open/closed status ---------------- */
  (function setStatus() {
    const pill = document.getElementById('statusPill');
    const text = document.getElementById('statusText');
    try {
      const now = new Date();
      const spNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const today = dayNames[spNow.getDay()];
      const todayHours = BUSINESS.hours.find(h => h.d === today);
      let isOpen = false;
      if (todayHours) {
        const toMinutes = (str) => {
          const [hh, mm] = str.split(':').map(Number);
          return hh * 60 + mm;
        };
        const nowMinutes = spNow.getHours() * 60 + spNow.getMinutes();
        isOpen = todayHours.ranges.some(r => nowMinutes >= toMinutes(r.open) && nowMinutes <= toMinutes(r.close));
      }
      pill.classList.toggle('closed', !isOpen);
      text.textContent = isOpen ? 'Aberto agora' : 'Fechado no momento';
    } catch (e) {
      text.textContent = 'Consulte horários';
    }
  })();

  /* ---------------- Índice de produtos (ids estáveis para o carrinho) ---------------- */
  // Itens vindos do Supabase já têm um "id" próprio e permanente.
  // Itens do fallback estático (js/menu-data.js) ganham um id baseado em
  // categoria+nome — estável mesmo se a ordem dos itens mudar.
  window.ITEM_INDEX = {};
  MENU.forEach((c) => {
    c.items.forEach((item) => {
      const id = item.id || slugify(`${c.cat}-${item.n}`);
      window.ITEM_INDEX[id] = { ...item, cat: c.cat, id };
    });
  });

  /* ---------------- Monta a lista de destaques a partir do campo "featured" ---------------- */
  const FEATURED = Object.values(window.ITEM_INDEX).filter(it => it.featured);

  /* ---------------- Render featured dishes ---------------- */
  const featuredTrack = document.getElementById('featuredTrack');
  const featuredSection = document.getElementById('destaques');
  if (FEATURED.length === 0 && featuredSection) {
    featuredSection.style.display = 'none';
  } else if (featuredTrack) {
    featuredTrack.innerHTML = FEATURED.map((item) => {
      const disponivel = item.v != null;
      return `
      <div class="dish-card reveal in">
        ${orderingOn && item.promo ? '<span class="dish-badge">Oferta</span>' : ''}
        <div class="dish-img"><img src="${item.img}" alt="${item.n}" loading="lazy"></div>
        <div class="dish-body">
          <h3>${item.n}</h3>
          <p>${item.d}</p>
          ${orderingOn ? `
          <div class="dish-price-row">
            <div class="dish-price">
              ${item.promo
                ? `<span class="now">R$ ${fmt(item.promo)}</span><span class="was">R$ ${fmt(item.v)}</span>`
                : `<span class="now">R$ ${fmt(item.v)}</span>`}
            </div>
            ${disponivel ? `<button class="add-btn" data-add="${item.id}" aria-label="Adicionar ${item.n}"><i class="bi bi-plus-lg"></i></button>` : ''}
          </div>` : ''}
        </div>
      </div>
    `; }).join('');
  }

  /* ---------------- Navegação do carrossel de destaques ---------------- */
  const featuredTrackWrap = document.getElementById('featuredTrackWrap');
  const featuredPrev = document.getElementById('featuredPrev');
  const featuredNext = document.getElementById('featuredNext');
  const scrollFeatured = (dir) => {
    const card = featuredTrack.querySelector('.dish-card');
    const step = card ? card.offsetWidth + 22 : 320;
    featuredTrackWrap.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
  };
  if (featuredPrev) featuredPrev.addEventListener('click', () => scrollFeatured(-1));
  if (featuredNext) featuredNext.addEventListener('click', () => scrollFeatured(1));

  /* ---------------- Render menu tabs + panels ---------------- */
  const menuTabs = document.getElementById('menuTabs');
  const menuPanels = document.getElementById('menuPanels');

  const catId = (cat) => 'panel-' + slugify(cat);

  menuTabs.innerHTML = MENU.map((c, i) => `
    <button class="menu-tab ${i === 0 ? 'active' : ''}" data-target="${catId(c.cat)}">
      <i class="bi ${c.icon || 'bi-egg-fried'}"></i> ${c.cat}
    </button>
  `).join('');

  menuPanels.innerHTML = MENU.map((c, ci) => `
    <div class="menu-panel ${ci === 0 ? 'active' : ''}" id="${catId(c.cat)}">
      <div class="menu-panel-head">
        <h3>${c.cat}</h3>
        <span>${c.sub ? c.sub : c.items.length + ' opções'}</span>
      </div>
      <div class="menu-grid">
        ${c.items.map((item) => {
          const id = item.id || slugify(`${c.cat}-${item.n}`);
          return `
          <div class="menu-item" data-search="${(item.n + ' ' + (item.d||'') + ' ' + c.cat).toLowerCase()}">
            ${item.img
              ? `<div class="thumb"><img src="${item.img}" alt="${item.n}" loading="lazy"></div>`
              : `<div class="no-thumb"><i class="bi ${c.icon || 'bi-egg-fried'}"></i></div>`}
            <div class="menu-item-body">
              <div class="menu-item-text">
                <div class="menu-item-top">
                  <h4>${item.n}</h4>
                  ${orderingOn ? `
                  <div class="menu-item-price">
                    ${item.v == null
                      ? '<span class="ask">Consultar</span>'
                      : item.promo
                        ? `<span class="old">R$ ${fmt(item.v)}</span><span class="promo">R$ ${fmt(item.promo)}</span>`
                        : `R$ ${fmt(item.v)}`}
                  </div>` : ''}
                </div>
                ${item.d ? `<p class="menu-item-desc">${item.d}</p>` : ''}
              </div>
              ${orderingOn && item.v != null ? `<button class="add-btn" data-add="${id}" aria-label="Adicionar ${item.n}"><i class="bi bi-plus-lg"></i></button>` : ''}
            </div>
          </div>
        `; }).join('')}
      </div>
    </div>
  `).join('');

  menuTabs.querySelectorAll('.menu-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      menuTabs.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      menuPanels.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(tab.dataset.target).classList.add('active');
      document.getElementById('menuSearch').value = '';
    });
  });

  /* ---------------- Search ---------------- */
  const searchInput = document.getElementById('menuSearch');
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();

    if (!q) {
      menuPanels.querySelectorAll('.menu-panel').forEach((p, i) => p.classList.toggle('active', i === [...menuTabs.querySelectorAll('.menu-tab')].findIndex(t => t.classList.contains('active'))));
      menuPanels.querySelectorAll('.menu-item').forEach(el => el.style.display = '');
      menuPanels.querySelectorAll('.no-results').forEach(el => el.remove());
      return;
    }

    // show all panels, filter items across all categories
    menuPanels.querySelectorAll('.menu-panel').forEach(p => p.classList.add('active'));
    let anyVisible = false;
    menuPanels.querySelectorAll('.menu-panel').forEach(panel => {
      let panelHasMatch = false;
      panel.querySelectorAll('.menu-item').forEach(item => {
        const match = item.dataset.search.includes(q);
        item.style.display = match ? '' : 'none';
        if (match) { panelHasMatch = true; anyVisible = true; }
      });
      panel.style.display = panelHasMatch ? '' : 'none';
    });

    menuPanels.querySelectorAll('.no-results').forEach(el => el.remove());
    if (!anyVisible) {
      menuPanels.insertAdjacentHTML('beforeend', `<div class="no-results"><i class="bi bi-emoji-frown" style="font-size:28px;display:block;margin-bottom:10px;"></i>Nenhum prato encontrado para "${q}"</div>`);
    }
  });

  /* ---------------- Delivery fee table ---------------- */
  document.getElementById('feeTable').innerHTML = BUSINESS.deliveryFees.map(f => `
    <tr><td>${f.distance}</td><td>R$ ${fmt(f.value)}</td></tr>
  `).join('');

  /* ---------------- Hours table ---------------- */
  const fmtHour = (h) => h.replace(':', 'h');
  document.getElementById('hoursTable').innerHTML = BUSINESS.hours.map(h => `
    <div class="hrow">
      <span class="hd">${h.d}</span>
      <span class="hh">${h.ranges.map(r => `${fmtHour(r.open)} – ${fmtHour(r.close)}`).join(' e ')}</span>
    </div>
  `).join('');

  /* ---------------- Footer year ---------------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------------- Scroll reveal ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

});
