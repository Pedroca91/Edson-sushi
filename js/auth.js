/* ============================================
   AUTH — cadastro / login simples (localStorage)
   Sem backend: os dados ficam salvos apenas neste
   navegador/dispositivo do cliente.
   ============================================ */

const Auth = (() => {

  const USERS_KEY = 'edsonsushi_users';
  const SESSION_KEY = 'edsonsushi_session';

  /* ---------------- Storage helpers ---------------- */
  const getUsers = () => {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
  };
  const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const onlyDigits = (s) => (s || '').replace(/\D/g, '');

  const getCurrentUser = () => {
    const phone = localStorage.getItem(SESSION_KEY);
    if (!phone) return null;
    return getUsers().find(u => u.phone === phone) || null;
  };

  const setSession = (phone) => localStorage.setItem(SESSION_KEY, phone);

  const findByPhone = (phone) => getUsers().find(u => u.phone === onlyDigits(phone));

  const upsertUser = (user) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.phone === user.phone);
    if (idx >= 0) users[idx] = { ...users[idx], ...user };
    else users.push(user);
    saveUsers(users);
  };

  /* ---------------- Masks ---------------- */
  const maskPhone = (v) => {
    v = onlyDigits(v).slice(0, 11);
    if (v.length <= 2) return v;
    if (v.length <= 7) return `(${v.slice(0,2)}) ${v.slice(2)}`;
    return `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
  };
  const maskCpf = (v) => {
    v = onlyDigits(v).slice(0, 11);
    return v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };
  const maskCep = (v) => {
    v = onlyDigits(v).slice(0, 8);
    if (v.length <= 5) return v;
    return `${v.slice(0,5)}-${v.slice(5)}`;
  };

  /* ---------------- CPF validation (algoritmo oficial) ---------------- */
  const isValidCpf = (raw) => {
    const cpf = onlyDigits(raw);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let d1 = (sum * 10) % 11; if (d1 === 10) d1 = 0;
    if (d1 !== parseInt(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    let d2 = (sum * 10) % 11; if (d2 === 10) d2 = 0;
    return d2 === parseInt(cpf[10]);
  };

  /* ---------------- ViaCEP lookup ---------------- */
  async function lookupCep(cep) {
    const clean = onlyDigits(cep);
    if (clean.length !== 8) return { ok: false, reason: 'invalid' };
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      if (!res.ok) return { ok: false, reason: 'network' };
      const data = await res.json();
      if (data.erro) return { ok: false, reason: 'not_found' };
      return {
        ok: true,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade && data.uf ? `${data.localidade}/${data.uf}` : (data.localidade || '')
      };
    } catch (e) {
      return { ok: false, reason: 'network' };
    }
  }

  /* ---------------- DOM wiring ---------------- */
  let pendingAfterAuth = null; // callback executado após login/cadastro com sucesso

  function init() {
    const overlay = document.getElementById('authOverlay');
    const closeBtn = document.getElementById('authClose');
    const tabs = document.querySelectorAll('.auth-tab');
    const tabButtons = document.querySelectorAll('[data-tab]');
    const loginView = document.getElementById('loginView');
    const signupView = document.getElementById('signupView');

    const loginForm = document.getElementById('loginForm');
    const loginPhone = document.getElementById('loginPhone');
    const loginPhoneError = document.getElementById('loginPhoneError');

    const signupForm = document.getElementById('signupForm');
    const suName = document.getElementById('suName');
    const suEmail = document.getElementById('suEmail');
    const suPhone = document.getElementById('suPhone');
    const suCpf = document.getElementById('suCpf');
    const suCpfError = document.getElementById('suCpfError');
    const suCep = document.getElementById('suCep');
    const suCepBtn = document.getElementById('suCepBtn');
    const suCepStatus = document.getElementById('suCepStatus');
    const suStreet = document.getElementById('suStreet');
    const suNumber = document.getElementById('suNumber');
    const suComplement = document.getElementById('suComplement');
    const suNeighborhood = document.getElementById('suNeighborhood');
    const suCity = document.getElementById('suCity');

    loginPhone.addEventListener('input', () => { loginPhone.value = maskPhone(loginPhone.value); loginPhoneError.classList.remove('show'); });
    suPhone.addEventListener('input', () => suPhone.value = maskPhone(suPhone.value));
    suCpf.addEventListener('input', () => { suCpf.value = maskCpf(suCpf.value); suCpfError.classList.remove('show'); });
    suCep.addEventListener('input', () => suCep.value = maskCep(suCep.value));

    function switchTab(tab) {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
      loginView.classList.toggle('active', tab === 'login');
      signupView.classList.toggle('active', tab === 'signup');
    }
    tabButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    function openModal(tab) {
      switchTab(tab || 'login');
      overlay.classList.add('open');
      document.body.classList.add('lock-scroll');
    }
    function closeModal() {
      overlay.classList.remove('open');
      document.body.classList.remove('lock-scroll');
    }
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    async function runCepLookup() {
      suCepStatus.className = 'cep-status loading';
      suCepStatus.textContent = 'Buscando endereço...';
      const result = await lookupCep(suCep.value);
      if (result.ok) {
        suStreet.value = result.street;
        suNeighborhood.value = result.neighborhood;
        suCity.value = result.city;
        suCepStatus.className = 'cep-status ok';
        suCepStatus.innerHTML = '<i class="bi bi-check-circle"></i> Endereço encontrado. Confirme o número.';
      } else if (result.reason === 'not_found') {
        suCepStatus.className = 'cep-status err';
        suCepStatus.innerHTML = '<i class="bi bi-exclamation-circle"></i> CEP não encontrado. Preencha o endereço manualmente.';
        suStreet.value = ''; suNeighborhood.value = ''; suCity.value = '';
      } else {
        suCepStatus.className = 'cep-status err';
        suCepStatus.innerHTML = '<i class="bi bi-exclamation-circle"></i> Não foi possível buscar automaticamente. Preencha manualmente.';
      }
    }
    suCepBtn.addEventListener('click', runCepLookup);
    suCep.addEventListener('blur', () => { if (onlyDigits(suCep.value).length === 8) runCepLookup(); });

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phone = onlyDigits(loginPhone.value);
      const user = findByPhone(phone);
      if (!user) {
        loginPhoneError.classList.add('show');
        return;
      }
      setSession(user.phone);
      closeModal();
      Toast.show(`Bem-vindo(a) de volta, ${user.name.split(' ')[0]}!`);
      if (pendingAfterAuth) { const cb = pendingAfterAuth; pendingAfterAuth = null; cb(); }
      document.dispatchEvent(new CustomEvent('edson:authchange'));
    });

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!isValidCpf(suCpf.value)) {
        suCpfError.classList.add('show');
        suCpf.focus();
        return;
      }

      const phone = onlyDigits(suPhone.value);
      if (!suName.value.trim() || phone.length < 10 || !suEmail.value.trim()) {
        Toast.show('Preencha nome, e-mail e celular corretamente.', true);
        return;
      }

      const user = {
        name: suName.value.trim(),
        email: suEmail.value.trim(),
        phone,
        cpf: onlyDigits(suCpf.value),
        cep: onlyDigits(suCep.value),
        street: suStreet.value.trim(),
        number: suNumber.value.trim(),
        complement: suComplement.value.trim(),
        neighborhood: suNeighborhood.value.trim(),
        city: suCity.value.trim()
      };

      upsertUser(user);
      setSession(user.phone);
      closeModal();
      Toast.show(`Cadastro criado! Bem-vindo(a), ${user.name.split(' ')[0]}.`);
      if (pendingAfterAuth) { const cb = pendingAfterAuth; pendingAfterAuth = null; cb(); }
      document.dispatchEvent(new CustomEvent('edson:authchange'));
    });

    /* ---------------- Minha conta (ver/editar dados, sair) ---------------- */
    const accountOverlay = document.getElementById('accountOverlay');
    const accountClose = document.getElementById('accountClose');
    const accountForm = document.getElementById('accountForm');
    const accName = document.getElementById('accName');
    const accEmail = document.getElementById('accEmail');
    const accPhone = document.getElementById('accPhone');
    const accCpf = document.getElementById('accCpf');
    const accCpfError = document.getElementById('accCpfError');
    const accCep = document.getElementById('accCep');
    const accCepBtn = document.getElementById('accCepBtn');
    const accCepStatus = document.getElementById('accCepStatus');
    const accStreet = document.getElementById('accStreet');
    const accNumber = document.getElementById('accNumber');
    const accComplement = document.getElementById('accComplement');
    const accNeighborhood = document.getElementById('accNeighborhood');
    const accCity = document.getElementById('accCity');
    const accountLogoutBtn = document.getElementById('accountLogoutBtn');

    accPhone.addEventListener('input', () => accPhone.value = maskPhone(accPhone.value));
    accCpf.addEventListener('input', () => { accCpf.value = maskCpf(accCpf.value); accCpfError.classList.remove('show'); });
    accCep.addEventListener('input', () => accCep.value = maskCep(accCep.value));

    function openAccountModal() {
      const user = getCurrentUser();
      if (!user) return;
      document.getElementById('accountGreeting').textContent = `Olá, ${user.name.split(' ')[0]}!`;
      accName.value = user.name || '';
      accEmail.value = user.email || '';
      accPhone.value = maskPhone(user.phone || '');
      accCpf.value = maskCpf(user.cpf || '');
      accCep.value = maskCep(user.cep || '');
      accStreet.value = user.street || '';
      accNumber.value = user.number || '';
      accComplement.value = user.complement || '';
      accNeighborhood.value = user.neighborhood || '';
      accCity.value = user.city || '';
      accCepStatus.textContent = '';
      accountOverlay.classList.add('open');
      document.body.classList.add('lock-scroll');
    }
    function closeAccountModal() {
      accountOverlay.classList.remove('open');
      document.body.classList.remove('lock-scroll');
    }
    accountClose.addEventListener('click', closeAccountModal);
    accountOverlay.addEventListener('click', (e) => { if (e.target === accountOverlay) closeAccountModal(); });

    accCepBtn.addEventListener('click', async () => {
      accCepStatus.className = 'cep-status loading';
      accCepStatus.textContent = 'Buscando endereço...';
      const result = await lookupCep(accCep.value);
      if (result.ok) {
        accStreet.value = result.street;
        accNeighborhood.value = result.neighborhood;
        accCity.value = result.city;
        accCepStatus.className = 'cep-status ok';
        accCepStatus.innerHTML = '<i class="bi bi-check-circle"></i> Endereço encontrado. Confirme o número.';
      } else {
        accCepStatus.className = 'cep-status err';
        accCepStatus.innerHTML = '<i class="bi bi-exclamation-circle"></i> Não encontramos automaticamente. Preencha manualmente.';
      }
    });

    accountForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const oldUser = getCurrentUser();
      if (!oldUser) return;

      const cpfDigits = onlyDigits(accCpf.value);
      if (cpfDigits && !isValidCpf(accCpf.value)) {
        accCpfError.classList.add('show');
        accCpf.focus();
        return;
      }

      const newPhone = onlyDigits(accPhone.value);
      if (!accName.value.trim() || newPhone.length < 10 || !accEmail.value.trim()) {
        Toast.show('Preencha nome, e-mail e celular corretamente.', true);
        return;
      }

      const updated = {
        ...oldUser,
        name: accName.value.trim(),
        email: accEmail.value.trim(),
        phone: newPhone,
        cpf: cpfDigits,
        cep: onlyDigits(accCep.value),
        street: accStreet.value.trim(),
        number: accNumber.value.trim(),
        complement: accComplement.value.trim(),
        neighborhood: accNeighborhood.value.trim(),
        city: accCity.value.trim()
      };

      const users = getUsers().filter(u => u.phone !== oldUser.phone);
      users.push(updated);
      saveUsers(users);
      setSession(updated.phone);

      closeAccountModal();
      Toast.show('Dados atualizados com sucesso!');
      document.dispatchEvent(new CustomEvent('edson:authchange'));
    });

    accountLogoutBtn.addEventListener('click', () => {
      logout();
      closeAccountModal();
      Toast.show('Você saiu da sua conta.');
      document.dispatchEvent(new CustomEvent('edson:authchange'));
    });

    // ícone de conta no header
    document.getElementById('accountBtn').addEventListener('click', () => {
      const user = getCurrentUser();
      if (user) {
        openAccountModal();
      } else {
        openModal('login');
      }
    });

    // expose
    Auth._openModal = openModal;
    Auth._closeModal = closeModal;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  return {
    getCurrentUser,
    isValidCpf,
    lookupCep,
    onlyDigits,
    maskPhone, maskCpf, maskCep,
    upsertUser,
    setSession,
    logout,
    openModal: (tab, cb) => { pendingAfterAuth = cb || null; Auth._openModal(tab); },
    closeModal: () => Auth._closeModal(),
    init
  };
})();

document.addEventListener('DOMContentLoaded', Auth.init);
