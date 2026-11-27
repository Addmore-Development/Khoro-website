(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header scroll state */
  var header = d.querySelector('.site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  var toggle = d.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = d.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    d.querySelectorAll('.primary-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        d.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', false);
      });
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') d.body.classList.remove('menu-open');
    });
  }

  /* Scroll reveal */
  var items = d.querySelectorAll('.reveal, .reveal-left');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* Count-up numbers */
  var counters = d.querySelectorAll('[data-count]');
  function runCount(el) {
    var end = parseInt(el.getAttribute('data-count'), 10), start = 0, dur = 1600, t0 = null;
    var fmt = el.getAttribute('data-plain') !== null;
    if (reduce) { el.textContent = end; return; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (end - start) * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { co.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute('data-count'); });
  }

  /* Hero slider */
  var slides = d.querySelectorAll('.slide');
  if (slides.length) {
    var dots = d.querySelectorAll('.slide-nav button');
    var count = d.querySelector('.slide-count');
    var navEl = d.querySelector('.slide-nav');
    var i = 0, timer, TIME = 6500;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle('is-active', k === i);
        s.setAttribute('aria-hidden', k !== i);
      });
      dots.forEach(function (b, k) {
        b.classList.remove('is-active');
        b.setAttribute('aria-current', k === i ? 'true' : 'false');
        if (k === i) { void b.offsetWidth; b.classList.add('is-active'); }
      });
      if (count) count.textContent = '0' + (i + 1) + ' / 0' + slides.length;
    }
    function play() {
      clearInterval(timer);
      if (reduce) return;
      timer = setInterval(function () { show(i + 1); }, TIME);
    }
    dots.forEach(function (b, k) {
      b.addEventListener('click', function () { show(k); play(); });
    });
    var hero = d.querySelector('.hero');
    hero.addEventListener('mouseenter', function () { clearInterval(timer); navEl.classList.add('paused'); });
    hero.addEventListener('mouseleave', function () { navEl.classList.remove('paused'); show(i); play(); });
    d.documentElement.style.setProperty('--slide-time', TIME + 'ms');
    show(0); play();

    /* subtle parallax on rings */
    var art = d.querySelector('.hero-art');
    if (art && !reduce && window.matchMedia('(pointer:fine)').matches) {
      hero.addEventListener('mousemove', function (e) {
        var x = (e.clientX / window.innerWidth - .5) * 18, y = (e.clientY / window.innerHeight - .5) * 18;
        art.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
    }
  }

  /* Focus area tabs */
  var tabs = d.querySelectorAll('.focus-tab');
  if (tabs.length) {
    var panels = d.querySelectorAll('.focus-panel');
    function select(n, focus) {
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', k === n);
        t.tabIndex = k === n ? 0 : -1;
        panels[k].classList.toggle('is-active', k === n);
        if (k === n && focus) t.focus();
      });
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { select(k); });
      t.addEventListener('mouseenter', function () {
        if (window.matchMedia('(hover:hover)').matches) select(k);
      });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select((k + 1) % tabs.length, true); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select((k - 1 + tabs.length) % tabs.length, true); }
      });
    });
    select(0);
  }

  /* Contact form (no backend on shared hosting: opens the visitor's email app) */
  var form = d.getElementById('quote-form');
  if (form) {
    var ok = d.querySelector('.form-ok');
    var prefill = new URLSearchParams(location.search).get('service');
    if (prefill && form.service) form.service.value = prefill;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var good = f.value.trim() && (f.type !== 'email' || /^\S+@\S+\.\S+$/.test(f.value));
        f.closest('.field').classList.toggle('invalid', !good);
        if (!good) valid = false;
      });
      if (!valid) { form.querySelector('.invalid input, .invalid textarea').focus(); return; }
      var b = form.elements;
      var body = 'Name: ' + b.name.value + '\nEmail: ' + b.email.value + '\nPhone: ' + (b.phone.value || '-') +
        '\nInterested in: ' + b.service.value + '\n\n' + b.message.value;
      window.location.href = 'mailto:services@khoro.co.za?subject=' +
        encodeURIComponent('Quote request: ' + b.service.value) + '&body=' + encodeURIComponent(body);
      ok.classList.add('show');
    });
    form.querySelectorAll('input,textarea').forEach(function (f) {
      f.addEventListener('input', function () { f.closest('.field').classList.remove('invalid'); });
    });
  }

  /* Never show broken-image alt text: fade failed images out and let the brand background show */
  function failed(img){ img.classList.add('img-failed'); }
  d.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') failed(e.target); }, true);
  window.addEventListener('load', function () {
    d.querySelectorAll('img').forEach(function (im) { if (im.complete && im.naturalWidth === 0) failed(im); });
  });

  /* Footer year */
  var y = d.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
