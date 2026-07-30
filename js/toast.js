/* ============================================
   TOAST — pequenas notificações no canto da tela
   ============================================ */
const Toast = (() => {
  function show(message, isError) {
    const wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast' + (isError ? ' error' : '');
    el.innerHTML = `<i class="bi ${isError ? 'bi-exclamation-circle' : 'bi-check-circle'}"></i><span>${message}</span>`;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }
  return { show };
})();
