/* ============================================
   SCROLL FX — scroll suave, cursor customizado, tipografia cinética
   do hero e narrativa "presa" (sticky) da seção de Delivery.
   Puramente decorativo: se alguma peça (ex. Lenis via CDN) não carregar,
   o site continua 100% funcional, só sem o efeito.
   ============================================ */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Mobile/touch usa sempre o scroll nativo (mais rápido e mais leve pra bateria/CPU)
  // — Lenis e cursor customizado são só "tempero" de desktop com mouse.
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------------- Lenis (scroll suave com momentum, só desktop) ---------------- */
  if (!reduceMotion && isFinePointer && window.Lenis) {
    document.documentElement.classList.add('has-lenis');
    const lenis = new Lenis({ duration: 0.7, smoothWheel: true, touchMultiplier: 0 });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------------- Cursor customizado (só em dispositivos com mouse) ---------------- */
  if (!reduceMotion && isFinePointer) {
    const ring = document.getElementById('cursorRing');
    if (ring) {
      document.documentElement.classList.add('cursor-fine');
      let x = 0, y = 0, rx = 0, ry = 0;
      window.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });
      (function follow() {
        rx += (x - rx) * 0.22;
        ry += (y - ry) * 0.22;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
        requestAnimationFrame(follow);
      })();
      document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, input, [data-cursor="hover"]')) ring.classList.add('hover');
      });
      document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, input, [data-cursor="hover"]')) ring.classList.remove('hover');
      });
      document.addEventListener('mouseleave', () => ring.classList.add('is-hidden'));
      document.addEventListener('mouseenter', () => ring.classList.remove('is-hidden'));
    }
  }

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
