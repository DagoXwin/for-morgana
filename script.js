/* =========================================================
   ei, Morgana — interações
   1) Reveal suave no scroll
   2) Modal/lightbox da foto surpresa
   3) Painel de ajuste de fotos (modo Dago) — zoom, posição,
      rotação e perspectiva, por foto. Salvo no atributo data-fit.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ============ aplica os data-fit já salvos em cada foto ============ */
  // formato do data-fit: "zoom|x|y|rot|persp"  ex: "1.2|40|60|-3|5"
  function aplicarFit(fig) {
    var img = fig.querySelector('img');
    if (!img) return;
    var v = (fig.getAttribute('data-fit') || '').split('|');
    var zoom = v[0] || 1, x = v[1] || 50, y = v[2] || 50, rot = v[3] || 0, persp = v[4] || 0;
    img.style.setProperty('--fit-zoom', zoom);
    img.style.setProperty('--fit-x', x + '%');
    img.style.setProperty('--fit-y', y + '%');
    img.style.setProperty('--fit-rot', rot + 'deg');
    img.style.setProperty('--fit-persp', persp + 'deg');
  }
  var todasFotos = Array.prototype.slice.call(document.querySelectorAll('.photo[data-fit]'));
  todasFotos.forEach(aplicarFit);

  /* ============ 1. Reveal no scroll ============ */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ============ 2. Modal da foto surpresa ============ */
  var modal = document.getElementById('modal');
  var openBtn = document.getElementById('revealBtn');
  var closeBtn = document.getElementById('modalClose');

  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-close') || e.target === modal) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  /* ============ 3. PAINEL DE AJUSTE (modo Dago) ============ */
  // Só aparece se o link terminar com #ajustar  (ela nunca vê)
  var modoAjuste = window.location.hash === '#ajustar';
  var toggle = document.getElementById('adminToggle');
  var panel = document.getElementById('adminPanel');

  if (modoAjuste && toggle && panel) {
    toggle.hidden = false;

    var pick = document.getElementById('admPick');
    var sZoom = document.getElementById('admZoom');
    var sX = document.getElementById('admX');
    var sY = document.getElementById('admY');
    var sRot = document.getElementById('admRot');
    var sPersp = document.getElementById('admPersp');
    var fotoAtual = null;

    // monta a lista de fotos no seletor
    todasFotos.forEach(function (fig, i) {
      var img = fig.querySelector('img');
      var nome = (img && img.getAttribute('src') || ('foto ' + i)).replace('img/', '');
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = nome;
      pick.appendChild(opt);
    });

    // carrega os valores de uma foto nos sliders
    function carregar(i) {
      todasFotos.forEach(function (f) { f.classList.remove('is-editing'); });
      fotoAtual = todasFotos[i];
      fotoAtual.classList.add('is-editing');
      fotoAtual.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var v = (fotoAtual.getAttribute('data-fit') || '').split('|');
      sZoom.value = v[0] || 1;
      // X/Y guardados em % (0–100); slider trabalha em -100..100 → converte
      sX.value = (v[1] !== undefined && v[1] !== '') ? (v[1] - 50) * 2 : 0;
      sY.value = (v[2] !== undefined && v[2] !== '') ? (v[2] - 50) * 2 : 0;
      sRot.value = v[3] || 0;
      sPersp.value = v[4] || 0;
    }

    // aplica o que está nos sliders na foto atual (ao vivo)
    function aplicar() {
      if (!fotoAtual) return;
      var img = fotoAtual.querySelector('img');
      var xPct = Math.round(50 + (parseFloat(sX.value) / 2)); // -100..100 → 0..100
      var yPct = Math.round(50 + (parseFloat(sY.value) / 2));
      img.style.setProperty('--fit-zoom', sZoom.value);
      img.style.setProperty('--fit-x', xPct + '%');
      img.style.setProperty('--fit-y', yPct + '%');
      img.style.setProperty('--fit-rot', sRot.value + 'deg');
      img.style.setProperty('--fit-persp', sPersp.value + 'deg');
      // guarda no data-fit no formato final
      fotoAtual.setAttribute('data-fit', [sZoom.value, xPct, yPct, sRot.value, sPersp.value].join('|'));
    }

    [sZoom, sX, sY, sRot, sPersp].forEach(function (s) {
      s.addEventListener('input', aplicar);
    });

    pick.addEventListener('change', function () { carregar(parseInt(pick.value, 10)); });

    document.getElementById('admReset').addEventListener('click', function () {
      sZoom.value = 1; sX.value = 0; sY.value = 0; sRot.value = 0; sPersp.value = 0;
      aplicar();
    });

    document.getElementById('admCopy').addEventListener('click', function () {
      if (!fotoAtual) return;
      var img = fotoAtual.querySelector('img');
      var nome = img.getAttribute('src').replace('img/', '');
      var fit = fotoAtual.getAttribute('data-fit');
      var texto = nome + '  →  data-fit="' + fit + '"';
      // copia pro clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText('data-fit="' + fit + '"');
      }
      var btn = document.getElementById('admCopy');
      var antes = btn.textContent;
      btn.textContent = 'copiado! ✓';
      setTimeout(function () { btn.textContent = antes; }, 1400);
      console.log('AJUSTE → ' + texto);
    });

    toggle.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      if (!panel.hidden && fotoAtual === null) carregar(0);
    });
    document.getElementById('adminClose').addEventListener('click', function () {
      panel.hidden = true;
    });
  }
});
