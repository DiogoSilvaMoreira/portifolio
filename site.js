(function () {
  'use strict';

  var header = document.getElementById('header');
  var menu = document.getElementById('menu');
  var mobileNav = document.getElementById('mobileNav');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var setHeader = function () { header.classList.toggle('stuck', scrollY > 12); };
  setHeader();
  addEventListener('scroll', setHeader, { passive: true });

  menu.addEventListener('click', function () {
    var open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    mobileNav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  });

  mobileNav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      menu.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('open');
      document.body.classList.remove('menu-open');
    });
  });

  var items = document.querySelectorAll('[data-reveal]');

  if (reduce) {
    items.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  var hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(function () { hero.classList.add('is-ready'); });

    if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
      hero.addEventListener('pointermove', function (e) {
        var rect = hero.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty('--mx', x + '%');
        hero.style.setProperty('--my', y + '%');
      }, { passive: true });
    }
  }

  if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = 'translate(' + (x * .18) + 'px,' + (y * .3) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
