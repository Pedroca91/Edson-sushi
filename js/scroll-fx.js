/* ============================================
   SCROLL FX — cursor customizado (mini hashi), tipografia cinética do hero,
   narrativa "presa" (sticky) da Delivery e scroll horizontal por wheel nas
   faixas de categoria/destaques. Sem lib de scroll suave: scroll é sempre
   o nativo do navegador (mais rápido e mais leve, principalmente no celular).
   ============================================ */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Mobile/touch nunca ativa o cursor customizado — é só "tempero" de desktop com mouse.
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------------- Cursor customizado: mini hashi (só em dispositivos com mouse) ---------------- */
  if (!reduceMotion && isFinePointer) {
    const cursor = document.getElementById('cursorHashi');
    if (cursor) {
      document.documentElement.classList.add('cursor-fine');
      let x = 0, y = 0, rx = 0, ry = 0, hovering = false;
      window.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });
      (function follow() {
        rx += (x - rx) * 0.28;
        ry += (y - ry) * 0.28;
        const scale = hovering ? 1.25 : 1;
        const angle = hovering ? -22 : -38;
        cursor.style.transform = `translate(${rx}px, ${ry}px) rotate(${angle}deg) scale(${scale})`;
        requestAnimationFrame(follow);
      })();
      document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, input, [data-cursor="hover"]')) { hovering = true; cursor.classList.add('hover'); }
      });
      document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, input, [data-cursor="hover"]')) { hovering = false; cursor.classList.remove('hover'); }
      });
      document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
      document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));
    }
  }

  /* ---------------- Faixas horizontais: roda do mouse vertical vira scroll horizontal ---------------- */
  document.querySelectorAll('.menu-tabs-wrap, .featured-track-wrap').forEach((wrap) => {
    wrap.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // já é gesto horizontal, deixa nativo
      if (wrap.scrollWidth <= wrap.clientWidth) return; // nada pra rolar
      e.preventDefault();
      wrap.scrollLeft += e.deltaY;
    }, { passive: false });
  });

  /* ---------------- Hero: reveal cinético palavra a palavra ---------------- */
  const hero = document.querySelector('.hero-kinetic');
  if (hero) {
    hero.querySelectorAll('.w').forEach((w, i) => {
      w.style.transitionDelay = `${0.28 + i * 0.045}s`;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('in')));
  }

  /* ---------------- Hero: contagem dos números (+90 / 4.9) ---------------- */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const isDecimal = !Number.isInteger(target);
    const duration = 1400;
    const start = performance.now() + 500; // acompanha o reveal do hero
    function tick(now) {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - p, 3);
      const value = target * eased;
      el.textContent = prefix + (isDecimal ? value.toFixed(1) : Math.round(value));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  /* ---------------- Delivery: capítulo ativo enquanto rola (sticky) ---------------- */
  const chapters = document.querySelectorAll('.delivery-chapter');
  const chapterNum = document.getElementById('deliveryChapterNum');
  const chapterLabel = document.getElementById('deliveryChapterLabel');
  if (chapters.length && chapterNum && chapterLabel) {
    const setActive = (el) => {
      chapterNum.textContent = el.dataset.chapter;
      chapterLabel.textContent = el.dataset.label;
    };
    const chapterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target);
      });
    }, { threshold: 0.5 });
    chapters.forEach((c) => chapterIO.observe(c));
  }

  /* ---------------- Reveal genérico com leve atraso por ordem (usa o .reveal já existente) ---------------- */
  document.querySelectorAll('.feature-row').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
  });
})();
