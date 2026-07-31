/* ============================================
   PAINEL DE ADMIN — lógica
   ============================================ */

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

let categories = [];          // categorias carregadas do Supabase (cache local do painel)
let editingCatDocId = null;   // categoria aberta no modal de item
let editingItemId = null;     // item sendo editado (null = criando um novo)
let pendingImageFile = null;  // arquivo de foto escolhido no modal, ainda não enviado
let dashboardStarted = false; // evita inicializar o dashboard mais de uma vez

document.addEventListener('DOMContentLoaded', () => {

  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  const supabaseWarning = document.getElementById('supabaseWarning');

  if (!window.AdminAPI || !AdminAPI.isConfigured()) {
    supabaseWarning.style.display = 'flex';
  }

  /* ---------------- Autenticação ---------------- */
  if (window.supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'flex';
        if (!dashboardStarted) { dashboardStarted = true; initDashboard(); }
      } else {
        loginScreen.style.display = 'flex';
        dashboard.style.display = 'none';
        dashboardStarted = false;
      }
    });
  }

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const pass = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginError');
    errorEl.classList.remove('show');

    if (!window.supabaseClient) {
      Toast.show('Configure o Supabase antes de entrar (veja js/supabase-config.js).', true);
      return;
    }
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
    if (error) {
      errorEl.classList.add('show');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    supabaseClient.auth.signOut();
  });

  /* ---------------- Navegação lateral ---------------- */
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(btn.dataset.panel).classList.add('active');
    });
  });
});

/* ============================================
   INICIALIZAÇÃO DO DASHBOARD
   ============================================ */
async function initDashboard() {
  await loadSettingsIntoForm();
  await loadCategoriesIntoUI();
  await loadCouponsIntoUI();
  wireSettingsForm();
  wireMenuPanel();
  wireImportPanel();
  wireItemModal();
  wireCouponsPanel();

  const role = await AdminAPI.getMyRole();
  if (role === 'super_admin') {
    document.getElementById('superAdminNavBtn').style.display = 'flex';
    await wireSuperAdminPanel();
  }
}

/* ============================================
   PAINEL: CONFIGURAÇÕES
   ============================================ */
async function loadSettingsIntoForm() {
  let data = null;
  try { data = await AdminAPI.getBusinessSettings(); } catch (e) { /* ignora */ }
  const b = { ...BUSINESS, ...(data || {}) };

  document.getElementById('cfgHeroTitle').value = b.heroTitle || '';
  document.getElementById('cfgHeroTitleAccent').value = b.heroTitleAccent || '';
  document.getElementById('cfgHeroLead').value = b.heroLead || '';
  document.getElementById('cfgAboutText').value = b.aboutText || '';
  document.getElementById('cfgCtaTitle').value = b.ctaTitle || '';
  document.getElementById('cfgCtaText').value = b.ctaText || '';

  document.getElementById('cfgName').value = b.name || '';
  document.getElementById('cfgTagline').value = b.tagline || '';
  document.getElementById('cfgPhone').value = b.phone || '';
  document.getElementById('cfgPhoneDisplay').value = b.phoneDisplay || '';
  document.getElementById('cfgAddress').value = b.address || '';
  document.getElementById('cfgAddressComplement').value = b.addressComplement || '';
  document.getElementById('cfgLat').value = b.lat != null ? b.lat : '';
  document.getElementById('cfgLng').value = b.lng != null ? b.lng : '';
  document.getElementById('cfgMinOrder').value = b.minOrder != null ? b.minOrder : '';

  document.querySelectorAll('#cfgPayments input').forEach(chk => {
    chk.checked = (b.payments || []).includes(chk.value);
  });

  renderFeeRows(b.deliveryFees || []);
  renderHoursRows(b.hours || DAY_NAMES.map(d => ({ d, ranges: [{ open: '', close: '' }] })));
}

function renderFeeRows(fees) {
  const wrap = document.getElementById('feeRows');
  wrap.innerHTML = '';
  fees.forEach(f => addFeeRow(f.distance, f.value));
}

function addFeeRow(distance = '', value = '') {
  const wrap = document.getElementById('feeRows');
  const row = document.createElement('div');
  row.className = 'admin-row';
  row.innerHTML = `
    <input type="text" class="fee-distance" placeholder='Ex: até 3,9 km' value="${distance}">
    <input type="number" step="0.01" class="fee-value" placeholder="Valor R$" value="${value}">
    <button type="button" class="row-remove"><i class="bi bi-trash3"></i></button>
  `;
  row.querySelector('.row-remove').addEventListener('click', () => row.remove());
  wrap.appendChild(row);
}

function renderHoursRows(hours) {
  const wrap = document.getElementById('hoursRows');
  wrap.innerHTML = DAY_NAMES.map(day => {
    const dayData = hours.find(h => h.d === day) || { ranges: [] };
    const r1 = dayData.ranges[0] || { open: '', close: '' };
    const r2 = dayData.ranges[1] || { open: '', close: '' };
    return `
      <div class="hours-row" data-day="${day}">
        <span class="day-label">${day}</span>
        <input type="text" class="h-open-1" placeholder="11:00" value="${r1.open || ''}">
        <span class="range-sep">–</span>
        <input type="text" class="h-close-1" placeholder="15:00" value="${r1.close || ''}">
        <span class="range-sep">e</span>
        <input type="text" class="h-open-2" placeholder="18:00" value="${r2.open || ''}">
        <span class="range-sep">–</span>
        <input type="text" class="h-close-2" placeholder="23:00" value="${r2.close || ''}">
      </div>
    `;
  }).join('');
}

function wireSettingsForm() {
  document.getElementById('addFeeRow').onclick = () => addFeeRow();

  document.getElementById('saveSettingsBtn').onclick = async () => {
    const fees = [...document.querySelectorAll('#feeRows .admin-row')].map(row => ({
      distance: row.querySelector('.fee-distance').value.trim(),
      value: parseFloat(row.querySelector('.fee-value').value) || 0
    })).filter(f => f.distance);

    const hours = [...document.querySelectorAll('.hours-row')].map(row => {
      const day = row.dataset.day;
      const ranges = [];
      const o1 = row.querySelector('.h-open-1').value.trim();
      const c1 = row.querySelector('.h-close-1').value.trim();
      const o2 = row.querySelector('.h-open-2').value.trim();
      const c2 = row.querySelector('.h-close-2').value.trim();
      if (o1 && c1) ranges.push({ open: o1, close: c1 });
      if (o2 && c2) ranges.push({ open: o2, close: c2 });
      return { d: day, ranges };
    });

    const payments = [...document.querySelectorAll('#cfgPayments input:checked')].map(c => c.value);

    const data = {
      heroTitle: document.getElementById('cfgHeroTitle').value.trim(),
      heroTitleAccent: document.getElementById('cfgHeroTitleAccent').value.trim(),
      heroLead: document.getElementById('cfgHeroLead').value.trim(),
      aboutText: document.getElementById('cfgAboutText').value.trim(),
      ctaTitle: document.getElementById('cfgCtaTitle').value.trim(),
      ctaText: document.getElementById('cfgCtaText').value.trim(),
      name: document.getElementById('cfgName').value.trim(),
      tagline: document.getElementById('cfgTagline').value.trim(),
      phone: document.getElementById('cfgPhone').value.trim(),
      phoneDisplay: document.getElementById('cfgPhoneDisplay').value.trim(),
      address: document.getElementById('cfgAddress').value.trim(),
      addressComplement: document.getElementById('cfgAddressComplement').value.trim(),
      lat: parseFloat(document.getElementById('cfgLat').value) || null,
      lng: parseFloat(document.getElementById('cfgLng').value) || null,
      minOrder: parseFloat(document.getElementById('cfgMinOrder').value) || 0,
      payments,
      deliveryFees: fees,
      hours
    };

    try {
      await AdminAPI.saveBusinessSettings(data);
      Toast.show('Configurações salvas com sucesso!');
    } catch (e) {
      Toast.show('Erro ao salvar: ' + e.message, true);
    }
  };
}

/* ============================================
   PAINEL: CARDÁPIO
   ============================================ */
async function loadCategoriesIntoUI() {
  try {
    categories = await AdminAPI.listCategories();
  } catch (e) {
    categories = [];
  }
  renderCategories();
}

function renderCategories() {
  const wrap = document.getElementById('categoriesWrap');
  if (categories.length === 0) {
    wrap.innerHTML = `<p style="color:var(--text-dim);font-size:14px;margin-top:20px;">Nenhuma categoria ainda. Clique em "Importar dados iniciais" (menu à esquerda) para trazer o cardápio atual, ou crie uma categoria nova.</p>`;
    return;
  }

  wrap.innerHTML = categories.map((cat, ci) => `
    <div class="admin-cat-card" data-doc="${cat._docId}">
      <div class="admin-cat-head">
        <div class="admin-cat-head-left">
          <i class="bi bi-chevron-right cat-caret"></i>
          <input type="text" class="cat-name-input" value="${cat.cat}" data-doc="${cat._docId}">
          <span class="admin-cat-count">${(cat.items || []).length} itens</span>
        </div>
        <div class="admin-cat-actions">
          <button type="button" class="cat-add-item" title="Adicionar item"><i class="bi bi-plus-lg"></i></button>
          <button type="button" class="cat-delete danger" title="Excluir categoria"><i class="bi bi-trash3"></i></button>
        </div>
      </div>
      <div class="admin-cat-body">
        ${(cat.items || []).map(item => `
          <div class="admin-item-row" data-item="${item.id}">
            <div class="admin-item-thumb">
              ${item.img ? `<img src="${item.img}" alt="">` : `<div class="no-thumb"><i class="bi bi-egg-fried"></i></div>`}
            </div>
            <div class="admin-item-info">
              <strong>${item.n}${item.featured ? '<span class="featured-tag">★ destaque</span>' : ''}</strong>
              <span>${item.d || 'sem descrição'}</span>
            </div>
            <div class="admin-item-price">${item.v != null ? 'R$ ' + item.v.toFixed(2).replace('.', ',') : '—'}</div>
            <div class="admin-item-actions">
              <button type="button" class="item-edit" title="Editar"><i class="bi bi-pencil"></i></button>
              <button type="button" class="item-delete danger" title="Excluir"><i class="bi bi-trash3"></i></button>
            </div>
          </div>
        `).join('') || '<p style="color:var(--text-faint);font-size:13.5px;">Nenhum item nesta categoria ainda.</p>'}
        <button type="button" class="btn btn-outline btn-sm admin-add-item-btn"><i class="bi bi-plus"></i> Adicionar produto</button>
      </div>
    </div>
  `).join('');
}

function wireMenuPanel() {
  document.getElementById('addCategoryBtn').onclick = async () => {
    const name = prompt('Nome da nova categoria:');
    if (!name) return;
    try {
      const docId = await AdminAPI.saveCategory(null, { cat: name, icon: 'bi-egg-fried', sub: '', order: categories.length, items: [] });
      categories.push({ cat: name, icon: 'bi-egg-fried', sub: '', order: categories.length, items: [], _docId: docId });
      renderCategories();
      Toast.show('Categoria criada!');
    } catch (e) {
      Toast.show('Erro: ' + e.message, true);
    }
  };

  const wrap = document.getElementById('categoriesWrap');
  wrap.addEventListener('click', async (e) => {
    const catCard = e.target.closest('.admin-cat-card');
    if (!catCard) return;
    const docId = catCard.dataset.doc;
    const cat = categories.find(c => c._docId === docId);

    // abrir/fechar categoria
    if (e.target.closest('.admin-cat-head-left') && !e.target.closest('.cat-name-input')) {
      catCard.querySelector('.admin-cat-body').classList.toggle('open');
      catCard.querySelector('.cat-caret').classList.toggle('bi-chevron-right');
      catCard.querySelector('.cat-caret').classList.toggle('bi-chevron-down');
      return;
    }

    // excluir categoria
    if (e.target.closest('.cat-delete')) {
      if (!confirm(`Excluir a categoria "${cat.cat}" e todos os seus itens?`)) return;
      try {
        await AdminAPI.deleteCategory(docId);
        categories = categories.filter(c => c._docId !== docId);
        renderCategories();
        Toast.show('Categoria excluída.');
      } catch (err) { Toast.show('Erro: ' + err.message, true); }
      return;
    }

    // adicionar item (botão do cabeçalho ou botão no rodapé do corpo)
    if (e.target.closest('.cat-add-item') || e.target.closest('.admin-add-item-btn')) {
      openItemModal(docId, null);
      return;
    }

    // editar item
    const editBtn = e.target.closest('.item-edit');
    if (editBtn) {
      const itemId = editBtn.closest('.admin-item-row').dataset.item;
      openItemModal(docId, itemId);
      return;
    }

    // excluir item
    const delBtn = e.target.closest('.item-delete');
    if (delBtn) {
      const itemId = delBtn.closest('.admin-item-row').dataset.item;
      if (!confirm('Excluir este produto?')) return;
      try {
        const newItems = cat.items.filter(it => it.id !== itemId);
        await AdminAPI.saveItemInCategory(docId, newItems);
        cat.items = newItems;
        renderCategories();
        Toast.show('Produto excluído.');
      } catch (err) { Toast.show('Erro: ' + err.message, true); }
      return;
    }
  });

  // renomear categoria (salva ao sair do campo)
  wrap.addEventListener('focusout', async (e) => {
    if (!e.target.classList.contains('cat-name-input')) return;
    const docId = e.target.dataset.doc;
    const cat = categories.find(c => c._docId === docId);
    const newName = e.target.value.trim();
    if (!newName || newName === cat.cat) return;
    try {
      await AdminAPI.saveCategory(docId, { cat: newName });
      cat.cat = newName;
      Toast.show('Categoria renomeada.');
    } catch (err) { Toast.show('Erro: ' + err.message, true); }
  });
}

/* ============================================
   PAINEL: CUPONS
   ============================================ */
let coupons = [];

async function loadCouponsIntoUI() {
  try {
    coupons = await AdminAPI.listCoupons();
  } catch (e) {
    coupons = [];
  }
  renderCoupons();
}

function renderCoupons() {
  const wrap = document.getElementById('couponsWrap');
  if (coupons.length === 0) {
    wrap.innerHTML = `<p style="color:var(--text-dim);font-size:14px;">Nenhum cupom criado ainda.</p>`;
    return;
  }
  wrap.innerHTML = coupons.map(c => `
    <div class="admin-cat-card" data-code="${c.code}">
      <div class="admin-cat-head" style="cursor:default;">
        <div class="admin-cat-head-left">
          <strong style="font-family:var(--font-display);font-size:17px;">${c.code}</strong>
          <span class="admin-cat-count">
            ${c.type === 'percent' ? c.value + '% off' : 'R$ ' + Number(c.value).toFixed(2).replace('.', ',') + ' off'}
            ${c.min_order ? ' · pedido mín. R$ ' + Number(c.min_order).toFixed(2).replace('.', ',') : ''}
            ${c.active ? '' : ' · <span style="color:var(--red);">inativo</span>'}
          </span>
        </div>
        <div class="admin-cat-actions">
          <button type="button" class="cpn-toggle" title="${c.active ? 'Desativar' : 'Ativar'}"><i class="bi ${c.active ? 'bi-toggle-on' : 'bi-toggle-off'}"></i></button>
          <button type="button" class="cpn-delete danger" title="Excluir"><i class="bi bi-trash3"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

function wireCouponsPanel() {
  document.getElementById('addCouponBtn').addEventListener('click', async () => {
    const code = document.getElementById('cpnCode').value.trim().toUpperCase();
    const type = document.getElementById('cpnType').value;
    const value = parseFloat(document.getElementById('cpnValue').value);
    const minOrder = parseFloat(document.getElementById('cpnMinOrder').value) || 0;

    if (!code) { Toast.show('Informe o código do cupom.', true); return; }
    if (!value || value <= 0) { Toast.show('Informe um valor de desconto válido.', true); return; }

    try {
      await AdminAPI.saveCoupon({ code, type, value, min_order: minOrder, active: true });
      Toast.show('Cupom criado!');
      document.getElementById('cpnCode').value = '';
      document.getElementById('cpnValue').value = '';
      document.getElementById('cpnMinOrder').value = '';
      await loadCouponsIntoUI();
    } catch (e) {
      Toast.show('Erro ao criar cupom: ' + e.message, true);
    }
  });

  document.getElementById('couponsWrap').addEventListener('click', async (e) => {
    const card = e.target.closest('.admin-cat-card');
    if (!card) return;
    const code = card.dataset.code;
    const coupon = coupons.find(c => c.code === code);

    if (e.target.closest('.cpn-toggle')) {
      try {
        await AdminAPI.saveCoupon({ ...coupon, active: !coupon.active });
        Toast.show(coupon.active ? 'Cupom desativado.' : 'Cupom ativado.');
        await loadCouponsIntoUI();
      } catch (err) { Toast.show('Erro: ' + err.message, true); }
      return;
    }
    if (e.target.closest('.cpn-delete')) {
      if (!confirm(`Excluir o cupom "${code}"?`)) return;
      try {
        await AdminAPI.deleteCoupon(code);
        Toast.show('Cupom excluído.');
        await loadCouponsIntoUI();
      } catch (err) { Toast.show('Erro: ' + err.message, true); }
      return;
    }
  });
}

/* ============================================
   MODAL DE ITEM
   ============================================ */
function openItemModal(catDocId, itemId) {
  editingCatDocId = catDocId;
  editingItemId = itemId;
  pendingImageFile = null;

  const cat = categories.find(c => c._docId === catDocId);
  const item = itemId ? cat.items.find(it => it.id === itemId) : null;

  document.getElementById('itemModalTitle').textContent = item ? 'Editar produto' : 'Novo produto';
  document.getElementById('itNome').value = item ? item.n : '';
  document.getElementById('itDesc').value = item ? (item.d || '') : '';
  document.getElementById('itPreco').value = item && item.v != null ? item.v : '';
  document.getElementById('itPromo').value = item && item.promo != null ? item.promo : '';
  document.getElementById('itFeatured').checked = !!(item && item.featured);
  document.getElementById('itFoto').value = '';
  document.getElementById('itFotoPreview').innerHTML = item && item.img ? `<img src="${item.img}">` : '';

  const hasOptions = !!(item && item.hasOptions);
  document.getElementById('itHasOptions').checked = hasOptions;
  document.getElementById('itOptionLabel').value = item && item.optionLabel ? item.optionLabel : '';
  document.getElementById('itOptionsBlock').style.display = hasOptions ? 'block' : 'none';
  renderOptionChoiceRows(item && item.optionChoices ? item.optionChoices : []);

  document.getElementById('itemModalOverlay').classList.add('open');
  document.body.classList.add('lock-scroll');
}

function renderOptionChoiceRows(choices) {
  const wrap = document.getElementById('itOptionChoices');
  wrap.innerHTML = '';
  (choices.length ? choices : ['']).forEach(addOptionChoiceRow);
}

function addOptionChoiceRow(value = '') {
  const wrap = document.getElementById('itOptionChoices');
  const row = document.createElement('div');
  row.className = 'admin-row';
  row.innerHTML = `
    <input type="text" class="option-choice-input" placeholder="Ex: Cru" value="${value}">
    <button type="button" class="row-remove"><i class="bi bi-trash3"></i></button>
  `;
  row.querySelector('.row-remove').addEventListener('click', () => row.remove());
  wrap.appendChild(row);
}

function closeItemModal() {
  document.getElementById('itemModalOverlay').classList.remove('open');
  document.body.classList.remove('lock-scroll');
}

function wireItemModal() {
  document.getElementById('itemModalClose').onclick = closeItemModal;
  document.getElementById('itemModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'itemModalOverlay') closeItemModal();
  });

  document.getElementById('itFoto').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingImageFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('itFotoPreview').innerHTML = `<img src="${ev.target.result}">`;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('itHasOptions').addEventListener('change', (e) => {
    document.getElementById('itOptionsBlock').style.display = e.target.checked ? 'block' : 'none';
  });
  document.getElementById('addOptionChoice').addEventListener('click', () => addOptionChoiceRow());

  document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('itSaveBtn');
    const nome = document.getElementById('itNome').value.trim();
    if (!nome) { Toast.show('Informe o nome do produto.', true); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    try {
      const cat = categories.find(c => c._docId === editingCatDocId);
      let imgUrl = null;
      const existing = editingItemId ? cat.items.find(it => it.id === editingItemId) : null;
      if (existing) imgUrl = existing.img || null;

      if (pendingImageFile) {
        saveBtn.textContent = 'Enviando foto...';
        imgUrl = await AdminAPI.uploadProductImage(pendingImageFile);
      }

      const precoVal = document.getElementById('itPreco').value;
      const promoVal = document.getElementById('itPromo').value;

      const hasOptions = document.getElementById('itHasOptions').checked;
      const optionChoices = [...document.querySelectorAll('.option-choice-input')]
        .map(inp => inp.value.trim())
        .filter(Boolean);
      if (hasOptions && optionChoices.length === 0) {
        Toast.show('Adicione pelo menos uma opção de escolha, ou desmarque a opção.', true);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar produto';
        return;
      }

      const newItem = {
        id: editingItemId || AdminAPI.genId('itm'),
        n: nome,
        d: document.getElementById('itDesc').value.trim(),
        v: precoVal ? parseFloat(precoVal) : null,
        promo: promoVal ? parseFloat(promoVal) : null,
        img: imgUrl,
        featured: document.getElementById('itFeatured').checked,
        hasOptions,
        optionLabel: hasOptions ? document.getElementById('itOptionLabel').value.trim() || 'Escolha uma opção' : '',
        optionChoices: hasOptions ? optionChoices : []
      };

      let newItems;
      if (editingItemId) {
        newItems = cat.items.map(it => it.id === editingItemId ? newItem : it);
      } else {
        newItems = [...(cat.items || []), newItem];
      }

      await AdminAPI.saveItemInCategory(editingCatDocId, newItems);
      cat.items = newItems;
      renderCategories();
      closeItemModal();
      Toast.show('Produto salvo com sucesso!');
    } catch (err) {
      Toast.show('Erro ao salvar: ' + err.message, true);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar produto';
    }
  });
}

/* ============================================
   PAINEL: IMPORTAR DADOS INICIAIS
   ============================================ */
function wireImportPanel() {
  document.getElementById('seedBtn').onclick = async () => {
    if (!confirm('Importar o cardápio local (js/menu-data.js) para o Supabase agora?')) return;
    const btn = document.getElementById('seedBtn');
    btn.disabled = true;
    btn.textContent = 'Importando...';
    try {
      await AdminAPI.seedInitialData();
      Toast.show('Cardápio importado com sucesso! Vá em "Cardápio" para conferir.');
      await loadCategoriesIntoUI();
      await loadSettingsIntoForm();
    } catch (e) {
      Toast.show('Erro ao importar: ' + e.message, true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-cloud-arrow-up"></i> Importar cardápio inicial para o Supabase';
    }
  };
}

/* ============================================
   PAINEL: SUPER ADMIN (só visível pra quem tem esse papel)
   ============================================ */
async function wireSuperAdminPanel() {
  const toggle = document.getElementById('orderingToggle');
  toggle.checked = await AdminAPI.getOrderingEnabled();

  toggle.addEventListener('change', async () => {
    toggle.disabled = true;
    try {
      await AdminAPI.setOrderingEnabled(toggle.checked);
      Toast.show(toggle.checked ? 'Pedido pelo site ligado.' : 'Pedido pelo site desligado - só cardápio agora.');
    } catch (e) {
      toggle.checked = !toggle.checked;
      Toast.show('Erro: ' + e.message, true);
    } finally {
      toggle.disabled = false;
    }
  });

  document.getElementById('createStoreAdminBtn').addEventListener('click', async () => {
    const btn = document.getElementById('createStoreAdminBtn');
    const email = document.getElementById('saEmail').value.trim();
    const password = document.getElementById('saPassword').value;

    if (!email) { Toast.show('Informe o e-mail.', true); return; }
    if (password.length < 8) { Toast.show('A senha precisa ter no mínimo 8 caracteres.', true); return; }

    btn.disabled = true;
    btn.textContent = 'Criando...';
    try {
      await AdminAPI.createStoreAdmin(email, password);
      Toast.show(`Acesso da loja criado! Repasse o e-mail e a senha pro dono do restaurante.`);
      document.getElementById('saEmail').value = '';
      document.getElementById('saPassword').value = '';
    } catch (e) {
      Toast.show('Erro ao criar acesso: ' + e.message, true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-person-plus"></i> Criar acesso da loja';
    }
  });
}
