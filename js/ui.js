/* =====================================================================
   ui.js — All UI logic: welcome screen, compass, dossier panel,
   HUD updates, keyboard shortcuts, auto-drift, tweaks panel.
   Depends on: window.NODES, window.PALETTES, window.TWEAKS, window.CHRONO
   Exposes:    window.UI (used by scene.js to trigger UI changes)
   ===================================================================== */
(function () {
  'use strict';

  // ----------------------------------------------------------------
  // Element references
  // ----------------------------------------------------------------
  const welcome   = document.getElementById('welcome');
  const beginBtn  = document.getElementById('begin');
  const dossier   = document.getElementById('dossier');
  const dClose    = document.getElementById('d-close');
  const compass   = document.getElementById('compass');
  const hudYear   = document.getElementById('hud-year');
  const hudFrag   = document.getElementById('hud-frag');
  const hudLoc    = document.getElementById('hud-loc');
  const hudTime   = document.getElementById('hud-time');
  const collected = document.getElementById('col-n');
  const hints     = document.getElementById('hints');
  const pill      = document.getElementById('autodrift');

  let collectedSet = new Set();
  let autoOn = false;
  let autoTimer = null;

  // ----------------------------------------------------------------
  // Compass — build and update
  // ----------------------------------------------------------------
  function buildCompass() {
    const n = window.NODES.length;
    window.NODES.forEach((def, i) => {
      const pct = n === 1 ? 50 : (i / (n - 1)) * 100;

      const node = document.createElement('div');
      node.className = 'node' + (def.isStation ? ' station' : '');
      node.style.left = pct + '%';
      node.title = def.title;
      node.addEventListener('click', () => {
        window.CHRONO.goto(i, true);
        dismissHints();
      });
      compass.appendChild(node);

      const label = document.createElement('div');
      label.className = 'label';
      label.style.left = pct + '%';
      label.textContent = def.isStation ? 'NOW · STATION' : def.yearShort + ' · ' + def.title;
      compass.appendChild(label);
    });
    updateCompass(0);
  }

  function updateCompass(idx) {
    compass.querySelectorAll('.node').forEach((el, i) => el.classList.toggle('active', i === idx));
    compass.querySelectorAll('.label').forEach((el, i) => {
      el.style.color = i === idx ? 'var(--ink)' : 'var(--ink-faint)';
    });
  }

  // ----------------------------------------------------------------
  // Dossier — render content and open/close
  // ----------------------------------------------------------------
  function renderDossier(idx) {
    const def = window.NODES[idx];
    document.getElementById('d-tag').textContent   = def.tag;
    document.getElementById('d-year').textContent  = def.year;
    document.getElementById('d-title').textContent = def.title;
    document.getElementById('d-role').textContent  = def.role;
    document.getElementById('d-desc').textContent  = def.desc;

    // Bullet items
    const itemsEl = document.getElementById('d-items');
    itemsEl.innerHTML = '';
    def.items.forEach((it) => {
      const d = document.createElement('div');
      d.className = 'd-item' + (it.lit ? ' lit' : '');
      d.innerHTML = `<div class="mark"></div><div>${it.text}</div>`;
      itemsEl.appendChild(d);
    });

    // Stats
    const statsEl = document.getElementById('d-stats');
    statsEl.innerHTML = '';
    def.stats.forEach((s) => {
      const d = document.createElement('div');
      d.className = 'd-stat';
      d.innerHTML = `<div class="k mono">${s.k}</div><div class="v">${s.v}</div>`;
      statsEl.appendChild(d);
    });

    // Tech chips
    const chipsEl = document.getElementById('d-chips');
    chipsEl.innerHTML = '';
    def.chips.forEach((c) => {
      const d = document.createElement('span');
      d.className = 'chip mono';
      d.textContent = c;
      chipsEl.appendChild(d);
    });

    // Contact links (space station only)
    let contactEl = document.getElementById('d-contact');
    if (def.contacts && def.contacts.length) {
      if (!contactEl) {
        contactEl = document.createElement('div');
        contactEl.id = 'd-contact';
        contactEl.className = 'd-contact';
        document.querySelector('.d-body').appendChild(contactEl);
      }
      contactEl.innerHTML = '';
      def.contacts.forEach((c) => {
        const a = document.createElement('a');
        a.className = 'd-contact-link';
        a.href   = c.href;
        a.target = c.href.startsWith('mailto') ? '_self' : '_blank';
        a.rel    = 'noopener';
        a.innerHTML = `<span class="d-link-icon mono">${c.icon}</span><span class="d-link-val">${c.label}</span>`;
        contactEl.appendChild(a);
      });
      contactEl.style.display = '';
    } else if (contactEl) {
      contactEl.style.display = 'none';
    }
  }

  function openDossier()  { dossier.classList.add('open');    dossier.setAttribute('aria-hidden', 'false'); }
  function closeDossier() { dossier.classList.remove('open'); dossier.setAttribute('aria-hidden', 'true');  }

  dClose.addEventListener('click', () => { window.CHRONO.retreat(); closeDossier(); });

  // ----------------------------------------------------------------
  // HUD update
  // ----------------------------------------------------------------
  function setHud(idx, approaching) {
    const def = window.NODES[idx];
    hudYear.textContent = def.yearShort;
    hudFrag.textContent = `Fragment ${idx + 1} of ${window.NODES.length}`;
    hudLoc.textContent  = 'LOC — ' + (def.isStation ? 'STATION ALPHA' : def.title.toUpperCase());
    updateCompass(idx);
    if (approaching) {
      collectedSet.add(idx);
      collected.textContent = collectedSet.size;
      renderDossier(idx);
      openDossier();
    } else {
      closeDossier();
    }
  }

  // ----------------------------------------------------------------
  // Hints
  // ----------------------------------------------------------------
  function dismissHints() { hints.classList.add('gone'); }

  // ----------------------------------------------------------------
  // Welcome screen
  // ----------------------------------------------------------------
  beginBtn.addEventListener('click', () => {
    welcome.classList.add('gone');
    setTimeout(() => { welcome.style.display = 'none'; }, 1300);
    window.CHRONO.begin();
    setHud(0, false);
    setTimeout(() => { window.CHRONO.goto(0, true); }, 2600);
    setTimeout(dismissHints, 8000);
  });

  // ----------------------------------------------------------------
  // Keyboard shortcuts
  // ----------------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    const welcomeVisible = welcome.style.display !== 'none' && !welcome.classList.contains('gone');
    if (welcomeVisible) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); beginBtn.click(); }
      return;
    }
    switch (e.key) {
      case 'ArrowRight': window.CHRONO.next();     dismissHints(); break;
      case 'ArrowLeft':  window.CHRONO.prev();     dismissHints(); break;
      case 'Enter':      window.CHRONO.approach(); dismissHints(); break;
      case 'Escape':     window.CHRONO.retreat();  break;
      case 't': case 'T': document.getElementById('tweaks').classList.toggle('open'); break;
    }
  });

  // ----------------------------------------------------------------
  // Mobile FAB buttons
  // ----------------------------------------------------------------
  document.getElementById('fab-prev').addEventListener('click', () => { window.CHRONO.prev(); dismissHints(); });
  document.getElementById('fab-next').addEventListener('click', () => { window.CHRONO.next(); dismissHints(); });

  // ----------------------------------------------------------------
  // Auto-drift
  // ----------------------------------------------------------------
  function setAuto(on) {
    autoOn = on;
    pill.classList.toggle('on', on);
    clearInterval(autoTimer);
    if (on) {
      autoTimer = setInterval(() => {
        const next = (window.CHRONO.getIdx() + 1) % window.NODES.length;
        window.CHRONO.goto(next, true);
      }, 8000);
    }
  }
  pill.addEventListener('click', () => { setAuto(!autoOn); dismissHints(); });

  // ----------------------------------------------------------------
  // Session chronometer
  // ----------------------------------------------------------------
  const tStart = Date.now();
  setInterval(() => {
    const s   = Math.floor((Date.now() - tStart) / 1000);
    const h   = String(Math.floor(s / 3600)).padStart(2, '0');
    const m   = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    hudTime.textContent = `T+${h}:${m}:${sec}`;
  }, 1000);

  // ----------------------------------------------------------------
  // Mobile swipe-to-close dossier
  // ----------------------------------------------------------------
  let tsY = 0, tsX = 0, swipeDragging = false;
  dossier.addEventListener('touchstart', (e) => {
    tsY = e.touches[0].clientY; tsX = e.touches[0].clientX; swipeDragging = true;
  });
  dossier.addEventListener('touchmove', (e) => {
    if (!swipeDragging) return;
    if (e.touches[0].clientY - tsY > 80) {
      window.CHRONO.retreat(); closeDossier(); swipeDragging = false;
    }
  });
  dossier.addEventListener('touchend', () => { swipeDragging = false; });

  // ----------------------------------------------------------------
  // Public surface — consumed by scene.js
  // ----------------------------------------------------------------
  window.UI = {
    onNodeChange(idx, approaching) {
      try { localStorage.setItem('chrono.idx', String(idx)); } catch (e) { /* storage unavailable */ }
      setHud(idx, approaching);
    },
    dismissHints
  };

  // ----------------------------------------------------------------
  // Build compass now that NODES is populated
  // ----------------------------------------------------------------
  buildCompass();

  // ----------------------------------------------------------------
  // Tweaks panel
  // ----------------------------------------------------------------
  (function initTweaks() {
    const panel = document.getElementById('tweaks');

    // Design-tool edit-mode integration
    window.addEventListener('message', (e) => {
      if (!e.data) return;
      if (e.data.type === '__activate_edit_mode')   panel.classList.add('open');
      if (e.data.type === '__deactivate_edit_mode') panel.classList.remove('open');
    });
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) { /* cross-origin */ }

    function persist(edits) {
      Object.assign(window.TWEAKS, edits);
      try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*'); } catch (e) { /* cross-origin */ }
    }

    // Palette swatches
    document.querySelectorAll('#sw-palette .sw').forEach((el) => {
      el.classList.toggle('on', el.dataset.p === window.TWEAKS.palette);
      el.addEventListener('click', () => {
        document.querySelectorAll('#sw-palette .sw').forEach((x) => x.classList.remove('on'));
        el.classList.add('on');
        window.CHRONO.setPalette(el.dataset.p);
        persist({ palette: el.dataset.p });
      });
    });

    // Star density
    const rStars = document.getElementById('r-stars');
    const vStars = document.getElementById('v-stars');
    rStars.value = window.TWEAKS.stars;
    vStars.textContent = (+window.TWEAKS.stars).toFixed(2);
    let dbStars;
    rStars.addEventListener('input', () => {
      const v = parseFloat(rStars.value);
      vStars.textContent = v.toFixed(2);
      clearTimeout(dbStars);
      dbStars = setTimeout(() => { window.CHRONO.setStars(v); }, 180);
      persist({ stars: v });
    });

    // Look sensitivity
    const rLook = document.getElementById('r-look');
    const vLook = document.getElementById('v-look');
    rLook.value = window.TWEAKS.look;
    vLook.textContent = (+window.TWEAKS.look).toFixed(2);
    rLook.addEventListener('input', () => {
      const v = parseFloat(rLook.value);
      vLook.textContent = v.toFixed(2);
      window.CHRONO.setLook(v);
      persist({ look: v });
    });

    // Nebula intensity
    const rNeb = document.getElementById('r-neb');
    const vNeb = document.getElementById('v-neb');
    rNeb.value = window.TWEAKS.nebula;
    vNeb.textContent = (+window.TWEAKS.nebula).toFixed(2);
    rNeb.addEventListener('input', () => {
      const v = parseFloat(rNeb.value);
      vNeb.textContent = v.toFixed(2);
      window.CHRONO.setNebula(v);
      persist({ nebula: v });
    });

    // Quality toggle
    const tQ = document.getElementById('t-quality');
    const renderQ = () => { tQ.textContent = (window.TWEAKS.quality || 'auto').toUpperCase(); };
    renderQ();
    tQ.addEventListener('click', () => {
      const order = ['auto', 'high', 'low'];
      const cur   = order.indexOf(window.TWEAKS.quality || 'auto');
      const next  = order[(cur + 1) % order.length];
      persist({ quality: next });
      renderQ();
      window.CHRONO.setQuality(next);
    });
  })();
})();
