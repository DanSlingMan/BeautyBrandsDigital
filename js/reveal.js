/* ============================================================
   reveal.js — Scroll-triggered fade-in reveals via
               Intersection Observer for CLT Makeup
   ============================================================ */

(function () {
  'use strict';

  /* ── Respect user motion preference ─────────────────────── */
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ── If user prefers reduced motion, show all immediately ── */
  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
    return;
  }

  /* ── Intersection Observer setup ─────────────────────────── */
  const observerOptions = {
    root: null,          // viewport
    rootMargin: '0px 0px -60px 0px', // trigger 60px before bottom edge
    threshold: 0.12      // 12% of element must be visible
  };

  /* ── Callback: reveal each intersecting element ─────────── */
  function onIntersect(entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Stop observing once revealed — one-time animation
        observer.unobserve(entry.target);
      }
    });
  }

  const observer = new IntersectionObserver(onIntersect, observerOptions);

  /* ── Observe all elements with .reveal class ─────────────── */
  function initReveal() {
    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ── Run after DOM is ready ──────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();
