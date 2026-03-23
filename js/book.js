/* ============================================================
   book.js — Stripe Checkout + confirmation for book.html
   ============================================================ */

(function () {
  'use strict';

  /* ── Stripe configuration ────────────────────────────────
     Replace these placeholders before going live:
     - publishableKey: your Stripe publishable key (pk_live_...)
     - priceId:        your Stripe Price ID for the $75 deposit (price_...)
     ──────────────────────────────────────────────────────── */
  var STRIPE_PUBLISHABLE_KEY = 'pk_test_REPLACE_WITH_YOUR_KEY'; // Replace with your Stripe publishable key: pk_live_...
  var STRIPE_PRICE_ID        = 'price_REPLACE_WITH_YOUR_PRICE_ID'; // Replace with your Stripe price ID: price_...

  /* ── DOM references ──────────────────────────────────────── */
  var checkoutBtn    = document.getElementById('stripe-checkout-btn');
  var confirmation   = document.getElementById('booking-confirmation');
  var depositCard    = checkoutBtn ? checkoutBtn.closest('.deposit-card') : null;

  if (!checkoutBtn) return;

  /* ── Check for ?payment=success in URL (Stripe redirect) ── */
  function checkPaymentSuccess() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      showConfirmation();
    }
  }

  /* ── Show confirmation, hide the deposit card ────────────── */
  function showConfirmation() {
    if (depositCard)  depositCard.style.display  = 'none';
    if (confirmation) confirmation.classList.add('is-visible');

    // Scroll confirmation into view smoothly
    if (confirmation) {
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /* ── Handle Stripe Checkout button click ─────────────────── */
  function handleCheckout() {
    // Guard: Stripe.js must be loaded
    if (typeof Stripe === 'undefined') {
      console.error('Stripe.js has not loaded yet.');
      return;
    }

    var stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

    // Disable button to prevent double-clicks
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Redirecting…';

    stripe.redirectToCheckout({
      lineItems: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'payment',
      // Stripe will append ?session_id={CHECKOUT_SESSION_ID} automatically.
      // Update these URLs to match your live domain before launch.
      successUrl: window.location.origin + '/book.html?payment=success',
      cancelUrl:  window.location.origin + '/book.html',
    }).then(function (result) {
      if (result.error) {
        // Show the error to the user — re-enable button
        console.error(result.error.message);
        checkoutBtn.disabled    = false;
        checkoutBtn.textContent = 'Pay $75 Deposit Securely';
        alert('Something went wrong: ' + result.error.message);
      }
    });
  }

  /* ── Attach listeners ────────────────────────────────────── */
  checkoutBtn.addEventListener('click', handleCheckout);

  /* ── Run on page load ────────────────────────────────────── */
  checkPaymentSuccess();
})();
