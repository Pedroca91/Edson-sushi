/* ============================================
   CART + CHECKOUT + PEDIDO VIA WHATSAPP
   ============================================ */

const Cart = (() => {

  const CART_KEY = 'edsonsushi_cart';
  const fmt = (v) => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let checkoutAddress = null;   // endereço confirmado nesta sessão de checkout
  let checkoutPayment = null;   // forma de pagamento escolhida
  let currentStep = 1;

  /* ---------------- Cálculo de taxa por distância (KM real) ---------------- */
  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = (d) => d * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async function tryGeocode(parts) {
    const q = encodeURIComponent(parts.filter(Boolean).join(', '));
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${q}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data[0]) return null;
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (e) {
      return null;
    }
  }

  // Busca em cascata: o buscador (Nominatim/OpenStreetMap) costuma ter a rua
  // mapeada mas não cada número de casa — juntar tudo numa busca só falha
  // com frequência mesmo pra endereço real. Vai afrouxando até achar algo
  // (aproximado é suficiente pra calcular a faixa de distância da entrega).
  async function geocodeAddress(addr) {
    const city = addr.city || 'São Paulo';
    const attempts = [
      [addr.street, addr.number, addr.neighborhood, city, 'Brasil'],
      [addr.street, addr.number, city, 'Brasil'],
      [addr.street, addr.neighborhood, city, 'Brasil'],
      [addr.street, city, 'Brasil'],
    ];
    for (const parts of attempts) {
      const coords = await tryGeocode(parts);
      if (coords) return coords;
    }
    return null;
  }

  // encontra a faixa de taxa configurada em BUSINESS.deliveryFees para uma dada distância
  function feeForDistance(km) {
    for (const tier of BUSINESS.deliveryFees) {
      const max = parseFloat(tier.distance.replace(/[^\d,.]/g, '').replace(',', '.'));
      if (km <= max) return tier;
    }
    return null; // fora de todas as faixas cadastradas
  }

  async function estimateDeliveryFee(addr) {
    const coords = await geocodeAddress(addr);
    if (!coords) return { ok: false };
    const km = haversineKm(BUSINESS.lat, BUSINESS.lng, coords.lat, coords.lng);
    const tier = feeForDistance(km);
    return { ok: true, km, fee: tier ? tier.value : null };
  }

  function total() {
    const fee = (checkoutAddress && checkoutAddress.fee != null) ? checkoutAddress.fee : 0;
    return subtotal() + fee;
  }

  /* ---------------- Storage ---------------- */
  const getCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
    catch (e) { return {}; }
  };
  const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

  function add(id, qty = 1) {
    const cart = getCart();
    cart[id] = (cart[id] || 0) + qty;
    saveCart(cart);
    renderBadge();
  }
  function setQty(id, qty) {
    const cart = getCart();
    if (qty <= 0) delete cart[id];
    else cart[id] = qty;
    saveCart(cart);
    renderBadge();
    renderCartView();
  }
  function remove(id) { setQty(id, 0); }
  function clear() { saveCart({}); renderBadge(); }

  function getLines() {
    const cart = getCart();
    return Object.keys(cart).map(id => {
      const item = window.ITEM_INDEX ? window.ITEM_INDEX[id] : null;
      if (!item) return null;
      const unit = item.promo || item.v || 0;
      return { id, item, qty: cart[id], unit, total: unit * cart[id] };
    }).filter(Boolean);
  }
  function count() { return getLines().reduce((s, l) => s + l.qty, 0); }
  function subtotal() { return getLines().reduce((s, l) => s + l.total, 0); }

  function renderBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const c = count();
    badge.textContent = c;
    badge.style.display = c > 0 ? 'flex' : 'none';
  }

  /* ---------------- Drawer control ---------------- */
  function openDrawer(step = 1) {
    document.getElementById('cartOverlay').classList.add('open');
    document.body.classList.add('lock-scroll');
    goToStep(step);
  }
  function closeDrawer() {
    document.getElementById('cartOverlay').classList.remove('open');
    document.body.classList.remove('lock-scroll');
  }

  function goToStep(step) {
    currentStep = step;
    ['viewCart', 'viewAddress', 'viewPayment', 'viewReview'].forEach((id, i) => {
      document.getElementById(id).classList.toggle('active', i === step - 1);
    });

    const title = document.getElementById('drawerTitle');
    const backBtn = document.getElementById('drawerBackBtn');
    const actionBtn = document.getElementById('drawerActionBtn');
    const totalRow = document.getElementById('drawerTotalRow');

    backBtn.style.display = step > 1 ? 'flex' : 'none';

    if (step === 1) {
      title.innerHTML = '<i class="bi bi-bag"></i> Seu pedido';
      renderCartView();
      totalRow.style.display = 'flex';
      actionBtn.style.display = 'inline-flex';
      actionBtn.textContent = 'Continuar';
      actionBtn.disabled = getLines().length === 0;
      actionBtn.onclick = () => goToStep(2);
    } else if (step === 2) {
      title.innerHTML = '<i class="bi bi-geo-alt"></i> Endereço de entrega';
      renderAddressView();
      totalRow.style.display = 'none';
      if (checkoutAddress) {
        // endereço já confirmado (calculado ou revisitado via "voltar") - sempre dá pra seguir
        actionBtn.style.display = 'inline-flex';
        actionBtn.textContent = 'Continuar';
        actionBtn.disabled = false;
        actionBtn.onclick = () => goToStep(3);
      } else {
        actionBtn.style.display = 'none';
      }
    } else if (step === 3) {
      title.innerHTML = '<i class="bi bi-credit-card"></i> Pagamento';
      renderPaymentView();
      totalRow.style.display = 'flex';
      document.getElementById('drawerTotal').textContent = 'R$ ' + fmt(total());
      actionBtn.style.display = 'inline-flex';
      actionBtn.textContent = 'Continuar';
      actionBtn.disabled = !checkoutPayment;
      actionBtn.onclick = () => goToStep(4);
    } else if (step === 4) {
      title.innerHTML = '<i class="bi bi-check2-circle"></i> Revisar pedido';
      renderReviewView();
      totalRow.style.display = 'flex';
      document.getElementById('drawerTotal').textContent = 'R$ ' + fmt(total());
      actionBtn.style.display = 'inline-flex';
      actionBtn.textContent = 'Solicitar pedido pela loja';
      actionBtn.disabled = false;
      actionBtn.onclick = sendOrder;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('drawerBackBtn').addEventListener('click', () => {
      if (currentStep > 1) goToStep(currentStep - 1);
    });
  });

  /* ---------------- STEP 1: Cart items ---------------- */
  function renderCartView() {
    const wrap = document.getElementById('cartItemsWrap');
    const lines = getLines();

    if (lines.length === 0) {
      wrap.innerHTML = `<div class="cart-empty"><i class="bi bi-bag-x"></i>Seu carrinho está vazio.<br>Escolha algo delicioso no cardápio!</div>`;
      const actionBtn = document.getElementById('drawerActionBtn');
      if (actionBtn) actionBtn.disabled = true;
      return;
    }

    wrap.innerHTML = lines.map(l => `
      <div class="cart-line" data-id="${l.id}">
        ${l.item.img
          ? `<div class="thumb"><img src="${l.item.img}" alt="${l.item.n}"></div>`
          : `<div class="no-thumb"><i class="bi bi-egg-fried"></i></div>`}
        <div class="cart-line-body">
          <div class="cart-line-top">
            <h4>${l.item.n}</h4>
            <button class="cart-line-remove" data-remove="${l.id}"><i class="bi bi-trash3"></i></button>
          </div>
          <div class="cart-line-price">R$ ${fmt(l.unit)} / un.</div>
          <div class="qty-stepper">
            <button data-dec="${l.id}"><i class="bi bi-dash"></i></button>
            <span>${l.qty}</span>
            <button data-inc="${l.id}"><i class="bi bi-plus"></i></button>
          </div>
        </div>
        <div class="cart-line-total">R$ ${fmt(l.total)}</div>
      </div>
    `).join('') + `
      <div class="summary-row" style="margin-top:14px;"><span>Subtotal</span><span>R$ ${fmt(subtotal())}</span></div>
      <div class="summary-row"><span>Taxa de entrega</span><span>calculada no próximo passo</span></div>
    `;

    document.getElementById('drawerTotal').textContent = 'R$ ' + fmt(subtotal());
    const actionBtn = document.getElementById('drawerActionBtn');
    if (actionBtn) actionBtn.disabled = false;
  }

  /* ---------------- STEP 2: Address ---------------- */
  function formatUserAddress(u) {
    if (!u || !u.street) return null;
    const comp = u.complement ? `, ${u.complement}` : '';
    return {
      street: u.street, number: u.number, complement: u.complement,
      neighborhood: u.neighborhood, city: u.city, cep: u.cep,
      display: `${u.street}, ${u.number}${comp} — ${u.neighborhood}, ${u.city}`
    };
  }

  // confirma o endereço, calcula a taxa por distância real (km) e avança para o pagamento
  async function confirmAddressAndProceed(addr) {
    checkoutAddress = addr;
    const wrap = document.getElementById('addressConfirmWrap');
    wrap.innerHTML = `
      <div class="address-card">
        <strong><i class="bi bi-geo-alt-fill" style="color:var(--gold-light);margin-right:6px;"></i>Entregar em:</strong>
        <p>${addr.display}</p>
      </div>
      <p class="cep-status loading"><i class="bi bi-hourglass-split"></i> Calculando taxa de entrega pela distância...</p>
    `;

    const result = await estimateDeliveryFee(addr);
    if (result.ok && result.fee != null) {
      checkoutAddress.km = result.km;
      checkoutAddress.fee = result.fee;
      checkoutAddress.feeNote = `${result.km.toFixed(1)} km da loja`;
    } else if (result.ok && result.fee == null) {
      checkoutAddress.fee = null;
      checkoutAddress.feeNote = `${result.km.toFixed(1)} km — fora do raio padrão, a loja confirmará a taxa`;
    } else {
      checkoutAddress.fee = null;
      checkoutAddress.feeNote = 'não foi possível calcular automaticamente — a loja confirmará a taxa';
    }

    // fica no passo 2 mostrando o resultado - não avança sozinho, dá tempo
    // da pessoa conferir a taxa calculada antes de continuar por vontade própria.
    goToStep(2);
  }

  function renderAddressView() {
    const wrap = document.getElementById('addressConfirmWrap');
    const user = Auth.getCurrentUser();

    if (checkoutAddress) {
      const feeLine = checkoutAddress.fee != null
        ? `<div class="summary-row"><span>Taxa de entrega (${checkoutAddress.feeNote})</span><span>R$ ${fmt(checkoutAddress.fee)}</span></div>`
        : checkoutAddress.feeNote
          ? `<p class="cep-status err"><i class="bi bi-exclamation-circle"></i> ${checkoutAddress.feeNote}</p>`
          : '';
      wrap.innerHTML = `
        <div class="address-card">
          <strong><i class="bi bi-geo-alt-fill" style="color:var(--gold-light);margin-right:6px;"></i>Entregar em:</strong>
          <p>${checkoutAddress.display}</p>
        </div>
        ${feeLine}
        <button class="btn btn-outline btn-block" id="changeAddrBtn" style="margin-top:14px;"><i class="bi bi-arrow-repeat"></i> Trocar endereço</button>
      `;
      document.getElementById('changeAddrBtn').addEventListener('click', () => { checkoutAddress = null; goToStep(2); });
      return;
    }

    const savedAddr = formatUserAddress(user);

    wrap.innerHTML = `
      ${savedAddr ? `
        <div class="address-card">
          <strong>Você está neste endereço?</strong>
          <p>${savedAddr.display}</p>
        </div>
        <div class="address-actions">
          <button class="btn btn-primary" id="addrYes"><i class="bi bi-check-lg"></i> Sim, é aqui</button>
          <button class="btn btn-outline" id="addrNo">Usar outro</button>
        </div>
        <div id="altAddrForm" style="margin-top:20px;"></div>
      ` : `
        <p style="font-size:14px;color:var(--text-dim);margin-bottom:16px;">Informe o endereço de entrega:</p>
        <div id="altAddrForm"></div>
      `}
    `;

    if (savedAddr) {
      document.getElementById('addrYes').addEventListener('click', () => confirmAddressAndProceed(savedAddr));
      document.getElementById('addrNo').addEventListener('click', () => renderAltAddressForm());
    } else {
      renderAltAddressForm();
    }
  }

  function renderAltAddressForm() {
    const holder = document.getElementById('altAddrForm');
    holder.innerHTML = `
      <div class="cep-row">
        <div class="form-group">
          <label for="chkCep">CEP</label>
          <input type="text" id="chkCep" placeholder="00000-000">
        </div>
        <button type="button" class="btn btn-outline btn-sm" id="chkCepBtn">Buscar</button>
      </div>
      <div class="cep-status" id="chkCepStatus"></div>

      <div class="form-group" style="margin-top:14px;">
        <label for="chkStreet">Rua</label>
        <input type="text" id="chkStreet" placeholder="Rua / Avenida">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="chkNumber">Número</label>
          <input type="text" id="chkNumber" placeholder="123">
        </div>
        <div class="form-group">
          <label for="chkComplement">Complemento</label>
          <input type="text" id="chkComplement" placeholder="Apto, bloco...">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="chkNeighborhood">Bairro</label>
          <input type="text" id="chkNeighborhood" placeholder="Bairro">
        </div>
        <div class="form-group">
          <label for="chkCity">Cidade / UF</label>
          <input type="text" id="chkCity" placeholder="Cidade/UF">
        </div>
      </div>
      <button type="button" class="btn btn-primary btn-block" id="confirmAltAddr">Confirmar este endereço</button>
    `;

    const cepInput = document.getElementById('chkCep');
    cepInput.addEventListener('input', () => cepInput.value = Auth.maskCep(cepInput.value));

    async function runLookup() {
      const status = document.getElementById('chkCepStatus');
      status.className = 'cep-status loading';
      status.textContent = 'Buscando endereço...';
      const result = await Auth.lookupCep(cepInput.value);
      if (result.ok) {
        document.getElementById('chkStreet').value = result.street;
        document.getElementById('chkNeighborhood').value = result.neighborhood;
        document.getElementById('chkCity').value = result.city;
        status.className = 'cep-status ok';
        status.innerHTML = '<i class="bi bi-check-circle"></i> Endereço encontrado. Confirme o número.';
      } else {
        status.className = 'cep-status err';
        status.innerHTML = '<i class="bi bi-exclamation-circle"></i> Não encontramos automaticamente — preencha manualmente.';
      }
    }
    document.getElementById('chkCepBtn').addEventListener('click', runLookup);
    cepInput.addEventListener('blur', () => { if (Auth.onlyDigits(cepInput.value).length === 8) runLookup(); });

    document.getElementById('confirmAltAddr').addEventListener('click', () => {
      const street = document.getElementById('chkStreet').value.trim();
      const number = document.getElementById('chkNumber').value.trim();
      if (!street || !number) {
        Toast.show('Informe pelo menos rua e número.', true);
        return;
      }
      const complement = document.getElementById('chkComplement').value.trim();
      const neighborhood = document.getElementById('chkNeighborhood').value.trim();
      const city = document.getElementById('chkCity').value.trim();
      const comp = complement ? `, ${complement}` : '';
      const newAddr = {
        street, number, complement, neighborhood, city,
        cep: document.getElementById('chkCep').value.trim(),
        display: `${street}, ${number}${comp}${neighborhood ? ' — ' + neighborhood : ''}${city ? ', ' + city : ''}`
      };
      confirmAddressAndProceed(newAddr);
    });
  }

  /* ---------------- STEP 3: Payment ---------------- */
  const paymentIcons = {
    'Dinheiro': 'bi-cash-coin',
    'Crédito': 'bi-credit-card',
    'Débito': 'bi-credit-card-2-back',
    'Pix': 'bi-qr-code'
  };

  function renderPaymentView() {
    const wrap = document.getElementById('paymentOptions');
    wrap.innerHTML = BUSINESS.payments.map(p => `
      <label class="payment-option ${checkoutPayment === p ? 'selected' : ''}">
        <input type="radio" name="payment" value="${p}" ${checkoutPayment === p ? 'checked' : ''}>
        <i class="bi ${paymentIcons[p] || 'bi-wallet2'}"></i> ${p}
      </label>
    `).join('');

    wrap.querySelectorAll('input[name=payment]').forEach(input => {
      input.addEventListener('change', () => {
        checkoutPayment = input.value;
        wrap.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
        input.closest('.payment-option').classList.add('selected');
        document.getElementById('troco-wrap').style.display = checkoutPayment === 'Dinheiro' ? 'block' : 'none';
        document.getElementById('drawerActionBtn').disabled = false;
      });
    });

    document.getElementById('troco-wrap').style.display = checkoutPayment === 'Dinheiro' ? 'block' : 'none';
  }

  /* ---------------- STEP 4: Review ---------------- */
  function renderReviewView() {
    const wrap = document.getElementById('reviewWrap');
    const user = Auth.getCurrentUser();
    const lines = getLines();

    wrap.innerHTML = `
      <div class="review-block">
        <h4>Itens (${lines.reduce((s,l)=>s+l.qty,0)})</h4>
        <div class="review-items">
          ${lines.map(l => `<div class="review-item"><span>${l.qty}x ${l.item.n}</span><span>R$ ${fmt(l.total)}</span></div>`).join('')}
        </div>
      </div>
      <div class="review-block">
        <h4>Cliente</h4>
        <div class="review-item"><span>${user.name}</span><span>${Auth.maskPhone(user.phone)}</span></div>
      </div>
      <div class="review-block">
        <h4>Entrega</h4>
        <p style="font-size:14px;color:var(--text-dim);">${checkoutAddress.display}</p>
        <div class="review-item" style="margin-top:8px;">
          <span>Taxa de entrega${checkoutAddress.feeNote ? ' (' + checkoutAddress.feeNote + ')' : ''}</span>
          <span>${checkoutAddress.fee != null ? 'R$ ' + fmt(checkoutAddress.fee) : 'a combinar'}</span>
        </div>
      </div>
      <div class="review-block">
        <h4>Pagamento</h4>
        <p style="font-size:14px;color:var(--text-dim);">${checkoutPayment}${checkoutPayment === 'Dinheiro' && document.getElementById('trocoInput').value ? ' — troco para ' + document.getElementById('trocoInput').value : ''}</p>
      </div>
    `;
  }

  /* ---------------- Enviar pedido pelo WhatsApp ---------------- */
  function buildMessage() {
    const user = Auth.getCurrentUser();
    const lines = getLines();
    const troco = document.getElementById('trocoInput') ? document.getElementById('trocoInput').value.trim() : '';

    let msg = '';
    msg += `*NOVO PEDIDO — EDSON SUSHI*\n`;
    msg += `------------------------------\n`;
    msg += `*Cliente:* ${user.name}\n`;
    msg += `*Telefone:* ${Auth.maskPhone(user.phone)}\n`;
    msg += `*CPF:* ${Auth.maskCpf(user.cpf)}\n`;
    msg += `------------------------------\n`;
    msg += `*Itens do pedido:*\n`;
    lines.forEach(l => {
      msg += `${l.qty}x ${l.item.n} — R$ ${fmt(l.unit)} (un.) = R$ ${fmt(l.total)}\n`;
    });
    msg += `------------------------------\n`;
    msg += `*Subtotal:* R$ ${fmt(subtotal())}\n`;
    if (checkoutAddress.fee != null) {
      msg += `*Taxa de entrega:* R$ ${fmt(checkoutAddress.fee)} (${checkoutAddress.feeNote})\n`;
      msg += `*Total do pedido:* R$ ${fmt(total())}\n`;
    } else {
      msg += `*Taxa de entrega:* a combinar com a loja (${checkoutAddress.feeNote || 'distância não calculada'})\n`;
      msg += `*Total do pedido (sem taxa):* R$ ${fmt(subtotal())}\n`;
    }
    msg += `*Forma de pagamento:* ${checkoutPayment}\n`;
    if (checkoutPayment === 'Dinheiro' && troco) msg += `*Troco para:* ${troco}\n`;
    msg += `------------------------------\n`;
    msg += `*Endereço de entrega:*\n`;
    msg += `${checkoutAddress.street}, ${checkoutAddress.number}${checkoutAddress.complement ? ' - ' + checkoutAddress.complement : ''}\n`;
    if (checkoutAddress.neighborhood) msg += `${checkoutAddress.neighborhood}`;
    if (checkoutAddress.city) msg += ` — ${checkoutAddress.city}`;
    msg += `\n`;
    if (checkoutAddress.cep) msg += `CEP: ${checkoutAddress.cep}\n`;
    msg += `------------------------------\n`;
    msg += `Pedido gerado pelo site do Edson Sushi.`;
    return msg;
  }

  function sendOrder() {
    if (!checkoutAddress || !checkoutPayment || getLines().length === 0) {
      Toast.show('Complete todas as etapas antes de enviar.', true);
      return;
    }
    const message = buildMessage();
    const url = `https://wa.me/${BUSINESS.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');

    clear();
    checkoutAddress = null;
    checkoutPayment = null;
    closeDrawer();
    Toast.show('Pedido pronto! Confira o WhatsApp e envie a mensagem para confirmar com a loja.');
  }

  /* ---------------- Public add-to-cart handler (com gate de login) ---------------- */
  function handleAddToCart(id) {
    if (!window.ITEM_INDEX || !window.ITEM_INDEX[id]) return;

    if (!Auth.getCurrentUser()) {
      Auth.openModal('login', () => {
        add(id, 1);
        Toast.show('Item adicionado! Continue montando seu pedido.');
        openDrawer(1);
      });
      return;
    }

    add(id, 1);
    Toast.show(`${window.ITEM_INDEX[id].n} adicionado ao carrinho.`);
  }

  /* ---------------- Wiring geral ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    renderBadge();

    document.getElementById('cartClose').addEventListener('click', closeDrawer);
    document.getElementById('cartOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'cartOverlay') closeDrawer();
    });

    document.getElementById('cartBtn').addEventListener('click', () => {
      if (!Auth.getCurrentUser()) { Auth.openModal('login', () => openDrawer(1)); return; }
      openDrawer(1);
    });

    // delegação de eventos para botões "adicionar", "+", "-", "remover"
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add]');
      if (addBtn) { handleAddToCart(addBtn.dataset.add); return; }

      const incBtn = e.target.closest('[data-inc]');
      if (incBtn) {
        const cart = getCart();
        const id = incBtn.dataset.inc;
        setQty(id, (cart[id] || 0) + 1);
        return;
      }
      const decBtn = e.target.closest('[data-dec]');
      if (decBtn) {
        const cart = getCart();
        const id = decBtn.dataset.dec;
        setQty(id, (cart[id] || 0) - 1);
        return;
      }
      const remBtn = e.target.closest('[data-remove]');
      if (remBtn) { remove(remBtn.dataset.remove); return; }
    });
  });

  return { add, remove, setQty, clear, getLines, count, subtotal, total, openDrawer, closeDrawer, renderBadge };
})();
