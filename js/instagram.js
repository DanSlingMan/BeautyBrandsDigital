// instagram.js — Loads Miriam's latest Instagram posts into the homepage strip.
// Fetches from our Netlify function (which holds the API token server-side).
// If anything fails, the blush placeholder boxes simply remain — no broken UI.

(function () {
  "use strict";

  // Populate the Instagram grid with real post images
  function renderFeed(posts) {
    var items = document.querySelectorAll(".instagram-grid .instagram-item");

    posts.forEach(function (post, i) {
      if (!items[i]) return;

      var link = items[i].querySelector("a");
      var placeholder = items[i].querySelector(".img-placeholder");
      if (!link || !placeholder) return;

      // Link each tile to its actual Instagram post
      link.href = post.permalink;
      link.setAttribute("aria-label", "View this post by @clt_makeup1 on Instagram");

      // Swap the placeholder for the real image
      var img = document.createElement("img");
      img.src = post.image;
      img.alt = post.caption;
      img.loading = "lazy";
      img.className = "instagram-img";
      placeholder.replaceWith(img);
    });
  }

  // Fetch the feed once the page is ready
  function loadFeed() {
    fetch("/.netlify/functions/instagram-feed")
      .then(function (res) {
        if (!res.ok) throw new Error("Feed unavailable");
        return res.json();
      })
      .then(function (data) {
        if (data.posts && data.posts.length) renderFeed(data.posts);
      })
      .catch(function () {
        // Quietly keep placeholders — they already link to the profile
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadFeed);
  } else {
    loadFeed();
  }
})();
