(function () {
  'use strict';

  var header = document.getElementById('header');
  var menu = document.getElementById('menu');
  var mobileNav = document.getElementById('mobileNav');

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

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
