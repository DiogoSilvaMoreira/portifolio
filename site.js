/* =========================================================================
   diogo.dev — "Construindo presença digital, peça por peça"
   Direção de movimento única: tudo é controlado pelo progresso do scroll,
   em camadas (.motion-wrapper = scroll · .tilt-wrapper = mouse · card = conteúdo).

   Regras: sem JS, sem GSAP ou com prefers-reduced-motion, todo o conteúdo
   permanece visível e clicável em sua posição final.
   ========================================================================= */
(function () {
  'use strict';

  var q = function (s, c) { return (c || document).querySelector(s); };
  var qa = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var ANIM = !!(gsap && ST) && !reduce;

  if (gsap && ST) gsap.registerPlugin(ST);
  if (gsap) gsap.defaults({ ease: 'power3.out' });

  var introSeen = false;
  try { introSeen = sessionStorage.getItem('dm.intro') === '1'; } catch (e) { introSeen = true; }
  var INTRO_T = (ANIM && !introSeen) ? 1.05 : 0;

  /* camadas: cria wrappers sem alterar o HTML semântico entregue ao Google */
  function layer(el, outer, inner) {
    var mo = document.createElement('div');
    mo.className = outer;
    el.parentNode.insertBefore(mo, el);
    var ti = null;
    if (inner) {
      ti = document.createElement('div');
      ti.className = inner;
      mo.appendChild(ti);
      ti.appendChild(el);
    } else {
      mo.appendChild(el);
    }
    return { motion: mo, tilt: ti };
  }

  function claim(el) {
    if (!el) return el;
    el.classList.remove('reveal', 'd1', 'd2', 'd3', 'd4');
    el.classList.add('in');
    return el;
  }

  /* =====================================================================
     1 · SMOOTH SCROLL + ÂNCORAS
     ===================================================================== */
  var lenis = null;
  function initSmoothScroll() {
    if (!ANIM || !window.Lenis) return;
    lenis = new window.Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.5 });
    document.documentElement.classList.add('lenis');
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function initAnchors() {
    qa('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      a.addEventListener('click', function (e) {
        var t = document.querySelector(id);
        if (!t || !lenis) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: -78, duration: 1.1 });
      });
    });
  }

  /* =====================================================================
     2 · INTRO (máx. 1,2s, uma vez por sessão)
     ===================================================================== */
  function initIntro() {
    var el = q('#intro');
    if (!el) return;
    if (!ANIM || introSeen) { el.remove(); return; }
    try { sessionStorage.setItem('dm.intro', '1'); } catch (e) {}

    var mark = q('.intro-mark', el), line = q('.intro-line', el), name = q('.intro-name', el);
    gsap.set([mark, name], { opacity: 0 });
    gsap.set(mark, { scale: .4 });
    gsap.set(name, { x: -8 });

    gsap.timeline({ onComplete: function () { el.remove(); ST.refresh(); } })
      .to(mark, { opacity: 1, scale: 1, duration: .32, ease: 'back.out(2)' })
      .to(line, { width: 74, duration: .3, ease: 'power2.out' }, '-=.06')
      .to(name, { opacity: 1, x: 0, duration: .3 }, '-=.14')
      .to(el, { opacity: 0, duration: .34, ease: 'power2.inOut' }, '+=.12');
  }

  /* =====================================================================
     3 · NAVEGAÇÃO
     ===================================================================== */
  function initNav() {
    var nav = q('#nav'), burger = q('#burger'), navLinks = q('#navLinks');
    if (!nav || !navLinks) return;

    var onScroll = function () { nav.classList.toggle('scrolled', scrollY > 10); };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.addEventListener('click', function () {
        var open = navLinks.classList.toggle('open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      });
    }
    qa('a', navLinks).forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      });
    });

    var ind = document.createElement('span');
    ind.className = 'nav-ind';
    ind.setAttribute('aria-hidden', 'true');
    navLinks.appendChild(ind);
    navLinks.classList.add('has-ind');

    var links = qa('a', navLinks), current = null;
    function place(a) {
      if (!a || innerWidth <= 980) { ind.style.opacity = '0'; return; }
      var r = a.getBoundingClientRect(), p = navLinks.getBoundingClientRect();
      ind.style.opacity = '1';
      ind.style.width = r.width + 'px';
      ind.style.transform = 'translateX(' + (r.left - p.left) + 'px)';
    }
    links.forEach(function (a) {
      a.addEventListener('mouseenter', function () { place(a); });
      a.addEventListener('focus', function () { place(a); });
    });
    navLinks.addEventListener('mouseleave', function () { place(current); });
    addEventListener('resize', function () { place(current); }, { passive: true });

    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = '#' + e.target.id;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === id;
          a.classList.toggle('active', on);
          if (on) { current = a; place(a); }
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    qa('section[id]').forEach(function (s) { spy.observe(s); });
  }

  function initProgress() {
    var bar = q('#progressBar');
    if (!bar) return;
    var update = function () {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  }

  /* =====================================================================
     4 · REVEAL BASE, CONTADORES, ROTATOR, MOCKUP, MARQUEE
     ===================================================================== */
  function initReveal() {
    var els = qa('.reveal');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .12 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    var els = qa('[data-count]');
    if (!els.length) return;
    if (reduce) {
      els.forEach(function (el) { el.textContent = el.dataset.count + (el.dataset.suffix || '+'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '+', t0 = null;
        var step = function (ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1200, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suf : '');
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: .15 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initRotator() {
    var rot = q('#rotator');
    if (!rot || reduce) return;
    var words = ['o seu negócio', 'sua confeitaria', 'seu escritório', 'sua clínica', 'seu ateliê', 'sua loja'];
    var i = 0, visible = true;
    var timer = setInterval(function () {
      if (!visible) return;
      rot.classList.add('out');
      setTimeout(function () {
        i = (i + 1) % words.length;
        rot.textContent = words[i];
        rot.classList.remove('out');
      }, 350);
    }, 2800);
    var hero = q('.hero');
    if (hero) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(hero);
    addEventListener('pagehide', function () { clearInterval(timer); });
  }

  function initBrowserDemo() {
    var browser = q('#browser'), tag = q('#demoTag'), url = q('#demoUrl');
    if (!browser || !tag || !url) return;
    var demos = [
      { tag: '◈ Confeitaria', url: 'suaconfeitaria.com.br', a: '#E4568B', b: '#FBD5E4', c: '#FFF8FB' },
      { tag: '◈ Advocacia', url: 'seuescritorio.adv.br', a: '#B08A3E', b: '#E8DCC2', c: '#FAF7F0' },
      { tag: '◈ Clínica de Estética', url: 'suaclinica.com.br', a: '#3FA79B', b: '#CDEEE9', c: '#F5FCFB' },
      { tag: '◈ Personal Trainer', url: 'seutreino.com.br', a: '#E8632C', b: '#FCDCCB', c: '#FFF9F5' }
    ];
    var i = 0, visible = true;
    function apply(d) {
      browser.style.setProperty('--da', d.a);
      browser.style.setProperty('--db', d.b);
      browser.style.setProperty('--dc', d.c);
      tag.textContent = d.tag;
      url.textContent = d.url;
    }
    apply(demos[0]);
    if (reduce) return;
    var timer = setInterval(function () {
      if (!visible) return;
      i = (i + 1) % demos.length;
      browser.classList.remove('building');
      tag.style.opacity = '0';
      void browser.offsetWidth;
      apply(demos[i]);
      tag.style.opacity = '1';
      browser.classList.add('building');
    }, 5600);
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(browser);
    addEventListener('pagehide', function () { clearInterval(timer); });
  }

  function initMarquee() {
    var mq = q('#mqTrack');
    if (!mq) return;
    mq.innerHTML += mq.innerHTML;
    if (!ANIM) return;
    gsap.fromTo('.marquee', { scale: .965, opacity: .75 }, {
      scale: 1, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'center 58%', scrub: .6 }
    });
  }

  /* =====================================================================
     5 · HERO — o site sendo construído (timeline única, com pin no desktop)
     ===================================================================== */
  function initHero() {
    var hero = q('.hero');
    if (!hero) return;
    var demoWrap = q('.demo-wrap'), browser = q('#browser'), floats = qa('.hf');
    claim(demoWrap);
    if (!ANIM) return;

    var intro = qa('.hero .badge, .hero h1, .hero-sub, .hero-ctas');
    var stats = q('.hero-stats');

    gsap.set(intro, { y: 26, opacity: 0 });
    gsap.set(stats, { y: 20, opacity: 0 });
    gsap.set(demoWrap, { opacity: 0, y: 46 });

    var mm = gsap.matchMedia();

    mm.add({
      desk: '(min-width: 981px)',
      tab: '(min-width: 721px) and (max-width: 980px)',
      mob: '(max-width: 720px)'
    }, function (ctx) {
      var c = ctx.conditions, amp = c.desk ? 1 : (c.tab ? .6 : .35);

      /* entrada */
      var tl = gsap.timeline({ delay: INTRO_T + .1 });
      tl.to(intro, { y: 0, opacity: 1, duration: .8, stagger: .09 })
        .to(demoWrap, { opacity: 1, y: 0, duration: .9 }, '-=.55');
      if (browser) {
        gsap.set(browser, { transformPerspective: 1300 });
        tl.fromTo(browser,
          { rotateY: -17 * amp, rotateX: 9 * amp, z: -260 * amp, scale: .93 },
          { rotateY: -5 * amp, rotateX: 2 * amp, z: 0, scale: 1, duration: 1.15 }, '-=.8');
      }
      if (floats.length && !c.mob) {
        floats.forEach(function (f, i) {
          gsap.set(f, {
            x: (+f.dataset.dx || 0) * amp,
            y: (+f.dataset.dy || 0) * amp,
            rotate: (+f.dataset.rz || 0) * amp,
            z: (+f.dataset.z || 0) * amp,
            opacity: 0, scale: .92, transformPerspective: 1000
          });
          tl.to(f, { opacity: 1, scale: 1, duration: .55 }, .55 + i * .07);
        });
      }
      /* as métricas só entram depois da composição */
      tl.to(stats, { y: 0, opacity: 1, duration: .7 }, '-=.2');

      /* construção ligada ao scroll */
      if (!c.mob) {
        var build = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: '+=' + Math.round(innerHeight * (c.desk ? .75 : .55)),
            scrub: .85,
            pin: c.desk,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        floats.forEach(function (f, i) {
          build.to(f, {
            x: 0, y: 0, rotate: 0, z: 0, scale: .82, opacity: .0 + (i === 4 ? .9 : .92),
            ease: 'none', duration: 1
          }, i * .04);
        });
        if (browser) build.to(browser, { rotateY: 0, rotateX: 0, scale: 1.04, z: 60, ease: 'none', duration: 1 }, 0);
        build.to('.hero-grid > div:first-child', { y: -34, ease: 'none', duration: 1 }, 0);
        build.fromTo('.hero .aurora', { opacity: .5 }, { opacity: .95, ease: 'none', duration: 1 }, 0);
      } else if (browser) {
        gsap.to(browser, {
          rotateY: 0, rotateX: 0, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: '+=55%', scrub: .6 }
        });
      }

      return function () {
        gsap.set(floats.concat(intro, [demoWrap, stats, browser]), { clearProps: 'all' });
      };
    });

    gsap.to('.bg-grid', {
      yPercent: 7, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 }
    });
  }

  /* =====================================================================
     6 · SERVIÇOS — cards que se encaixam (3 camadas)
     ===================================================================== */
  function initServices() {
    var plans = qa('.plan');
    if (!plans.length) return;
    plans.forEach(claim);
    if (!ANIM) return;

    var slots = plans.map(function (p) {
      var l = layer(p, 'plan-slot motion-wrapper', 'tilt-wrapper');
      return l.motion;
    });

    var hot = q('.plan.hot'), halo = null;
    if (hot) {
      halo = document.createElement('span');
      halo.className = 'plan-halo';
      halo.setAttribute('aria-hidden', 'true');
      hot.appendChild(halo);
      gsap.set(halo, { opacity: 0 });
    }

    var mm = gsap.matchMedia();

    mm.add('(min-width: 721px)', function () {
      var A = matchMedia('(min-width: 981px)').matches ? 1 : .55;
      var from = [
        { xPercent: -62 * A, yPercent: 10 * A, rotate: -11 * A, z: -320 * A },
        { xPercent: 0, yPercent: 34 * A, rotate: 0, z: -520 * A },
        { xPercent: 62 * A, yPercent: 10 * A, rotate: 11 * A, z: -320 * A }
      ];
      slots.forEach(function (s, i) {
        gsap.set(s, { transformPerspective: 1500, transformOrigin: '50% 60%' });
        gsap.set(s, from[i % 3]);
        gsap.set(plans[i].children, { opacity: 0, filter: 'blur(7px)', y: 10 });
      });

      var tl = gsap.timeline({
        scrollTrigger: { trigger: '.plans', start: 'top 90%', end: 'top 28%', scrub: .75 }
      });
      slots.forEach(function (s, i) {
        tl.to(s, { xPercent: 0, yPercent: 0, rotate: 0, z: 0, ease: 'none', duration: 1 }, i * .06);
        tl.to(plans[i].children, { opacity: 1, filter: 'blur(0px)', y: 0, ease: 'none', duration: .5, stagger: .03 }, .45 + i * .06);
      });
      if (halo) tl.to(halo, { opacity: 1, ease: 'none', duration: .5 }, .82);

      return function () {
        slots.forEach(function (s, i) {
          gsap.set(s, { clearProps: 'all' });
          gsap.set(plans[i].children, { clearProps: 'all' });
        });
        if (halo) gsap.set(halo, { clearProps: 'all' });
      };
    });

    mm.add('(max-width: 720px)', function () {
      slots.forEach(function (s) {
        gsap.set(s, { y: 46, opacity: 0 });
        gsap.to(s, {
          y: 0, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: s, start: 'top 92%', end: 'top 62%', scrub: .6 }
        });
      });
      if (halo) gsap.to(halo, {
        opacity: 1, ease: 'none',
        scrollTrigger: { trigger: hot, start: 'top 85%', end: 'top 55%', scrub: .6 }
      });
      return function () { slots.forEach(function (s) { gsap.set(s, { clearProps: 'all' }); }); };
    });
  }

  /* =====================================================================
     7 · AUTOMAÇÕES — o contato virando venda
     ===================================================================== */
  function initAutomation() {
    var banner = q('.auto-banner');
    if (!banner) return;
    claim(banner);
    if (!ANIM) return;

    var head = qa('.ab-eyebrow, .auto-banner h3, .ab-txt > p', banner);
    var items = qa('.ab-item', banner);
    var cta = q('.btn-teal', banner);
    var mods = qa('.fmod', banner);
    var railFill = q('.flow-rail i', banner);
    var pulse = q('.flow-pulse', banner);
    var rail = q('.flow-rail', banner);

    gsap.set(banner, { opacity: 0, y: 40 });
    gsap.set(head, { opacity: 0, y: 18 });
    gsap.set(items, { opacity: 0, y: 20, scale: .94 });
    gsap.set(mods, { opacity: 0, y: 26, scale: .94 });
    if (cta) gsap.set(cta, { opacity: 0, x: 22 });

    var tl = gsap.timeline({
      scrollTrigger: { trigger: banner, start: 'top 88%', end: 'top 30%', scrub: .7 }
    });
    tl.to(banner, { opacity: 1, y: 0, ease: 'none', duration: .5 })
      .to(head, { opacity: 1, y: 0, ease: 'none', duration: .45, stagger: .07 }, .15)
      .to(items, { opacity: 1, y: 0, scale: 1, ease: 'none', duration: .45, stagger: .1 }, .35)
      .to(mods, { opacity: 1, y: 0, scale: 1, ease: 'none', duration: .45, stagger: .12 }, .6);
    if (cta) tl.to(cta, { opacity: 1, x: 0, ease: 'none', duration: .45 }, 1);

    /* fluxo: trilha desenhada + pulso percorrendo os módulos */
    if (railFill && pulse && rail) {
      var flowTl = gsap.timeline({
        scrollTrigger: { trigger: '.flow', start: 'top 82%', end: 'bottom 55%', scrub: .8 },
        onUpdate: function () {
          var p = this.progress();
          var idx = clamp(Math.floor(p * mods.length), 0, mods.length - 1);
          mods.forEach(function (m, i) { m.classList.toggle('on', i <= idx && p > .04); });
        }
      });
      flowTl.fromTo(railFill, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0)
        .fromTo(pulse, { opacity: 0 }, { opacity: 1, duration: .06 }, 0)
        .fromTo(pulse, { x: 0 }, {
          x: function () { return rail.offsetWidth - 12; }, ease: 'none', duration: 1
        }, 0)
        .to(pulse, { opacity: 0, duration: .08 }, .96);
    }
  }

  /* =====================================================================
     8 · PROJETOS — galeria espacial (desktop) / lista (celular)
     ===================================================================== */
  function initProjects() {
    var cases = qa('.case');
    var host = q('.cases');
    if (!cases.length || !host) return;
    cases.forEach(claim);
    if (!ANIM) return;

    var slots = cases.map(function (c) { return layer(c, 'case-slot motion-wrapper').motion; });
    var n = slots.length;

    var hint = document.createElement('span');
    hint.className = 'cases--hint';
    hint.textContent = '↓ role para percorrer os projetos · clique para visitar';

    var mm = gsap.matchMedia();

    /* desktop: pilha espacial controlada pela rolagem vertical */
    mm.add('(min-width: 981px)', function () {
      host.classList.add('cases--stack');
      host.parentNode.insertBefore(hint, host.nextSibling);

      function depth(k) {
        return {
          y: k * 26, z: -k * 130, scale: 1 - k * .045,
          rotate: k === 0 ? 0 : (k % 2 ? 2.6 : -2.6),
          opacity: k < 3 ? 1 : 0
        };
      }
      slots.forEach(function (s, i) {
        s.style.zIndex = String(n - i);
        s.style.pointerEvents = i === 0 ? 'auto' : 'none';
        gsap.set(s, Object.assign({ transformPerspective: 1700, transformOrigin: '50% 90%' }, depth(i)));
      });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: host,
          start: 'center center',
          end: '+=' + Math.round(innerHeight * (n - 1) * .8),
          pin: true,
          scrub: .8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            var front = clamp(Math.round(self.progress * (n - 1)), 0, n - 1);
            slots.forEach(function (s, i) { s.style.pointerEvents = i === front ? 'auto' : 'none'; });
          }
        }
      });

      for (var i = 0; i < n - 1; i++) {
        tl.to(slots[i], { y: -70, z: 240, scale: .92, rotate: -3.5, opacity: 0, ease: 'none', duration: 1 }, i);
        for (var j = i + 1; j < n; j++) {
          tl.to(slots[j], Object.assign({ ease: 'none', duration: 1 }, depth(j - i - 1)), i);
        }
      }

      return function () {
        host.classList.remove('cases--stack');
        if (hint.parentNode) hint.parentNode.removeChild(hint);
        slots.forEach(function (s) {
          gsap.set(s, { clearProps: 'all' });
          s.style.zIndex = '';
          s.style.pointerEvents = '';
        });
      };
    });

    /* tablet: entrada em camadas, sem pin */
    mm.add('(min-width: 721px) and (max-width: 980px)', function () {
      slots.forEach(function (s, i) {
        var side = i % 2 === 0 ? -1 : 1;
        gsap.set(s, { transformPerspective: 1400, xPercent: 8 * side, yPercent: 8, rotate: 3.5 * side, z: -160, opacity: .45 });
        gsap.to(s, {
          xPercent: 0, yPercent: 0, rotate: 0, z: 0, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: s, start: 'top 94%', end: 'top 58%', scrub: .7 }
        });
      });
      return function () { slots.forEach(function (s) { gsap.set(s, { clearProps: 'all' }); }); };
    });

    /* celular: lista vertical simples */
    mm.add('(max-width: 720px)', function () {
      slots.forEach(function (s) {
        gsap.set(s, { y: 40, opacity: 0 });
        gsap.to(s, {
          y: 0, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: s, start: 'top 94%', end: 'top 66%', scrub: .6 }
        });
      });
      return function () { slots.forEach(function (s) { gsap.set(s, { clearProps: 'all' }); }); };
    });
  }

  /* =====================================================================
     9 · MULTI-MARKETPLACE — o painel revelado em camadas
     ===================================================================== */
  function initXray() {
    var ac = q('.auto-case');
    if (!ac) return;
    claim(ac);
    if (!ANIM) return;

    var mo = layer(ac, 'motion-wrapper').motion;
    var cover = q('.ac-cover', ac);
    var img = q('img', cover || ac);
    var mods = qa('.xm', ac);
    var body = q('.ac-body', ac);
    var pieces = body ? qa(':scope > *', body) : [];

    gsap.set(mo, { transformPerspective: 1500, opacity: 0, y: 36 });
    if (img) gsap.set(img, { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.06 });
    gsap.set(pieces, { opacity: 0, x: 26 });

    var A = matchMedia('(min-width: 981px)').matches ? 1 : .45;
    mods.forEach(function (m) {
      gsap.set(m, {
        x: (+m.dataset.dx || 0) * A,
        y: (+m.dataset.dy || 0) * A,
        rotate: (+m.dataset.rz || 0) * A,
        opacity: 0, scale: .9
      });
    });

    var tl = gsap.timeline({
      scrollTrigger: { trigger: ac, start: 'top 90%', end: 'top 25%', scrub: .75 }
    });
    tl.to(mo, { opacity: 1, y: 0, ease: 'none', duration: .5 }, 0);
    if (img) tl.to(img, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, ease: 'none', duration: .8 }, .1);
    tl.to(mods, { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1, ease: 'none', duration: .55, stagger: .07 }, .35);
    tl.to(pieces, { opacity: 1, x: 0, ease: 'none', duration: .45, stagger: .08 }, .5);
  }

  /* =====================================================================
     10 · PROCESSO — palco sticky em 4 estados
     ===================================================================== */
  function initProcess() {
    var steps = qa('.step'), host = q('.steps'), proc = q('.proc'), stage = q('.proc-stage');
    if (!steps.length || !host) return;
    steps.forEach(claim);
    if (!ANIM) return;

    var states = qa('.ps', stage || document);
    if (states.length) {
      gsap.set(states, { opacity: 0, scale: .97 });
      gsap.set(states[0], { opacity: 1, scale: 1 });
      gsap.set(qa('.ps-1 .idea'), { opacity: 0, y: 12 });
      gsap.set(qa('.ps-2 .wf'), { opacity: 0, scale: .9 });
      gsap.set(qa('.ps-3 .bl'), { opacity: 0, y: 10 });
      gsap.set(q('.ps-4 .ps-browser'), { opacity: 0, y: 24, scale: .94 });
      gsap.set(q('.ps-live'), { opacity: 0 });
    }

    gsap.set(steps, { opacity: .5, y: 18 });

    var current = -1;
    ST.create({
      trigger: proc || host,
      start: 'top 72%',
      end: 'bottom 78%',
      scrub: .6,
      onUpdate: function (self) {
        var idx = clamp(Math.floor(self.progress * steps.length), 0, steps.length - 1);
        if (idx === current) return;
        current = idx;
        steps.forEach(function (s, i) {
          gsap.to(s, { opacity: i <= idx ? (i === idx ? 1 : .75) : .5, y: i <= idx ? 0 : 18, duration: .45, overwrite: 'auto' });
        });
        if (!states.length) return;
        states.forEach(function (st, i) {
          gsap.to(st, { opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : .97, duration: .5, overwrite: 'auto' });
        });
        if (idx === 0) gsap.to(qa('.ps-1 .idea'), { opacity: 1, y: 0, duration: .45, stagger: .08, overwrite: 'auto' });
        if (idx === 1) gsap.to(qa('.ps-2 .wf'), { opacity: 1, scale: 1, duration: .4, stagger: .07, overwrite: 'auto' });
        if (idx === 2) gsap.to(qa('.ps-3 .bl'), { opacity: 1, y: 0, duration: .4, stagger: .06, overwrite: 'auto' });
        if (idx === 3) {
          gsap.to(q('.ps-4 .ps-browser'), { opacity: 1, y: 0, scale: 1, duration: .55, overwrite: 'auto' });
          gsap.to(q('.ps-live'), { opacity: 1, duration: .4, delay: .2, overwrite: 'auto' });
        }
      }
    });
  }

  /* =====================================================================
     11 · SOBRE — máscara na foto e selos que se encaixam
     ===================================================================== */
  function initAbout() {
    var photo = q('.about-photo'), txt = q('.about-txt');
    if (!photo) return;
    claim(photo); claim(txt);
    if (!ANIM) return;

    var frame = q('.frame', photo), glow = q('.glow', photo);
    var badges = qa('.photo-badge', photo);
    var bits = txt ? qa(':scope > *', txt) : [];

    var mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 981px)', small: '(max-width: 980px)' }, function (ctx) {
      var A = ctx.conditions.desk ? 1 : .5;

      if (frame) gsap.set(frame, { clipPath: 'inset(100% 0% 0% 0%)' });
      if (glow) gsap.set(glow, { opacity: 0, scale: .9 });
      gsap.set(badges, {
        x: function (i) { return (i % 2 ? 92 : -92) * A; },
        y: function (i) { return (i - 1) * 58 * A; },
        rotate: function (i) { return (i % 2 ? 11 : -11) * A; },
        opacity: 0, scale: .9
      });
      gsap.set(bits, { opacity: 0, y: 26 });

      var tl = gsap.timeline({
        scrollTrigger: { trigger: '#sobre', start: 'top 82%', end: 'top 16%', scrub: .75 }
      });
      if (glow) tl.to(glow, { opacity: .35, scale: 1, ease: 'none', duration: .5 }, 0);
      if (frame) tl.to(frame, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: .8 }, .05);
      tl.to(badges, { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1, ease: 'none', duration: .6, stagger: .1 }, .5);
      tl.to(bits, { opacity: 1, y: 0, ease: 'none', duration: .5, stagger: .07 }, .25);

      return function () {
        gsap.set(badges.concat(bits), { clearProps: 'all' });
        if (frame) gsap.set(frame, { clearProps: 'all' });
        if (glow) gsap.set(glow, { clearProps: 'all' });
      };
    });
  }

  /* =====================================================================
     12 · FAQ
     ===================================================================== */
  function initFaq() {
    var list = qa('#faq details');
    if (!list.length) return;
    claim(q('.faq-list'));
    if (!ANIM) return;

    gsap.from(list, {
      opacity: 0, y: 20, duration: .5, stagger: .06,
      scrollTrigger: { trigger: '.faq-list', start: 'top 86%' }
    });

    list.forEach(function (d) {
      var sum = q('summary', d), body = q('.a', d);
      if (!sum || !body) return;
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        if (d.open) {
          gsap.to(body, {
            height: 0, opacity: 0, duration: .28, ease: 'power2.in',
            onComplete: function () { d.open = false; gsap.set(body, { height: 'auto', opacity: 1 }); ST.refresh(); }
          });
        } else {
          d.open = true;
          gsap.fromTo(body, { height: 0, opacity: 0 }, {
            height: 'auto', opacity: 1, duration: .4, ease: 'power2.out',
            onComplete: function () { gsap.set(body, { height: 'auto' }); ST.refresh(); }
          });
        }
      });
    });
  }

  /* =====================================================================
     13 · CONTATO — as peças convergem para a oportunidade
     ===================================================================== */
  function initContact() {
    var card = q('.contact-card');
    if (card) {
      claim(card);
      if (ANIM) {
        var left = qa(':scope > div:first-child > *', card);
        var builder = q('.builder', card);
        var fields = builder ? qa(':scope > *', builder) : [];
        gsap.set(card, { opacity: 0, y: 46, transformPerspective: 1400 });
        gsap.set(left, { opacity: 0, x: -36 });
        gsap.set(fields, { opacity: 0, x: 36 });

        var tl = gsap.timeline({
          scrollTrigger: { trigger: card, start: 'top 90%', end: 'top 32%', scrub: .75 }
        });
        tl.to(card, { opacity: 1, y: 0, ease: 'none', duration: .5 }, 0)
          .to(left, { opacity: 1, x: 0, ease: 'none', duration: .5, stagger: .07 }, .18)
          .to(fields, { opacity: 1, x: 0, ease: 'none', duration: .45, stagger: .08 }, .3);
      }
    }

    var chips = qa('.chip'), waSend = q('#waSend'), cName = q('#cName');
    if (!waSend || !cName) return;
    var picked = '';
    function build() {
      var n = cName.value.trim(), msg = 'Olá Diogo!';
      if (n) msg += ' Meu nome é ' + n + '.';
      msg += picked ? (' Tenho interesse em ' + picked + '.') : ' Quero um orçamento para o meu negócio.';
      waSend.href = 'https://wa.me/5535999675196?text=' + encodeURIComponent(msg);
    }
    chips.forEach(function (ch) {
      ch.setAttribute('aria-pressed', 'false');
      ch.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('sel'); c.setAttribute('aria-pressed', 'false'); });
        ch.classList.add('sel');
        ch.setAttribute('aria-pressed', 'true');
        picked = ch.dataset.v;
        build();
      });
    });
    cName.addEventListener('input', build);
    build();
  }

  /* =====================================================================
     14 · PONTEIRO — tilt (camada própria), spotlight e botões magnéticos
     ===================================================================== */
  function initPointerFX() {
    if (reduce || !gsap || !matchMedia('(pointer:fine)').matches) return;

    function tilt(surface, target, max) {
      var rx = gsap.quickTo(target, 'rotateX', { duration: .5, ease: 'power3' });
      var ry = gsap.quickTo(target, 'rotateY', { duration: .5, ease: 'power3' });
      var ty = gsap.quickTo(target, 'y', { duration: .5, ease: 'power3' });
      gsap.set(target, { transformPerspective: 950 });
      surface.addEventListener('mouseenter', function () { target.style.willChange = 'transform'; });
      surface.addEventListener('mousemove', function (e) {
        var r = surface.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        ry(px * max); rx(-py * max); ty(-6);
        surface.style.setProperty('--mx', ((px + .5) * 100).toFixed(1) + '%');
        surface.style.setProperty('--my', ((py + .5) * 100).toFixed(1) + '%');
      });
      surface.addEventListener('mouseleave', function () {
        rx(0); ry(0); ty(0);
        setTimeout(function () { target.style.willChange = ''; }, 520);
      });
    }

    qa('.plan').forEach(function (p) {
      var w = p.closest('.tilt-wrapper');
      tilt(p, w || p, 7);
    });
    qa('.case, .auto-case').forEach(function (el) { tilt(el, el, 6); });

    qa('.btn-primary, .btn-wa, .btn-teal').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: .4, ease: 'power3' });
      var my = gsap.quickTo(el, 'y', { duration: .4, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) / r.width * 12);
        my((e.clientY - r.top - r.height / 2) / r.height * 8);
      });
      el.addEventListener('mouseleave', function () { mx(0); my(0); });
    });
  }

  /* =====================================================================
     BOOT
     ===================================================================== */
  function boot() {
    initSmoothScroll();
    initAnchors();
    initIntro();
    initNav();
    initProgress();
    initReveal();
    initCounters();
    initRotator();
    initBrowserDemo();
    initMarquee();
    initHero();
    initServices();
    initAutomation();
    initProjects();
    initXray();
    initProcess();
    initAbout();
    initFaq();
    initContact();
    initPointerFX();

    if (ANIM) {
      addEventListener('load', function () { ST.refresh(); });
      qa('img').forEach(function (img) {
        if (!img.complete) img.addEventListener('load', function () { ST.refresh(); }, { once: true });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
