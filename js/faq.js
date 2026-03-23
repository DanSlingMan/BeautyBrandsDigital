/* ============================================================
   faq.js — Accordion toggle for the FAQ section
   ============================================================ */

(function () {
  'use strict';

  /* ── Find all FAQ items ──────────────────────────────────── */
  const faqItems = document.querySelectorAll('.faq-item');

  if (!faqItems.length) return;

  /* ── Toggle a single item open or closed ─────────────────── */
  function toggleItem(item) {
    const isOpen   = item.classList.contains('is-open');
    const button   = item.querySelector('.faq-question');
    const answer   = item.querySelector('.faq-answer');

    // Close all other items first (accordion behaviour)
    faqItems.forEach(function (other) {
      if (other !== item) {
        other.classList.remove('is-open');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      }
    });

    // Toggle the clicked item
    item.classList.toggle('is-open', !isOpen);
    button.setAttribute('aria-expanded', String(!isOpen));

    // Announce state change to screen readers
    if (answer) {
      answer.setAttribute('aria-hidden', String(isOpen));
    }
  }

  /* ── Attach click listeners ──────────────────────────────── */
  faqItems.forEach(function (item) {
    const button = item.querySelector('.faq-question');
    if (!button) return;

    button.addEventListener('click', function () {
      toggleItem(item);
    });

    // Keyboard: Enter and Space are handled natively for <button>,
    // but set initial ARIA state
    button.setAttribute('aria-expanded', 'false');
  });
})();
