/* ============================================================
   nav.js — Mobile hamburger menu + scroll shadow for CLT Makeup
   ============================================================ */

(function () {
  'use strict';

  /* ── DOM references ──────────────────────────────────────── */
  const nav       = document.querySelector('.site-nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const drawer    = document.querySelector('.nav-drawer');

  if (!nav || !hamburger || !drawer) return;

  /* ── Toggle mobile drawer open / closed ─────────────────── */
  function toggleDrawer() {
    const isOpen = hamburger.classList.toggle('is-open');
    drawer.classList.toggle('is-open', isOpen);

    // Update ARIA attribute for accessibility
    hamburger.setAttribute('aria-expanded', isOpen);

    // Prevent body scroll while drawer is open
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', toggleDrawer);

  /* ── Close drawer when a drawer link is clicked ─────────── */
  function closeDrawer() {
    hamburger.classList.remove('is-open');
    drawer.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  drawer.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeDrawer);
  });

  /* ── Close drawer on Escape key ──────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && hamburger.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  /* ── Add shadow to nav on scroll ─────────────────────────── */
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 12);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load in case page is already scrolled
})();
